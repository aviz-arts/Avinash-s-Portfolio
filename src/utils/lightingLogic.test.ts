import test from 'node:test';
import assert from 'node:assert/strict';
import { polarToCartesian, LIGHTING_PRESETS, filterProjects, FilterableProject } from './lightingLogic';

test('polarToCartesian converts angles to proper 3D coordinates', () => {
  // Test zenith elevation (90 deg) -> straight up along Y axis
  const [x1, y1, z1] = polarToCartesian(0, 90, 10);
  assert.ok(Math.abs(x1) < 0.0001);
  assert.ok(Math.abs(y1 - 10) < 0.0001);
  assert.ok(Math.abs(z1) < 0.0001);

  // Test horizon azimuth 0 deg (elevation 0) -> along +Z axis
  const [x2, y2, z2] = polarToCartesian(0, 0, 10);
  assert.ok(Math.abs(x2) < 0.0001);
  assert.ok(Math.abs(y2) < 0.0001);
  assert.ok(Math.abs(z2 - 10) < 0.0001);

  // Test azimuth 90 deg -> along +X axis
  const [x3, y3, z3] = polarToCartesian(90, 0, 10);
  assert.ok(Math.abs(x3 - 10) < 0.0001);
  assert.ok(Math.abs(y3) < 0.0001);
  assert.ok(Math.abs(z3) < 0.0001);
});

test('lighting presets contain all required fields, valid ranges, and no duplicates', () => {
  const presets = Object.values(LIGHTING_PRESETS);
  assert.equal(presets.length, 4);

  const names = new Set<string>();
  for (const preset of presets) {
    assert.ok(preset.name.length > 0);
    assert.ok(!names.has(preset.name), `Duplicate preset name: ${preset.name}`);
    names.add(preset.name);
    assert.ok(preset.keyLight.intensity > 0);
    assert.ok(preset.keyLight.elevation >= 0 && preset.keyLight.elevation <= 90);
    assert.ok(preset.fillLight.intensity >= 0);
    assert.ok(preset.rimLight.intensity >= 0);
    assert.ok(preset.toneMapping.exposure > 0.5 && preset.toneMapping.exposure < 3.0);
  }
});

test('filterProjects handles category and search queries accurately', () => {
  const mockProjects: FilterableProject[] = [
    {
      id: 'p1',
      title: 'Neon District Subterranean',
      category: 'lighting',
      engine: 'Unreal Engine 5',
      tags: ['Lumen', 'Cyberpunk', 'Volumetrics'],
    },
    {
      id: 'p2',
      title: 'Tactical Arena Blockout',
      category: 'game-design',
      engine: 'Marmoset Toolbag 4',
      tags: ['Level Geometry', 'Choke Points'],
    },
    {
      id: 'p3',
      title: 'Ancient Crypt Sanctum',
      category: 'both',
      engine: 'Unreal Engine 5',
      tags: ['Lighting', 'Environmental Storytelling'],
    },
  ];

  // Category filters
  assert.equal(filterProjects(mockProjects, 'all', '').length, 3);
  assert.equal(filterProjects(mockProjects, 'lighting', '').length, 2); // p1 and p3 (both)
  assert.equal(filterProjects(mockProjects, 'game-design', '').length, 2); // p2 and p3 (both)
  assert.equal(filterProjects(mockProjects, 'unreal', '').length, 2);

  // Search filter
  assert.equal(filterProjects(mockProjects, 'all', 'cyberpunk').length, 1);
  assert.equal(filterProjects(mockProjects, 'all', 'blockout').length, 1);
  assert.equal(filterProjects(mockProjects, 'all', 'nonexistent').length, 0);
});
