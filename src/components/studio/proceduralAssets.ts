import * as THREE from 'three';

/**
 * Procedural texture helpers (zero external file dependencies)
 */
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base asphalt
  ctx.fillStyle = '#14171f';
  ctx.fillRect(0, 0, 512, 512);

  // Micro gravel noise
  for (let i = 0; i < 15000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const s = Math.random() * 2 + 1;
    const v = Math.floor(Math.random() * 50 + 20);
    ctx.fillStyle = `rgb(${v}, ${v + 4}, ${v + 8})`;
    ctx.fillRect(x, y, s, s);
  }

  // Asphalt road markings (yellow line)
  ctx.fillStyle = 'rgba(234, 179, 8, 0.45)';
  ctx.fillRect(246, 0, 20, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createStoneBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  // Brick seams
  ctx.strokeStyle = '#404040';
  ctx.lineWidth = 4;
  for (let y = 0; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();

    const xOffset = (y / 32) % 2 === 0 ? 0 : 32;
    for (let x = xOffset; x < 256; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 32);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

export function createContactShadowDisc(radius = 2.5): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0.7,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.015;
  mesh.renderOrder = 1;
  return mesh;
}

/**
 * Scene 1: Cyberpunk Subterranean Alleyway
 */
export function buildCyberpunkAlley(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'CyberpunkAlley';

  const asphaltTex = createAsphaltTexture();

  // 1. Wet asphalt floor
  const floorGeo = new THREE.PlaneGeometry(30, 30);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x141822,
    roughness: 0.18, // slick wet reflections
    metalness: 0.35,
    map: asphaltTex,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // 2. Left Building Facade (multi-part composite with ledges, panels)
  const leftBldg = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x181b26,
    roughness: 0.75,
    metalness: 0.2,
  });
  const mainWallL = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 24), wallMat);
  mainWallL.position.set(-6, 7, 0);
  mainWallL.castShadow = true;
  mainWallL.receiveShadow = true;
  leftBldg.add(mainWallL);

  // Architectural trim ledges
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x282e3f, roughness: 0.4, metalness: 0.6 });
  for (let h = 3; h <= 12; h += 4) {
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 24), trimMat);
    ledge.position.set(-4.8, h, 0);
    ledge.castShadow = true;
    leftBldg.add(ledge);
  }

  // Industrial ventilation pipes & conduits
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x3a4254, roughness: 0.3, metalness: 0.85 });
  const conduit1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 24, 16), pipeMat);
  conduit1.rotation.x = Math.PI / 2;
  conduit1.position.set(-4.8, 5.5, 0);
  conduit1.castShadow = true;
  leftBldg.add(conduit1);

  const conduit2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 24, 16), pipeMat);
  conduit2.rotation.x = Math.PI / 2;
  conduit2.position.set(-4.8, 5.1, 0);
  conduit2.castShadow = true;
  leftBldg.add(conduit2);

  group.add(leftBldg);

  // 3. Right Building Facade
  const rightBldg = new THREE.Group();
  const mainWallR = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 24), wallMat);
  mainWallR.position.set(6, 7, 0);
  mainWallR.castShadow = true;
  mainWallR.receiveShadow = true;
  rightBldg.add(mainWallR);

  // Right balconies
  for (let z = -6; z <= 6; z += 6) {
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 3), trimMat);
    balcony.position.set(4.6, 4.2, z);
    balcony.castShadow = true;
    rightBldg.add(balcony);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 3), pipeMat);
    rail.position.set(4.0, 4.7, z);
    rail.castShadow = true;
    rightBldg.add(rail);
  }

  group.add(rightBldg);

  // 4. Glowing Neon Signs (Cyan & Pink)
  const neonCyanMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 3.5,
    roughness: 0.2,
  });
  const signBack1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 1.2), new THREE.MeshStandardMaterial({ color: 0x0a0c12, roughness: 0.9 }));
  signBack1.position.set(-4.85, 4.5, 1.5);
  const signNeon1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.9), neonCyanMat);
  signNeon1.position.set(-4.8, 4.5, 1.5);
  group.add(signBack1, signNeon1);

  const neonPinkMat = new THREE.MeshStandardMaterial({
    color: 0xff0077,
    emissive: 0xff0077,
    emissiveIntensity: 3.2,
    roughness: 0.2,
  });
  const signBack2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 2.8), new THREE.MeshStandardMaterial({ color: 0x0a0c12, roughness: 0.9 }));
  signBack2.position.set(4.85, 5.2, -2.5);
  const signNeon2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 2.5), neonPinkMat);
  signNeon2.position.set(4.8, 5.2, -2.5);
  group.add(signBack2, signNeon2);

  // 5. Overhead Skywalk bridge connecting rooftops
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x222836, roughness: 0.5, metalness: 0.7 });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.6, 2.5), bridgeMat);
  bridge.position.set(0, 9.5, -4);
  bridge.castShadow = true;
  group.add(bridge);

  // 6. Street props: dumpsters, crates, barriers
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x3d475a, roughness: 0.65, metalness: 0.4 });
  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), crateMat);
  crate1.position.set(-3.5, 0.6, 2);
  crate1.rotation.y = 0.2;
  crate1.castShadow = true;
  group.add(crate1);

  const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), crateMat);
  crate2.position.set(-3.3, 1.65, 2.1);
  crate2.rotation.y = -0.3;
  crate2.castShadow = true;
  group.add(crate2);

  // Contact shadow
  group.add(createContactShadowDisc(4.0));

  return group;
}

/**
 * Scene 2: Gothic Underground Crypt & Moonlit Altar
 */
export function buildGothicCrypt(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'GothicCrypt';

  const stoneBump = createStoneBumpTexture();

  // Flagstone floor
  const floorGeo = new THREE.PlaneGeometry(28, 28);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1b1f2b,
    roughness: 0.85,
    metalness: 0.1,
    bumpMap: stoneBump,
    bumpScale: 0.05,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Carved masonry columns (4 columns with plinth, shaft, and capital)
  const colMat = new THREE.MeshStandardMaterial({
    color: 0x252a38,
    roughness: 0.75,
    metalness: 0.15,
    bumpMap: stoneBump,
    bumpScale: 0.04,
  });

  const columnPositions = [
    [-3.5, -3.5],
    [3.5, -3.5],
    [-3.5, 3.5],
    [3.5, 3.5],
  ];

  for (const [cx, cz] of columnPositions) {
    const colGroup = new THREE.Group();
    colGroup.position.set(cx, 0, cz);

    // Plinth (Base)
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), colMat);
    plinth.position.y = 0.25;
    plinth.castShadow = true;
    colGroup.add(plinth);

    // Shaft (Fluted Cylinder)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 7.5, 20), colMat);
    shaft.position.y = 4.25;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    colGroup.add(shaft);

    // Capital (Top)
    const capital = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1.5), colMat);
    capital.position.y = 8.3;
    capital.castShadow = true;
    colGroup.add(capital);

    group.add(colGroup);
  }

  // Vaulted ribs overhead
  const ribMat = new THREE.MeshStandardMaterial({ color: 0x202430, roughness: 0.8 });
  const rib1 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 0.8), ribMat);
  rib1.position.set(0, 8.4, -3.5);
  const rib2 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 0.8), ribMat);
  rib2.position.set(0, 8.4, 3.5);
  const rib3 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 8), ribMat);
  rib3.position.set(-3.5, 8.4, 0);
  const rib4 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 8), ribMat);
  rib4.position.set(3.5, 8.4, 0);
  group.add(rib1, rib2, rib3, rib4);

  // Central Altar Pedestal with Sacrificial Mystic Crystal
  const altarGroup = new THREE.Group();
  altarGroup.position.set(0, 0, 0);

  const altarBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 1.6), colMat);
  altarBase.position.y = 0.15;
  altarBase.castShadow = true;
  altarBase.receiveShadow = true;
  altarGroup.add(altarBase);

  const altarPillar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 1.2), colMat);
  altarPillar.position.y = 0.7;
  altarPillar.castShadow = true;
  altarGroup.add(altarPillar);

  const altarTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 1.8), colMat);
  altarTop.position.y = 1.22;
  altarTop.castShadow = true;
  altarGroup.add(altarTop);

  // Floating Mystic Crystal
  const crystalGeo = new THREE.OctahedronGeometry(0.45, 0);
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0x60a5fa,
    emissive: 0x2563eb,
    emissiveIntensity: 1.5,
    roughness: 0.1,
    metalness: 0.2,
    transmission: 0.6,
    ior: 1.5,
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 2.0;
  crystal.name = 'MysticCrystal';
  altarGroup.add(crystal);

  group.add(altarGroup);

  // Two Bronze Standing Fire Braziers
  const brazierMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 0.45, metalness: 0.85 });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xff7700,
    emissive: 0xff5500,
    emissiveIntensity: 3.5,
    roughness: 0.3,
  });

  for (const bz of [-2.5, 2.5]) {
    const brazier = new THREE.Group();
    brazier.position.set(-2.0, 0, bz);

    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.25, 1.3, 12), brazierMat);
    stand.position.y = 0.65;
    stand.castShadow = true;
    brazier.add(stand);

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.15, 0.3, 16), brazierMat);
    bowl.position.y = 1.45;
    bowl.castShadow = true;
    brazier.add(bowl);

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 8), flameMat);
    flame.position.y = 1.75;
    brazier.add(flame);

    group.add(brazier);
  }

  // Soft contact shadow
  group.add(createContactShadowDisc(3.2));

  return group;
}

/**
 * Scene 3: Titan Heavy Orbital Rail Turret (Hero Hard Surface Asset)
 */
export function buildMechTurret(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MechTurret';

  // High-end PBR materials
  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x222838,
    roughness: 0.35,
    metalness: 0.85,
  });
  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x181c24,
    roughness: 0.2,
    metalness: 0.95,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Crimson red trim
    roughness: 0.4,
    metalness: 0.6,
  });
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x0f1218,
    roughness: 0.6,
    metalness: 0.3,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 2.8,
    roughness: 0.1,
  });

  // Circular Turntable Studio Floor
  const studioFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(6, 6, 0.15, 48),
    new THREE.MeshStandardMaterial({ color: 0x11141c, roughness: 0.25, metalness: 0.5 })
  );
  studioFloor.position.y = -0.075;
  studioFloor.receiveShadow = true;
  group.add(studioFloor);

  // Turntable glowing rim ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(5.4, 5.5, 64),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.002;
  group.add(ring);

  // 1. Octagonal Armored Pedestal Base
  const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 0.6, 8), armorMat);
  baseMesh.position.y = 0.3;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Swivel Yaw Ring
  const yawRing = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.3, 24), gunMetalMat);
  yawRing.position.y = 0.75;
  yawRing.castShadow = true;
  group.add(yawRing);

  // Main Turret Housing (rotatable head)
  const turretHead = new THREE.Group();
  turretHead.position.y = 0.9;
  turretHead.name = 'TurretHead';

  // 3. Chassis Core
  const coreMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 2.0), armorMat);
  coreMesh.position.y = 0.6;
  coreMesh.castShadow = true;
  turretHead.add(coreMesh);

  // 4. Sloped armor side skirts
  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 2.2), accentMat);
  skirtL.position.set(-1.0, 0.55, 0);
  skirtL.rotation.z = -0.15;
  skirtL.castShadow = true;
  const skirtR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 2.2), accentMat);
  skirtR.position.set(1.0, 0.55, 0);
  skirtR.rotation.z = 0.15;
  skirtR.castShadow = true;
  turretHead.add(skirtL, skirtR);

  // 5. Twin Heavy Rail Barrels
  const barrelGroup = new THREE.Group();
  barrelGroup.position.set(0, 0.7, 0.9);
  barrelGroup.name = 'BarrelGroup';

  for (const bx of [-0.38, 0.38]) {
    // Barrel shroud
    const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 2.4), carbonMat);
    shroud.position.set(bx, 0, 1.2);
    shroud.castShadow = true;
    barrelGroup.add(shroud);

    // Muzzle brake
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.4, 16), gunMetalMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(bx, 0, 2.5);
    muzzle.castShadow = true;
    barrelGroup.add(muzzle);

    // Recoil damper cylinder
    const damper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 12), gunMetalMat);
    damper.rotation.x = Math.PI / 2;
    damper.position.set(bx, -0.15, 0.5);
    barrelGroup.add(damper);
  }
  turretHead.add(barrelGroup);

  // 6. Sensor Mast & Targeting Visor
  const sensorMast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 12), gunMetalMat);
  sensorMast.position.set(0.6, 1.4, -0.3);
  sensorMast.castShadow = true;
  turretHead.add(sensorMast);

  const visorBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.45), carbonMat);
  visorBox.position.set(0.6, 1.7, -0.3);
  visorBox.castShadow = true;
  turretHead.add(visorBox);

  const visorLens = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.18), visorMat);
  visorLens.position.set(0.6, 1.7, -0.07);
  turretHead.add(visorLens);

  // 7. Rear Heat Radiator Fins
  for (let z = -0.5; z >= -0.9; z -= 0.12) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.04), gunMetalMat);
    fin.position.set(0, 1.0, z);
    fin.castShadow = true;
    turretHead.add(fin);
  }

  group.add(turretHead);

  // Contact shadow
  group.add(createContactShadowDisc(2.8));

  return group;
}

/**
 * Switch all scene materials to Clay (monochrome diffuse) or restore
 */
export function applyRenderPassMode(
  root: THREE.Object3D,
  pass: 'final' | 'clay' | 'normals' | 'wireframe',
  clayMaterial: THREE.MeshStandardMaterial,
  normalMaterial: THREE.MeshNormalMaterial
) {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Don't modify contact shadows
      if (child.renderOrder === 1 && child.material.transparent) return;

      if (!child.userData.originalMaterial) {
        child.userData.originalMaterial = child.material;
      }

      if (pass === 'clay') {
        child.material = clayMaterial;
      } else if (pass === 'normals') {
        child.material = normalMaterial;
      } else if (pass === 'wireframe') {
        if (!child.userData.wireframeMaterial) {
          child.userData.wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            wireframe: true,
          });
        }
        child.material = child.userData.wireframeMaterial;
      } else {
        // Restore final lit material
        child.material = child.userData.originalMaterial;
      }
    }
  });
}
