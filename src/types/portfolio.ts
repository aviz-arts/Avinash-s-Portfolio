export type ProjectCategory = 'game-design' | 'lighting' | 'both';

export interface LightingPass {
  id: string;
  name: string;
  description: string;
  type: 'final' | 'clay' | 'unlit' | 'normals' | 'roughness';
  accentColor: string;
}

export interface ProjectMetric {
  label: string;
  value: string;
  detail: string;
}

export interface LevelDesignBlockout {
  pacingNote: string;
  combatEncounters: number;
  sightlines: string;
  verticalityLayers: number;
  flowTopology: string;
}

export interface GameplayDesignBreakdown {
  coreLoop?: string;
  playerVerbs?: string[];
  progressionEconomy?: string;
  encounterPacing?: string;
  feelAndJuice?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  category: ProjectCategory;
  engine: string;
  role: string;
  year: string;
  duration: string;
  featured: boolean;
  heroType: 'video' | 'interactive' | 'image';
  videoDuration?: string;
  summary: string;
  creativeIntent: string;
  technicalChallenge: string;
  solution: string;
  gameplayDesign?: GameplayDesignBreakdown;
  lightingSetup: {
    keyLight: string;
    fillBounce: string;
    volumetricFog: string;
    colorPalette: string[];
    exposureEV: string;
  };
  levelDesign?: LevelDesignBlockout;
  metrics: ProjectMetric[];
  passes: LightingPass[];
  tags: string[];
  dummySceneStyle: 'cyberpunk' | 'crypt' | 'scifi' | 'derelict' | 'ruins' | 'turret';
}
