import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  buildCyberpunkAlley,
  buildGothicCrypt,
  buildMechTurret,
  applyRenderPassMode,
} from './proceduralAssets';
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
} from 'lucide-react';

interface LightingStudioProps {
  initialScene?: 'cyberpunk' | 'crypt' | 'turret';
  className?: string;
}

export const LightingStudio: React.FC<LightingStudioProps> = ({
  initialScene = 'cyberpunk',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Studio UI state
  const [selectedScene, setSelectedScene] = useState<'cyberpunk' | 'crypt' | 'turret'>(initialScene);
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

  // Active lighting settings
  const [lighting, setLighting] = useState<LightSettings>(LIGHTING_PRESETS.cyberpunk);

  // Refs for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentSceneMeshRef = useRef<THREE.Group | null>(null);

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
    selectedScene,
    renderPass,
    autoRotate,
    turntableSpeed,
    pulseDiegeticLight,
    isSoftwareGl: false,
  });

  useEffect(() => {
    stateRef.current = {
      lighting,
      selectedScene,
      renderPass,
      autoRotate,
      turntableSpeed,
      pulseDiegeticLight,
      isSoftwareGl: stateRef.current.isSoftwareGl,
    };
  }, [lighting, selectedScene, renderPass, autoRotate, turntableSpeed, pulseDiegeticLight]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();
    stateRef.current.isSoftwareGl = isSoftwareGl;

    // 2. Setup Scene & Camera (Positioned to frame subject in upper/middle view)
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(lighting.fog.color || '#080812');

    const aspect = container.clientWidth / Math.max(container.clientHeight, 300);
    const camera = new THREE.PerspectiveCamera(lighting.camera?.fov || 50, aspect, 0.1, 100);
    camera.position.set(0, 4.8, 12);
    cameraRef.current = camera;

    // 3. Setup Renderer with tone mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = lighting.toneMapping.exposure;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Controls (Target framed higher so subject is unobstructed by bottom bar)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent going below floor
    controls.minDistance = 3.5;
    controls.maxDistance = 26;
    controls.target.set(0, 2.6, 0); // Elevated focal point
    controlsRef.current = controls;

    // 6. Lighting Rig Setup
    // Key Light (Directional Sunlight)
    const keyLight = new THREE.DirectionalLight(lighting.keyLight.color, lighting.keyLight.intensity);
    const [kx, ky, kz] = polarToCartesian(lighting.keyLight.azimuth, lighting.keyLight.elevation, 12);
    keyLight.position.set(kx, ky, kz);
    keyLight.castShadow = !isSoftwareGl && lighting.keyLight.castShadow;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 9;
    keyLight.shadow.camera.bottom = -9;
    keyLight.shadow.bias = lighting.keyLight.shadowBias ?? -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.radius = lighting.keyLight.softness ?? 1.0;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    // Fill Light (Hemisphere Skylight with Indirect Bounce)
    const giMult = lighting.fillLight.giBounceMultiplier ?? 1.0;
    const fillLight = new THREE.HemisphereLight(
      lighting.fillLight.skyColor,
      lighting.fillLight.groundColor,
      lighting.fillLight.intensity * giMult
    );
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    // Rim Light (Directional Kicker)
    const rimLight = new THREE.DirectionalLight(lighting.rimLight.color, lighting.rimLight.intensity);
    const [rx, ry, rz] = polarToCartesian(lighting.rimLight.angle, lighting.rimLight.elevation ?? 30, 10);
    rimLight.position.set(rx, ry, rz);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Local Point Light (Diegetic Accent)
    const localLight = new THREE.PointLight(
      lighting.localLight.color,
      lighting.localLight.intensity,
      lighting.localLight.distance
    );
    localLight.position.set(lighting.localLight.x, lighting.localLight.y, lighting.localLight.z);
    scene.add(localLight);
    localLightRef.current = localLight;

    // Atmosphere Fog
    scene.fog = new THREE.Fog(lighting.fog.color, lighting.fog.near, lighting.fog.far);

    // 7. Load Initial Scene Mesh
    let meshGroup: THREE.Group;
    if (selectedScene === 'crypt') meshGroup = buildGothicCrypt();
    else if (selectedScene === 'turret') meshGroup = buildMechTurret();
    else meshGroup = buildCyberpunkAlley();
    scene.add(meshGroup);
    currentSceneMeshRef.current = meshGroup;

    // 8. Animation & Render Loop
    let frameId = 0;
    let isDisposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

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

      // Diegetic light pulse / flicker animation
      if (localLightRef.current && stateRef.current.pulseDiegeticLight) {
        const pulse = Math.sin(elapsedTime * (stateRef.current.lighting.localLight.pulseSpeed || 1.8));
        localLightRef.current.intensity =
          stateRef.current.lighting.localLight.intensity * (0.85 + pulse * 0.15);
      }

      // Dynamic scene animations
      if (currentSceneMeshRef.current) {
        // Floating crystal in crypt
        const crystal = currentSceneMeshRef.current.getObjectByName('MysticCrystal');
        if (crystal) {
          crystal.rotation.y += delta * 0.8;
          crystal.position.y = 2.0 + Math.sin(elapsedTime * 1.5) * 0.12;
        }
        // Turret scanner pan
        const turretHead = currentSceneMeshRef.current.getObjectByName('TurretHead');
        if (turretHead && stateRef.current.autoRotate) {
          turretHead.rotation.y = Math.sin(elapsedTime * 0.6) * 0.4;
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync scene mesh change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (currentSceneMeshRef.current) {
      scene.remove(currentSceneMeshRef.current);
    }

    let newMesh: THREE.Group;
    if (selectedScene === 'crypt') {
      newMesh = buildGothicCrypt();
      if (controlsRef.current) controlsRef.current.target.set(0, 2.2, 0);
    } else if (selectedScene === 'turret') {
      newMesh = buildMechTurret();
      if (controlsRef.current) controlsRef.current.target.set(0, 1.8, 0);
    } else {
      newMesh = buildCyberpunkAlley();
      if (controlsRef.current) controlsRef.current.target.set(0, 2.6, 0);
    }

    scene.add(newMesh);
    currentSceneMeshRef.current = newMesh;

    // Apply surface wetness to floor
    updateFloorWetness(newMesh, lighting.surface?.wetness ?? 0.5);

    // Reapply current render pass
    applyRenderPassMode(newMesh, renderPass, clayMatRef.current, normalMatRef.current);
  }, [selectedScene]);

  // Helper to dynamically modulate floor material wetness & roughness
  const updateFloorWetness = (group: THREE.Group, wetness: number) => {
    const floor = group.getObjectByName('StudioFloor') as THREE.Mesh;
    if (floor && floor.material instanceof THREE.MeshStandardMaterial) {
      // wetness 1.0 => roughness 0.08 (slick puddle mirror), wetness 0.0 => roughness 0.85 (dry rough stone/asphalt)
      floor.material.roughness = Math.max(0.06, 0.85 - wetness * 0.77);
      floor.material.metalness = 0.2 + wetness * 0.35;
      floor.material.needsUpdate = true;
    }
  };

  // Sync lighting changes to Three.js objects
  useEffect(() => {
    if (!keyLightRef.current || !fillLightRef.current || !rimLightRef.current || !localLightRef.current)
      return;

    // Key light
    keyLightRef.current.color.set(lighting.keyLight.color);
    keyLightRef.current.intensity = lighting.keyLight.intensity;
    const [kx, ky, kz] = polarToCartesian(lighting.keyLight.azimuth, lighting.keyLight.elevation, 12);
    keyLightRef.current.position.set(kx, ky, kz);
    keyLightRef.current.castShadow = !stateRef.current.isSoftwareGl && lighting.keyLight.castShadow;
    if (keyLightRef.current.shadow) {
      keyLightRef.current.shadow.radius = lighting.keyLight.softness ?? 1.0;
      keyLightRef.current.shadow.bias = lighting.keyLight.shadowBias ?? -0.0005;
    }

    // Fill light with GI multiplier
    const giMult = lighting.fillLight.giBounceMultiplier ?? 1.0;
    fillLightRef.current.color.set(lighting.fillLight.skyColor);
    fillLightRef.current.groundColor.set(lighting.fillLight.groundColor);
    fillLightRef.current.intensity = lighting.fillLight.intensity * giMult;

    // Rim light
    rimLightRef.current.color.set(lighting.rimLight.color);
    rimLightRef.current.intensity = lighting.rimLight.intensity;
    const [rx, ry, rz] = polarToCartesian(
      lighting.rimLight.angle,
      lighting.rimLight.elevation ?? 30,
      10
    );
    rimLightRef.current.position.set(rx, ry, rz);

    // Local light
    localLightRef.current.color.set(lighting.localLight.color);
    localLightRef.current.intensity = lighting.localLight.intensity;
    localLightRef.current.distance = lighting.localLight.distance;
    localLightRef.current.position.set(
      lighting.localLight.x,
      lighting.localLight.y,
      lighting.localLight.z
    );

    // Atmosphere Fog
    if (sceneRef.current && sceneRef.current.fog instanceof THREE.Fog) {
      sceneRef.current.fog.color.set(lighting.fog.color);
      sceneRef.current.fog.near = lighting.fog.near;
      sceneRef.current.fog.far = lighting.fog.far;
      sceneRef.current.background = new THREE.Color(lighting.fog.color);
    }

    // Renderer Tone Mapping & Exposure
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = lighting.toneMapping.exposure;
      if (lighting.toneMapping.mode === 'cineon') {
        rendererRef.current.toneMapping = THREE.CineonToneMapping;
      } else if (lighting.toneMapping.mode === 'reinhard') {
        rendererRef.current.toneMapping = THREE.ReinhardToneMapping;
      } else if (lighting.toneMapping.mode === 'neutral') {
        rendererRef.current.toneMapping = THREE.NeutralToneMapping;
      } else if (lighting.toneMapping.mode === 'linear') {
        rendererRef.current.toneMapping = THREE.LinearToneMapping;
      } else {
        rendererRef.current.toneMapping = THREE.ACESFilmicToneMapping;
      }
    }

    // Camera FOV
    if (cameraRef.current && lighting.camera?.fov) {
      if (cameraRef.current.fov !== lighting.camera.fov) {
        cameraRef.current.fov = lighting.camera.fov;
        cameraRef.current.updateProjectionMatrix();
      }
    }

    // Surface wetness
    if (currentSceneMeshRef.current) {
      updateFloorWetness(currentSceneMeshRef.current, lighting.surface?.wetness ?? 0.5);
    }
  }, [lighting]);

  // Sync render pass changes
  useEffect(() => {
    if (!currentSceneMeshRef.current) return;
    applyRenderPassMode(
      currentSceneMeshRef.current,
      renderPass,
      clayMatRef.current,
      normalMatRef.current
    );
  }, [renderPass]);

  // Camera preset positions
  const setCameraPreset = (preset: 'cinematic' | 'hero' | 'top' | 'macro') => {
    if (!cameraRef.current || !controlsRef.current) return;
    if (preset === 'cinematic') {
      cameraRef.current.position.set(0, 4.6, 12);
      controlsRef.current.target.set(0, 2.6, 0);
    } else if (preset === 'hero') {
      cameraRef.current.position.set(-3.8, 1.4, 5.8);
      controlsRef.current.target.set(0, 2.4, 0);
    } else if (preset === 'top') {
      cameraRef.current.position.set(0, 14, 2.5);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'macro') {
      cameraRef.current.position.set(1.4, 2.2, 3.4);
      controlsRef.current.target.set(0, 2.0, 0);
    }
    controlsRef.current.update();
  };

  // Lens focal length switcher
  const handleFocalLengthChange = (mm: number) => {
    // 24mm: ~73.7, 35mm: ~54.4, 50mm: ~39.6, 85mm: ~23.9
    let fov = 54;
    if (mm === 24) fov = 74;
    else if (mm === 35) fov = 54;
    else if (mm === 50) fov = 40;
    else if (mm === 85) fov = 24;

    setLighting((prev) => ({
      ...prev,
      camera: { ...prev.camera, focalLengthMm: mm, fov },
    }));
  };

  // Color temperature Kelvin helper
  const handleKelvinChange = (kelvin: number) => {
    const hex = kelvinToHex(kelvin);
    setLighting((prev) => ({
      ...prev,
      keyLight: { ...prev.keyLight, color: hex, kelvin },
    }));
  };

  // Azimuth compass label
  const getCompassHeading = (azimuth: number): string => {
    const norm = (azimuth % 360 + 360) % 360;
    if (norm >= 337.5 || norm < 22.5) return 'N (0°)';
    if (norm >= 22.5 && norm < 67.5) return 'NE (45°)';
    if (norm >= 67.5 && norm < 112.5) return 'E (90°)';
    if (norm >= 112.5 && norm < 157.5) return 'SE (135°)';
    if (norm >= 157.5 && norm < 202.5) return 'S (180°)';
    if (norm >= 202.5 && norm < 247.5) return 'SW (225°)';
    if (norm >= 247.5 && norm < 292.5) return 'W (270°)';
    return 'NW (315°)';
  };

  // Export formats
  const handleCopyCode = (format: 'ue5' | 'threejs' | 'json') => {
    let text = '';
    if (format === 'ue5') {
      text = `// --- UNREAL ENGINE 5 LUMEN LIGHTING RIG SPEC ---
// Scene: ${selectedScene.toUpperCase()}
// Key Light (Directional): Intensity: ${lighting.keyLight.intensity} Lux | Color: ${lighting.keyLight.color} | Pitch: -${lighting.keyLight.elevation}° | Yaw: ${lighting.keyLight.azimuth}° | Softness: ${lighting.keyLight.softness || 1.0}
// Skylight (Fill & GI): Intensity: ${lighting.fillLight.intensity} | Sky Color: ${lighting.fillLight.skyColor} | Ground Color: ${lighting.fillLight.groundColor} | Lumen Indirect Multiplier: ${lighting.fillLight.giBounceMultiplier || 1.0}x
// Rim Kicker: Intensity: ${lighting.rimLight.intensity} | Color: ${lighting.rimLight.color} | Angle: ${lighting.rimLight.angle}°
// Exponential Height Fog: Density: ${lighting.fog.density} | Color: ${lighting.fog.color} | Start Distance: ${lighting.fog.near * 100}cm
// PostProcessVolume: EV100 Exposure: ${lighting.toneMapping.exposure} | ToneCurve: ACES Filmic
// Authored by Avinash · Game Designer & Lighting Artist`;
    } else if (format === 'threejs') {
      text = `// --- THREE.JS LIGHT RIG SETUP ---
const keyLight = new THREE.DirectionalLight('${lighting.keyLight.color}', ${lighting.keyLight.intensity});
const [kx, ky, kz] = polarToCartesian(${lighting.keyLight.azimuth}, ${lighting.keyLight.elevation}, 12);
keyLight.position.set(kx, ky, kz);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.HemisphereLight('${lighting.fillLight.skyColor}', '${lighting.fillLight.groundColor}', ${lighting.fillLight.intensity});
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight('${lighting.rimLight.color}', ${lighting.rimLight.intensity});
scene.add(rimLight);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = ${lighting.toneMapping.exposure};`;
    } else {
      text = JSON.stringify(lighting, null, 2);
    }

    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* 3D Canvas Viewport Box */}
      <div
        className={`relative w-full overflow-hidden bg-[#07090e] border border-zinc-800/80 rounded-2xl transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-50 rounded-none border-none h-screen'
            : 'h-[620px] sm:h-[680px] lg:h-[760px]'
        }`}
      >
        {/* Three.js Isolated Canvas Mount */}
        <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Left: Scene Spec Badge & Real-time Info */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 bg-zinc-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 shadow-xl">
            <span className="text-red-500 font-bold tracking-wider">3D LIGHTING LAB</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-200">
              {selectedScene === 'cyberpunk'
                ? 'Cyberpunk Alleyway'
                : selectedScene === 'crypt'
                ? 'Gothic Moonlit Crypt'
                : 'Titan Rail Turret'}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-red-400 font-mono font-medium">
              {renderPass === 'final' ? 'PBR Lit' : renderPass === 'clay' ? 'Clay Pass' : renderPass}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans tracking-tight pl-1 drop-shadow">
            Left click + drag to orbit · Right click to pan · Scroll to zoom
          </p>
        </div>

        {/* Top Right: Fullscreen, Layout Switcher & Code Export */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* Layout Toggle (Overlay vs Below) */}
          <button
            onClick={() => setLayoutMode(layoutMode === 'overlay' ? 'below' : 'overlay')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
              layoutMode === 'below'
                ? 'bg-red-950/60 text-red-300 border-red-800 shadow-md'
                : 'bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 border-zinc-800'
            }`}
            title={
              layoutMode === 'below'
                ? 'Docked Below Canvas (100% Unobstructed Scene)'
                : 'Overlay Dock (Bottom edge of canvas)'
            }
          >
            <Layout className="w-3.5 h-3.5 text-red-500" />
            <span>{layoutMode === 'below' ? 'Console Below Canvas' : 'Overlay Dock'}</span>
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
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Code Export Dropdown Modal */}
        {showExportModal && (
          <div className="absolute top-14 right-4 z-30 w-72 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl p-3 text-xs font-mono text-zinc-300 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
              <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-red-500" />
                <span>Export Light Rig</span>
              </span>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-zinc-500 hover:text-white"
              >
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

        {/* OVERLAY DOCK (Placed flush at the very bottom so entire 3D scene is visible) */}
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

      {/* EXTERNAL CONSOLE (When in 'below' mode, placed completely below canvas for 100% unobstructed 3D scene) */}
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
        {/* Row 1: Scene Switcher + Primary Feature Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-800/80">
          {/* 3D Scene Selector */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setSelectedScene('cyberpunk')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedScene === 'cyberpunk'
                  ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-600/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cyberpunk Alley
            </button>
            <button
              onClick={() => setSelectedScene('crypt')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedScene === 'crypt'
                  ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-600/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Gothic Crypt
            </button>
            <button
              onClick={() => setSelectedScene('turret')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedScene === 'turret'
                  ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-600/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Mech Turret
            </button>
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
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
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
              <Flame className="w-3.5 h-3.5 text-pink-400" />
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
              <Crosshair className="w-3.5 h-3.5 text-red-400" />
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
              <Droplets className="w-3.5 h-3.5 text-teal-400" />
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
              <Camera className="w-3.5 h-3.5 text-zinc-300" />
              <span>Optics</span>
            </button>
          </div>
        </div>

        {/* Row 2: Selected Tool's Interactive Controls */}
        <div className="min-h-[110px] flex items-center">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {Object.entries(LIGHTING_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => {
                    setLighting(preset);
                    if (key === 'cyberpunk' || key === 'redAlert') setSelectedScene('cyberpunk');
                    if (key === 'crypt') setSelectedScene('crypt');
                    if (key === 'studio' || key === 'noir') setSelectedScene('turret');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    lighting.name === preset.name
                      ? 'bg-zinc-800/90 border-red-500/90 shadow-md shadow-red-500/20'
                      : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="text-xs font-bold text-zinc-100 flex items-center justify-between">
                    <span className="truncate">{preset.name}</span>
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: preset.keyLight.color }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-1">
                    Key {preset.keyLight.intensity}x · {preset.keyLight.kelvin || 5600}K
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* TAB 2: KEY LIGHT & SUN RIG */}
          {activeTab === 'key' && (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
              {/* Color & Kelvin */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Color & Temp</span>
                  <span className="text-zinc-200">{lighting.keyLight.kelvin || 5600}K</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lighting.keyLight.color}
                    onChange={(e) =>
                      setLighting((prev) => ({
                        ...prev,
                        keyLight: { ...prev.keyLight, color: e.target.value },
                      }))
                    }
                    className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    type="range"
                    min="2000"
                    max="9000"
                    step="100"
                    value={lighting.keyLight.kelvin || 5600}
                    onChange={(e) => handleKelvinChange(parseInt(e.target.value))}
                    className="w-full accent-red-500 bg-zinc-800"
                    title="Color Temperature Kelvin (2000K Candle to 9000K Ice)"
                  />
                </div>
              </div>

              {/* Intensity / Lux */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Key Intensity</span>
                  <span className="text-zinc-200">{lighting.keyLight.intensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="7.0"
                  step="0.1"
                  value={lighting.keyLight.intensity}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      keyLight: { ...prev.keyLight, intensity: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Azimuth (Orbit angle) */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Azimuth Orbit</span>
                  <span className="text-zinc-200">{getCompassHeading(lighting.keyLight.azimuth)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={lighting.keyLight.azimuth}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      keyLight: { ...prev.keyLight, azimuth: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Elevation / Solar Angle */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Sun Elevation</span>
                  <span className="text-zinc-200">{lighting.keyLight.elevation}°</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="85"
                  step="1"
                  value={lighting.keyLight.elevation}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      keyLight: { ...prev.keyLight, elevation: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Soft Shadows Radius */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Soft Shadows</span>
                  <span className="text-zinc-200">{(lighting.keyLight.softness || 1.0).toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={lighting.keyLight.softness || 1.0}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      keyLight: { ...prev.keyLight, softness: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Shadow Casting Toggle */}
              <div className="space-y-1 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setLighting((prev) => ({
                      ...prev,
                      keyLight: { ...prev.keyLight, castShadow: !prev.keyLight.castShadow },
                    }))
                  }
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    lighting.keyLight.castShadow
                      ? 'bg-red-950/50 border-red-800 text-red-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>{lighting.keyLight.castShadow ? 'Shadows: Active' : 'Shadows: Off'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FILL LIGHT & INDIRECT GI BOUNCE */}
          {activeTab === 'fill' && (
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              {/* Sky Color */}
              <div className="space-y-1">
                <span className="text-zinc-400">Sky Dome Tint</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lighting.fillLight.skyColor}
                    onChange={(e) =>
                      setLighting((prev) => ({
                        ...prev,
                        fillLight: { ...prev.fillLight, skyColor: e.target.value },
                      }))
                    }
                    className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-zinc-200">{lighting.fillLight.skyColor.toUpperCase()}</span>
                </div>
              </div>

              {/* Ground Bounce Color */}
              <div className="space-y-1">
                <span className="text-zinc-400">Ground Bounce Tint</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lighting.fillLight.groundColor}
                    onChange={(e) =>
                      setLighting((prev) => ({
                        ...prev,
                        fillLight: { ...prev.fillLight, groundColor: e.target.value },
                      }))
                    }
                    className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-zinc-200">{lighting.fillLight.groundColor.toUpperCase()}</span>
                </div>
              </div>

              {/* Fill Intensity */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Fill Ambient</span>
                  <span className="text-zinc-200">{lighting.fillLight.intensity.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.5"
                  step="0.05"
                  value={lighting.fillLight.intensity}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      fillLight: { ...prev.fillLight, intensity: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Simulated Lumen Indirect GI Bounce */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Lumen GI Bounce</span>
                  <span className="text-red-400 font-bold">
                    {(lighting.fillLight.giBounceMultiplier || 1.0).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={lighting.fillLight.giBounceMultiplier || 1.0}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      fillLight: { ...prev.fillLight, giBounceMultiplier: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>
            </div>
          )}

          {/* TAB 4: RIM LIGHT / KICKER */}
          {activeTab === 'rim' && (
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              {/* Rim Color */}
              <div className="space-y-1">
                <span className="text-zinc-400">Rim Kicker Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lighting.rimLight.color}
                    onChange={(e) =>
                      setLighting((prev) => ({
                        ...prev,
                        rimLight: { ...prev.rimLight, color: e.target.value },
                      }))
                    }
                    className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-zinc-200">{lighting.rimLight.color.toUpperCase()}</span>
                </div>
              </div>

              {/* Rim Intensity */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Rim Intensity</span>
                  <span className="text-zinc-200">{lighting.rimLight.intensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="8.0"
                  step="0.2"
                  value={lighting.rimLight.intensity}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      rimLight: { ...prev.rimLight, intensity: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Rim Angle (Azimuth) */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Rim Angle</span>
                  <span className="text-zinc-200">{lighting.rimLight.angle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={lighting.rimLight.angle}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      rimLight: { ...prev.rimLight, angle: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Rim Elevation */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Rim Elevation</span>
                  <span className="text-zinc-200">{lighting.rimLight.elevation || 30}°</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="75"
                  step="5"
                  value={lighting.rimLight.elevation || 30}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      rimLight: { ...prev.rimLight, elevation: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>
            </div>
          )}

          {/* TAB 5: POINT LIGHT (DIEGETIC ACCENT) */}
          {activeTab === 'point' && (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
              {/* Point Color */}
              <div className="space-y-1">
                <span className="text-zinc-400">Point Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lighting.localLight.color}
                    onChange={(e) =>
                      setLighting((prev) => ({
                        ...prev,
                        localLight: { ...prev.localLight, color: e.target.value },
                      }))
                    }
                    className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-zinc-200">{lighting.localLight.color.toUpperCase()}</span>
                </div>
              </div>

              {/* Intensity */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Intensity</span>
                  <span className="text-zinc-200">{lighting.localLight.intensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="10.0"
                  step="0.2"
                  value={lighting.localLight.intensity}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      localLight: { ...prev.localLight, intensity: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Position X */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Coord X</span>
                  <span className="text-zinc-200">{lighting.localLight.x.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="-6.0"
                  max="6.0"
                  step="0.2"
                  value={lighting.localLight.x}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      localLight: { ...prev.localLight, x: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Position Y (Height) */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Coord Y (Height)</span>
                  <span className="text-zinc-200">{lighting.localLight.y.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="6.0"
                  step="0.2"
                  value={lighting.localLight.y}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      localLight: { ...prev.localLight, y: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Position Z */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Coord Z</span>
                  <span className="text-zinc-200">{lighting.localLight.z.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="-6.0"
                  max="6.0"
                  step="0.2"
                  value={lighting.localLight.z}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      localLight: { ...prev.localLight, z: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Animation pulse toggle */}
              <div className="space-y-1 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setPulseDiegeticLight(!pulseDiegeticLight)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    pulseDiegeticLight
                      ? 'bg-red-950/50 border-red-800 text-red-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{pulseDiegeticLight ? 'Neon Pulse: On' : 'Neon Pulse: Off'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: ATMOSPHERE & SURFACE WETNESS */}
          {activeTab === 'atmosphere' && (
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              {/* Fog Color */}
              <div className="space-y-1">
                <span className="text-zinc-400">Atmospheric Fog Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lighting.fog.color}
                    onChange={(e) =>
                      setLighting((prev) => ({
                        ...prev,
                        fog: { ...prev.fog, color: e.target.value },
                      }))
                    }
                    className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-zinc-200">{lighting.fog.color.toUpperCase()}</span>
                </div>
              </div>

              {/* Fog Distance (Far falloff) */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Fog Density Distance</span>
                  <span className="text-zinc-200">{lighting.fog.far}m</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="60"
                  step="2"
                  value={lighting.fog.far}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      fog: { ...prev.fog, far: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Floor Surface Wetness (modulates specular puddles) */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Floor Rain Wetness</span>
                  <span className="text-cyan-400 font-bold">
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
                    setLighting((prev) => ({
                      ...prev,
                      surface: { ...prev.surface, wetness: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-cyan-500 bg-zinc-800"
                  title="Adjust puddle reflections and ground specular roughness"
                />
              </div>

              {/* Fog Near Distance */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Fog Inset Start</span>
                  <span className="text-zinc-200">{lighting.fog.near}m</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={lighting.fog.near}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      fog: { ...prev.fog, near: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>
            </div>
          )}

          {/* TAB 7: ACES COLOR GRADING & POST-PROCESS */}
          {activeTab === 'post' && (
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-mono">
              {/* Tone Mapping Curve */}
              <div className="space-y-1">
                <span className="text-zinc-400">Tone Mapping Engine</span>
                <select
                  value={lighting.toneMapping.mode || 'aces'}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      toneMapping: { ...prev.toneMapping, mode: e.target.value as any },
                    }))
                  }
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                >
                  <option value="aces">ACES Filmic (Cinematic)</option>
                  <option value="reinhard">Reinhard (Smooth Highlights)</option>
                  <option value="cineon">Cineon (Film Roll-off)</option>
                  <option value="neutral">Neutral (sRGB Standard)</option>
                  <option value="linear">Linear (Raw HDR)</option>
                </select>
              </div>

              {/* Exposure EV */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Exposure (EV)</span>
                  <span className="text-zinc-200">{lighting.toneMapping.exposure.toFixed(2)} EV</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={lighting.toneMapping.exposure}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      toneMapping: { ...prev.toneMapping, exposure: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Contrast S-Curve</span>
                  <span className="text-zinc-200">
                    {(lighting.toneMapping.contrast || 1.1).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.6"
                  step="0.05"
                  value={lighting.toneMapping.contrast || 1.1}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      toneMapping: { ...prev.toneMapping, contrast: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Saturation</span>
                  <span className="text-zinc-200">
                    {(lighting.toneMapping.saturation || 1.0).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.05"
                  value={lighting.toneMapping.saturation ?? 1.0}
                  onChange={(e) =>
                    setLighting((prev) => ({
                      ...prev,
                      toneMapping: { ...prev.toneMapping, saturation: parseFloat(e.target.value) },
                    }))
                  }
                  className="w-full accent-red-500 bg-zinc-800"
                />
              </div>
            </div>
          )}

          {/* TAB 8: RENDER PASSES (Clay, Normals, Lit, Wireframe) */}
          {activeTab === 'passes' && (
            <div className="w-full flex flex-wrap items-center gap-2">
              {[
                { id: 'final', label: 'Final Lit (PBR)', desc: 'Full materials, wetness & environment' },
                { id: 'clay', label: 'Lighting Only (Clay)', desc: 'Isolate pure light & shadow falloff' },
                { id: 'normals', label: 'World Surface Normals', desc: 'Surface orientation buffer inspection' },
                { id: 'wireframe', label: 'Wireframe Topology', desc: 'Polygon flow & structural density' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setRenderPass(mode.id as any)}
                  className={`flex-1 min-w-[150px] p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    renderPass === mode.id
                      ? 'bg-zinc-800 border-red-500/80 text-white shadow-md'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="text-xs font-bold">{mode.label}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{mode.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* TAB 9: OPTICS & CAMERA */}
          {activeTab === 'camera' && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono items-center">
              {/* Focal Length Lens */}
              <div className="space-y-1">
                <span className="text-zinc-400">Cinematic Lens:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { mm: 24, label: '24mm Wide' },
                    { mm: 35, label: '35mm Cine' },
                    { mm: 50, label: '50mm Eye' },
                    { mm: 85, label: '85mm Tele' },
                  ].map((lens) => (
                    <button
                      key={lens.mm}
                      onClick={() => handleFocalLengthChange(lens.mm)}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-center transition-colors cursor-pointer ${
                        (lighting.camera?.focalLengthMm || 50) === lens.mm
                          ? 'bg-red-950/60 border-red-800 text-red-300 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {lens.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Viewpoints */}
              <div className="space-y-1">
                <span className="text-zinc-400">Camera Viewpoints:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCameraPreset('cinematic')}
                    className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 transition-colors cursor-pointer text-center"
                  >
                    Cinematic
                  </button>
                  <button
                    onClick={() => setCameraPreset('hero')}
                    className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 transition-colors cursor-pointer text-center"
                  >
                    Hero
                  </button>
                  <button
                    onClick={() => setCameraPreset('top')}
                    className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 transition-colors cursor-pointer text-center"
                  >
                    Top
                  </button>
                  <button
                    onClick={() => setCameraPreset('macro')}
                    className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 transition-colors cursor-pointer text-center"
                  >
                    Macro
                  </button>
                </div>
              </div>

              {/* Turntable Auto-rotate */}
              <div className="space-y-1">
                <span className="text-zinc-400">Turntable 360° Orbit:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      autoRotate
                        ? 'bg-red-950/40 text-red-400 border-red-500/50'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
                    <span>{autoRotate ? 'Rotating (On)' : 'Turntable Off'}</span>
                  </button>
                  {autoRotate && (
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.2"
                      value={turntableSpeed}
                      onChange={(e) => setTurntableSpeed(parseFloat(e.target.value))}
                      className="w-20 accent-red-500"
                      title="Rotation Speed"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
};
