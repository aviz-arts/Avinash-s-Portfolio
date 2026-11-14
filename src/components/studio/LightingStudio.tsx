import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { applyRenderPassMode } from './proceduralAssets';
import {
  prepareModelForLightingStudio,
  buildStudioPedestal,
  buildDefaultLookdevAsset,
  loadModelPayloadFromArrayBuffer,
  loadModelPayloadFromUrl,
  loadEnvironmentTextureFromArrayBuffer,
  createProceduralSkyTexture,
  getSupportedModelFormat,
  getSupportedEnvFormat,
  SupportedModelFormat,
  SupportedEnvFormat,
  AssetStageMode,
  ProceduralSkyPreset,
  PreparedModelResult,
  ModelStats,
} from './modelLoaders';
import {
  saveUploadedModel,
  loadUploadedModel,
  clearUploadedModel,
  saveUploadedEnvMap,
  loadUploadedEnvMap,
  clearUploadedEnvMap,
} from '../../utils/modelStorage';
import {
  LIGHTING_PRESETS,
  LightSettings,
  polarToCartesian,
  kelvinToHex,
  hexToRgb,
  normalizeHex,
} from '../../utils/lightingLogic';
import { RgbHexColorControl } from './RgbHexColorControl';
import {
  Sun,
  Sliders,
  Camera,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Eye,
  Flame,
  Droplets,
  Film,
  Compass,
  Palette,
  Crosshair,
  Volume2,
  Move,
  Code,
  Layout,
  Upload,
  FileCode,
  RotateCcw,
  Target,
  Box,
  Link as LinkIcon,
  X,
  AlertCircle,
  Globe,
} from 'lucide-react';

interface LightingStudioProps {
  className?: string;
}

export const LightingStudio: React.FC<LightingStudioProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const envInputRef = useRef<HTMLInputElement>(null);

  // Active lighting settings
  const [lighting, setLighting] = useState<LightSettings>(() => {
    return LIGHTING_PRESETS.studio || Object.values(LIGHTING_PRESETS)[0];
  });

  // Model & 3D Environment UI state
  const [modelName, setModelName] = useState<string>('Studio Lookdev Model');
  const [isCustomModel, setIsCustomModel] = useState<boolean>(false);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);
  const [stageMode, setStageMode] = useState<AssetStageMode>('object');
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [modelScale, setModelScale] = useState<number>(1.0);
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');

  // HDRI / 3D Skybox Environment state
  const [skyPreset, setSkyPreset] = useState<ProceduralSkyPreset | 'custom'>('studio');
  const [customEnvName, setCustomEnvName] = useState<string | null>(null);
  const [showSkybox, setShowSkybox] = useState<boolean>(false);
  const [envIntensity, setEnvIntensity] = useState<number>(1.0);
  const [showBase, setShowBase] = useState<boolean>(true);

  // Studio UI layout state
  const [activeTab, setActiveTab] = useState<
    'presets' | 'key' | 'fill' | 'rim' | 'point' | 'atmosphere' | 'post' | 'passes' | 'camera'
  >('presets');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'overlay' | 'below'>('below');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [renderPass, setRenderPass] = useState<'final' | 'clay' | 'normals' | 'wireframe'>('final');
  const [autoRotate, setAutoRotate] = useState(false);
  const [turntableSpeed, setTurntableSpeed] = useState(1.2);
  const [pulseDiegeticLight, setPulseDiegeticLight] = useState(true);

  // Refs for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelContainerRef = useRef<THREE.Group | null>(null);
  const activeMeshGroupRef = useRef<THREE.Group | null>(null);
  const rawModelRef = useRef<{ object: THREE.Object3D; animations: THREE.AnimationClip[]; name: string; isCustom: boolean; format?: SupportedModelFormat; buffer?: ArrayBuffer } | null>(null);
  const pedestalRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const pmremGeneratorRef = useRef<THREE.PMREMGenerator | null>(null);
  const envRenderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const envTextureRef = useRef<THREE.Texture | null>(null);
  const scaledRadiusRef = useRef<number>(4.0);
  const baseRadiusRef = useRef<number>(6.0);

  // Light objects refs
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.HemisphereLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const localLightRef = useRef<THREE.PointLight | null>(null);

  // Reusable materials for pass switching
  const clayMatRef = useRef<THREE.MeshStandardMaterial>(
    new THREE.MeshStandardMaterial({ color: 0x858a98, roughness: 0.72, metalness: 0.08 })
  );
  const normalMatRef = useRef<THREE.MeshNormalMaterial>(new THREE.MeshNormalMaterial());

  // Mutable state for render loop
  const stateRef = useRef({
    lighting,
    renderPass,
    autoRotate,
    turntableSpeed,
    pulseDiegeticLight,
    showSkybox,
    envIntensity,
    showBase,
    isSoftwareGl: false,
  });

  useEffect(() => {
    stateRef.current = {
      lighting,
      renderPass,
      autoRotate,
      turntableSpeed,
      pulseDiegeticLight,
      showSkybox,
      envIntensity,
      showBase,
      isSoftwareGl: stateRef.current.isSoftwareGl,
    };
    if (pedestalRef.current) {
      pedestalRef.current.visible = showBase;
    }
  }, [lighting, renderPass, autoRotate, turntableSpeed, pulseDiegeticLight, showSkybox, envIntensity, showBase]);

  // Apply adaptive camera, OrbitControls, studio base scale, and shadow frustum for Object vs 3D Environment
  const applyStageFraming = useCallback((
    mode: AssetStageMode,
    bounds: PreparedModelResult['scaledBounds']
  ) => {
    scaledRadiusRef.current = bounds.radius;

    const horizontalRadius = Math.max(bounds.width, bounds.depth) * 0.5;
    const desiredBaseRadius =
      mode === 'environment'
        ? Math.max(16, horizontalRadius * 1.25)
        : Math.max(5.2, horizontalRadius * 1.65);
    baseRadiusRef.current = desiredBaseRadius;

    if (pedestalRef.current) {
      const baseScale = desiredBaseRadius / 8.0;
      pedestalRef.current.scale.set(
        baseScale,
        mode === 'environment' ? Math.max(1, baseScale * 0.45) : 1,
        baseScale
      );
      pedestalRef.current.position.y = mode === 'environment' ? -0.02 : 0;
      pedestalRef.current.visible = stateRef.current.showBase;
    }

    if (keyLightRef.current) {
      const shadowHalf = mode === 'environment' ? Math.max(14, bounds.radius * 1.15) : 9;
      keyLightRef.current.shadow.camera.left = -shadowHalf;
      keyLightRef.current.shadow.camera.right = shadowHalf;
      keyLightRef.current.shadow.camera.top = shadowHalf;
      keyLightRef.current.shadow.camera.bottom = -shadowHalf;
      keyLightRef.current.shadow.camera.near = 0.5;
      keyLightRef.current.shadow.camera.far = Math.max(40, shadowHalf * 5);
      keyLightRef.current.shadow.camera.updateProjectionMatrix();

      const keyRadius = mode === 'environment' ? Math.max(18, bounds.radius * 1.45) : 12;
      const [kx, ky, kz] = polarToCartesian(
        stateRef.current.lighting.keyLight.azimuth,
        stateRef.current.lighting.keyLight.elevation,
        keyRadius
      );
      keyLightRef.current.position.set(kx, ky, kz);
    }

    if (cameraRef.current && controlsRef.current) {
      const cam = cameraRef.current;
      const ctrl = controlsRef.current;

      cam.far = mode === 'environment' ? Math.max(300, bounds.radius * 16) : 120;
      cam.near = mode === 'environment' ? 0.15 : 0.1;
      cam.updateProjectionMatrix();

      ctrl.screenSpacePanning = true;
      ctrl.minDistance = mode === 'environment' ? 0.2 : 1.5;
      ctrl.maxDistance = mode === 'environment' ? Math.max(45, bounds.radius * 4.5) : 25;
      ctrl.maxPolarAngle = mode === 'environment' ? Math.PI * 0.65 : Math.PI / 2 - 0.02;

      const targetY = mode === 'environment' ? Math.max(1.2, bounds.height * 0.35) : (bounds.centerY || 2.0);
      ctrl.target.set(0, targetY, 0);

      if (mode === 'environment') {
        // Place camera at an elevated panoramic overlook inside/facing the 3D environment
        const dist = Math.max(6, bounds.radius * 0.78);
        cam.position.set(dist * 0.65, targetY + bounds.height * 0.45 + 1.5, dist * 0.85);
      } else {
        const dist = Math.max(5.5, bounds.radius * 2.2);
        cam.position.set(0, targetY + 1.2, dist);
      }
      ctrl.update();
    }
  }, []);

  // Replace active model or 3D environment in the scene
  const replaceSceneModel = useCallback((
    prepared: PreparedModelResult,
    name: string,
    isCustom: boolean,
    animations: THREE.AnimationClip[] = []
  ) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
    }

    if (activeMeshGroupRef.current) {
      scene.remove(activeMeshGroupRef.current);
    }

    scene.add(prepared.container);
    activeMeshGroupRef.current = prepared.container;
    modelContainerRef.current = prepared.container;

    setModelStats(prepared.stats);
    setStageMode(prepared.stageMode);
    setModelName(name);
    setIsCustomModel(isCustom);
    setModelError(null);
    setModelScale(1.0);

    // Play embedded animations if present
    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(prepared.innerModel);
      animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
      mixerRef.current = mixer;
    }

    applyRenderPassMode(prepared.container, stateRef.current.renderPass, clayMatRef.current, normalMatRef.current);
    applyStageFraming(prepared.stageMode, prepared.scaledBounds);
  }, [applyStageFraming]);

  // Toggle manually between Object Stage (pedestal) and 3D Environment (full scene scale)
  const handleToggleStageMode = () => {
    if (!rawModelRef.current) return;
    const nextMode: AssetStageMode = stageMode === 'object' ? 'environment' : 'object';
    const rawEntry = rawModelRef.current;
    const prepared = prepareModelForLightingStudio(
      rawEntry.object,
      { stageMode: nextMode },
      rawEntry.animations.length
    );
    replaceSceneModel(prepared, rawEntry.name, rawEntry.isCustom, rawEntry.animations);
    if (rawEntry.isCustom && rawEntry.buffer && rawEntry.format) {
      saveUploadedModel(rawEntry.name, rawEntry.buffer, rawEntry.format, nextMode);
    }
  };

  // Load custom 3D model or 3D environment from raw ArrayBuffer (.fbx or .glb only)
  const handleModelBufferLoad = useCallback(async (
    buffer: ArrayBuffer,
    fileName: string,
    format: SupportedModelFormat,
    savedStageMode?: AssetStageMode
  ) => {
    setIsLoadingModel(true);
    setModelError(null);
    try {
      const payload = await loadModelPayloadFromArrayBuffer(buffer, format);
      const prepared = prepareModelForLightingStudio(
        payload.scene,
        savedStageMode ? { stageMode: savedStageMode } : { stageMode: 'auto' },
        payload.animations.length
      );
      rawModelRef.current = {
        object: payload.scene,
        animations: payload.animations,
        name: fileName,
        isCustom: true,
        format,
        buffer,
      };
      replaceSceneModel(prepared, fileName, true, payload.animations);
      // Persist in IndexedDB for session persistence
      await saveUploadedModel(fileName, buffer, format, prepared.stageMode);
    } catch (err) {
      console.error('Failed to load 3D asset:', err);
      setModelError(`Failed to load ${fileName}: ${err instanceof Error ? err.message : 'Invalid 3D format'}`);
    } finally {
      setIsLoadingModel(false);
    }
  }, [replaceSceneModel]);

  // Load model or 3D environment from direct URL
  const handleUrlLoad = async (url: string) => {
    if (!url.trim()) return;
    setIsLoadingModel(true);
    setModelError(null);
    setShowUrlModal(false);
    try {
      const payload = await loadModelPayloadFromUrl(url);
      const fileName = url.split('/').pop()?.split('?')[0] || 'Remote 3D Asset';
      const prepared = prepareModelForLightingStudio(
        payload.scene,
        { stageMode: 'auto' },
        payload.animations.length
      );
      rawModelRef.current = {
        object: payload.scene,
        animations: payload.animations,
        name: fileName,
        isCustom: true,
      };
      replaceSceneModel(prepared, fileName, true, payload.animations);
    } catch (err) {
      console.error('Failed to load 3D asset from URL:', err);
      setModelError(`Failed to load asset from URL: ${err instanceof Error ? err.message : 'Network/CORS or invalid format'}`);
    } finally {
      setIsLoadingModel(false);
    }
  };

  // Apply procedural or HDR/EXR environment lighting
  const applyEnvironmentMapTexture = useCallback((
    equirectTexture: THREE.Texture,
    displayAsSkybox: boolean
  ) => {
    const scene = sceneRef.current;
    const pmrem = pmremGeneratorRef.current;
    if (!scene || !pmrem) return;

    if (envRenderTargetRef.current) {
      envRenderTargetRef.current.dispose();
    }
    if (envTextureRef.current && envTextureRef.current !== equirectTexture) {
      envTextureRef.current.dispose();
    }

    const rt = pmrem.fromEquirectangular(equirectTexture);
    envRenderTargetRef.current = rt;
    envTextureRef.current = equirectTexture;

    scene.environment = rt.texture;
    scene.environmentIntensity = stateRef.current.envIntensity;
    if (displayAsSkybox) {
      scene.background = rt.texture;
      scene.backgroundBlurriness = 0.04;
    } else {
      scene.background = new THREE.Color(stateRef.current.lighting.fog.color);
    }
  }, []);

  const handleSelectProceduralSky = (preset: ProceduralSkyPreset) => {
    setSkyPreset(preset);
    setCustomEnvName(null);
    clearUploadedEnvMap();
    const tex = createProceduralSkyTexture(preset);
    applyEnvironmentMapTexture(tex, showSkybox);
  };

  const handleEnvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const format: SupportedEnvFormat | null = getSupportedEnvFormat(file.name);
    if (!format) {
      setModelError('Unsupported HDRI environment format. Please upload a .hdr or .exr file.');
      e.target.value = '';
      return;
    }
    setIsLoadingModel(true);
    try {
      const buffer = await file.arrayBuffer();
      const tex = await loadEnvironmentTextureFromArrayBuffer(buffer, format);
      setSkyPreset('custom');
      setCustomEnvName(file.name);
      setShowSkybox(true);
      applyEnvironmentMapTexture(tex, true);
      await saveUploadedEnvMap(file.name, buffer, format);
    } catch (err) {
      setModelError(`Failed to load HDRI environment: ${err instanceof Error ? err.message : 'Invalid file'}`);
    } finally {
      setIsLoadingModel(false);
      e.target.value = '';
    }
  };

  // Reset to default lookdev calibration asset
  const handleResetToDefaultModel = async () => {
    const defaultRaw = buildDefaultLookdevAsset();
    const prepared = prepareModelForLightingStudio(defaultRaw, { stageMode: 'object', targetSpan: 3.8 });
    rawModelRef.current = {
      object: defaultRaw,
      animations: [],
      name: 'Studio Lookdev Model',
      isCustom: false,
    };
    replaceSceneModel(prepared, 'Studio Lookdev Model', false, []);
    await clearUploadedModel();
  };

  // File picker handler (.fbx or .glb only)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const format = getSupportedModelFormat(file.name);
    if (!format) {
      setModelError('Unsupported file format. Please upload a .fbx or .glb 3D model file.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        handleModelBufferLoad(buffer, file.name, format);
      }
    };
    reader.onerror = () => {
      setModelError('Failed to read file from disk.');
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Drag and Drop handlers for 3D canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const format = getSupportedModelFormat(file.name);
    if (!format) {
      setModelError('Unsupported file format. Please drop a .fbx or .glb 3D model file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        handleModelBufferLoad(buffer, file.name, format);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        if (!gl) return true;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          return /swiftshader|llvmpipe|software/i.test(renderer);
        }
        return false;
      } catch {
        return false;
      }
    })();
    stateRef.current.isSoftwareGl = isSoftwareGl;
    const activeLighting = lighting || LIGHTING_PRESETS.studio || Object.values(LIGHTING_PRESETS)[0];

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(activeLighting.fog?.color || '#07090e');
    sceneRef.current = scene;

    // 2. Camera with cinematic focal length
    const camera = new THREE.PerspectiveCamera(
      activeLighting.camera?.fov ?? 45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 3.2, 9.5);
    cameraRef.current = camera;

    // 3. Renderer with ACES Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      precision: isSoftwareGl ? 'mediump' : 'highp',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSoftwareGl ? 1 : 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Set ACES Tone Mapping
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = activeLighting.toneMapping?.exposure ?? 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Environment Lighting (PMREM)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    pmremGeneratorRef.current = pmremGenerator;
    const neutralEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(neutralEnv).texture;
    scene.environmentIntensity = stateRef.current.envIntensity;

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 1.5;
    controls.maxDistance = 30.0;
    controls.target.set(0, 2.0, 0);
    controlsRef.current = controls;

    // 6. Lights
    // Key Light (Directional Sun)
    const keyColorHex = normalizeHex(
      activeLighting.keyLight?.color ||
        (activeLighting.keyLight?.kelvin ? kelvinToHex(activeLighting.keyLight.kelvin) : '#ffffff'),
      '#ffffff'
    );
    const keyLight = new THREE.DirectionalLight(keyColorHex, activeLighting.keyLight?.intensity ?? 2.0);
    const [kx, ky, kz] = polarToCartesian(activeLighting.keyLight?.azimuth ?? 60, activeLighting.keyLight?.elevation ?? 50, 12);
    keyLight.position.set(kx, ky, kz);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = isSoftwareGl ? 512 : 2048;
    keyLight.shadow.mapSize.height = isSoftwareGl ? 512 : 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 9;
    keyLight.shadow.camera.bottom = -9;
    keyLight.shadow.bias = activeLighting.keyLight?.shadowBias ?? -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.radius = activeLighting.keyLight?.softness ?? 1.0;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    // Fill Light (Hemisphere Skylight with Indirect Bounce)
    const giMult = activeLighting.fillLight?.giBounceMultiplier ?? 1.0;
    const fillLight = new THREE.HemisphereLight(
      activeLighting.fillLight?.skyColor || '#c8d6e5',
      activeLighting.fillLight?.groundColor || '#485460',
      (activeLighting.fillLight?.intensity ?? 0.6) * giMult
    );
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    // Rim Light (Directional Kicker)
    const rimLight = new THREE.DirectionalLight(activeLighting.rimLight?.color || '#ffffff', activeLighting.rimLight?.intensity ?? 2.5);
    const [rx, ry, rz] = polarToCartesian(activeLighting.rimLight?.angle ?? 240, activeLighting.rimLight?.elevation ?? 30, 10);
    rimLight.position.set(rx, ry, rz);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Local Point Light (Diegetic Accent)
    const localLight = new THREE.PointLight(
      activeLighting.localLight?.color || '#f1f2f6',
      activeLighting.localLight?.intensity ?? 1.0,
      activeLighting.localLight?.distance ?? 12
    );
    localLight.position.set(
      activeLighting.localLight?.x ?? 0,
      activeLighting.localLight?.y ?? 3,
      activeLighting.localLight?.z ?? 2
    );
    scene.add(localLight);
    localLightRef.current = localLight;

    // Atmosphere Fog
    scene.fog = new THREE.Fog(
      activeLighting.fog?.color || '#07090e',
      activeLighting.fog?.near ?? 15,
      activeLighting.fog?.far ?? 60
    );

    // 7. Add Permanent Studio Pedestal Lookdev Stage (auto-hidden when loading a 3D Environment)
    const pedestal = buildStudioPedestal(8.0);
    pedestalRef.current = pedestal;
    scene.add(pedestal);

    // 8. Initial Model/Environment + HDRI Loading (Restore from IndexedDB if exists)
    (async () => {
      try {
        const storedEnv = await loadUploadedEnvMap();
        if (storedEnv && storedEnv.buffer && (storedEnv.format === 'hdr' || storedEnv.format === 'exr')) {
          const envTex = await loadEnvironmentTextureFromArrayBuffer(storedEnv.buffer, storedEnv.format);
          setSkyPreset('custom');
          setCustomEnvName(storedEnv.name);
          setShowSkybox(true);
          applyEnvironmentMapTexture(envTex, true);
        }
      } catch {
        // Ignore HDRI restore errors
      }

      try {
        const stored = await loadUploadedModel();
        if (stored && stored.buffer && (stored.format === 'fbx' || stored.format === 'glb')) {
          const payload = await loadModelPayloadFromArrayBuffer(stored.buffer, stored.format);
          const prepared = prepareModelForLightingStudio(
            payload.scene,
            stored.stageMode ? { stageMode: stored.stageMode } : { stageMode: 'auto' },
            payload.animations.length
          );
          rawModelRef.current = {
            object: payload.scene,
            animations: payload.animations,
            name: stored.name,
            isCustom: true,
            format: stored.format,
            buffer: stored.buffer,
          };
          replaceSceneModel(prepared, stored.name, true, payload.animations);
          return;
        }
      } catch {
        // ignore and fallback
      }
      // Fallback to default lookdev calibration asset
      const defaultRaw = buildDefaultLookdevAsset();
      const prepared = prepareModelForLightingStudio(defaultRaw, { stageMode: 'object', targetSpan: 3.8 });
      rawModelRef.current = {
        object: defaultRaw,
        animations: [],
        name: 'Studio Lookdev Model',
        isCustom: false,
      };
      replaceSceneModel(prepared, 'Studio Lookdev Model', false, []);
    })();

    // 9. Render Loop
    let frameId = 0;
    let isDisposed = false;
    let lastTime = performance.now();
    let elapsedTime = 0;

    function tick() {
      if (isDisposed) return;
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      elapsedTime += delta;

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      if (controlsRef.current) {
        if (stateRef.current.autoRotate && !isSoftwareGl) {
          controlsRef.current.autoRotate = true;
          controlsRef.current.autoRotateSpeed = stateRef.current.turntableSpeed;
        } else {
          controlsRef.current.autoRotate = false;
        }
        controlsRef.current.update();
      }

      // Diegetic light pulse
      if (localLightRef.current && stateRef.current.pulseDiegeticLight) {
        const pulse = Math.sin(elapsedTime * (stateRef.current.lighting.localLight.pulseSpeed || 1.8));
        localLightRef.current.intensity =
          stateRef.current.lighting.localLight.intensity * (0.85 + pulse * 0.15);
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    // Responsive ResizeObserver so fullscreen, mobile, and wide layouts always match WebGL size
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    if (resizeObserver) {
      resizeObserver.observe(container);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (mixerRef.current) mixerRef.current.stopAllAction();
      if (envRenderTargetRef.current) envRenderTargetRef.current.dispose();
      if (envTextureRef.current) envTextureRef.current.dispose();
      renderer.dispose();
      pmremGenerator.dispose();
      neutralEnv.dispose();
    };
  }, [replaceSceneModel, applyEnvironmentMapTexture]);

  // Synchronize dynamic light parameters without reloading the scene
  useEffect(() => {
    if (!lighting || !keyLightRef.current || !fillLightRef.current || !rimLightRef.current || !localLightRef.current) return;

    // Key Light (position radius adapts to Object vs 3D Environment scale)
    const keyColorHex = normalizeHex(
      lighting.keyLight.color ||
        (lighting.keyLight.kelvin ? kelvinToHex(lighting.keyLight.kelvin) : '#ffffff'),
      '#ffffff'
    );
    keyLightRef.current.color.set(keyColorHex);
    keyLightRef.current.intensity = lighting.keyLight.intensity;
    const keyRadius = stageMode === 'environment' ? Math.max(18, scaledRadiusRef.current * 1.45) : 12;
    const [kx, ky, kz] = polarToCartesian(lighting.keyLight.azimuth, lighting.keyLight.elevation, keyRadius);
    keyLightRef.current.position.set(kx, ky, kz);
    keyLightRef.current.shadow.bias = lighting.keyLight.shadowBias ?? -0.0005;
    keyLightRef.current.shadow.radius = lighting.keyLight.softness ?? 1.0;

    // Fill Light with GI multiplier
    const giMult = lighting.fillLight.giBounceMultiplier ?? 1.0;
    fillLightRef.current.color.set(lighting.fillLight.skyColor);
    fillLightRef.current.groundColor.set(lighting.fillLight.groundColor);
    fillLightRef.current.intensity = lighting.fillLight.intensity * giMult;

    // Rim Light
    rimLightRef.current.color.set(lighting.rimLight.color);
    rimLightRef.current.intensity = lighting.rimLight.intensity;
    const rimRadius = stageMode === 'environment' ? Math.max(16, scaledRadiusRef.current * 1.35) : 10;
    const [rx, ry, rz] = polarToCartesian(lighting.rimLight.angle, lighting.rimLight.elevation ?? 30, rimRadius);
    rimLightRef.current.position.set(rx, ry, rz);

    // Local Point Light
    localLightRef.current.color.set(lighting.localLight.color);
    localLightRef.current.intensity = lighting.localLight.intensity;
    localLightRef.current.distance = stageMode === 'environment'
      ? Math.max(lighting.localLight.distance, scaledRadiusRef.current * 1.2)
      : lighting.localLight.distance;
    localLightRef.current.position.set(lighting.localLight.x, lighting.localLight.y, lighting.localLight.z);

    // Fog, Skybox Background & Environment IBL Intensity
    if (sceneRef.current) {
      sceneRef.current.environmentIntensity = envIntensity;
      if (showSkybox && envRenderTargetRef.current) {
        sceneRef.current.background = envRenderTargetRef.current.texture;
        sceneRef.current.backgroundBlurriness = 0.04;
      } else {
        sceneRef.current.background = new THREE.Color(lighting.fog.color);
      }
      if (sceneRef.current.fog instanceof THREE.Fog) {
        sceneRef.current.fog.color.set(lighting.fog.color);
        sceneRef.current.fog.near = lighting.fog.near;
        sceneRef.current.fog.far = lighting.fog.far;
      }
    }

    // ACES Tone Mapping
    if (rendererRef.current) {
      if (lighting.toneMapping?.mode === 'reinhard') rendererRef.current.toneMapping = THREE.ReinhardToneMapping;
      else if (lighting.toneMapping?.mode === 'cineon') rendererRef.current.toneMapping = THREE.CineonToneMapping;
      else if (lighting.toneMapping?.mode === 'neutral') rendererRef.current.toneMapping = THREE.NeutralToneMapping;
      else if (lighting.toneMapping?.mode === 'linear') rendererRef.current.toneMapping = THREE.LinearToneMapping;
      else rendererRef.current.toneMapping = THREE.ACESFilmicToneMapping;

      rendererRef.current.toneMappingExposure = lighting.toneMapping?.exposure ?? 1.1;
    }

    // Surface wetness feedback on Studio Base deck
    if (pedestalRef.current) {
      const studioFloor = pedestalRef.current.getObjectByName('StudioFloor') as THREE.Mesh | undefined;
      if (studioFloor && studioFloor.material instanceof THREE.MeshStandardMaterial) {
        const wetness = lighting.surface?.wetness ?? 0.2;
        studioFloor.material.roughness = THREE.MathUtils.clamp(0.66 - wetness * 0.54, 0.08, 0.85);
        studioFloor.material.metalness = THREE.MathUtils.clamp(0.18 + wetness * 0.34, 0.12, 0.6);
      }
    }

    // Camera FOV
    if (cameraRef.current && lighting.camera?.fov) {
      cameraRef.current.fov = lighting.camera.fov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [lighting, stageMode, showSkybox, envIntensity]);

  // Synchronize Render Pass (PBR Lit, Clay, Normals, Wireframe)
  useEffect(() => {
    if (activeMeshGroupRef.current) {
      applyRenderPassMode(activeMeshGroupRef.current, renderPass, clayMatRef.current, normalMatRef.current);
    }
  }, [renderPass]);

  // Synchronize Model Scale & proportionally scale Studio Base
  useEffect(() => {
    if (activeMeshGroupRef.current) {
      activeMeshGroupRef.current.scale.setScalar(modelScale);
    }
    if (pedestalRef.current) {
      const scaledBase = (baseRadiusRef.current / 8.0) * Math.max(0.85, modelScale);
      pedestalRef.current.scale.set(
        scaledBase,
        stageMode === 'environment' ? Math.max(1, scaledBase * 0.45) : 1,
        scaledBase
      );
    }
  }, [modelScale, stageMode]);

  // Center camera focus on the active model or 3D environment
  const handleFrameModel = () => {
    if (!controlsRef.current || !modelStats || !cameraRef.current) return;
    const height = (modelStats.dimensions.y * modelScale) || 2.0;
    const targetY = stageMode === 'environment' ? Math.max(1.2, height * 0.35) : height * 0.45;
    controlsRef.current.target.set(0, targetY, 0);
    if (stageMode === 'environment') {
      const dist = Math.max(6, scaledRadiusRef.current * modelScale * 0.78);
      cameraRef.current.position.set(dist * 0.65, targetY + height * 0.45 + 1.5, dist * 0.85);
    } else {
      const dist = Math.max(5.5, scaledRadiusRef.current * modelScale * 2.2);
      cameraRef.current.position.set(0, targetY + 1.2, dist);
    }
    controlsRef.current.update();
  };

  // Preset lighting selection handler
  const handleSelectPreset = (presetKey: keyof typeof LIGHTING_PRESETS) => {
    const preset = LIGHTING_PRESETS[presetKey];
    if (preset) {
      setLighting(preset);
      if (preset.camera?.fov && cameraRef.current) {
        cameraRef.current.fov = preset.camera.fov;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  };

  // Code Export generator
  const handleCopyCode = (format: 'ue5' | 'threejs' | 'json') => {
    let output = '';
    const keyHex = normalizeHex(
      lighting.keyLight.color ||
        (lighting.keyLight.kelvin ? kelvinToHex(lighting.keyLight.kelvin) : '#ffffff'),
      '#ffffff'
    );
    const keyRgb = hexToRgb(keyHex);
    const skyRgb = hexToRgb(lighting.fillLight.skyColor);
    const groundRgb = hexToRgb(lighting.fillLight.groundColor);
    const rimRgb = hexToRgb(lighting.rimLight.color);
    const localRgb = hexToRgb(lighting.localLight.color);
    const fogRgb = hexToRgb(lighting.fog.color);

    if (format === 'ue5') {
      output = `// Unreal Engine 5 Lumen Lighting Rig Specification
// Model: ${modelName}
// Generated from Avinash's Real-time 3D Lighting Studio

// 1. Directional Sun Light (Key Light: ${keyHex.toUpperCase()} | RGB ${keyRgb.r}, ${keyRgb.g}, ${keyRgb.b})
DirectionalLight->SetIntensity(${lighting.keyLight.intensity.toFixed(2)}f);
DirectionalLight->SetLightColor(FLinearColor::FromSRGBColor(FColor(${keyRgb.r}, ${keyRgb.g}, ${keyRgb.b}))); // Hex: ${keyHex.toUpperCase()}
DirectionalLight->SetCastShadows(true);
DirectionalLight->bUseTemperature = true;
DirectionalLight->Temperature = ${lighting.keyLight.kelvin ?? 5600}f;
DirectionalLight->ShadowSourceAngle = ${((lighting.keyLight.softness ?? 1.0) * 1.5).toFixed(1)}f;

// 2. SkyLight (Lumen Indirect GI Bounce | Sky RGB ${skyRgb.r}, ${skyRgb.g}, ${skyRgb.b} / Ground RGB ${groundRgb.r}, ${groundRgb.g}, ${groundRgb.b})
SkyLight->SetIntensity(${lighting.fillLight.intensity.toFixed(2)}f);
SkyLight->SetLightColor(FLinearColor::FromSRGBColor(FColor(${skyRgb.r}, ${skyRgb.g}, ${skyRgb.b})));
SkyLight->IndirectLightingIntensity = ${(lighting.fillLight.giBounceMultiplier ?? 1.0).toFixed(2)}f;

// 3. Rim & Local Point Accent (Rim RGB ${rimRgb.r}, ${rimRgb.g}, ${rimRgb.b} | Point RGB ${localRgb.r}, ${localRgb.g}, ${localRgb.b})
RimLight->SetLightColor(FLinearColor::FromSRGBColor(FColor(${rimRgb.r}, ${rimRgb.g}, ${rimRgb.b}))); // Hex: ${normalizeHex(lighting.rimLight.color).toUpperCase()}
PointLight->SetLightColor(FLinearColor::FromSRGBColor(FColor(${localRgb.r}, ${localRgb.g}, ${localRgb.b}))); // Hex: ${normalizeHex(lighting.localLight.color).toUpperCase()}

// 4. Exponential Height Fog & PostProcess Volume (ACES Tone Mapping)
ExponentialHeightFog->FogInscatteringColor = FLinearColor::FromSRGBColor(FColor(${fogRgb.r}, ${fogRgb.g}, ${fogRgb.b}));
PostProcessVolume->Settings.AutoExposureMethod = EAutoExposureMethod::AEM_Manual;
PostProcessVolume->Settings.AutoExposureBias = ${(lighting.toneMapping?.exposure ? (lighting.toneMapping.exposure - 1.0) * 2 : 0).toFixed(2)}f;
PostProcessVolume->Settings.ToneCurveAmount = 1.0f; // ACES Filmic`;
    } else if (format === 'threejs') {
      output = `// Three.js Lighting Setup for "${modelName}"
const keyLight = new THREE.DirectionalLight('rgb(${keyRgb.r}, ${keyRgb.g}, ${keyRgb.b})', ${lighting.keyLight.intensity}); // HEX: ${keyHex.toUpperCase()}
const fillLight = new THREE.HemisphereLight('rgb(${skyRgb.r}, ${skyRgb.g}, ${skyRgb.b})', 'rgb(${groundRgb.r}, ${groundRgb.g}, ${groundRgb.b})', ${lighting.fillLight.intensity}); // HEX: ${normalizeHex(lighting.fillLight.skyColor).toUpperCase()} / ${normalizeHex(lighting.fillLight.groundColor).toUpperCase()}
const rimLight = new THREE.DirectionalLight('rgb(${rimRgb.r}, ${rimRgb.g}, ${rimRgb.b})', ${lighting.rimLight.intensity}); // HEX: ${normalizeHex(lighting.rimLight.color).toUpperCase()}
const pointLight = new THREE.PointLight('rgb(${localRgb.r}, ${localRgb.g}, ${localRgb.b})', ${lighting.localLight.intensity}, ${lighting.localLight.distance}); // HEX: ${normalizeHex(lighting.localLight.color).toUpperCase()}
scene.fog = new THREE.Fog('rgb(${fogRgb.r}, ${fogRgb.g}, ${fogRgb.b})', ${lighting.fog.near}, ${lighting.fog.far}); // HEX: ${normalizeHex(lighting.fog.color).toUpperCase()}

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = ${lighting.toneMapping?.exposure ?? 1.1};
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;`;
    } else {
      output = JSON.stringify(
        {
          model: modelName,
          stats: modelStats,
          colorFormats: {
            keyLight: { hex: keyHex.toUpperCase(), rgb: keyRgb },
            fillSky: { hex: normalizeHex(lighting.fillLight.skyColor).toUpperCase(), rgb: skyRgb },
            fillGround: { hex: normalizeHex(lighting.fillLight.groundColor).toUpperCase(), rgb: groundRgb },
            rimLight: { hex: normalizeHex(lighting.rimLight.color).toUpperCase(), rgb: rimRgb },
            pointLight: { hex: normalizeHex(lighting.localLight.color).toUpperCase(), rgb: localRgb },
            fog: { hex: normalizeHex(lighting.fog.color).toUpperCase(), rgb: fogRgb },
          },
          lighting,
        },
        null,
        2
      );
    }

    navigator.clipboard.writeText(output);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Hidden file input for 3D model / environment upload (.fbx and .glb only) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".fbx,.glb"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Hidden file input for 360° HDRI sky environment (.hdr and .exr) */}
      <input
        ref={envInputRef}
        type="file"
        accept=".hdr,.exr"
        className="hidden"
        onChange={handleEnvFileChange}
      />

      {/* Main 3D Canvas Box */}
      <div
        className={`relative w-full overflow-hidden bg-[#07090e] border border-zinc-800/80 rounded-2xl transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-50 rounded-none border-none h-screen'
            : 'h-[54vh] min-h-[380px] sm:min-h-[480px] max-h-[760px]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Three.js Canvas Mount */}
        <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Drag and Drop Visual Feedback Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-40 bg-black/80 border-2 border-dashed border-red-500 rounded-2xl flex flex-col items-center justify-center p-6 text-center backdrop-blur-md animate-in fade-in duration-150">
            <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-600/80 flex items-center justify-center text-red-400 mb-4 animate-bounce">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-1">
              Drop 3D Model to Inspect in Real-Time
            </h3>
            <p className="text-xs font-mono text-zinc-400 max-w-sm">
              Release to auto-center, auto-ground, and light your real <code className="text-red-400">.fbx</code> or <code className="text-red-400">.glb</code> file.
            </p>
          </div>
        )}

        {/* Loading Spinner Overlay */}
        {isLoadingModel && (
          <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-zinc-200">
              Parsing & Normalizing 3D Model Geometry...
            </span>
          </div>
        )}

        {/* Unified Non-Overlapping Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-4 flex flex-wrap items-start justify-between gap-2.5 pointer-events-none">
          {/* Top Left: Clean Active Model Pill + Subtle Orbit Hint */}
          <div className="min-w-0 max-w-full sm:max-w-[52%] flex flex-col gap-1 pointer-events-auto">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-200 bg-zinc-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800/90 shadow-lg min-w-0">
              <Box className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="text-white font-semibold truncate" title={modelName}>
                {modelName}
              </span>
              {modelStats && (
                <span className="text-[10px] text-zinc-400 shrink-0 hidden sm:inline">
                  · {modelStats.triangles > 0 ? `${(modelStats.triangles / 1000).toFixed(1)}k tris` : `${modelStats.vertices} verts`}
                </span>
              )}
              {isCustomModel && (
                <button
                  onClick={handleResetToDefaultModel}
                  className="ml-1 p-0.5 text-zinc-400 hover:text-red-400 rounded transition-colors cursor-pointer shrink-0"
                  title="Reset to default studio calibration asset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="hidden sm:block text-[11px] text-zinc-400/90 font-sans pl-1 drop-shadow pointer-events-none">
              Drag to orbit · Right-drag to pan · Scroll to zoom
            </p>

            {modelError && (
              <div className="flex items-center gap-2 p-2 bg-red-950/90 border border-red-800 rounded-xl text-xs font-mono text-red-300 shadow-xl mt-1">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="truncate">{modelError}</span>
                <button
                  onClick={() => setModelError(null)}
                  className="ml-auto text-red-400 hover:text-white shrink-0"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Top Right: Clean Viewport Toolbar (No Duplicate Buttons) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 pointer-events-auto">
            <button
              onClick={() => setShowBase(!showBase)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                showBase
                  ? 'bg-zinc-900/90 text-white border-zinc-700'
                  : 'bg-zinc-950/75 hover:bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
              title={showBase ? 'Hide studio turntable base' : 'Show studio turntable base'}
            >
              <Layers className={`w-3.5 h-3.5 ${showBase ? 'text-red-400' : 'text-zinc-500'}`} />
              <span className="hidden md:inline">Base</span>
            </button>

            <button
              onClick={handleToggleStageMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                stageMode === 'environment'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                  : 'bg-zinc-950/85 hover:bg-zinc-900 text-zinc-300 border-zinc-800'
              }`}
              title="Switch between Object Turntable Stage and Full 3D Environment Scale"
            >
              {stageMode === 'environment' ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">3D Env</span>
                </>
              ) : (
                <>
                  <Box className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden md:inline">Stage</span>
                </>
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/25 transition-all cursor-pointer"
              title="Upload a 3D model or 3D environment (.fbx or .glb)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .FBX / .GLB</span>
            </button>

            <button
              onClick={() => setShowUrlModal(true)}
              className="p-1.5 bg-zinc-950/85 hover:bg-zinc-900 text-zinc-300 rounded-xl border border-zinc-800 backdrop-blur-md transition-colors cursor-pointer"
              title="Load 3D asset from URL"
            >
              <LinkIcon className="w-4 h-4 text-zinc-400" />
            </button>

            <button
              onClick={handleFrameModel}
              className="p-1.5 bg-zinc-950/85 hover:bg-zinc-900 text-zinc-300 rounded-xl border border-zinc-800 backdrop-blur-md transition-colors cursor-pointer"
              title="Re-center camera"
            >
              <Target className="w-4 h-4 text-zinc-400" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-zinc-950/85 hover:bg-zinc-900 text-zinc-300 rounded-xl border border-zinc-800 backdrop-blur-md transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remote URL Modal */}
        {showUrlModal && (
          <div className="absolute inset-0 z-40 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl p-4 text-xs font-mono text-zinc-200 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-red-500" />
                  <span>Load 3D Asset from URL</span>
                </span>
                <button onClick={() => setShowUrlModal(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
                Enter a direct link to any <code className="text-red-400">.fbx</code> or <code className="text-red-400">.glb</code> file:
              </p>
              <input
                type="url"
                autoFocus
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/model.glb"
                className="w-full px-3 py-2 bg-black border border-zinc-700 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 mb-3"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUrlLoad(urlInput)}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-xs shadow-md shadow-red-600/30 cursor-pointer"
                >
                  Load Asset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Code Export Modal */}
        {showExportModal && (
          <div className="absolute inset-0 z-40 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl p-3.5 text-xs font-mono text-zinc-300 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-800">
                <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-red-500" />
                  <span>Export Light Rig</span>
                </span>
                <button onClick={() => setShowExportModal(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                  ✕
                </button>
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleCopyCode('ue5')}
                  className="w-full text-left px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Unreal Engine 5 (Lumen)</span>
                  {copiedFormat === 'ue5' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                </button>
                <button
                  onClick={() => handleCopyCode('threejs')}
                  className="w-full text-left px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Three.js / WebGL Code</span>
                  {copiedFormat === 'threejs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                </button>
                <button
                  onClick={() => handleCopyCode('json')}
                  className="w-full text-left px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Studio JSON Settings</span>
                  {copiedFormat === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY DOCK (Flush at the bottom inside fullscreen or when overlay mode selected) */}
        {(layoutMode === 'overlay' || isFullscreen) && (
          <div
            className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-out ${
              isCollapsed ? 'translate-y-[calc(100%-34px)]' : 'translate-y-0'
            }`}
          >
            <div className="flex justify-center">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-medium text-zinc-300 bg-zinc-950/90 hover:bg-zinc-900 border-t border-x border-zinc-800 rounded-t-xl backdrop-blur-md transition-colors shadow-2xl cursor-pointer"
              >
                {isCollapsed ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-red-500" />
                    <span>Show Lighting Controls</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-red-500" />
                    <span>Hide Controls</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-zinc-950/95 border-t border-zinc-800/90 shadow-2xl backdrop-blur-xl p-3 sm:p-4 text-zinc-200">
              {renderControlPanelContent()}
            </div>
          </div>
        )}
      </div>

      {/* NEAT BELOW-CANVAS LIGHTING CONSOLE (Default unobstructed view) */}
      {layoutMode === 'below' && !isFullscreen && (
        <div className="w-full mt-3 bg-zinc-950 border border-zinc-800/90 rounded-2xl p-3.5 sm:p-4 shadow-xl text-zinc-200">
          {renderControlPanelContent()}
        </div>
      )}
    </div>
  );

  // Modular renderer for the neat, simple lighting toolset
  function renderControlPanelContent() {
    return (
      <div className="w-full space-y-3">
        {/* Row 1: Clean Lighting Tool Tabs + Utility Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
          {/* Scrollable Lighting Tool Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'presets'
                  ? 'bg-zinc-800 text-white shadow-sm border border-red-500/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <span>Presets</span>
            </button>

            <button
              onClick={() => setActiveTab('key')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'key'
                  ? 'bg-zinc-800 text-white shadow-sm border border-red-500/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Key Light</span>
            </button>

            <button
              onClick={() => setActiveTab('fill')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'fill'
                  ? 'bg-zinc-800 text-white shadow-sm border border-red-500/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fill & GI</span>
            </button>

            <button
              onClick={() => setActiveTab('rim')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'rim'
                  ? 'bg-zinc-800 text-white shadow-sm border border-red-500/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Rim Kicker</span>
            </button>

            <button
              onClick={() => setActiveTab('point')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'point'
                  ? 'bg-zinc-800 text-white shadow-sm border border-red-500/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-orange-400" />
              <span>Point Light</span>
            </button>

            <button
              onClick={() => setActiveTab('atmosphere')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'atmosphere'
                  ? 'bg-zinc-800 text-white shadow-sm border border-red-500/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Droplets className="w-3.5 h-3.5 text-emerald-400" />
              <span>Atmosphere & Wetness</span>
            </button>

            <button
              onClick={() => setActiveTab('post')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'post'
                  ? 'bg-zinc-800 text-white shadow-sm border border-red-500/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>ACES Post-Process</span>
            </button>

            <button
              onClick={() => setActiveTab('passes')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'passes'
                  ? 'bg-zinc-800 text-white shadow-sm border border-red-500/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-zinc-300" />
              <span>Passes</span>
            </button>

            <button
              onClick={() => setActiveTab('camera')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'camera'
                  ? 'bg-zinc-800 text-white shadow-sm border border-red-500/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-amber-500" />
              <span>Optics</span>
            </button>
          </div>

          {/* Right Utility Actions: Dock Mode & Code Export */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isFullscreen && (
              <button
                onClick={() => setLayoutMode(layoutMode === 'overlay' ? 'below' : 'overlay')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
                title={layoutMode === 'below' ? 'Float controls inside canvas' : 'Dock controls below canvas'}
              >
                <Layout className="w-3.5 h-3.5 text-red-400" />
                <span>{layoutMode === 'below' ? 'Overlay' : 'Dock Below'}</span>
              </button>
            )}

            <button
              onClick={() => setShowExportModal(!showExportModal)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
              title="Export light rig to UE5 or Three.js"
            >
              <Code className="w-3.5 h-3.5 text-red-400" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Row 2: Active Tab Controls Subpanel */}
        <div className="pt-1">
          {/* TAB: PRESETS */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(LIGHTING_PRESETS).map(([key, p]) => {
                const isSelected = lighting.name === p.name;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectPreset(key as keyof typeof LIGHTING_PRESETS)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-zinc-800 border-red-500/80 shadow-sm'
                        : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800/90 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                        {p.name}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: p.keyLight.color }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 truncate">
                      {p.keyLight.kelvin ?? 5600}K · {p.keyLight.intensity}x
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB: KEY LIGHT */}
          {activeTab === 'key' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
              {/* Key Light RGB + HEX Color */}
              <RgbHexColorControl
                label="Key Light Color (HEX & RGB)"
                color={lighting.keyLight.color}
                onChange={(nextHex) =>
                  setLighting({
                    ...lighting,
                    keyLight: { ...lighting.keyLight, color: nextHex },
                  })
                }
                subtitle="Direct key hue (overrides Kelvin tint)"
              />

              {/* Intensity */}
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between text-zinc-400">
                  <span>Intensity</span>
                  <span className="text-white font-bold tabular-nums">{lighting.keyLight.intensity.toFixed(1)} lux</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6.0"
                  step="0.1"
                  value={lighting.keyLight.intensity}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      keyLight: { ...lighting.keyLight, intensity: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              {/* Color Temperature (Kelvin) */}
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between text-zinc-400">
                  <span>Color Temp (Kelvin)</span>
                  <span className="text-white font-bold tabular-nums">
                    {lighting.keyLight.kelvin ?? 5600}K
                  </span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="12000"
                  step="200"
                  value={lighting.keyLight.kelvin ?? 5600}
                  onChange={(e) => {
                    const nextKelvin = parseInt(e.target.value, 10);
                    setLighting({
                      ...lighting,
                      keyLight: {
                        ...lighting.keyLight,
                        kelvin: nextKelvin,
                        color: kelvinToHex(nextKelvin),
                      },
                    });
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Azimuth Angle */}
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between text-zinc-400">
                  <span>Sun Angle</span>
                  <span className="text-white font-bold tabular-nums">{lighting.keyLight.azimuth}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={lighting.keyLight.azimuth}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      keyLight: { ...lighting.keyLight, azimuth: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              {/* Elevation Angle */}
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between text-zinc-400">
                  <span>Elevation</span>
                  <span className="text-white font-bold tabular-nums">{lighting.keyLight.elevation}°</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="85"
                  value={lighting.keyLight.elevation}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      keyLight: { ...lighting.keyLight, elevation: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>

              {/* Soft Shadows & Penumbra Radius */}
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between text-zinc-400">
                  <span>Soft Shadows (PCF)</span>
                  <span className="text-white font-bold tabular-nums">
                    {(lighting.keyLight.softness ?? 1.0).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={lighting.keyLight.softness ?? 1.0}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      keyLight: { ...lighting.keyLight, softness: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB: FILL & GI */}
          {activeTab === 'fill' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between text-zinc-400">
                  <span>Fill Skylight Intensity</span>
                  <span className="text-white font-bold tabular-nums">{lighting.fillLight.intensity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.05"
                  value={lighting.fillLight.intensity}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      fillLight: { ...lighting.fillLight, intensity: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between text-zinc-400">
                  <span>Lumen GI Bounce Mult</span>
                  <span className="text-white font-bold tabular-nums">
                    {(lighting.fillLight.giBounceMultiplier ?? 1.0).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.05"
                  value={lighting.fillLight.giBounceMultiplier ?? 1.0}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      fillLight: {
                        ...lighting.fillLight,
                        giBounceMultiplier: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <RgbHexColorControl
                label="Sky Hemis Color"
                color={lighting.fillLight.skyColor}
                onChange={(nextHex) =>
                  setLighting({
                    ...lighting,
                    fillLight: { ...lighting.fillLight, skyColor: nextHex },
                  })
                }
                subtitle="Indirect dome radiance"
              />

              <RgbHexColorControl
                label="Ground Bounce Color"
                color={lighting.fillLight.groundColor}
                onChange={(nextHex) =>
                  setLighting({
                    ...lighting,
                    fillLight: { ...lighting.fillLight, groundColor: nextHex },
                  })
                }
                subtitle="Floor diffuse return"
              />
            </div>
          )}

          {/* TAB: RIM KICKER */}
          {activeTab === 'rim' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between text-zinc-400">
                  <span>Rim Intensity</span>
                  <span className="text-white font-bold tabular-nums">{lighting.rimLight.intensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="6.0"
                  step="0.1"
                  value={lighting.rimLight.intensity}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      rimLight: { ...lighting.rimLight, intensity: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between text-zinc-400">
                  <span>Rim Angle</span>
                  <span className="text-white font-bold tabular-nums">{lighting.rimLight.angle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={lighting.rimLight.angle}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      rimLight: { ...lighting.rimLight, angle: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <RgbHexColorControl
                label="Rim Color (HEX & RGB)"
                color={lighting.rimLight.color}
                onChange={(nextHex) =>
                  setLighting({
                    ...lighting,
                    rimLight: { ...lighting.rimLight, color: nextHex },
                  })
                }
                subtitle="Edge silhouette kicker"
              />
            </div>
          )}

          {/* TAB: POINT LIGHT */}
          {activeTab === 'point' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between text-zinc-400">
                  <span>Intensity</span>
                  <span className="text-white font-bold tabular-nums">{lighting.localLight.intensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8.0"
                  step="0.2"
                  value={lighting.localLight.intensity}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      localLight: { ...lighting.localLight, intensity: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between text-zinc-400">
                  <span>Pulse Animation</span>
                  <span className="text-white font-bold">{pulseDiegeticLight ? 'Active' : 'Static'}</span>
                </div>
                <button
                  onClick={() => setPulseDiegeticLight(!pulseDiegeticLight)}
                  className={`w-full py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    pulseDiegeticLight
                      ? 'bg-orange-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {pulseDiegeticLight ? 'Diegetic Pulse Enabled' : 'Fixed Steady Output'}
                </button>
              </div>

              <RgbHexColorControl
                label="Point Color (HEX & RGB)"
                color={lighting.localLight.color}
                onChange={(nextHex) =>
                  setLighting({
                    ...lighting,
                    localLight: { ...lighting.localLight, color: nextHex },
                  })
                }
                subtitle="Localized diegetic accent"
              />

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                <div className="flex justify-between text-zinc-400">
                  <span>Position (Y Height)</span>
                  <span className="text-white font-bold tabular-nums">{lighting.localLight.y.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.2"
                  value={lighting.localLight.y}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      localLight: { ...lighting.localLight, y: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB: ATMOSPHERE & 3D ENVIRONMENT SKY */}
          {activeTab === 'atmosphere' && (
            <div className="space-y-3 text-xs font-mono">
              {/* HDRI / 3D Environment IBL Sky Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-zinc-400 mr-1">3D Sky / IBL:</span>
                  {(
                    [
                      { id: 'studio', label: 'Studio Dome' },
                      { id: 'daylight', label: 'Daylight' },
                      { id: 'sunset', label: 'Golden Sunset' },
                      { id: 'cyberNight', label: 'Cyber Night' },
                    ] as const
                  ).map((sky) => (
                    <button
                      key={sky.id}
                      onClick={() => handleSelectProceduralSky(sky.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                        skyPreset === sky.id
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {sky.label}
                    </button>
                  ))}
                  <button
                    onClick={() => envInputRef.current?.click()}
                    className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                      skyPreset === 'custom'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-zinc-950 border-zinc-700 text-zinc-300 hover:border-emerald-500/60'
                    }`}
                    title="Upload an equirectangular .hdr or .exr environment map"
                  >
                    {customEnvName ? `HDRI: ${customEnvName}` : '+ Load .HDR / .EXR'}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const next = !showSkybox;
                      setShowSkybox(next);
                      if (next && !envRenderTargetRef.current) {
                        const tex = createProceduralSkyTexture(skyPreset === 'custom' ? 'studio' : skyPreset);
                        applyEnvironmentMapTexture(tex, true);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] cursor-pointer transition-colors ${
                      showSkybox
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {showSkybox ? 'Skybox Visible' : 'Show Skybox'}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">IBL:</span>
                    <input
                      type="range"
                      min="0"
                      max="2.5"
                      step="0.1"
                      value={envIntensity}
                      onChange={(e) => setEnvIntensity(parseFloat(e.target.value))}
                      className="w-20 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-white font-bold w-8 tabular-nums">{envIntensity.toFixed(1)}x</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <RgbHexColorControl
                  label="Fog & Backdrop Color"
                  color={lighting.fog.color}
                  onChange={(nextHex) =>
                    setLighting({
                      ...lighting,
                      fog: { ...lighting.fog, color: nextHex },
                    })
                  }
                  subtitle="Atmospheric scattering tint"
                />

                <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                  <div className="flex justify-between text-zinc-400">
                    <span>Surface Pavement Wetness</span>
                    <span className="text-white font-bold tabular-nums">
                      {Math.round((lighting.surface?.wetness ?? 0.5) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={lighting.surface?.wetness ?? 0.5}
                    onChange={(e) =>
                      setLighting({
                        ...lighting,
                        surface: { wetness: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                  <div className="flex justify-between text-zinc-400">
                    <span>Volumetric Fog Near</span>
                    <span className="text-white font-bold tabular-nums">{lighting.fog.near}m</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={lighting.fog.near}
                    onChange={(e) =>
                      setLighting({
                        ...lighting,
                        fog: { ...lighting.fog, near: parseInt(e.target.value, 10) },
                      })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5 flex flex-col justify-center">
                  <div className="flex justify-between text-zinc-400">
                    <span>Volumetric Fog Far</span>
                    <span className="text-white font-bold tabular-nums">{lighting.fog.far}m</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="200"
                    value={lighting.fog.far}
                    onChange={(e) =>
                      setLighting({
                        ...lighting,
                        fog: { ...lighting.fog, far: parseInt(e.target.value, 10) },
                      })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: ACES POST-PROCESS */}
          {activeTab === 'post' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>ACES Filmic Exposure</span>
                  <span className="text-white font-bold">
                    {(lighting.toneMapping?.exposure ?? 1.1).toFixed(2)} EV
                  </span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.05"
                  value={lighting.toneMapping?.exposure ?? 1.1}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      toneMapping: {
                        mode: lighting.toneMapping?.mode ?? 'aces',
                        exposure: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <span className="text-zinc-400 block mb-1">Tone Mapping Curve</span>
                <div className="grid grid-cols-4 gap-1">
                  {(['aces', 'neutral', 'reinhard', 'cineon'] as const).map((curve) => (
                    <button
                      key={curve}
                      onClick={() =>
                        setLighting({
                          ...lighting,
                          toneMapping: {
                            mode: curve,
                            exposure: lighting.toneMapping?.exposure ?? 1.1,
                          },
                        })
                      }
                      className={`py-1 rounded text-center uppercase text-[10px] cursor-pointer transition-colors ${
                        (lighting.toneMapping?.mode ?? 'aces') === curve
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {curve}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PASSES */}
          {activeTab === 'passes' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <button
                onClick={() => setRenderPass('final')}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  renderPass === 'final'
                    ? 'bg-red-950/60 border-red-600 text-white font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-sm font-semibold">PBR Lit (Final)</div>
                <div className="text-[10px] text-zinc-500 mt-1">Full textures, materials & shadows</div>
              </button>

              <button
                onClick={() => setRenderPass('clay')}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  renderPass === 'clay'
                    ? 'bg-red-950/60 border-red-600 text-white font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-sm font-semibold">Clay Pass</div>
                <div className="text-[10px] text-zinc-500 mt-1">Neutral greybox diffuse inspection</div>
              </button>

              <button
                onClick={() => setRenderPass('normals')}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  renderPass === 'normals'
                    ? 'bg-red-950/60 border-red-600 text-white font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-sm font-semibold">World Normals</div>
                <div className="text-[10px] text-zinc-500 mt-1">Surface curvature orientation</div>
              </button>

              <button
                onClick={() => setRenderPass('wireframe')}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  renderPass === 'wireframe'
                    ? 'bg-red-950/60 border-red-600 text-white font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="text-sm font-semibold">Wireframe</div>
                <div className="text-[10px] text-zinc-500 mt-1">Mesh topology & edge density</div>
              </button>
            </div>
          )}

          {/* TAB: CAMERA & OPTICS */}
          {activeTab === 'camera' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              {/* Lenses */}
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <span className="text-zinc-400 block mb-1">Cinematic Prime Lenses</span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: '24mm', fov: 65 },
                    { label: '35mm', fov: 50 },
                    { label: '50mm', fov: 38 },
                    { label: '85mm', fov: 24 },
                  ].map((lens) => (
                    <button
                      key={lens.label}
                      onClick={() => {
                        setLighting({
                          ...lighting,
                          camera: { fov: lens.fov },
                        });
                        if (cameraRef.current) {
                          cameraRef.current.fov = lens.fov;
                          cameraRef.current.updateProjectionMatrix();
                        }
                      }}
                      className={`py-1 rounded text-center text-[10px] font-bold cursor-pointer transition-colors ${
                        (lighting.camera?.fov ?? 45) === lens.fov
                          ? 'bg-amber-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {lens.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turntable Auto-Rotate */}
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Turntable Turntable</span>
                  <span className="text-white font-bold">{autoRotate ? `${turntableSpeed}x` : 'Paused'}</span>
                </div>
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`w-full py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    autoRotate
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {autoRotate ? 'Stop Turntable Orbit' : 'Start 360° Turntable'}
                </button>
              </div>

              {/* Model Scale Slider */}
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Model Scale</span>
                  <span className="text-white font-bold">{modelScale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.05"
                  value={modelScale}
                  onChange={(e) => setModelScale(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
};
