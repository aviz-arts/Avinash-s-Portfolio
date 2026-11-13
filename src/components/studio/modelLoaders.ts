import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export type SupportedModelFormat = 'fbx' | 'glb';

export interface ModelStats {
  meshes: number;
  vertices: number;
  triangles: number;
  materials: number;
  dimensions: { x: number; y: number; z: number };
}

export interface PreparedModelResult {
  container: THREE.Group;
  innerModel: THREE.Object3D;
  stats: ModelStats;
}

/**
 * Extracts and validates the 3D model format from a filename or URL (.fbx or .glb only)
 */
export function getSupportedModelFormat(fileNameOrUrl: string): SupportedModelFormat | null {
  const clean = fileNameOrUrl.split('?')[0].split('#')[0].trim().toLowerCase();
  const ext = clean.split('.').pop();
  if (ext === 'fbx') return 'fbx';
  if (ext === 'glb') return 'glb';
  return null;
}

/**
 * Loads a model from an in-memory ArrayBuffer (.fbx or .glb only)
 */
export function loadModelFromArrayBuffer(
  buffer: ArrayBuffer,
  format: SupportedModelFormat
): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    if (format === 'fbx') {
      try {
        const fbxLoader = new FBXLoader();
        const group = fbxLoader.parse(buffer, '');
        resolve(group);
      } catch (err) {
        reject(new Error(`Failed to parse FBX file: ${err instanceof Error ? err.message : String(err)}`));
      }
    } else if (format === 'glb') {
      const gltfLoader = new GLTFLoader();
      gltfLoader.parse(
        buffer,
        '',
        (gltf) => {
          resolve(gltf.scene || gltf.scenes[0]);
        },
        (error) => {
          reject(new Error(`Failed to parse GLB file: ${error instanceof Error ? error.message : String(error)}`));
        }
      );
    } else {
      reject(new Error('Unsupported format. Only .fbx and .glb files are allowed.'));
    }
  });
}

/**
 * Loads a model from a remote URL (.fbx or .glb only)
 */
export function loadModelFromUrl(url: string): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    const format = getSupportedModelFormat(url);
    if (!format) {
      reject(new Error('Only .fbx and .glb 3D model URLs are supported.'));
      return;
    }

    if (format === 'fbx') {
      const loader = new FBXLoader();
      loader.load(url, resolve, undefined, reject);
    } else {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => resolve(gltf.scene || gltf.scenes[0]),
        undefined,
        reject
      );
    }
  });
}

/**
 * Centers, grounds, scales, and gathers statistics for any arbitrary 3D model
 */
export function prepareModelForLightingStudio(
  rawModel: THREE.Object3D,
  targetHeight: number = 4.2
): PreparedModelResult {
  const container = new THREE.Group();
  container.name = 'UploadedModelContainer';

  let meshesCount = 0;
  let verticesCount = 0;
  let trianglesCount = 0;
  const materialsSet = new Set<string>();

  // 1. Prepare all child meshes for lighting & shadows
  rawModel.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshesCount++;
      child.castShadow = true;
      child.receiveShadow = true;

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

      // Ensure at least a default standard material exists if FBX/GLB mesh lacks one
      if (!child.material) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xb0b7c3,
          roughness: 0.5,
          metalness: 0.2,
        });
      }

      // Preserve original materials and configure color spaces
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (mat) {
          materialsSet.add(mat.uuid);
          if ('map' in mat && mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
          if ('emissiveMap' in mat && mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
          // Ensure environment map reflections respond
          if ('envMapIntensity' in mat) {
            mat.envMapIntensity = 1.0;
          }
        }
      });

      // Cache original material for Clay / Normals / Wireframe passes
      if (!child.userData.originalMaterial) {
        child.userData.originalMaterial = child.material;
      }
    }
  });

  // 2. Measure bounding box and dimensions
  const bbox = new THREE.Box3().setFromObject(rawModel);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const center = new THREE.Vector3();
  bbox.getCenter(center);

  // Fallback if model is flat or zero-sized
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const scale = targetHeight / maxDim;

  rawModel.scale.setScalar(scale);

  // Ground model so lowest point sits exactly at y = 0
  const scaledCenter = center.clone().multiplyScalar(scale);
  const scaledMinY = bbox.min.y * scale;

  rawModel.position.set(-scaledCenter.x, -scaledMinY, -scaledCenter.z);

  container.add(rawModel);

  return {
    container,
    innerModel: rawModel,
    stats: {
      meshes: meshesCount,
      vertices: Math.round(verticesCount),
      triangles: Math.round(trianglesCount),
      materials: materialsSet.size,
      dimensions: {
        x: Math.round(size.x * 100) / 100,
        y: Math.round(size.y * 100) / 100,
        z: Math.round(size.z * 100) / 100,
      },
    },
  };
}

/**
 * Builds an authentic studio pedestal lookdev stage with contact shadow disc
 */
export function buildStudioPedestal(radius: number = 7.0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'StudioPedestalGroup';

  // Base circular floor
  const floorGeo = new THREE.CylinderGeometry(radius, radius + 0.5, 0.25, 64);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x181a20,
    roughness: 0.65,
    metalness: 0.15,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.name = 'StudioFloor';
  floor.position.y = -0.125;
  floor.receiveShadow = true;
  group.add(floor);

  // Concentric studio measurement ring
  const ringGeo = new THREE.RingGeometry(radius * 0.75, radius * 0.77, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x3f4452,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  group.add(ring);

  // Soft contact shadow disc
  const shadowTex = createRadialShadowTexture();
  const shadowGeo = new THREE.PlaneGeometry(radius * 1.3, radius * 1.3);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.005;
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
  // Headless / test fallback
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
 * Default multi-surface PBR lookdev showcase asset (used before user uploads their model)
 * Features curved surfaces, sharp chamfers, chrome, metallic, and rough matte patches
 */
export function buildDefaultLookdevAsset(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'DefaultLookdevAsset';

  // 1. Center Pedestal Column
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

  // 2. Multi-Faceted Lookdev Sphere
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

  // 3. Inner Carved Ring (Gives deep self-shadowing crevices)
  const torusGeo = new THREE.TorusGeometry(1.5, 0.15, 24, 64);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xef4444, // Red accent
    roughness: 0.35,
    metalness: 0.5,
  });
  const torus = new THREE.Mesh(torusGeo, ringMat);
  torus.position.y = 2.2;
  torus.rotation.x = Math.PI / 4;
  torus.castShadow = true;
  torus.receiveShadow = true;
  root.add(torus);

  // 4. Floating Geometric Satellites for Shadow Testing
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
