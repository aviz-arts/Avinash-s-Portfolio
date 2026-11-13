import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export type SupportedModelFormat = 'fbx' | 'glb';
export type SupportedEnvFormat = 'hdr' | 'exr';
export type AssetStageMode = 'object' | 'environment';
export type ProceduralSkyPreset = 'studio' | 'daylight' | 'sunset' | 'cyberNight';

export interface ModelStats {
  meshes: number;
  vertices: number;
  triangles: number;
  materials: number;
  dimensions: { x: number; y: number; z: number };
  stageMode: AssetStageMode;
  embeddedLights: number;
  animationsCount: number;
}

export interface LoadedModelPayload {
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
}

export interface PrepareModelOptions {
  stageMode?: 'auto' | AssetStageMode;
  targetSpan?: number;
}

export interface PreparedModelResult {
  container: THREE.Group;
  innerModel: THREE.Object3D;
  stats: ModelStats;
  stageMode: AssetStageMode;
  scaledBounds: {
    width: number;
    height: number;
    depth: number;
    radius: number;
    centerY: number;
  };
}

// 1x1 neutral grey PNG used as fallback when FBX files embed local OS paths (e.g. C:\Textures\...)
const NEUTRAL_PIXEL_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// Singleton Draco decoder configured against local public/draco assets
let sharedDracoLoader: DRACOLoader | null = null;
function getDracoLoader(): DRACOLoader {
  if (!sharedDracoLoader) {
    sharedDracoLoader = new DRACOLoader();
    sharedDracoLoader.setDecoderPath('/draco/');
  }
  return sharedDracoLoader;
}

/**
 * Fault-tolerant LoadingManager that prevents missing external texture files
 * inside .fbx/.glb 3D environments from aborting geometry loading.
 */
function createFaultTolerantLoadingManager(isBufferParse: boolean = true): THREE.LoadingManager {
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (!url) return NEUTRAL_PIXEL_DATA_URI;
    if (
      url.startsWith('data:') ||
      url.startsWith('blob:') ||
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('/draco/')
    ) {
      return url;
    }
    // Unresolved relative / file:// / Windows drive / Mac local texture paths inside .fbx or .gltf files
    if (
      /\.(png|jpe?g|tga|bmp|tif|tiff|webp|dds|exr|hdr)(\?|#|$)/i.test(url) ||
      /^[a-zA-Z]:[\\/]/.test(url) ||
      url.startsWith('file://') ||
      (isBufferParse && !/\.(fbx|glb|gltf|bin)(\?|#|$)/i.test(url))
    ) {
      return NEUTRAL_PIXEL_DATA_URI;
    }
    return url;
  });
  return manager;
}

async function createConfiguredGLTFLoader(manager: THREE.LoadingManager): Promise<GLTFLoader> {
  const loader = new GLTFLoader(manager);
  loader.setDRACOLoader(getDracoLoader());
  try {
    if (MeshoptDecoder && 'ready' in MeshoptDecoder) {
      await (MeshoptDecoder as { ready: Promise<void> }).ready;
    }
    loader.setMeshoptDecoder(MeshoptDecoder);
  } catch {
    // Non-fatal if meshopt decoder is unused
  }
  return loader;
}

/**
 * Extracts and validates the 3D model/environment format from a filename or URL (.fbx or .glb only)
 */
export function getSupportedModelFormat(fileNameOrUrl: string): SupportedModelFormat | null {
  const clean = fileNameOrUrl.split('?')[0].split('#')[0].trim().toLowerCase();
  const ext = clean.split('.').pop();
  if (ext === 'fbx') return 'fbx';
  if (ext === 'glb') return 'glb';
  return null;
}

/**
 * Extracts and validates HDRI skybox environment map formats (.hdr or .exr)
 */
export function getSupportedEnvFormat(fileNameOrUrl: string): SupportedEnvFormat | null {
  const clean = fileNameOrUrl.split('?')[0].split('#')[0].trim().toLowerCase();
  const ext = clean.split('.').pop();
  if (ext === 'hdr') return 'hdr';
  if (ext === 'exr') return 'exr';
  return null;
}

/**
 * Loads a 3D model or 3D environment from an in-memory ArrayBuffer (.fbx or .glb only),
 * returning both scene graph and any embedded animation clips.
 */
export async function loadModelPayloadFromArrayBuffer(
  buffer: ArrayBuffer,
  format: SupportedModelFormat
): Promise<LoadedModelPayload> {
  const manager = createFaultTolerantLoadingManager();

  if (format === 'fbx') {
    const fbxLoader = new FBXLoader(manager);
    const group = fbxLoader.parse(buffer, '');
    return {
      scene: group,
      animations: Array.isArray(group.animations) ? group.animations : [],
    };
  }

  if (format === 'glb') {
    const gltfLoader = await createConfiguredGLTFLoader(manager);
    return new Promise((resolve, reject) => {
      gltfLoader.parse(
        buffer,
        '',
        (gltf) => {
          const scene = gltf.scene || gltf.scenes[0];
          if (!scene) {
            reject(new Error('GLB file contains no renderable scenes.'));
            return;
          }
          resolve({
            scene,
            animations: Array.isArray(gltf.animations) ? gltf.animations : [],
          });
        },
        (error) => {
          reject(
            new Error(
              `Failed to parse GLB file: ${error instanceof Error ? error.message : String(error)}`
            )
          );
        }
      );
    });
  }

  throw new Error('Unsupported format. Only .fbx and .glb files are allowed.');
}

/**
 * Backward-compatible wrapper returning just the Three.js scene Object3D
 */
export async function loadModelFromArrayBuffer(
  buffer: ArrayBuffer,
  format: SupportedModelFormat
): Promise<THREE.Object3D> {
  const payload = await loadModelPayloadFromArrayBuffer(buffer, format);
  return payload.scene;
}

/**
 * Loads a 3D model or 3D environment from a remote URL (.fbx or .glb only)
 */
export async function loadModelPayloadFromUrl(url: string): Promise<LoadedModelPayload> {
  const format = getSupportedModelFormat(url);
  if (!format) {
    throw new Error('Only .fbx and .glb 3D model URLs are supported.');
  }

  const manager = createFaultTolerantLoadingManager(false);

  if (format === 'fbx') {
    return new Promise((resolve, reject) => {
      const loader = new FBXLoader(manager);
      loader.load(
        url,
        (group) =>
          resolve({
            scene: group,
            animations: Array.isArray(group.animations) ? group.animations : [],
          }),
        undefined,
        reject
      );
    });
  }

  const loader = await createConfiguredGLTFLoader(manager);
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const scene = gltf.scene || gltf.scenes[0];
        if (!scene) {
          reject(new Error('GLB URL contains no renderable scenes.'));
          return;
        }
        resolve({
          scene,
          animations: Array.isArray(gltf.animations) ? gltf.animations : [],
        });
      },
      undefined,
      reject
    );
  });
}

export async function loadModelFromUrl(url: string): Promise<THREE.Object3D> {
  const payload = await loadModelPayloadFromUrl(url);
  return payload.scene;
}

/**
 * Parses an HDR (.hdr) or EXR (.exr) equirectangular environment texture from an ArrayBuffer.
 */
export function loadEnvironmentTextureFromArrayBuffer(
  buffer: ArrayBuffer,
  format: SupportedEnvFormat
): Promise<THREE.DataTexture> {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(new Blob([buffer]));
    const cleanup = () => URL.revokeObjectURL(blobUrl);

    if (format === 'hdr') {
      const loader = new HDRLoader();
      loader.load(
        blobUrl,
        (tex) => {
          cleanup();
          tex.mapping = THREE.EquirectangularReflectionMapping;
          resolve(tex);
        },
        undefined,
        (err) => {
          cleanup();
          reject(new Error(`Failed to parse .hdr file: ${err instanceof Error ? err.message : String(err)}`));
        }
      );
    } else {
      const loader = new EXRLoader();
      loader.load(
        blobUrl,
        (tex) => {
          cleanup();
          tex.mapping = THREE.EquirectangularReflectionMapping;
          resolve(tex);
        },
        undefined,
        (err) => {
          cleanup();
          reject(new Error(`Failed to parse .exr file: ${err instanceof Error ? err.message : String(err)}`));
        }
      );
    }
  });
}

/**
 * Generates zero-dependency procedural equirectangular IBL sky textures for 3D environments
 */
export function createProceduralSkyTexture(preset: ProceduralSkyPreset): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  if (preset === 'daylight') {
    grad.addColorStop(0, '#1e488f');
    grad.addColorStop(0.42, '#6ba4d9');
    grad.addColorStop(0.51, '#d8e9f5');
    grad.addColorStop(0.55, '#3b4248');
    grad.addColorStop(1, '#15181c');
  } else if (preset === 'sunset') {
    grad.addColorStop(0, '#131836');
    grad.addColorStop(0.35, '#59335c');
    grad.addColorStop(0.49, '#e07b42');
    grad.addColorStop(0.53, '#33221c');
    grad.addColorStop(1, '#0c090a');
  } else if (preset === 'cyberNight') {
    grad.addColorStop(0, '#040610');
    grad.addColorStop(0.4, '#0c1430');
    grad.addColorStop(0.5, '#1d1238');
    grad.addColorStop(0.54, '#0a0a14');
    grad.addColorStop(1, '#030306');
  } else {
    // Studio softbox dome
    grad.addColorStop(0, '#2a2f3a');
    grad.addColorStop(0.48, '#1a1e26');
    grad.addColorStop(0.52, '#101218');
    grad.addColorStop(1, '#07080c');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Add bright specular skybox light panels / sun disc so PBR metallics & glass catch realistic reflections
  if (preset === 'studio') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillRect(160, 70, 200, 90);
    ctx.fillStyle = 'rgba(200, 225, 255, 0.65)';
    ctx.fillRect(660, 90, 180, 75);
    ctx.fillStyle = 'rgba(255, 210, 190, 0.35)';
    ctx.fillRect(430, 35, 160, 45);
  } else if (preset === 'daylight') {
    const sunGrad = ctx.createRadialGradient(320, 150, 4, 320, 150, 90);
    sunGrad.addColorStop(0, 'rgba(255, 252, 235, 1)');
    sunGrad.addColorStop(0.25, 'rgba(255, 240, 200, 0.5)');
    sunGrad.addColorStop(1, 'rgba(255, 240, 200, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(200, 30, 240, 240);
  } else if (preset === 'sunset') {
    const sunGrad = ctx.createRadialGradient(512, 245, 6, 512, 245, 110);
    sunGrad.addColorStop(0, 'rgba(255, 220, 150, 1)');
    sunGrad.addColorStop(0.3, 'rgba(255, 120, 60, 0.55)');
    sunGrad.addColorStop(1, 'rgba(255, 80, 40, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(380, 120, 260, 260);
  } else if (preset === 'cyberNight') {
    ctx.fillStyle = 'rgba(0, 229, 255, 0.85)';
    ctx.fillRect(180, 160, 90, 130);
    ctx.fillStyle = 'rgba(255, 0, 128, 0.85)';
    ctx.fillRect(730, 150, 110, 140);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Classifies whether a loaded asset is a compact 3D object/character or a 3D environment scene
 */
export function detectAssetStageMode(
  meshesCount: number,
  rawSize: THREE.Vector3
): AssetStageMode {
  const maxHorizontal = Math.max(rawSize.x, rawSize.z);
  const height = Math.max(rawSize.y, 0.001);

  // Full 3D architectural levels, streets, rooms, terrains have either many scattered
  // scene pieces, meter-scale multi-building footprints, or wide flat terrain proportions.
  // Keep detailed vehicles/characters/props (often 15-35 meshes) in Object Stage.
  if (meshesCount >= 45 && maxHorizontal >= 8) return 'environment';
  if (meshesCount >= 12 && maxHorizontal >= 15 && maxHorizontal <= 120) return 'environment';
  if (maxHorizontal >= 20 && maxHorizontal > height * 5.0) return 'environment';
  return 'object';
}

/**
 * Computes an accurate bounding box using valid renderable meshes only
 * (preventing cameras/empties/light helpers in FBX/GLB scenes from skewing center/scale).
 */
function computeMeshOnlyBoundingBox(root: THREE.Object3D): THREE.Box3 {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const meshBox = new THREE.Box3();

  root.traverse((child) => {
    if (child instanceof THREE.Mesh && child.visible) {
      if (!child.geometry) return;
      if (!child.geometry.boundingBox) {
        child.geometry.computeBoundingBox();
      }
      if (!child.geometry.boundingBox) return;

      meshBox.copy(child.geometry.boundingBox);
      meshBox.applyMatrix4(child.matrixWorld);

      if (
        Number.isFinite(meshBox.min.x) &&
        Number.isFinite(meshBox.min.y) &&
        Number.isFinite(meshBox.min.z) &&
        Number.isFinite(meshBox.max.x) &&
        Number.isFinite(meshBox.max.y) &&
        Number.isFinite(meshBox.max.z)
      ) {
        box.union(meshBox);
      }
    }
  });

  if (box.isEmpty()) {
    box.setFromObject(root);
  }
  return box;
}

/**
 * Centers, grounds, scales, and normalizes any 3D model OR 3D environment (.fbx / .glb).
 */
export function prepareModelForLightingStudio(
  rawModel: THREE.Object3D,
  optionsOrHeight: number | PrepareModelOptions = {},
  animationsCount: number = 0
): PreparedModelResult {
  const opts: PrepareModelOptions =
    typeof optionsOrHeight === 'number'
      ? { stageMode: 'object', targetSpan: optionsOrHeight }
      : optionsOrHeight;

  const container = new THREE.Group();
  container.name = 'UploadedModelContainer';

  let meshesCount = 0;
  let verticesCount = 0;
  let trianglesCount = 0;
  let embeddedLights = 0;
  const materialsSet = new Set<string>();

  // 1. Normalize all meshes, materials, and embedded lights
  rawModel.traverse((child) => {
    if (child instanceof THREE.Light) {
      embeddedLights++;
      // Disable extra shadow casting on imported scene lights to stay within GPU WebGL limits
      child.castShadow = false;
      // Blender/UE5 candela exports often come in at huge intensity values (e.g. 500–5000W)
      if (child.intensity > 25) {
        child.intensity = Math.min(8, child.intensity * 0.005);
      }
      return;
    }

    if (child instanceof THREE.Mesh) {
      meshesCount++;
      child.castShadow = true;
      child.receiveShadow = true;

      // Guard InstancedMesh frustum culling in wide scenes
      if (child instanceof THREE.InstancedMesh) {
        child.frustumCulled = false;
      }

      // Ensure geometry vertex normals exist for proper PBR lighting
      if (child.geometry) {
        if (!child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }
        const posAttr = child.geometry.attributes.position;
        if (posAttr) {
          verticesCount += posAttr.count;
          if (child.geometry.index) {
            trianglesCount += child.geometry.index.count / 3;
          } else {
            trianglesCount += posAttr.count / 3;
          }
        }
      }

      // Assign fallback PBR material if mesh has no material
      if (!child.material) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xb0b7c3,
          roughness: 0.5,
          metalness: 0.2,
        });
      }

      // Configure color spaces & fix transparent/alpha bugs common in FBX exports
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (!mat) return;
        materialsSet.add(mat.uuid);
        if ('map' in mat && mat.map) {
          mat.map.colorSpace = THREE.SRGBColorSpace;
          mat.map.needsUpdate = true;
        }
        if ('emissiveMap' in mat && mat.emissiveMap) {
          mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
        }
        if ('envMapIntensity' in mat) {
          mat.envMapIntensity = 1.0;
        }
        // Fix FBX opacity: 0 bug where matte objects disappear
        if ('opacity' in mat && mat.opacity === 0 && !mat.transparent) {
          mat.opacity = 1.0;
        }
      });

      // Cache original material for Clay / Normals / Wireframe passes
      if (!child.userData.originalMaterial) {
        child.userData.originalMaterial = child.material;
      }
    }
  });

  // 2. Reset root transform so re-preparing the same model across stage modes is idempotent
  rawModel.scale.setScalar(1);
  rawModel.position.set(0, 0, 0);

  // Measure mesh-only bounding box & resolve Object vs 3D Environment stage mode
  const rawBbox = computeMeshOnlyBoundingBox(rawModel);
  const rawSize = new THREE.Vector3();
  rawBbox.getSize(rawSize);
  const rawCenter = new THREE.Vector3();
  rawBbox.getCenter(rawCenter);

  const stageMode: AssetStageMode =
    opts.stageMode && opts.stageMode !== 'auto'
      ? opts.stageMode
      : detectAssetStageMode(meshesCount, rawSize);

  const defaultSpan = stageMode === 'environment' ? 24.0 : 4.8;
  const targetSpan = opts.targetSpan ?? defaultSpan;

  const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z, 0.001);
  const scale = targetSpan / maxDim;

  rawModel.scale.setScalar(scale);

  // Center horizontally at (0, _, 0) and ground lowest surface at y = 0
  const scaledCenter = rawCenter.clone().multiplyScalar(scale);
  const scaledMinY = rawBbox.min.y * scale;
  rawModel.position.set(-scaledCenter.x, -scaledMinY, -scaledCenter.z);

  container.add(rawModel);

  const scaledWidth = Math.max(0.1, rawSize.x * scale);
  const scaledHeight = Math.max(0.1, rawSize.y * scale);
  const scaledDepth = Math.max(0.1, rawSize.z * scale);
  const scaledRadius = Math.max(1.5, Math.sqrt(scaledWidth ** 2 + scaledHeight ** 2 + scaledDepth ** 2) * 0.5);

  return {
    container,
    innerModel: rawModel,
    stageMode,
    scaledBounds: {
      width: scaledWidth,
      height: scaledHeight,
      depth: scaledDepth,
      radius: scaledRadius,
      centerY: scaledHeight * 0.45,
    },
    stats: {
      meshes: meshesCount,
      vertices: Math.round(verticesCount),
      triangles: Math.round(trianglesCount),
      materials: materialsSet.size,
      dimensions: {
        x: Math.round(scaledWidth * 100) / 100,
        y: Math.round(scaledHeight * 100) / 100,
        z: Math.round(scaledDepth * 100) / 100,
      },
      stageMode,
      embeddedLights,
      animationsCount,
    },
  };
}

/**
 * Builds an authentic studio pedestal lookdev stage with contact shadow disc
 */
export function buildStudioPedestal(radius: number = 8.0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'StudioPedestalGroup';

  // Tier 1: Primary dark lookdev turntable top deck (top flush at y = 0)
  const floorGeo = new THREE.CylinderGeometry(radius, radius * 1.03, 0.24, 96);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x171a24,
    roughness: 0.45,
    metalness: 0.25,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.name = 'StudioFloor';
  floor.position.y = -0.12;
  floor.receiveShadow = true;
  group.add(floor);

  // Tier 2: Architectural beveled plinth skirt for solid grounded silhouette
  const skirtGeo = new THREE.CylinderGeometry(radius * 1.05, radius * 1.12, 0.28, 96);
  const skirtMat = new THREE.MeshStandardMaterial({
    color: 0x0d0f15,
    roughness: 0.72,
    metalness: 0.18,
  });
  const skirt = new THREE.Mesh(skirtGeo, skirtMat);
  skirt.name = 'StudioPedestalSkirt';
  skirt.position.y = -0.38;
  skirt.receiveShadow = true;
  group.add(skirt);

  // Outer brushed metallic bezel ring
  const outerRingGeo = new THREE.RingGeometry(radius * 0.965, radius * 0.985, 96);
  const outerRingMat = new THREE.MeshStandardMaterial({
    color: 0x525b70,
    roughness: 0.35,
    metalness: 0.75,
    side: THREE.DoubleSide,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.003;
  outerRing.receiveShadow = true;
  group.add(outerRing);

  // Concentric studio calibration ring
  const ringGeo = new THREE.RingGeometry(radius * 0.72, radius * 0.732, 96);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x475063,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.32,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  group.add(ring);

  // Soft contact shadow disc
  const shadowTex = createRadialShadowTexture();
  const shadowGeo = new THREE.PlaneGeometry(radius * 1.4, radius * 1.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.004;
  shadowMesh.renderOrder = 1;
  group.add(shadowMesh);

  return group;
}

function createRadialShadowTexture(): THREE.Texture {
  if (typeof document !== 'undefined') {
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
      grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(shadowCanvas);
    }
  }
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  const center = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2) / center;
      const alpha = Math.max(0, Math.min(255, Math.floor((1 - Math.min(dist, 1)) * 200)));
      data[idx] = 0;
      data[idx + 1] = 0;
      data[idx + 2] = 0;
      data[idx + 3] = alpha;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Default multi-surface PBR lookdev showcase asset (used before user uploads their model/environment)
 */
export function buildDefaultLookdevAsset(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'DefaultLookdevAsset';

  const pedestalGeo = new THREE.CylinderGeometry(1.4, 1.8, 1.0, 32);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x22252e,
    roughness: 0.45,
    metalness: 0.6,
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.y = 0.5;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  root.add(pedestal);

  const sphereGeo = new THREE.SphereGeometry(1.2, 48, 36);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0xc4c9d4,
    roughness: 0.22,
    metalness: 0.85,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.y = 2.2;
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  root.add(sphere);

  const torusGeo = new THREE.TorusGeometry(1.5, 0.15, 24, 64);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.35,
    metalness: 0.5,
  });
  const torus = new THREE.Mesh(torusGeo, ringMat);
  torus.position.y = 2.2;
  torus.rotation.x = Math.PI / 4;
  torus.castShadow = true;
  torus.receiveShadow = true;
  root.add(torus);

  const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const cubeMat = new THREE.MeshStandardMaterial({
    color: 0x8892b0,
    roughness: 0.7,
    metalness: 0.1,
  });
  const cube = new THREE.Mesh(cubeGeo, cubeMat);
  cube.position.set(-1.8, 1.2, 0.8);
  cube.rotation.set(0.4, 0.6, 0.2);
  cube.castShadow = true;
  cube.receiveShadow = true;
  root.add(cube);

  const cylinderGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 24);
  const cylinderMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.95,
  });
  const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
  cylinder.position.set(1.8, 1.0, -0.6);
  cylinder.rotation.set(-0.3, 0.2, 0.5);
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  root.add(cylinder);

  return root;
}
