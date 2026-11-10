/**
 * High-fidelity procedural rendering engine for game art, lighting passes,
 * and animated cinematic video reels without external file dependencies.
 */

export type SceneStyle = 'cyberpunk' | 'crypt' | 'scifi' | 'derelict' | 'ruins' | 'turret';
export type PassType = 'final' | 'clay' | 'unlit' | 'normals' | 'roughness';

export function drawProceduralScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: SceneStyle,
  pass: PassType = 'final',
  time = 0
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  if (pass === 'clay') {
    drawClayPass(ctx, width, height, style, time);
  } else if (pass === 'normals') {
    drawNormalsPass(ctx, width, height, style, time);
  } else if (pass === 'roughness') {
    drawRoughnessPass(ctx, width, height, style, time);
  } else if (pass === 'unlit') {
    drawUnlitPass(ctx, width, height, style, time);
  } else {
    drawFinalLitPass(ctx, width, height, style, time);
  }

  // Cinematic letterbox & technical HUD overlay
  drawCinematicOverlay(ctx, width, height, pass, style);

  ctx.restore();
}

function drawFinalLitPass(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: SceneStyle,
  t: number
) {
  // Base atmosphere gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);

  if (style === 'cyberpunk') {
    bgGrad.addColorStop(0, '#06070d');
    bgGrad.addColorStop(0.6, '#0f0c1b');
    bgGrad.addColorStop(1, '#1b1328');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Distant skyscraper silhouettes
    ctx.fillStyle = '#0a0d18';
    for (let i = 0; i < 9; i++) {
      const bw = w * 0.14;
      const bx = i * (w * 0.12) - w * 0.05;
      const bh = h * (0.4 + (i % 4) * 0.12);
      ctx.fillRect(bx, h - bh - h * 0.25, bw, bh);

      // Building window lights
      ctx.fillStyle = (i % 2 === 0) ? '#00f0ff22' : '#ff005522';
      for (let wy = h - bh - h * 0.2; wy < h - h * 0.28; wy += 14) {
        if ((wy + i * 7) % 28 === 0) {
          ctx.fillRect(bx + bw * 0.2, wy, bw * 0.6, 2);
        }
      }
      ctx.fillStyle = '#0a0d18';
    }

    // Volumetric Neon Light Cones
    const pulse1 = Math.sin(t * 2.5) * 0.15 + 0.85;
    const pulse2 = Math.cos(t * 1.8) * 0.2 + 0.8;

    // Cyan Key Spot
    const coneGrad1 = ctx.createRadialGradient(w * 0.25, h * 0.35, 10, w * 0.25, h * 0.35, w * 0.6);
    coneGrad1.addColorStop(0, `rgba(0, 240, 255, ${0.45 * pulse1})`);
    coneGrad1.addColorStop(0.5, `rgba(0, 240, 255, ${0.12 * pulse1})`);
    coneGrad1.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = coneGrad1;
    ctx.fillRect(0, 0, w, h);

    // Magenta Rim Spot
    const coneGrad2 = ctx.createRadialGradient(w * 0.8, h * 0.4, 10, w * 0.8, h * 0.4, w * 0.55);
    coneGrad2.addColorStop(0, `rgba(255, 0, 110, ${0.5 * pulse2})`);
    coneGrad2.addColorStop(0.6, `rgba(255, 0, 110, ${0.1 * pulse2})`);
    coneGrad2.addColorStop(1, 'rgba(255, 0, 110, 0)');
    ctx.fillStyle = coneGrad2;
    ctx.fillRect(0, 0, w, h);

    // Foreground wet asphalt road
    const roadY = h * 0.65;
    const roadGrad = ctx.createLinearGradient(0, roadY, 0, h);
    roadGrad.addColorStop(0, '#090a12');
    roadGrad.addColorStop(1, '#05060a');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, roadY, w, h - roadY);

    // Wet puddles with specular reflections
    const puddleGrad1 = ctx.createRadialGradient(w * 0.35, h * 0.82, 5, w * 0.35, h * 0.82, 120);
    puddleGrad1.addColorStop(0, `rgba(0, 240, 255, ${0.65 * pulse1})`);
    puddleGrad1.addColorStop(0.4, `rgba(0, 180, 240, 0.25)`);
    puddleGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = puddleGrad1;
    ctx.beginPath();
    ctx.ellipse(w * 0.35, h * 0.82, w * 0.22, h * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    const puddleGrad2 = ctx.createRadialGradient(w * 0.72, h * 0.88, 5, w * 0.72, h * 0.88, 90);
    puddleGrad2.addColorStop(0, `rgba(255, 0, 128, ${0.7 * pulse2})`);
    puddleGrad2.addColorStop(0.5, `rgba(255, 0, 128, 0.2)`);
    puddleGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = puddleGrad2;
    ctx.beginPath();
    ctx.ellipse(w * 0.72, h * 0.88, w * 0.16, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // Foreground architectural conduits and neon sign
    ctx.fillStyle = '#080910';
    ctx.fillRect(0, h * 0.2, w * 0.18, h * 0.6);
    ctx.fillRect(w * 0.84, h * 0.15, w * 0.16, h * 0.65);

    // Neon Kanji / Sci-Fi Signboard
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.04, h * 0.26, w * 0.1, h * 0.32);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(w * 0.024)}px monospace`;
    ctx.fillText('NEXUS', w * 0.05, h * 0.34);
    ctx.fillText('D-07', w * 0.055, h * 0.42);
    ctx.fillText('⚡ 60Hz', w * 0.045, h * 0.5);
    ctx.shadowBlur = 0;

  } else if (style === 'crypt') {
    // Gothic Crypt Moonlight
    bgGrad.addColorStop(0, '#04070d');
    bgGrad.addColorStop(0.5, '#08101e');
    bgGrad.addColorStop(1, '#0e0b09');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Ruined Gothic Rose Window & Moon Shaft
    const moonGrad = ctx.createRadialGradient(w * 0.5, h * 0.18, 10, w * 0.5, h * 0.18, w * 0.45);
    moonGrad.addColorStop(0, 'rgba(210, 230, 255, 0.9)');
    moonGrad.addColorStop(0.3, 'rgba(140, 180, 240, 0.4)');
    moonGrad.addColorStop(0.7, 'rgba(70, 110, 180, 0.1)');
    moonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.18, w * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Moonlight volumetric beam cone descending to floor
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.44, h * 0.18);
    ctx.lineTo(w * 0.56, h * 0.18);
    ctx.lineTo(w * 0.72, h * 0.9);
    ctx.lineTo(w * 0.28, h * 0.9);
    ctx.closePath();
    const beamGrad = ctx.createLinearGradient(0, h * 0.18, 0, h * 0.9);
    beamGrad.addColorStop(0, 'rgba(180, 215, 255, 0.45)');
    beamGrad.addColorStop(0.5, 'rgba(120, 170, 240, 0.22)');
    beamGrad.addColorStop(1, 'rgba(80, 130, 210, 0.05)');
    ctx.fillStyle = beamGrad;
    ctx.fill();
    ctx.restore();

    // Gothic Stone Pillars (Foreground & Midground)
    ctx.fillStyle = '#0a0d14';
    // Left column
    ctx.fillRect(w * 0.14, h * 0.1, w * 0.09, h * 0.8);
    // Right column
    ctx.fillRect(w * 0.77, h * 0.1, w * 0.09, h * 0.8);

    // Warm Fire Brazier on the left
    const firePulse = Math.sin(t * 5.0) * 0.12 + Math.cos(t * 8.0) * 0.08 + 0.8;
    const fireGrad = ctx.createRadialGradient(w * 0.26, h * 0.68, 5, w * 0.26, h * 0.68, w * 0.25);
    fireGrad.addColorStop(0, `rgba(255, 160, 40, ${0.85 * firePulse})`);
    fireGrad.addColorStop(0.3, `rgba(255, 90, 10, ${0.45 * firePulse})`);
    fireGrad.addColorStop(0.7, 'rgba(120, 30, 0, 0.15)');
    fireGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.arc(w * 0.26, h * 0.68, w * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Central ancient altar illuminated by moon
    ctx.fillStyle = '#161d2a';
    ctx.fillRect(w * 0.42, h * 0.72, w * 0.16, h * 0.15);
    ctx.fillStyle = '#222d40';
    ctx.fillRect(w * 0.39, h * 0.7, w * 0.22, h * 0.04);

  } else if (style === 'scifi') {
    // Tactical Greybox Arena
    bgGrad.addColorStop(0, '#0c1017');
    bgGrad.addColorStop(0.5, '#141c28');
    bgGrad.addColorStop(1, '#1b2434');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Perspective 3D Grid Floor
    ctx.strokeStyle = '#2b374c';
    ctx.lineWidth = 1;
    const vanishY = h * 0.45;
    for (let x = -w * 0.5; x <= w * 1.5; x += w * 0.1) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, vanishY);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = vanishY + 15; y < h; y += (y - vanishY) * 0.35 + 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // High Noon crisp directional shadow blocks
    ctx.fillStyle = '#334155';
    // Cover block 1
    ctx.fillRect(w * 0.22, h * 0.55, w * 0.14, h * 0.22);
    // Cover block top face
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.55);
    ctx.lineTo(w * 0.27, h * 0.5);
    ctx.lineTo(w * 0.41, h * 0.5);
    ctx.lineTo(w * 0.36, h * 0.55);
    ctx.closePath();
    ctx.fill();

    // Orange tactical zone marker
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.2, h * 0.78, w * 0.2, h * 0.1);
    ctx.fillStyle = '#f97316';
    ctx.font = `bold ${Math.floor(w * 0.02)}px monospace`;
    ctx.fillText('SITE A // CHOKEPOINT', w * 0.21, h * 0.84);

  } else if (style === 'derelict') {
    // Horror Deep Space Derelict
    bgGrad.addColorStop(0, '#020305');
    bgGrad.addColorStop(1, '#05060a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Deep space earth/nebula through canopy
    const earthGrad = ctx.createRadialGradient(w * 0.75, h * 0.35, 10, w * 0.75, h * 0.35, w * 0.25);
    earthGrad.addColorStop(0, '#0284c7');
    earthGrad.addColorStop(0.6, '#03456c');
    earthGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.35, w * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Sweeping Emergency Crimson Beacon
    const angle = (t * 2.2) % (Math.PI * 2);
    ctx.save();
    ctx.translate(w * 0.3, h * 0.4);
    ctx.rotate(angle);
    const strobeGrad = ctx.createLinearGradient(0, 0, w * 0.8, 0);
    strobeGrad.addColorStop(0, 'rgba(239, 68, 68, 0.95)');
    strobeGrad.addColorStop(0.3, 'rgba(220, 38, 38, 0.4)');
    strobeGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = strobeGrad;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(w * 0.8, -h * 0.25);
    ctx.lineTo(w * 0.8, h * 0.25);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Mechanical bulkheads and hazard stripes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
    for (let x = 0; x < w; x += 36) {
      ctx.fillStyle = (x / 36) % 2 === 0 ? '#eab308' : '#000000';
      ctx.beginPath();
      ctx.moveTo(x, h * 0.6);
      ctx.lineTo(x + 18, h * 0.6);
      ctx.lineTo(x + 28, h * 0.63);
      ctx.lineTo(x + 10, h * 0.63);
      ctx.closePath();
      ctx.fill();
    }

  } else if (style === 'ruins') {
    // Maritime Overgrown Citadel
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.4, '#1e293b');
    bgGrad.addColorStop(0.7, '#0d4a58');
    bgGrad.addColorStop(1, '#062d37');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Warm Sun breaking through
    const sunGrad = ctx.createRadialGradient(w * 0.7, h * 0.25, 5, w * 0.7, h * 0.25, w * 0.4);
    sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.85)');
    sunGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.25)');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w * 0.7, h * 0.25, w * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Ocean surface with caustics
    ctx.fillStyle = '#075985';
    ctx.fillRect(0, h * 0.68, w, h * 0.32);

    // Sunken monolith column
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(w * 0.25, h * 0.28, w * 0.12, h * 0.55);
    ctx.fillStyle = '#059669';
    // Overgrown moss
    ctx.beginPath();
    ctx.arc(w * 0.28, h * 0.35, 18, 0, Math.PI * 2);
    ctx.arc(w * 0.33, h * 0.45, 24, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // Studio Turret / Hard Surface
    bgGrad.addColorStop(0, '#0b0d13');
    bgGrad.addColorStop(0.5, '#12151f');
    bgGrad.addColorStop(1, '#181d2a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Studio turntable circular pedestal
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.8, w * 0.35, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Studio Rim Light glow from left and right
    const rim1 = ctx.createRadialGradient(w * 0.2, h * 0.45, 10, w * 0.2, h * 0.45, w * 0.35);
    rim1.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    rim1.addColorStop(1, 'transparent');
    ctx.fillStyle = rim1;
    ctx.fillRect(0, 0, w, h);

    // Mech Turret Silhouette with PBR reflections
    ctx.fillStyle = '#334155';
    // Base chassis
    ctx.fillRect(w * 0.38, h * 0.6, w * 0.24, h * 0.15);
    // Turret housing
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.52, w * 0.14, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    // Heavy dual rail barrels
    ctx.fillStyle = '#64748b';
    ctx.fillRect(w * 0.44, h * 0.3, w * 0.035, h * 0.22);
    ctx.fillRect(w * 0.525, h * 0.3, w * 0.035, h * 0.22);

    // Glowing optics visor
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.fillRect(w * 0.46, h * 0.5, w * 0.08, h * 0.02);
    ctx.shadowBlur = 0;
  }
}

function drawClayPass(ctx: CanvasRenderingContext2D, w: number, h: number, style: SceneStyle, t: number) {
  // Neutral diffuse clay sculpture with pure lighting values
  const clayGrad = ctx.createLinearGradient(0, 0, 0, h);
  clayGrad.addColorStop(0, '#383a42');
  clayGrad.addColorStop(0.5, '#4f525d');
  clayGrad.addColorStop(1, '#2c2e35');
  ctx.fillStyle = clayGrad;
  ctx.fillRect(0, 0, w, h);

  // Directional key light shadow falloff
  const shadowGrad = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, h);
  shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  shadowGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(0, 0, w, h);

  // Clay silhouettes with ambient occlusion crevices
  ctx.fillStyle = '#686b77';
  if (style === 'cyberpunk') {
    ctx.fillRect(w * 0.1, h * 0.25, w * 0.2, h * 0.55);
    ctx.fillRect(w * 0.7, h * 0.2, w * 0.2, h * 0.6);
  } else if (style === 'crypt') {
    ctx.fillRect(w * 0.15, h * 0.15, w * 0.1, h * 0.7);
    ctx.fillRect(w * 0.75, h * 0.15, w * 0.1, h * 0.7);
    ctx.fillRect(w * 0.4, h * 0.7, w * 0.2, h * 0.15);
  } else {
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNormalsPass(ctx: CanvasRenderingContext2D, w: number, h: number, style: SceneStyle, t: number) {
  // World space normal map visualization (RGB -> XYZ)
  ctx.fillStyle = '#8080ff'; // Default Z-facing forward normal
  ctx.fillRect(0, 0, w, h);

  // Up-facing floors (Green)
  ctx.fillStyle = '#80ff80';
  ctx.fillRect(0, h * 0.65, w, h * 0.35);

  // Left-facing surfaces (Red - 0)
  ctx.fillStyle = '#0080ff';
  ctx.fillRect(w * 0.1, h * 0.2, w * 0.18, h * 0.5);

  // Right-facing surfaces (Red - 255)
  ctx.fillStyle = '#ff80ff';
  ctx.fillRect(w * 0.72, h * 0.18, w * 0.18, h * 0.52);

  // Curved bevel highlight normals
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(w * 0.1, h * 0.2, w * 0.18, h * 0.5);
  ctx.strokeRect(w * 0.72, h * 0.18, w * 0.18, h * 0.52);
}

function drawRoughnessPass(ctx: CanvasRenderingContext2D, w: number, h: number, style: SceneStyle, t: number) {
  // Grayscale microfacet roughness (0.0 = mirror black, 1.0 = matte white)
  ctx.fillStyle = '#b8b8b8'; // Default matte concrete
  ctx.fillRect(0, 0, w, h);

  // Puddles / Polished metals (Roughness near 0 = dark)
  ctx.fillStyle = '#101010';
  ctx.beginPath();
  ctx.ellipse(w * 0.35, h * 0.8, w * 0.2, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.7, h * 0.85, w * 0.15, h * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // Polished glass / metallic conduits
  ctx.fillStyle = '#202020';
  ctx.fillRect(w * 0.1, h * 0.25, w * 0.08, h * 0.4);

  // Micro-scratches & noise lines
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    const rx = (i * 73) % w;
    const ry = (i * 59) % h;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 30, ry + 2);
    ctx.stroke();
  }
}

function drawUnlitPass(ctx: CanvasRenderingContext2D, w: number, h: number, style: SceneStyle, t: number) {
  // Pure flat PBR Base Color albedo textures
  ctx.fillStyle = '#222733';
  ctx.fillRect(0, 0, w, h);

  // Albedo materials
  ctx.fillStyle = '#3a3328'; // Wet asphalt albedo
  ctx.fillRect(0, h * 0.65, w, h * 0.35);

  ctx.fillStyle = '#00f0ff'; // Neon paint
  ctx.fillRect(w * 0.08, h * 0.28, w * 0.1, h * 0.04);
  ctx.fillStyle = '#ff0055';
  ctx.fillRect(w * 0.08, h * 0.34, w * 0.1, h * 0.04);

  ctx.fillStyle = '#556070'; // Painted steel
  ctx.fillRect(w * 0.72, h * 0.22, w * 0.16, h * 0.5);
}

function drawCinematicOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pass: PassType,
  style: SceneStyle
) {
  // Top/Bottom 2.39:1 Cinematic Letterbox Bars
  const barHeight = Math.floor(h * 0.055);
  ctx.fillStyle = '#050608';
  ctx.fillRect(0, 0, w, barHeight);
  ctx.fillRect(0, h - barHeight, w, barHeight);

  // Viewport technical telemetry HUD on bottom letterbox bar
  ctx.font = `600 ${Math.max(10, Math.floor(w * 0.012))}px 'JetBrains Mono', monospace`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';

  // Bottom Left: Pass Name & Engine
  const passLabel = {
    final: 'LIT // FINAL COMPOSITE · LUMEN GI',
    clay: 'LIGHTING ONLY // CLAY ISOLATION',
    normals: 'BUFFER // WORLD NORMALS',
    roughness: 'BUFFER // PBR ROUGHNESS',
    unlit: 'BUFFER // BASE COLOR (ALBEDO)',
  }[pass];

  ctx.fillText(`[ ${passLabel} ]`, 20, h - barHeight * 0.35);

  // Bottom Right: Engine Stats
  ctx.textAlign = 'right';
  ctx.fillText('60.0 FPS · 16.6ms · 4K UHD', w - 20, h - barHeight * 0.35);
  ctx.textAlign = 'left';

  // Frame corner guides
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  const guideLen = 14;
  ctx.beginPath();
  ctx.moveTo(24, barHeight + 12);
  ctx.lineTo(24 + guideLen, barHeight + 12);
  ctx.moveTo(24, barHeight + 12);
  ctx.lineTo(24, barHeight + 12 + guideLen);

  ctx.moveTo(w - 24, h - barHeight - 12);
  ctx.lineTo(w - 24 - guideLen, h - barHeight - 12);
  ctx.moveTo(w - 24, h - barHeight - 12);
  ctx.lineTo(w - 24, h - barHeight - 12 - guideLen);
  ctx.stroke();
}
