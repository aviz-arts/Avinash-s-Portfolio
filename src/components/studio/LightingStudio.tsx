import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { applyRenderPassMode } from './proceduralAssets';
import {
  prepareModelForLightingStudio,
  buildStudioPedestal,
  buildDefaultLookdevAsset,
  loadModelFromArrayBuffer,
  loadModelFromUrl,
  ModelStats,
} from './modelLoaders';
import {
  saveUploadedModel,
  loadUploadedModel,
  clearUploadedModel,
} from '../../utils/modelStorage';
import {
  LIGHTING_PRESETS,
  LightSettings,
  polarToCartesian,
  kelvinToHex,
} from '../../utils/lightingLogic';
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
} from 'lucide-react';

interface LightingStudioProps {
  className?: string;
}

export const LightingStudio: React.FC<LightingStudioProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active lighting settings
  const [lighting, setLighting] = useState<LightSettings>(() => {
    return LIGHTING_PRESETS.cleanStudio || LIGHTING_PRESETS.studio || Object.values(LIGHTING_PRESETS)[0];
  });

  // Model & Studio UI state
  const [modelName, setModelName] = useState<string>('Studio Lookdev Model');
  const [isCustomModel, setIsCustomModel] = useState<boolean>(false);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [modelScale, setModelScale] = useState<number>(1.0);
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');

  // Studio UI layout state
  const [activeTab, setActiveTab] = useState<
    'presets' | 'key' | 'fill' | 'rim' | 'point' | 'atmosphere' | 'post' | 'passes' | 'camera'
  >('presets');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'overlay' | 'below'>('overlay');
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
    isSoftwareGl: false,
  });

  useEffect(() => {
    stateRef.current = {
      lighting,
      renderPass,
      autoRotate,
      turntableSpeed,
      pulseDiegeticLight,
      isSoftwareGl: stateRef.current.isSoftwareGl,
    };
  }, [lighting, renderPass, autoRotate, turntableSpeed, pulseDiegeticLight]);

  // Replace active model in the scene
  const replaceSceneModel = useCallback((preparedGroup: THREE.Group, stats: ModelStats, name: string, isCustom: boolean) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (activeMeshGroupRef.current) {
      scene.remove(activeMeshGroupRef.current);
    }

    scene.add(preparedGroup);
    activeMeshGroupRef.current = preparedGroup;
    modelContainerRef.current = preparedGroup;

    setModelStats(stats);
    setModelName(name);
    setIsCustomModel(isCustom);
    setModelError(null);

    // Apply surface wetness and current render pass
    applyRenderPassMode(preparedGroup, stateRef.current.renderPass, clayMatRef.current, normalMatRef.current);

    // Re-frame camera and controls target
    if (controlsRef.current && cameraRef.current) {
      const targetY = (stats.dimensions.y * 0.45) || 2.2;
      controlsRef.current.target.set(0, targetY, 0);
      controlsRef.current.update();
    }
  }, []);

  // Load custom 3D model from raw ArrayBuffer
  const handleModelBufferLoad = useCallback(async (
    buffer: ArrayBuffer,
    fileName: string,
    format: 'glb' | 'gltf' | 'obj'
  ) => {
    setIsLoadingModel(true);
    setModelError(null);
    try {
      const rawModel = await loadModelFromArrayBuffer(buffer, format);
      const { container, stats } = prepareModelForLightingStudio(rawModel);
      replaceSceneModel(container, stats, fileName, true);
      // Persist in IndexedDB for session persistence
      await saveUploadedModel(fileName, buffer, format);
    } catch (err) {
      console.error('Failed to load 3D model:', err);
      setModelError(`Failed to load ${fileName}: ${err instanceof Error ? err.message : 'Invalid 3D format'}`);
    } finally {
      setIsLoadingModel(false);
    }
  }, [replaceSceneModel]);

  // Load model from direct URL
  const handleUrlLoad = async (url: string) => {
    if (!url.trim()) return;
    setIsLoadingModel(true);
    setModelError(null);
    setShowUrlModal(false);
    try {
      const rawModel = await loadModelFromUrl(url);
      const fileName = url.split('/').pop()?.split('?')[0] || 'Remote 3D Model';
      const { container, stats } = prepareModelForLightingStudio(rawModel);
      replaceSceneModel(container, stats, fileName, true);
    } catch (err) {
      console.error('Failed to load model from URL:', err);
      setModelError(`Failed to load model from URL: ${err instanceof Error ? err.message : 'Network/CORS or invalid model'}`);
    } finally {
      setIsLoadingModel(false);
    }
  };

  // Reset to default lookdev calibration asset
  const handleResetToDefaultModel = async () => {
    const defaultRaw = buildDefaultLookdevAsset();
    const { container, stats } = prepareModelForLightingStudio(defaultRaw, 3.8);
    replaceSceneModel(container, stats, 'Studio Lookdev Model', false);
    await clearUploadedModel();
  };

  // File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    const format: 'glb' | 'gltf' | 'obj' = ext === 'obj' ? 'obj' : 'glb';

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

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'glb' && ext !== 'gltf' && ext !== 'obj') {
      setModelError('Please drop a .glb, .gltf, or .obj 3D model file.');
      return;
    }

    const format: 'glb' | 'gltf' | 'obj' = ext === 'obj' ? 'obj' : 'glb';
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
    const activeLighting = lighting || LIGHTING_PRESETS.cleanStudio || LIGHTING_PRESETS.studio || Object.values(LIGHTING_PRESETS)[0];

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

    // 4. Studio Environment Lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const neutralEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(neutralEnv).texture;

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent camera dipping below floor
    controls.minDistance = 2.0;
    controls.maxDistance = 25.0;
    controls.target.set(0, 2.0, 0);
    controlsRef.current = controls;

    // 6. Lights
    // Key Light (Directional Sun)
    const keyColorHex = activeLighting.keyLight?.kelvin
      ? kelvinToHex(activeLighting.keyLight.kelvin)
      : (activeLighting.keyLight?.color || '#ffffff');
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

    // 7. Add Permanent Studio Pedestal Lookdev Stage
    const pedestal = buildStudioPedestal(8.0);
    scene.add(pedestal);

    // 8. Initial Model Loading (Restore from IndexedDB if exists, otherwise load default lookdev model)
    (async () => {
      try {
        const stored = await loadUploadedModel();
        if (stored && stored.buffer) {
          const rawModel = await loadModelFromArrayBuffer(stored.buffer, stored.format);
          const { container, stats } = prepareModelForLightingStudio(rawModel);
          replaceSceneModel(container, stats, stored.name, true);
          return;
        }
      } catch {
        // ignore and fallback
      }
      // Fallback to default lookdev calibration asset
      const defaultRaw = buildDefaultLookdevAsset();
      const { container, stats } = prepareModelForLightingStudio(defaultRaw, 3.8);
      replaceSceneModel(container, stats, 'Studio Lookdev Model', false);
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

    // Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      pmremGenerator.dispose();
      neutralEnv.dispose();
    };
  }, [replaceSceneModel]);

  // Synchronize dynamic light parameters without reloading the scene
  useEffect(() => {
    if (!lighting || !keyLightRef.current || !fillLightRef.current || !rimLightRef.current || !localLightRef.current) return;

    // Key Light
    const keyColorHex = lighting.keyLight.kelvin
      ? kelvinToHex(lighting.keyLight.kelvin)
      : lighting.keyLight.color;
    keyLightRef.current.color.set(keyColorHex);
    keyLightRef.current.intensity = lighting.keyLight.intensity;
    const [kx, ky, kz] = polarToCartesian(lighting.keyLight.azimuth, lighting.keyLight.elevation, 12);
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
    const [rx, ry, rz] = polarToCartesian(lighting.rimLight.angle, lighting.rimLight.elevation ?? 30, 10);
    rimLightRef.current.position.set(rx, ry, rz);

    // Local Point Light
    localLightRef.current.color.set(lighting.localLight.color);
    localLightRef.current.intensity = lighting.localLight.intensity;
    localLightRef.current.distance = lighting.localLight.distance;
    localLightRef.current.position.set(lighting.localLight.x, lighting.localLight.y, lighting.localLight.z);

    // Fog & Background
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(lighting.fog.color);
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

    // Camera FOV
    if (cameraRef.current && lighting.camera?.fov) {
      cameraRef.current.fov = lighting.camera.fov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [lighting]);

  // Synchronize Render Pass (PBR Lit, Clay, Normals, Wireframe)
  useEffect(() => {
    if (activeMeshGroupRef.current) {
      applyRenderPassMode(activeMeshGroupRef.current, renderPass, clayMatRef.current, normalMatRef.current);
    }
  }, [renderPass]);

  // Synchronize Model Scale
  useEffect(() => {
    if (activeMeshGroupRef.current) {
      activeMeshGroupRef.current.scale.setScalar(modelScale);
    }
  }, [modelScale]);

  // Center camera focus on the model
  const handleFrameModel = () => {
    if (!controlsRef.current || !modelStats) return;
    const targetY = (modelStats.dimensions.y * 0.45 * modelScale) || 2.0;
    controlsRef.current.target.set(0, targetY, 0);
    if (cameraRef.current) {
      cameraRef.current.position.set(0, targetY + 1.2, 9.5);
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
    const keyHex = lighting.keyLight.kelvin
      ? kelvinToHex(lighting.keyLight.kelvin)
      : lighting.keyLight.color;

    if (format === 'ue5') {
      output = `// Unreal Engine 5 Lumen Lighting Rig Specification
// Model: ${modelName}
// Generated from Avinash's Real-time 3D Lighting Studio

// 1. Directional Sun Light (Key Light)
DirectionalLight->SetIntensity(${lighting.keyLight.intensity.toFixed(2)}f);
DirectionalLight->SetLightColor(FLinearColor::FromSRGBColor(FColor::FromHex("${keyHex}")));
DirectionalLight->SetCastShadows(true);
DirectionalLight->bUseTemperature = true;
DirectionalLight->Temperature = ${lighting.keyLight.kelvin ?? 5600}f;
DirectionalLight->ShadowSourceAngle = ${((lighting.keyLight.softness ?? 1.0) * 1.5).toFixed(1)}f;

// 2. SkyLight (Lumen Indirect GI Bounce)
SkyLight->SetIntensity(${lighting.fillLight.intensity.toFixed(2)}f);
SkyLight->IndirectLightingIntensity = ${(lighting.fillLight.giBounceMultiplier ?? 1.0).toFixed(2)}f;

// 3. PostProcess Volume (ACES Tone Mapping)
PostProcessVolume->Settings.AutoExposureMethod = EAutoExposureMethod::AEM_Manual;
PostProcessVolume->Settings.AutoExposureBias = ${(lighting.toneMapping?.exposure ? (lighting.toneMapping.exposure - 1.0) * 2 : 0).toFixed(2)}f;
PostProcessVolume->Settings.ToneCurveAmount = 1.0f; // ACES Filmic`;
    } else if (format === 'threejs') {
      output = `// Three.js Lighting Setup for "${modelName}"
const keyLight = new THREE.DirectionalLight('${keyHex}', ${lighting.keyLight.intensity});
const fillLight = new THREE.HemisphereLight('${lighting.fillLight.skyColor}', '${lighting.fillLight.groundColor}', ${lighting.fillLight.intensity});
const rimLight = new THREE.DirectionalLight('${lighting.rimLight.color}', ${lighting.rimLight.intensity});

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = ${lighting.toneMapping?.exposure ?? 1.1};
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;`;
    } else {
      output = JSON.stringify(
        {
          model: modelName,
          stats: modelStats,
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
      {/* Hidden file input for 3D model upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,.obj"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main 3D Canvas Box */}
      <div
        className={`relative w-full overflow-hidden bg-[#07090e] border border-zinc-800/80 rounded-2xl transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-50 rounded-none border-none h-screen'
            : 'h-[620px] sm:h-[680px] lg:h-[760px]'
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
              Release to auto-center, auto-ground, and light your real <code className="text-red-400">.glb</code>, <code className="text-red-400">.gltf</code>, or <code className="text-red-400">.obj</code> file.
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

        {/* Top Left: Active Model Info & Pass Status */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5 max-w-[80%]">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-300 bg-zinc-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 shadow-xl pointer-events-auto">
            <span className="text-red-500 font-bold tracking-wider">3D LIGHTING LAB</span>
            <span className="text-zinc-600">/</span>

            {/* Current Active Model */}
            <span className="text-white font-semibold truncate max-w-[180px] sm:max-w-[260px]" title={modelName}>
              {modelName}
            </span>

            {isCustomModel && (
              <span className="px-1.5 py-0.5 text-[10px] bg-red-950/60 border border-red-800/80 text-red-300 rounded">
                Custom Model
              </span>
            )}

            <span className="text-zinc-600">/</span>
            <span className="text-red-400 font-medium">
              {renderPass === 'final' ? 'PBR Lit' : renderPass === 'clay' ? 'Clay Pass' : renderPass}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 font-sans tracking-tight pl-1 drop-shadow pointer-events-none">
            Left click + drag to orbit · Right click to pan · Scroll to zoom
          </p>

          {/* Model error alert */}
          {modelError && (
            <div className="flex items-center gap-2 p-2 bg-red-950/90 border border-red-800 rounded-xl text-xs font-mono text-red-300 shadow-xl pointer-events-auto mt-1">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{modelError}</span>
              <button
                onClick={() => setModelError(null)}
                className="ml-auto text-red-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Top Right: Upload 3D Model, Fullscreen, Layout Switcher & Code Export */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* Primary Upload 3D Model Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            title="Upload your own 3D model (.glb, .gltf, .obj)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload 3D Model</span>
          </button>

          {/* Link URL input */}
          <button
            onClick={() => setShowUrlModal(true)}
            className="p-1.5 bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 rounded-xl border border-zinc-800 backdrop-blur-md transition-colors cursor-pointer"
            title="Load model from URL"
          >
            <LinkIcon className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Frame Camera */}
          <button
            onClick={handleFrameModel}
            className="p-1.5 bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 rounded-xl border border-zinc-800 backdrop-blur-md transition-colors cursor-pointer"
            title="Frame Camera on Model"
          >
            <Target className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Layout Toggle (Overlay vs Below) */}
          <button
            onClick={() => setLayoutMode(layoutMode === 'overlay' ? 'below' : 'overlay')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
              layoutMode === 'below'
                ? 'bg-red-950/60 text-red-300 border-red-800 shadow-md'
                : 'bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 border-zinc-800'
            }`}
            title={layoutMode === 'below' ? 'Docked Below Canvas' : 'Overlay Dock'}
          >
            <Layout className="w-3.5 h-3.5 text-red-500" />
            <span>{layoutMode === 'below' ? 'Below Canvas' : 'Overlay Dock'}</span>
          </button>

          {/* Code Export Button */}
          <button
            onClick={() => setShowExportModal(!showExportModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-zinc-950/80 hover:bg-zinc-900 text-zinc-200 rounded-xl border border-zinc-800 backdrop-blur-md transition-colors cursor-pointer"
            title="Export light rig to UE5 or Three.js"
          >
            <Code className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">Export Code</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 rounded-xl border border-zinc-800 backdrop-blur-md transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Remote URL Modal */}
        {showUrlModal && (
          <div className="absolute top-16 right-4 z-40 w-80 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl p-4 text-xs font-mono text-zinc-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-red-500" />
                <span>Load 3D Model from URL</span>
              </span>
              <button onClick={() => setShowUrlModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
              Enter a direct link to any <code className="text-red-400">.glb</code>, <code className="text-red-400">.gltf</code>, or <code className="text-red-400">.obj</code> file:
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
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUrlLoad(urlInput)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-xs shadow-md shadow-red-600/30"
              >
                Load Model
              </button>
            </div>
          </div>
        )}

        {/* Code Export Dropdown Modal */}
        {showExportModal && (
          <div className="absolute top-16 right-4 z-30 w-72 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl p-3 text-xs font-mono text-zinc-300 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
              <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-red-500" />
                <span>Export Light Rig</span>
              </span>
              <button onClick={() => setShowExportModal(false)} className="text-zinc-500 hover:text-white">
                ✕
              </button>
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => handleCopyCode('ue5')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Unreal Engine 5 (Lumen)</span>
                {copiedFormat === 'ue5' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
              </button>
              <button
                onClick={() => handleCopyCode('threejs')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Three.js / WebGL Code</span>
                {copiedFormat === 'threejs' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
              </button>
              <button
                onClick={() => handleCopyCode('json')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Studio JSON Settings</span>
                {copiedFormat === 'json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
              </button>
            </div>
          </div>
        )}

        {/* OVERLAY DOCK (Flush at the bottom) */}
        {layoutMode === 'overlay' && (
          <div
            className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-out ${
              isCollapsed ? 'translate-y-[calc(100%-34px)]' : 'translate-y-0'
            }`}
          >
            {/* Minimalist Zen View / Collapse Toggle Pill */}
            <div className="flex justify-center">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-medium text-zinc-300 bg-zinc-950/90 hover:bg-zinc-900 border-t border-x border-zinc-800 rounded-t-xl backdrop-blur-md transition-colors shadow-2xl cursor-pointer"
              >
                {isCollapsed ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-red-500" />
                    <span>Open Live Lighting Tools</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-red-500" />
                    <span>Zen View (Hide Controls · 100% Clear Scene)</span>
                  </>
                )}
              </button>
            </div>

            {/* Bottom Controls Bar Container */}
            <div className="bg-zinc-950/95 border-t border-zinc-800/90 shadow-2xl backdrop-blur-xl p-3 sm:p-4 text-zinc-200">
              {renderControlPanelContent()}
            </div>
          </div>
        )}
      </div>

      {/* EXTERNAL CONSOLE (When in 'below' mode) */}
      {layoutMode === 'below' && (
        <div className="w-full mt-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-xl text-zinc-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-red-500" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-white">
                Live Lighting Console · 100% Unobstructed Scene View
              </span>
            </div>
            <button
              onClick={() => setLayoutMode('overlay')}
              className="text-xs font-mono text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Switch to Overlay Dock
            </button>
          </div>
          {renderControlPanelContent()}
        </div>
      )}
    </div>
  );

  // Modular renderer for the entire advanced lighting toolset
  function renderControlPanelContent() {
    return (
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Row 1: Model Management Actions + Lighting Tool Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-800/80">
          {/* Active Model Info & Upload Trigger */}
          <div className="flex items-center gap-2 bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-red-600/30"
              title="Upload your own 3D model (.glb, .gltf, .obj)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Model</span>
            </button>

            {/* Model Name and stats badge */}
            <div className="flex items-center gap-1.5 px-2 text-xs font-mono text-zinc-300">
              <Box className="w-3.5 h-3.5 text-red-400" />
              <span className="font-semibold text-zinc-100 truncate max-w-[140px] sm:max-w-[200px]" title={modelName}>
                {modelName}
              </span>
              {modelStats && (
                <span className="text-[10px] text-zinc-500 hidden md:inline">
                  ({modelStats.triangles > 0 ? `${(modelStats.triangles / 1000).toFixed(1)}k tris` : `${modelStats.vertices} verts`})
                </span>
              )}
            </div>

            {/* Reset Model Button if custom model is loaded */}
            {isCustomModel && (
              <button
                onClick={handleResetToDefaultModel}
                className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Reset to default calibration lookdev model"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Advanced Lighting Tool Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 overflow-x-auto">
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
        </div>

        {/* Row 2: Active Tab Controls Subpanel */}
        <div className="pt-1">
          {/* TAB: PRESETS */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {Object.entries(LIGHTING_PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => handleSelectPreset(key as keyof typeof LIGHTING_PRESETS)}
                  className="p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/90 hover:border-red-500/50 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                      {p.name}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: p.keyLight.color }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 truncate">
                    Key: {p.keyLight.intensity}x · Exp {p.toneMapping?.exposure ?? 1}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* TAB: KEY LIGHT */}
          {activeTab === 'key' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
              {/* Intensity */}
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Intensity</span>
                  <span className="text-white font-bold">{lighting.keyLight.intensity.toFixed(1)} lux</span>
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
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Color Temp</span>
                  <span className="text-white font-bold">
                    {lighting.keyLight.kelvin ?? 5600}K
                  </span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="12000"
                  step="200"
                  value={lighting.keyLight.kelvin ?? 5600}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      keyLight: {
                        ...lighting.keyLight,
                        kelvin: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Azimuth Angle */}
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Sun Angle</span>
                  <span className="text-white font-bold">{lighting.keyLight.azimuth}°</span>
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
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Elevation</span>
                  <span className="text-white font-bold">{lighting.keyLight.elevation}°</span>
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
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Soft Shadows (PCF)</span>
                  <span className="text-white font-bold">
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
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Fill Skylight Intensity</span>
                  <span className="text-white font-bold">{lighting.fillLight.intensity.toFixed(2)}</span>
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

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Lumen GI Bounce Mult</span>
                  <span className="text-white font-bold">
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

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Sky Hemis Color</span>
                  <span className="text-zinc-200">{lighting.fillLight.skyColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lighting.fillLight.skyColor}
                    onChange={(e) =>
                      setLighting({
                        ...lighting,
                        fillLight: { ...lighting.fillLight, skyColor: e.target.value },
                      })
                    }
                    className="w-8 h-7 bg-transparent border-none cursor-pointer rounded"
                  />
                  <span className="text-[11px] text-zinc-500">Indirect dome radiance</span>
                </div>
              </div>

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Ground Bounce Color</span>
                  <span className="text-zinc-200">{lighting.fillLight.groundColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lighting.fillLight.groundColor}
                    onChange={(e) =>
                      setLighting({
                        ...lighting,
                        fillLight: { ...lighting.fillLight, groundColor: e.target.value },
                      })
                    }
                    className="w-8 h-7 bg-transparent border-none cursor-pointer rounded"
                  />
                  <span className="text-[11px] text-zinc-500">Floor diffuse return</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RIM KICKER */}
          {activeTab === 'rim' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Rim Intensity</span>
                  <span className="text-white font-bold">{lighting.rimLight.intensity.toFixed(1)}</span>
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

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Rim Angle</span>
                  <span className="text-white font-bold">{lighting.rimLight.angle}°</span>
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

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Rim Color</span>
                  <span className="text-zinc-200">{lighting.rimLight.color}</span>
                </div>
                <input
                  type="color"
                  value={lighting.rimLight.color}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      rimLight: { ...lighting.rimLight, color: e.target.value },
                    })
                  }
                  className="w-8 h-7 bg-transparent border-none cursor-pointer rounded"
                />
              </div>
            </div>
          )}

          {/* TAB: POINT LIGHT */}
          {activeTab === 'point' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Intensity</span>
                  <span className="text-white font-bold">{lighting.localLight.intensity.toFixed(1)}</span>
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

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
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

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Point Color</span>
                  <span className="text-zinc-200">{lighting.localLight.color}</span>
                </div>
                <input
                  type="color"
                  value={lighting.localLight.color}
                  onChange={(e) =>
                    setLighting({
                      ...lighting,
                      localLight: { ...lighting.localLight, color: e.target.value },
                    })
                  }
                  className="w-8 h-7 bg-transparent border-none cursor-pointer rounded"
                />
              </div>

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Position (Y Height)</span>
                  <span className="text-white font-bold">{lighting.localLight.y.toFixed(1)}m</span>
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

          {/* TAB: ATMOSPHERE & WETNESS */}
          {activeTab === 'atmosphere' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Surface Pavement Wetness</span>
                  <span className="text-white font-bold">
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

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Volumetric Fog Near</span>
                  <span className="text-white font-bold">{lighting.fog.near}m</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
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

              <div className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-1.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Volumetric Fog Far</span>
                  <span className="text-white font-bold">{lighting.fog.far}m</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
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
