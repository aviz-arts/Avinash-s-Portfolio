import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  prepareModelForLightingStudio,
  buildStudioPedestal,
  buildDefaultLookdevAsset,
  getSupportedModelFormat,
  getSupportedEnvFormat,
  detectAssetStageMode,
} from '../components/studio/modelLoaders';

test('getSupportedModelFormat accepts .fbx and .glb only', () => {
  assert.equal(getSupportedModelFormat('character.fbx'), 'fbx');
  assert.equal(getSupportedModelFormat('PROP_HERO.FBX'), 'fbx');
  assert.equal(getSupportedModelFormat('weapon.glb'), 'glb');
  assert.equal(getSupportedModelFormat('https://cdn.example.com/assets/mech.glb?v=2'), 'glb');
  assert.equal(getSupportedModelFormat('https://cdn.example.com/assets/rig.fbx#mesh'), 'fbx');

  // Rejected formats
  assert.equal(getSupportedModelFormat('scene.obj'), null);
  assert.equal(getSupportedModelFormat('scene.gltf'), null);
  assert.equal(getSupportedModelFormat('model.stl'), null);
  assert.equal(getSupportedModelFormat('texture.png'), null);
});

test('getSupportedEnvFormat accepts .hdr and .exr skyboxes only', () => {
  assert.equal(getSupportedEnvFormat('studio_4k.hdr'), 'hdr');
  assert.equal(getSupportedEnvFormat('SUNSET_DOME.EXR'), 'exr');
  assert.equal(getSupportedEnvFormat('https://cdn.example.com/hdri/sky.hdr?token=abc'), 'hdr');

  // Rejected formats
  assert.equal(getSupportedEnvFormat('sky.png'), null);
  assert.equal(getSupportedEnvFormat('env.glb'), null);
  assert.equal(getSupportedEnvFormat('env.fbx'), null);
});

test('detectAssetStageMode distinguishes compact objects & detailed vehicles from 3D environments', () => {
  // Single prop or tall character
  assert.equal(detectAssetStageMode(1, new THREE.Vector3(2, 4, 2)), 'object');
  assert.equal(detectAssetStageMode(2, new THREE.Vector3(80, 175, 45)), 'object');
  // Detailed multi-mesh car/vehicle (e.g. Porsche with 28 sub-meshes) stays in Object Stage
  assert.equal(detectAssetStageMode(28, new THREE.Vector3(2.0, 1.3, 4.5)), 'object');
  assert.equal(detectAssetStageMode(28, new THREE.Vector3(200, 130, 450)), 'object');

  // Large multi-mesh architectural/level environment
  assert.equal(detectAssetStageMode(50, new THREE.Vector3(12, 4, 12)), 'environment');
  assert.equal(detectAssetStageMode(14, new THREE.Vector3(22, 5, 18)), 'environment');

  // Wide single-mesh terrain/floorplan
  assert.equal(detectAssetStageMode(1, new THREE.Vector3(40, 4, 40)), 'environment');
});

test('buildStudioPedestal creates a grounded 2-tier studio stage with floor, skirt, and contact shadow', () => {
  const pedestal = buildStudioPedestal(8.0);
  assert.ok(pedestal instanceof THREE.Group);
  assert.equal(pedestal.name, 'StudioPedestalGroup');

  const floor = pedestal.getObjectByName('StudioFloor') as THREE.Mesh;
  const skirt = pedestal.getObjectByName('StudioPedestalSkirt') as THREE.Mesh;
  assert.ok(floor);
  assert.ok(skirt);
  assert.equal(floor.receiveShadow, true);
  assert.equal(skirt.receiveShadow, true);
});

test('buildDefaultLookdevAsset constructs multi-part lookdev calibration model', () => {
  const asset = buildDefaultLookdevAsset();
  assert.ok(asset instanceof THREE.Group);
  assert.equal(asset.name, 'DefaultLookdevAsset');
  assert.ok(asset.children.length >= 4);
});

test('prepareModelForLightingStudio centers, grounds, scales and gathers accurate geometry statistics', () => {
  const group = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(2, 4, 6);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(boxGeo, mat);
  mesh.position.set(10, 5, 20); // off-center
  group.add(mesh);

  const result = prepareModelForLightingStudio(group, 4.0);

  assert.ok(result.container instanceof THREE.Group);
  assert.equal(result.stageMode, 'object');
  assert.equal(result.stats.meshes, 1);
  assert.ok(result.stats.vertices > 0);
  assert.equal(result.stats.triangles, 12);
  assert.equal(result.stats.materials, 1);

  assert.equal(mesh.castShadow, true);
  assert.equal(mesh.receiveShadow, true);
});

test('prepareModelForLightingStudio auto-detects and normalizes multi-mesh 3D environments', () => {
  const envGroup = new THREE.Group();

  // Floor plane + 13 buildings/pillars (14 meshes total) in meter scale (24m wide)
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(24, 0.2, 24),
    new THREE.MeshStandardMaterial({ color: 0x333333, opacity: 0, transparent: false })
  );
  envGroup.add(floor);

  for (let i = 0; i < 13; i++) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1));
    if (i === 0) {
      pillar.material = undefined as unknown as THREE.Material;
    }
    pillar.position.set((i - 6) * 1.8, 2, (i % 3) * 4);
    envGroup.add(pillar);
  }

  // Oversized imported Blender/UE5 light should be clamped & shadows disabled
  const importedLight = new THREE.PointLight(0xffffff, 2000);
  importedLight.castShadow = true;
  envGroup.add(importedLight);

  const result = prepareModelForLightingStudio(envGroup, { stageMode: 'auto' }, 2);

  assert.equal(result.stageMode, 'environment');
  assert.equal(result.stats.stageMode, 'environment');
  assert.equal(result.stats.meshes, 14);
  assert.equal(result.stats.embeddedLights, 1);
  assert.equal(result.stats.animationsCount, 2);

  // Scaled to ~24 units horizontally rather than squished to object pedestal size
  assert.ok(result.scaledBounds.width >= 20 && result.scaledBounds.width <= 24.5);

  // FBX opacity=0 non-transparent bug fixed
  assert.equal((floor.material as THREE.MeshStandardMaterial).opacity, 1.0);
  // Missing material fallback assigned to pillar with undefined material
  assert.ok((envGroup.children[1] as THREE.Mesh).material instanceof THREE.MeshStandardMaterial);
  // Imported light clamped & shadow disabled
  assert.equal(importedLight.castShadow, false);
  assert.ok(importedLight.intensity <= 25);

  // Idempotent re-preparation when switching manually to object stage
  const objectOverride = prepareModelForLightingStudio(envGroup, { stageMode: 'object' }, 2);
  assert.equal(objectOverride.stageMode, 'object');
  assert.ok(objectOverride.scaledBounds.width <= 4.9);
});
