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
} from '../../utils/lightingLogic';
import {
  Sun,
  Moon,
  Zap,
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
  const [activeTab, setActiveTab] = useState<'presets' | 'key' | 'fill' | 'fog' | 'passes' | 'camera'>('presets');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedPreset, setCopiedPreset] = useState(false);
  const [renderPass, setRenderPass] = useState<'final' | 'clay' | 'normals' | 'wireframe'>('final');
  const [autoRotate, setAutoRotate] = useState(false);

  // Active lighting settings
  const [lighting, setLighting] = useState<LightSettings>(LIGHTING_PRESETS.cyberpunk);

  // Refs for Three.js objects (so React re-renders don't re-instantiate WebGL)
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
  const lightHelperGroupRef = useRef<THREE.Group | null>(null);

  // Reusable materials for pass switching
  const clayMatRef = useRef<THREE.MeshStandardMaterial>(
    new THREE.MeshStandardMaterial({ color: 0x858a98, roughness: 0.7, metalness: 0.1 })
  );
  const normalMatRef = useRef<THREE.MeshNormalMaterial>(new THREE.MeshNormalMaterial());

  // Mutable state for render loop
  const stateRef = useRef({
    lighting,
    selectedScene,
    renderPass,
    autoRotate,
    isSoftwareGl: false,
  });

  useEffect(() => {
    stateRef.current = { lighting, selectedScene, renderPass, autoRotate, isSoftwareGl: stateRef.current.isSoftwareGl };
  }, [lighting, selectedScene, renderPass, autoRotate]);

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

    // 2. Setup Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0c12);

    const aspect = container.clientWidth / Math.max(container.clientHeight, 300);
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camera.position.set(0, 4.5, 12);
    cameraRef.current = camera;

    // 3. Setup Renderer
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

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent going below floor
    controls.minDistance = 3;
    controls.maxDistance = 25;
    controls.target.set(0, 2, 0);
    controlsRef.current = controls;

    // 6. Lighting Rig Setup
    // Key Light
    const keyLight = new THREE.DirectionalLight(lighting.keyLight.color, lighting.keyLight.intensity);
    const [kx, ky, kz] = polarToCartesian(lighting.keyLight.azimuth, lighting.keyLight.elevation, 12);
    keyLight.position.set(kx, ky, kz);
    keyLight.castShadow = !isSoftwareGl && lighting.keyLight.castShadow;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    // Fill Light (Hemisphere)
    const fillLight = new THREE.HemisphereLight(
      lighting.fillLight.skyColor,
      lighting.fillLight.groundColor,
      lighting.fillLight.intensity
    );
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    // Rim Light (Directional opposite angle)
    const rimLight = new THREE.DirectionalLight(lighting.rimLight.color, lighting.rimLight.intensity);
    const [rx, ry, rz] = polarToCartesian(lighting.rimLight.angle, 30, 10);
    rimLight.position.set(rx, ry, rz);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Local Accent Light (Point)
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

    // Helpers group (optional visualization)
    const helperGroup = new THREE.Group();
    scene.add(helperGroup);
    lightHelperGroupRef.current = helperGroup;

    // 7. Load Initial Scene Mesh
    let meshGroup: THREE.Group;
    if (selectedScene === 'crypt') meshGroup = buildGothicCrypt();
    else if (selectedScene === 'turret') meshGroup = buildMechTurret();
    else meshGroup = buildCyberpunkAlley();
    scene.add(meshGroup);
    currentSceneMeshRef.current = meshGroup;

    // 8. Animation & Render Loop with Software-WebGL pacing
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
          controlsRef.current.autoRotateSpeed = 1.2;
        } else {
          controlsRef.current.autoRotate = false;
        }
        controlsRef.current.update();
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
      if (controlsRef.current) controlsRef.current.target.set(0, 2.0, 0);
    } else if (selectedScene === 'turret') {
      newMesh = buildMechTurret();
      if (controlsRef.current) controlsRef.current.target.set(0, 1.6, 0);
    } else {
      newMesh = buildCyberpunkAlley();
      if (controlsRef.current) controlsRef.current.target.set(0, 2.5, 0);
    }

    scene.add(newMesh);
    currentSceneMeshRef.current = newMesh;

    // Reapply current render pass
    applyRenderPassMode(newMesh, renderPass, clayMatRef.current, normalMatRef.current);
  }, [selectedScene]);

  // Sync lighting changes to Three.js objects
  useEffect(() => {
    if (!keyLightRef.current || !fillLightRef.current || !rimLightRef.current || !localLightRef.current) return;

    // Key light
    keyLightRef.current.color.set(lighting.keyLight.color);
    keyLightRef.current.intensity = lighting.keyLight.intensity;
    const [kx, ky, kz] = polarToCartesian(lighting.keyLight.azimuth, lighting.keyLight.elevation, 12);
    keyLightRef.current.position.set(kx, ky, kz);
    keyLightRef.current.castShadow = !stateRef.current.isSoftwareGl && lighting.keyLight.castShadow;

    // Fill light
    fillLightRef.current.color.set(lighting.fillLight.skyColor);
    fillLightRef.current.groundColor.set(lighting.fillLight.groundColor);
    fillLightRef.current.intensity = lighting.fillLight.intensity;

    // Rim light
    rimLightRef.current.color.set(lighting.rimLight.color);
    rimLightRef.current.intensity = lighting.rimLight.intensity;
    const [rx, ry, rz] = polarToCartesian(lighting.rimLight.angle, 30, 10);
    rimLightRef.current.position.set(rx, ry, rz);

    // Local light
    localLightRef.current.color.set(lighting.localLight.color);
    localLightRef.current.intensity = lighting.localLight.intensity;
    localLightRef.current.distance = lighting.localLight.distance;
    localLightRef.current.position.set(lighting.localLight.x, lighting.localLight.y, lighting.localLight.z);

    // Fog
    if (sceneRef.current && sceneRef.current.fog instanceof THREE.Fog) {
      sceneRef.current.fog.color.set(lighting.fog.color);
      sceneRef.current.fog.near = lighting.fog.near;
      sceneRef.current.fog.far = lighting.fog.far;
      sceneRef.current.background = new THREE.Color(lighting.fog.color);
    }

    // Exposure
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = lighting.toneMapping.exposure;
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
      cameraRef.current.position.set(0, 4.0, 11);
      controlsRef.current.target.set(0, 2.0, 0);
    } else if (preset === 'hero') {
      cameraRef.current.position.set(-3.5, 1.2, 5.5);
      controlsRef.current.target.set(0, 2.2, 0);
    } else if (preset === 'top') {
      cameraRef.current.position.set(0, 14, 2);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'macro') {
      cameraRef.current.position.set(1.5, 2.2, 3.2);
      controlsRef.current.target.set(0, 1.8, 0);
    }
    controlsRef.current.update();
  };

  const handleCopyPreset = () => {
    navigator.clipboard.writeText(JSON.stringify(lighting, null, 2));
    setCopiedPreset(true);
    setTimeout(() => setCopiedPreset(false), 2000);
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#090b10] border border-zinc-800/80 rounded-2xl ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[620px] lg:h-[700px]'
      } ${className}`}
    >
      {/* Three.js Isolated Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Scene Spec Badge & Real-time Info */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800">
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
          <span className="text-zinc-400 font-mono">
            {renderPass === 'final' ? 'PBR Lit' : renderPass === 'clay' ? 'Clay Pass' : renderPass}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 font-sans tracking-tight pl-1">
          Left click + drag to orbit · Right click to pan · Scroll to zoom
        </p>
      </div>

      {/* Top Right: Fullscreen & Reset Actions */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={handleCopyPreset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 transition-colors"
          title="Copy current light rig JSON"
        >
          {copiedPreset ? <Check className="w-3.5 h-3.5 text-red-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedPreset ? 'Copied' : 'Export JSON'}</span>
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 transition-colors"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-4xl transition-all duration-300 ease-out ${
          isCollapsed ? 'translate-y-[calc(100%-42px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse / Expand Tab Bar */}
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 border-t border-x border-zinc-700/80 rounded-t-xl backdrop-blur-md transition-colors shadow-lg"
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5 text-red-500" /> : <ChevronDown className="w-3.5 h-3.5 text-red-500" />}
            <span>{isCollapsed ? 'Open Lighting Controls' : 'Zen View (Hide HUD)'}</span>
          </button>
        </div>

        {/* Main Dock Container */}
        <div className="bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl p-3.5 text-zinc-200">
          {/* Dock Header: Scene Selector & Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
            {/* Scene Selector */}
            <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setSelectedScene('cyberpunk')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedScene === 'cyberpunk'
                    ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Cyberpunk Alley
              </button>
              <button
                onClick={() => setSelectedScene('crypt')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedScene === 'crypt'
                    ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Gothic Crypt
              </button>
              <button
                onClick={() => setSelectedScene('turret')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedScene === 'turret'
                    ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Mech Turret
              </button>
            </div>

            {/* Control Tabs */}
            <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveTab('presets')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'presets' ? 'bg-zinc-800 text-white shadow-sm border border-red-500/40' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
                <span>Presets</span>
              </button>
              <button
                onClick={() => setActiveTab('key')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'key' ? 'bg-zinc-800 text-white shadow-sm border border-red-500/40' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-zinc-300" />
                <span>Key Light</span>
              </button>
              <button
                onClick={() => setActiveTab('fill')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'fill' ? 'bg-zinc-800 text-white shadow-sm border border-red-500/40' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-zinc-300" />
                <span>Fill & Rim</span>
              </button>
              <button
                onClick={() => setActiveTab('fog')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'fog' ? 'bg-zinc-800 text-white shadow-sm border border-red-500/40' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-zinc-300" />
                <span>Atmosphere</span>
              </button>
              <button
                onClick={() => setActiveTab('passes')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'passes' ? 'bg-zinc-800 text-white shadow-sm border border-red-500/40' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-zinc-300" />
                <span>Passes</span>
              </button>
              <button
                onClick={() => setActiveTab('camera')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'camera' ? 'bg-zinc-800 text-white shadow-sm border border-red-500/40' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-zinc-300" />
                <span>Camera</span>
              </button>
            </div>
          </div>

          {/* Dock Content Body */}
          <div className="pt-3 min-h-[90px] flex items-center">
            {/* TAB: Presets */}
            {activeTab === 'presets' && (
              <div className="w-full flex flex-wrap items-center gap-2">
                {Object.entries(LIGHTING_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setLighting(preset);
                      if (key === 'cyberpunk') setSelectedScene('cyberpunk');
                      if (key === 'crypt') setSelectedScene('crypt');
                      if (key === 'studio') setSelectedScene('turret');
                    }}
                    className={`flex-1 min-w-[140px] px-3 py-2 rounded-xl border text-left transition-all ${
                      lighting.name === preset.name
                        ? 'bg-zinc-800/90 border-red-500/80 shadow-lg shadow-red-500/10'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-zinc-100 flex items-center justify-between">
                      <span>{preset.name}</span>
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: preset.keyLight.color }}
                      />
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Key: {preset.keyLight.intensity}x · Exp {preset.toneMapping.exposure}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* TAB: Key Light Controls */}
            {activeTab === 'key' && (
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Color picker */}
                <div className="space-y-1">
                  <span className="text-zinc-400 font-mono">Key Color</span>
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
                      className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-zinc-300">{lighting.keyLight.color.toUpperCase()}</span>
                  </div>
                </div>

                {/* Intensity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 font-mono">
                    <span>Intensity</span>
                    <span className="text-zinc-200">{lighting.keyLight.intensity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="6.0"
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

                {/* Elevation (Zenith angle) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 font-mono">
                    <span>Elevation</span>
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

                {/* Azimuth angle */}
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 font-mono">
                    <span>Azimuth</span>
                    <span className="text-zinc-200">{lighting.keyLight.azimuth}°</span>
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
              </div>
            )}

            {/* TAB: Fill & Rim Light */}
            {activeTab === 'fill' && (
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Fill Sky Color */}
                <div className="space-y-1">
                  <span className="text-zinc-400 font-mono">Sky Fill Tint</span>
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
                    <span className="font-mono text-zinc-300">{lighting.fillLight.skyColor.toUpperCase()}</span>
                  </div>
                </div>

                {/* Fill Intensity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 font-mono">
                    <span>Fill Bounce</span>
                    <span className="text-zinc-200">{lighting.fillLight.intensity.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
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

                {/* Rim Color */}
                <div className="space-y-1">
                  <span className="text-zinc-400 font-mono">Rim Color</span>
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
                    <span className="font-mono text-zinc-300">{lighting.rimLight.color.toUpperCase()}</span>
                  </div>
                </div>

                {/* Rim Intensity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 font-mono">
                    <span>Rim Kick</span>
                    <span className="text-zinc-200">{lighting.rimLight.intensity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6.0"
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
              </div>
            )}

            {/* TAB: Atmosphere & Tone Mapping */}
            {activeTab === 'fog' && (
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Fog Color */}
                <div className="space-y-1">
                  <span className="text-zinc-400 font-mono">Atmosphere Fog</span>
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
                    <span className="font-mono text-zinc-300">{lighting.fog.color.toUpperCase()}</span>
                  </div>
                </div>

                {/* Fog Density (Far distance) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 font-mono">
                    <span>Distance Falloff</span>
                    <span className="text-zinc-200">{lighting.fog.far}m</span>
                  </div>
                  <input
                    type="range"
                    min="15"
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

                {/* ACES Filmic Exposure */}
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 font-mono">
                    <span>ACES Exposure</span>
                    <span className="text-zinc-200">{lighting.toneMapping.exposure.toFixed(2)} EV</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="2.5"
                    step="0.05"
                    value={lighting.toneMapping.exposure}
                    onChange={(e) =>
                      setLighting((prev) => ({
                        ...prev,
                        toneMapping: { exposure: parseFloat(e.target.value) },
                      }))
                    }
                    className="w-full accent-red-500 bg-zinc-800"
                  />
                </div>

                {/* Local Light Accent */}
                <div className="space-y-1">
                  <div className="flex justify-between text-zinc-400 font-mono">
                    <span>Local Accent</span>
                    <span className="text-zinc-200">{lighting.localLight.intensity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8.0"
                    step="0.5"
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
              </div>
            )}

            {/* TAB: Render Passes (Clay, Normals, Lit, Wireframe) */}
            {activeTab === 'passes' && (
              <div className="w-full flex flex-wrap items-center gap-2">
                {[
                  { id: 'final', label: 'Final Lit (PBR)', desc: 'Full materials, roughness & environment' },
                  { id: 'clay', label: 'Lighting Only (Clay)', desc: 'Isolate pure light & shadow falloff' },
                  { id: 'normals', label: 'World Normals', desc: 'Surface orientation buffer inspection' },
                  { id: 'wireframe', label: 'Wireframe Topology', desc: 'Polygon flow & structural density' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setRenderPass(mode.id as any)}
                    className={`flex-1 min-w-[150px] px-3 py-2 rounded-xl border text-left transition-all ${
                      renderPass === mode.id
                        ? 'bg-zinc-800 border-red-500/80 text-white shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="text-xs font-semibold">{mode.label}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {/* TAB: Camera Presets & Turntable */}
            {activeTab === 'camera' && (
              <div className="w-full flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* View presets */}
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-mono">Viewpoints:</span>
                  <button
                    onClick={() => setCameraPreset('cinematic')}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 transition-colors"
                  >
                    Cinematic 35mm
                  </button>
                  <button
                    onClick={() => setCameraPreset('hero')}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 transition-colors"
                  >
                    Hero Low-Angle
                  </button>
                  <button
                    onClick={() => setCameraPreset('top')}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 transition-colors"
                  >
                    Top-Down Plan
                  </button>
                  <button
                    onClick={() => setCameraPreset('macro')}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-800 transition-colors"
                  >
                    Macro Detail
                  </button>
                </div>

                {/* Turntable Auto-rotate */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      autoRotate
                        ? 'bg-red-950/40 text-red-400 border-red-500/50'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
                    <span>{autoRotate ? 'Turntable Active' : 'Turntable Off'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
