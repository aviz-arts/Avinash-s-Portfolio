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
  };
  fillLight: {
    skyColor: string;
    groundColor: string;
    intensity: number;
  };
  rimLight: {
    color: string;
    intensity: number;
    angle: number;
  };
  localLight: {
    color: string;
    intensity: number;
    x: number;
    y: number;
    z: number;
    distance: number;
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
  };
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
    },
    fillLight: {
      skyColor: '#1d0b3a',
      groundColor: '#05020a',
      intensity: 0.8,
    },
    rimLight: {
      color: '#ff007f',
      intensity: 3.5,
      angle: 210,
    },
    localLight: {
      color: '#ff2a85',
      intensity: 4.0,
      x: 0,
      y: 2,
      z: 1,
      distance: 8,
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
    },
    fillLight: {
      skyColor: '#0d1829',
      groundColor: '#07090e',
      intensity: 0.4,
    },
    rimLight: {
      color: '#a3c2f0',
      intensity: 1.8,
      angle: 220,
    },
    localLight: {
      color: '#ff7300',
      intensity: 3.2,
      x: -1.5,
      y: 1.2,
      z: 0.5,
      distance: 6,
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
    },
    fillLight: {
      skyColor: '#3a6699',
      groundColor: '#1a1005',
      intensity: 0.7,
    },
    rimLight: {
      color: '#ffd080',
      intensity: 2.2,
      angle: 260,
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
    },
    fillLight: {
      skyColor: '#c8d6e5',
      groundColor: '#485460',
      intensity: 0.6,
    },
    rimLight: {
      color: '#ffffff',
      intensity: 2.5,
      angle: 240,
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
