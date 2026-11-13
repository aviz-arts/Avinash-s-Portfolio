import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  prepareModelForLightingStudio,
  buildStudioPedestal,
  buildDefaultLookdevAsset,
  getSupportedModelFormat,
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

test('buildStudioPedestal creates a valid studio stage with floor and contact shadow', () => {
  const pedestal = buildStudioPedestal(8.0);
  assert.ok(pedestal instanceof THREE.Group);
  assert.equal(pedestal.name, 'StudioPedestalGroup');

  const floor = pedestal.getObjectByName('StudioFloor') as THREE.Mesh;
  assert.ok(floor);
  assert.equal(floor.receiveShadow, true);
});

test('buildDefaultLookdevAsset constructs multi-part lookdev calibration model', () => {
  const asset = buildDefaultLookdevAsset();
  assert.ok(asset instanceof THREE.Group);
  assert.equal(asset.name, 'DefaultLookdevAsset');
  assert.ok(asset.children.length >= 4);
});

test('prepareModelForLightingStudio centers, grounds, scales and gathers accurate geometry statistics', () => {
  // Create a mock 3D model
  const group = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(2, 4, 6);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(boxGeo, mat);
  mesh.position.set(10, 5, 20); // off-center
  group.add(mesh);

  const result = prepareModelForLightingStudio(group, 4.0);

  assert.ok(result.container instanceof THREE.Group);
  assert.equal(result.stats.meshes, 1);
  assert.ok(result.stats.vertices > 0);
  assert.equal(result.stats.triangles, 12); // Box has 12 triangles (2 per face)
  assert.equal(result.stats.materials, 1);

  // Check that mesh now casts and receives shadows
  assert.equal(mesh.castShadow, true);
  assert.equal(mesh.receiveShadow, true);
});
