/**
 * Lighting presets, calculations, and color conversion logic
 * Tested via node:test
 */

export interface LightSettings {
  name: string;
  keyLight: {
    color: string;
    intensity: number;
    elevation: number; // degrees 0-90
    azimuth: number; // degrees 0-360
    castShadow: boolean;
    kelvin?: number;
    softness?: number;
    shadowBias?: number;
  };
  fillLight: {
    skyColor: string;
    groundColor: string;
    intensity: number;
    giBounceMultiplier?: number;
  };
  rimLight: {
    color: string;
    intensity: number;
    angle: number;
    elevation?: number;
  };
  localLight: {
    color: string;
    intensity: number;
    x: number;
    y: number;
    z: number;
    distance: number;
    pulseSpeed?: number;
  };
  fog: {
    enabled: boolean;
    color: string;
    density: number;
    near: number;
    far: number;
  };
  toneMapping: {
    exposure: number;
    mode?: 'aces' | 'reinhard' | 'cineon' | 'linear' | 'neutral';
    contrast?: number;
    saturation?: number;
    whiteBalanceTint?: number;
  };
  surface?: {
    wetness?: number; // 0 to 1
    roughnessScale?: number;
    metallicScale?: number;
  };
  camera?: {
    focalLengthMm?: number; // 24, 35, 50, 85
    fov?: number;
  };
}

export function kelvinToHex(kelvin: number): string {
  const temp = Math.max(1000, Math.min(40000, kelvin)) / 100;
  let r: number, g: number, b: number;

  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
    g = Math.max(0, Math.min(255, g));
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
    g = Math.max(0, Math.min(255, g));
  }

  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = temp - 10;
    b = 138.5177312231 * Math.log(b) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }

  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const LIGHTING_PRESETS: Record<string, LightSettings> = {
  cyberpunk: {
    name: 'Cyberpunk Neon Rain',
    keyLight: {
      color: '#00e5ff',
      intensity: 2.2,
      elevation: 45,
      azimuth: 135,
      castShadow: true,
      kelvin: 8500,
      softness: 1.2,
    },
    fillLight: {
      skyColor: '#1d0b3a',
      groundColor: '#05020a',
      intensity: 0.8,
      giBounceMultiplier: 1.4,
    },
    rimLight: {
      color: '#ff007f',
      intensity: 3.5,
      angle: 210,
      elevation: 35,
    },
    localLight: {
      color: '#ff2a85',
      intensity: 4.0,
      x: 0,
      y: 2,
      z: 1,
      distance: 8,
      pulseSpeed: 1.5,
    },
    fog: {
      enabled: true,
      color: '#080812',
      density: 0.04,
      near: 5,
      far: 35,
    },
    toneMapping: {
      exposure: 1.15,
      mode: 'aces',
      contrast: 1.15,
      saturation: 1.2,
    },
    surface: {
      wetness: 0.85,
    },
    camera: {
      focalLengthMm: 35,
      fov: 54,
    },
  },
  crypt: {
    name: 'Gothic Crypt Moonlight',
    keyLight: {
      color: '#8cb5e5',
      intensity: 1.6,
      elevation: 65,
      azimuth: 45,
      castShadow: true,
      kelvin: 7500,
      softness: 0.8,
    },
    fillLight: {
      skyColor: '#0d1829',
      groundColor: '#07090e',
      intensity: 0.4,
      giBounceMultiplier: 1.0,
    },
    rimLight: {
      color: '#a3c2f0',
      intensity: 1.8,
      angle: 220,
      elevation: 30,
    },
    localLight: {
      color: '#ff7300',
      intensity: 3.2,
      x: -1.5,
      y: 1.2,
      z: 0.5,
      distance: 6,
      pulseSpeed: 2.0,
    },
    fog: {
      enabled: true,
      color: '#0b0f17',
      density: 0.03,
      near: 4,
      far: 28,
    },
    toneMapping: {
      exposure: 1.0,
      mode: 'aces',
      contrast: 1.1,
      saturation: 0.95,
    },
    surface: {
      wetness: 0.4,
    },
    camera: {
      focalLengthMm: 50,
      fov: 40,
    },
  },
  goldenHour: {
    name: 'Cinematic Golden Hour',
    keyLight: {
      color: '#ffaa44',
      intensity: 2.8,
      elevation: 20,
      azimuth: 80,
      castShadow: true,
      kelvin: 3200,
      softness: 1.5,
    },
    fillLight: {
      skyColor: '#3a6699',
      groundColor: '#1a1005',
      intensity: 0.7,
      giBounceMultiplier: 1.8,
    },
    rimLight: {
      color: '#ffd080',
      intensity: 2.2,
      angle: 260,
      elevation: 25,
    },
    localLight: {
      color: '#ffe5b4',
      intensity: 1.5,
      x: 1,
      y: 2,
      z: 1,
      distance: 10,
    },
    fog: {
      enabled: true,
      color: '#1a161f',
      density: 0.015,
      near: 10,
      far: 45,
    },
    toneMapping: {
      exposure: 1.25,
      mode: 'aces',
      contrast: 1.05,
      saturation: 1.1,
    },
    surface: {
      wetness: 0.2,
    },
    camera: {
      focalLengthMm: 35,
      fov: 54,
    },
  },
  studio: {
    name: 'Clean Studio 3-Point',
    keyLight: {
      color: '#ffffff',
      intensity: 2.0,
      elevation: 50,
      azimuth: 60,
      castShadow: true,
      kelvin: 5600,
      softness: 1.0,
    },
    fillLight: {
      skyColor: '#c8d6e5',
      groundColor: '#485460',
      intensity: 0.6,
      giBounceMultiplier: 1.0,
    },
    rimLight: {
      color: '#ffffff',
      intensity: 2.5,
      angle: 240,
      elevation: 40,
    },
    localLight: {
      color: '#f1f2f6',
      intensity: 1.0,
      x: 0,
      y: 3,
      z: 2,
      distance: 12,
    },
    fog: {
      enabled: false,
      color: '#12151f',
      density: 0.01,
      near: 15,
      far: 60,
    },
    toneMapping: {
      exposure: 1.1,
      mode: 'neutral',
      contrast: 1.0,
      saturation: 1.0,
    },
    surface: {
      wetness: 0.1,
    },
    camera: {
      focalLengthMm: 50,
      fov: 40,
    },
  },
  cleanStudio: {
    name: 'Clean Studio 3-Point',
    keyLight: {
      color: '#ffffff',
      intensity: 2.0,
      elevation: 50,
      azimuth: 60,
      castShadow: true,
      kelvin: 5600,
      softness: 1.0,
    },
    fillLight: {
      skyColor: '#c8d6e5',
      groundColor: '#485460',
      intensity: 0.6,
      giBounceMultiplier: 1.0,
    },
    rimLight: {
      color: '#ffffff',
      intensity: 2.5,
      angle: 240,
      elevation: 40,
    },
    localLight: {
      color: '#f1f2f6',
      intensity: 1.0,
      x: 0,
      y: 3,
      z: 2,
      distance: 12,
    },
    fog: {
      enabled: false,
      color: '#12151f',
      density: 0.01,
      near: 15,
      far: 60,
    },
    toneMapping: {
      exposure: 1.1,
      mode: 'neutral',
      contrast: 1.0,
      saturation: 1.0,
    },
    surface: {
      wetness: 0.1,
    },
    camera: {
      focalLengthMm: 50,
      fov: 40,
    },
  },
  redAlert: {
    name: 'Sci-Fi Emergency Red Alert',
    keyLight: {
      color: '#ff1744',
      intensity: 3.2,
      elevation: 35,
      azimuth: 200,
      castShadow: true,
      kelvin: 2000,
      softness: 0.5,
    },
    fillLight: {
      skyColor: '#1a0508',
      groundColor: '#050002',
      intensity: 0.35,
      giBounceMultiplier: 1.2,
    },
    rimLight: {
      color: '#ff5252',
      intensity: 4.0,
      angle: 25,
      elevation: 45,
    },
    localLight: {
      color: '#ff0033',
      intensity: 5.5,
      x: 0,
      y: 2.2,
      z: 0.5,
      distance: 9,
      pulseSpeed: 3.0,
    },
    fog: {
      enabled: true,
      color: '#150508',
      density: 0.035,
      near: 6,
      far: 32,
    },
    toneMapping: {
      exposure: 1.1,
      mode: 'aces',
      contrast: 1.25,
      saturation: 1.3,
    },
    surface: {
      wetness: 0.7,
    },
    camera: {
      focalLengthMm: 35,
      fov: 54,
    },
  },
  noir: {
    name: 'High-Contrast Noir',
    keyLight: {
      color: '#ffffff',
      intensity: 3.5,
      elevation: 70,
      azimuth: 300,
      castShadow: true,
      kelvin: 6500,
      softness: 0.2,
    },
    fillLight: {
      skyColor: '#080808',
      groundColor: '#000000',
      intensity: 0.15,
      giBounceMultiplier: 0.4,
    },
    rimLight: {
      color: '#ffffff',
      intensity: 2.8,
      angle: 120,
      elevation: 20,
    },
    localLight: {
      color: '#ffffff',
      intensity: 0.5,
      x: 0,
      y: 1.5,
      z: 1,
      distance: 4,
    },
    fog: {
      enabled: true,
      color: '#050505',
      density: 0.025,
      near: 8,
      far: 38,
    },
    toneMapping: {
      exposure: 0.95,
      mode: 'cineon',
      contrast: 1.4,
      saturation: 0.0, // Monochromatic Noir
    },
    surface: {
      wetness: 0.9,
    },
    camera: {
      focalLengthMm: 50,
      fov: 40,
    },
  },
};

/**
 * Convert polar angles (azimuth & elevation in degrees) to Cartesian coordinates at given radius
 */
export function polarToCartesian(azimuthDeg: number, elevationDeg: number, radius: number): [number, number, number] {
  const azRad = (azimuthDeg * Math.PI) / 180;
  const elRad = (elevationDeg * Math.PI) / 180;

  const y = radius * Math.sin(elRad);
  const horizontalDist = radius * Math.cos(elRad);
  const x = horizontalDist * Math.sin(azRad);
  const z = horizontalDist * Math.cos(azRad);

  return [x, y, z];
}

/**
 * Filter projects by category and query
 */
export interface FilterableProject {
  id: string;
  category: 'game-design' | 'lighting' | 'both';
  engine: string;
  title: string;
  tags: string[];
}

export function filterProjects<T extends FilterableProject>(
  projects: T[],
  categoryFilter: string,
  searchQuery: string
): T[] {
  return projects.filter((project) => {
    // Category match
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'game-design' && project.category !== 'game-design' && project.category !== 'both') {
        return false;
      }
      if (categoryFilter === 'lighting' && project.category !== 'lighting' && project.category !== 'both') {
        return false;
      }
      if (categoryFilter === 'unreal' && !project.engine.toLowerCase().includes('unreal')) {
        return false;
      }
      if (categoryFilter === 'unity' && !project.engine.toLowerCase().includes('unity')) {
        return false;
      }
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inTitle = project.title.toLowerCase().includes(q);
      const inEngine = project.engine.toLowerCase().includes(q);
      const inTags = project.tags.some((t) => t.toLowerCase().includes(q));
      if (!inTitle && !inEngine && !inTags) return false;
    }

    return true;
  });
}
