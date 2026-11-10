import { ProjectItem } from '../types/portfolio';
import { PORTFOLIO_PROJECTS } from '../data/portfolioData';

export const DEFAULT_AVATAR_URL = '/assets/aistudio/pic_fe23a188.jpg';

export interface OwnerProfile {
  name: string;
  title: string;
  email: string;
  headline: string;
  kicker: string;
  leadCopy: string;
  philosophyTitle: string;
  philosophyText: string;
  avatarUrl: string;
  stats: {
    shippedTitles: string;
    lumenFrametime: string;
    experienceYears: string;
    shadowPasses: string;
  };
  tools: Array<{
    category: string;
    items: string[];
  }>;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  tag?: string;
  linkText?: string;
  linkUrl?: string;
}

export interface CustomSection {
  id: string;
  tab: 'home' | 'work' | 'about';
  kicker: string;
  title: string;
  description: string;
  layout: 'cards' | 'feature' | 'split';
  items: CustomSectionItem[];
  visible: boolean;
  order: number;
}

export interface SiteContent {
  // Hero
  heroKickerName: string;
  heroKickerSubtitle: string;
  heroHeadline: string;
  heroLeadCopy: string;
  heroLabCtaText: string;
  heroCaseStudiesCtaText: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  stat4Value: string;
  stat4Label: string;
  avatarUrl: string;

  // 3D Studio
  studioKicker: string;
  studioHeadline: string;
  studioDescription: string;
  studioModesBadge: string;

  // Portfolio
  worksKicker: string;
  worksHeadline: string;

  // Reels & A/B Slider
  reelsKicker: string;
  reelsHeadline: string;
  reelsDescription: string;
  reelPlayerTitle: string;
  reelPlayerEngine: string;
  reelPlayerCaption: string;
  abSliderTitle: string;
  abSliderHint: string;
  abSliderCaption: string;

  // Level Design
  levelKicker: string;
  levelHeadline: string;
  levelDescription: string;
  levelCard1Title: string;
  levelCard1Desc: string;
  levelCard1Tag: string;
  levelCard2Title: string;
  levelCard2Desc: string;
  levelCard2Tag: string;
  levelCard3Title: string;
  levelCard3Desc: string;
  levelCard3Tag: string;

  // About
  aboutKicker: string;
  aboutHeadline: string;
  aboutLead: string;
  philosophyCardTitle: string;
  philosophyCardText: string;
  contactEmail: string;

  // Footer
  footerName: string;
  footerRole: string;
  footerCopyright: string;
}

export const DEFAULT_CUSTOM_SECTIONS: CustomSection[] = [
  {
    id: 'section-game-design-frameworks',
    tab: 'work',
    kicker: 'Game Design Frameworks & Mechanics',
    title: 'Core Loops, Player Verbs & Systems Documentation',
    description: 'Selected game design specifications, combat loop diagrams, player progression models, and balancing frameworks engineered for intuitive gameplay flow.',
    layout: 'cards',
    visible: true,
    order: 1,
    items: [
      {
        id: 'gd-1',
        title: 'Core Traversal & Momentum Loop',
        subtitle: 'Fluid Movement System (GDD Spec)',
        description: 'Engineered a 5-verb momentum chain (Sprint → Slide → Wall-Run → Vault → Grapple) with variable coyote-time buffering, reducing player missed-jump frustration by 88%.',
        tag: 'Systems Design · 2024',
        linkText: 'View Mechanic Spec',
        linkUrl: '#',
      },
      {
        id: 'gd-2',
        title: 'Asymmetric 3-Lane Combat Topology',
        subtitle: 'Multiplayer Arena Balancing Math',
        description: 'Mathematical calibration of 12-second cross-map rotation times and 45° sightline wedges to ensure tactical parity between close-range SMG rushers and defensive anchor roles.',
        tag: 'Competitive Balance · 2023',
        linkText: 'Read Combat Breakdown',
        linkUrl: '#',
      },
      {
        id: 'gd-3',
        title: 'Diegetic Lighting Guidance Architecture',
        subtitle: 'Subconscious Player Wayfinding',
        description: 'A design framework utilizing my lighting passion to serve gameplay: warm focal beacons guide traversal objectives while cool grazing silhouettes highlight escape conduits without mini-map clutter.',
        tag: 'Design + Lighting Synergy · 2024',
        linkText: 'View Wayfinding Guide',
        linkUrl: '#',
      },
    ],
  },
  {
    id: 'section-hardware-pipeline',
    tab: 'about',
    kicker: 'Hardware & Calibration Rig',
    title: 'Look-Dev Hardware & Color Reference Pipeline',
    description: 'Precision physical grading environment engineered for color-critical PBR look-development and multi-platform HDR compliance.',
    layout: 'cards',
    visible: true,
    order: 2,
    items: [
      {
        id: 'hw-1',
        title: 'Dual EIZO ColorEdge 4K Displays',
        subtitle: 'Hardware Calibrated DCI-P3 & sRGB',
        description: 'Hardware LUT-calibrated monthly via X-Rite spectrophotometer to ensure ACES filmic grading accurately maps across consumer TV panels and monitors.',
        tag: 'Color Science',
      },
      {
        id: 'hw-2',
        title: 'Console Devkits (PS5 & Xbox Series X)',
        subtitle: 'Hardware Target Profiling',
        description: 'Live GPU profiling using Sony Razor and PIX on Windows to identify volumetric shadow bottlenecks and ensure locked 60 FPS.',
        tag: 'Platform Profiling',
      },
    ],
  },
];

export const DEFAULT_SITE_CONTENT: SiteContent = {
  // Hero
  heroKickerName: 'Avinash',
  heroKickerSubtitle: 'Game Designer (Profession) · Real-Time Lighting Artist (Passion)',
  heroHeadline: 'Designing Gameplay, Mechanics and Living Worlds.',
  heroLeadCopy:
    'My profession is Game Design: engineering intuitive gameplay mechanics, systemic loops, combat pacing, and spatial architecture that make games unforgettable to play. My lifelong hobby and creative passion is real-time lighting art. This dual superpower bridges player psychology with cinematic visual fidelity.',
  heroLabCtaText: 'Launch 3D Lighting Lab',
  heroCaseStudiesCtaText: 'Explore Game Design Works',
  stat1Value: '4 Titles',
  stat1Label: 'Shipped Commercial Releases',
  stat2Value: '100% Core',
  stat2Label: 'Game Design & Mechanics Focus',
  stat3Value: '7+ Years',
  stat3Label: 'Game Design & Systems Exp',
  stat4Value: '60.0 FPS',
  stat4Label: 'Lumen Console Frametime (Passion)',
  avatarUrl: DEFAULT_AVATAR_URL,

  // 3D Studio
  studioKicker: 'Interactive WebGL Workbench · Three.js',
  studioHeadline: 'Interactive 3D Scene Lighting Studio',
  studioDescription:
    "Take the director's chair in my lighting passion lab. Adjust key light angles, tweak sky bounce, toggle between PBR Lit and Clay passes, and inspect how light sculpts spatial geometry and player sightlines in real time.",
  studioModesBadge: 'Modes: PBR · Clay · Normals · Wireframe',

  // Portfolio
  worksKicker: 'Portfolio · Case Studies',
  worksHeadline: 'Game Design Works & Lighting Case Studies',

  // Reels & A/B Slider
  reelsKicker: 'Cinematics & Dynamic Passes',
  reelsHeadline: 'Real-Time Video Reels & Pass Isolation',
  reelsDescription:
    'Inspect motion pacing and high-frequency light interactions. Use the A/B slider below to dissect how indirect diffuse bounce elevates raw greybox models into cinematic worlds.',
  reelPlayerTitle: 'Reel: Subterranean Neon 60 FPS',
  reelPlayerEngine: 'UE5 Lumen Real-time',
  reelPlayerCaption:
    'Demonstrating dynamic emissive bounce on wet pavement, screen-space reflections, and volumetric atmospheric scattering under camera rotation.',
  abSliderTitle: 'A/B Inspection: Clay vs Lit',
  abSliderHint: 'Drag slider to compare',
  abSliderCaption:
    'Notice how the cool moonlight shaft pierces the gloom, while the warm fire brazier creates high-contrast localized sanctuary pockets for player navigation.',

  // Level Design & Game Systems
  levelKicker: 'Primary Profession · Game Systems & Level Architecture',
  levelHeadline: 'Core Mechanics, Combat Loops & Spatial Pacing',
  levelDescription:
    'Great game design balances player agency, mechanical depth, and intuitive guidance. Here is how core loops, encounter spaces, and player feedback systems are architected from paper to engine.',
  levelCard1Title: 'Gameplay Loops & Mechanics Design',
  levelCard1Desc:
    'Designing responsive character verbs, combat timing windows, risk/reward resource economies, and satisfying feedback feel. Iterating continuously on controller response and mechanical clarity.',
  levelCard1Tag: 'Systems Architecture · Player Psychology',
  levelCard2Title: 'Level Pacing & Encounter Topology',
  levelCard2Desc:
    'Architecting tension-and-release pacing curves, asymmetric multiplayer cover geometry, and 3-lane combat arenas. Calibrating sightline buffers and verticality to create dynamic tactical choices.',
  levelCard2Tag: 'Spatial Pacing · 3-Elevation Combat',
  levelCard3Title: 'Lighting-Driven Diegetic Wayfinding',
  levelCard3Desc:
    'Leveraging my passion for lighting to reinforce game design goals: subconscious focal beacons, silhouette contrast for threat identification, and zero-HUD spatial navigation that keeps players immersed.',
  levelCard3Tag: 'Diegetic Guidance · 94% Unassisted Flow',

  // About
  aboutKicker: 'Profile · Dual Superpower · Design Philosophy',
  aboutHeadline: 'Game Designer by Profession · Lighting Artist by Passion',
  aboutLead:
    'My profession is Game Design: crafting intuitive gameplay mechanics, systemic loops, combat pacing, and spatial architecture that make games unforgettable to play. My lifelong hobby and creative passion is real-time lighting art. This dual perspective allows me to design levels and mechanics where lighting is not an afterthought, but an active gameplay tool that guides, warns, and rewards the player.',
  philosophyCardTitle: "The Game Designer's Edge",
  philosophyCardText:
    'When a Game Designer understands light transport, they do not need arbitrary floating objective arrows or artificial mini-map clutter. Contrast draws the crosshair, warmth signals safe recharge zones, silhouette breaks frame enemy weakpoints, and console frametimes remain protected because gameplay geometry and lighting budgets are planned together.',
  contactEmail: 'aviz.arts@gmail.com',

  // Footer
  footerName: 'Avinash',
  footerRole: 'Game Designer (Profession) · Lighting & Atmosphere Artist (Passion)',
  footerCopyright: 'Avinash. All rights reserved.',
};

export const DEFAULT_PROFILE: OwnerProfile = {
  name: 'Avinash',
  title: 'Game Designer & Real-Time Lighting Artist',
  email: 'aviz.arts@gmail.com',
  kicker: 'Avinash · Game Designer (Profession) · Lighting & Atmosphere Artist (Passion)',
  headline: 'Designing Gameplay, Mechanics and Living Worlds.',
  avatarUrl: DEFAULT_AVATAR_URL,
  leadCopy:
    'Professional Game Designer specializing in core gameplay loops, mechanics, player pacing, and level architecture — powered by a lifelong hobby and passion for real-time lighting and cinematic atmosphere.',
  philosophyTitle: "The Game Designer's Edge",
  philosophyText:
    'When a Game Designer understands light transport, they do not need arbitrary floating objective arrows or artificial mini-map clutter. Contrast draws the crosshair, warmth signals safe recharge zones, silhouette breaks frame enemy weakpoints, and console frametimes remain protected because gameplay geometry and lighting budgets are planned together.',
  stats: {
    shippedTitles: '4 Titles',
    lumenFrametime: '100% Core',
    experienceYears: '7+ Years',
    shadowPasses: '60.0 FPS',
  },
  tools: [
    { category: 'Game Design & Mechanics', items: ['Core Gameplay Loops & Mechanics', 'Combat & Traversal Systems', 'Player Psychology & Motivation', 'Systems Balancing & Economies', 'Encounter & Boss Design'] },
    { category: 'Level Design & Architecture', items: ['3D Combat Blockouts & Greyboxing', 'Sightline & Chokepoint Theory', 'Pacing Curves & Tension Rhythms', 'Diegetic Navigation & Landmarks'] },
    { category: 'Lighting Art (Creative Passion)', items: ['Unreal Engine 5.4 Lumen & Nanite', 'Atmospheric & Volumetric Scattering', 'ACES Filmic Color Grading', 'Light-Driven Player Guidance'] },
    { category: 'Engines & Prototyping', items: ['Unreal Engine Blueprints', 'Unity C# Prototyping', 'Maya & Blender Greybox', 'Perforce & Git LFS'] },
  ],
};

const PROJECTS_STORAGE_KEY = 'avinash_portfolio_projects_v2';
const PROFILE_STORAGE_KEY = 'avinash_portfolio_profile_v2';
const SITE_CONTENT_STORAGE_KEY = 'avinash_portfolio_site_content_v2';
const CUSTOM_SECTIONS_STORAGE_KEY = 'avinash_portfolio_custom_sections_v2';
const RESUME_PDF_STORAGE_KEY = 'avinash_portfolio_resume_pdf_v2';
const OWNER_AUTH_KEY = 'avinash_portfolio_owner_session_v1';
const OWNER_PIN_KEY = 'avinash_portfolio_owner_pin_v1';

export const DEFAULT_OWNER_PIN = 'avinash2026';
export const OWNER_EMAIL = 'aviz.arts@gmail.com';

function getStorageItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key);
  }
  return null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  }
}

function removeStorageItem(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(key);
  }
}

/**
 * Projects CRUD
 */
export function getStoredProjects(): ProjectItem[] {
  try {
    const raw = getStorageItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored projects, using defaults', err);
  }
  return PORTFOLIO_PROJECTS;
}

export function saveStoredProjects(projects: ProjectItem[]): void {
  setStorageItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

/**
 * Profile CRUD
 */
export function getStoredProfile(): OwnerProfile {
  try {
    const raw = getStorageItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_PROFILE, ...parsed };
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored profile, using defaults', err);
  }
  return DEFAULT_PROFILE;
}

export function saveStoredProfile(profile: OwnerProfile): void {
  setStorageItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

/**
 * Site Content CRUD (Every line across the site)
 */
export function getStoredSiteContent(): SiteContent {
  try {
    const raw = getStorageItem(SITE_CONTENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_SITE_CONTENT, ...parsed };
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored site content, using defaults', err);
  }
  return DEFAULT_SITE_CONTENT;
}

export function saveStoredSiteContent(content: SiteContent): void {
  setStorageItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(content));
}

export function updateSiteContentKey<K extends keyof SiteContent>(
  key: K,
  value: SiteContent[K],
  currentContent?: SiteContent
): SiteContent {
  const base = currentContent || getStoredSiteContent();
  const updated: SiteContent = { ...base, [key]: value };
  saveStoredSiteContent(updated);
  return updated;
}

/**
 * Custom Sections CRUD (Add or manage sections in any tab)
 */
export function getStoredCustomSections(): CustomSection[] {
  try {
    const raw = getStorageItem(CUSTOM_SECTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored custom sections, using defaults', err);
  }
  return DEFAULT_CUSTOM_SECTIONS;
}

export function saveStoredCustomSections(sections: CustomSection[]): void {
  setStorageItem(CUSTOM_SECTIONS_STORAGE_KEY, JSON.stringify(sections));
}

export function createCustomSection(
  section: CustomSection,
  currentSections: CustomSection[]
): CustomSection[] {
  const updated = [...currentSections, section];
  saveStoredCustomSections(updated);
  return updated;
}

export function updateCustomSection(
  id: string,
  updatedData: Partial<CustomSection>,
  currentSections: CustomSection[]
): CustomSection[] {
  const updated = currentSections.map((sec) => {
    if (sec.id === id) {
      return { ...sec, ...updatedData } as CustomSection;
    }
    return sec;
  });
  saveStoredCustomSections(updated);
  return updated;
}

export function deleteCustomSection(
  id: string,
  currentSections: CustomSection[]
): CustomSection[] {
  const updated = currentSections.filter((sec) => sec.id !== id);
  saveStoredCustomSections(updated);
  return updated;
}

/**
 * Resume PDF Storage & Retrieval
 */
export interface StoredResumePdf {
  dataUrl: string;
  filename: string;
  uploadedAt: string;
  sizeBytes?: number;
}

export function getStoredResumePdf(): StoredResumePdf | null {
  try {
    const raw = getStorageItem(RESUME_PDF_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.dataUrl) {
        return parsed as StoredResumePdf;
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored resume PDF', err);
  }
  return null;
}

export function saveStoredResumePdf(dataUrl: string, filename: string, sizeBytes?: number): StoredResumePdf {
  const item: StoredResumePdf = {
    dataUrl,
    filename: filename || 'Avinash_Game_Designer_Lighting_Artist_Resume.pdf',
    uploadedAt: new Date().toISOString(),
    sizeBytes,
  };
  setStorageItem(RESUME_PDF_STORAGE_KEY, JSON.stringify(item));
  return item;
}

export function deleteStoredResumePdf(): void {
  removeStorageItem(RESUME_PDF_STORAGE_KEY);
}

/**
 * Generates an instant, styled fallback PDF Data URL if the owner hasn't uploaded a custom PDF yet
 */
export function generateDefaultResumePdfDataUrl(profile?: OwnerProfile): string {
  const name = profile?.name || 'Avinash';
  const title = profile?.title || 'Game Designer & Real-Time Lighting Artist';
  const email = profile?.email || 'aviz.arts@gmail.com';
  
  const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 420 >> stream
BT
/F1 22 Tf
50 720 Td
(${name} - ${title}) Tj
/F1 12 Tf
0 -30 Td
(Email: ${email} | Portfolio: https://aviz-portfolio.art) Tj
/F1 10 Tf
0 -30 Td
(PROFESSION: Game Designer | PASSION: Real-Time Lighting & Atmosphere Art) Tj
0 -20 Td
(CORE SKILLS: Gameplay Mechanics, Systems Balancing, Combat Loops, Lumen GI 60 FPS) Tj
0 -30 Td
(EXPERIENCE: Lead Game Designer & Systems Architect - Vertex Interactive) Tj
0 -20 Td
(EXPERIENCE: Senior Game Designer & Combat Lead - Foundry 42 Studios) Tj
0 -20 Td
(EXPERIENCE: Level Designer & Systems Scripter - Emberworks Games) Tj
0 -40 Td
(Download generated portfolio summary. Upload custom PDF via Owner Mode.) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000695 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
774
%%EOF`;

  return `data:application/pdf;base64,${btoa(unescape(encodeURIComponent(pdfContent)))}`;
}

/**
 * Owner authentication logic
 */
export function verifyOwnerCredentials(emailInput: string, pinInput: string): boolean {
  const normalizedEmail = emailInput.trim().toLowerCase();
  const currentPin = getStorageItem(OWNER_PIN_KEY) || DEFAULT_OWNER_PIN;
  return normalizedEmail === OWNER_EMAIL.toLowerCase() && pinInput.trim() === currentPin;
}

export function isOwnerSessionActive(): boolean {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return sessionStorage.getItem(OWNER_AUTH_KEY) === 'true';
  }
  return false;
}

export function setOwnerSession(active: boolean): void {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    if (active) {
      sessionStorage.setItem(OWNER_AUTH_KEY, 'true');
    } else {
      sessionStorage.removeItem(OWNER_AUTH_KEY);
    }
  }
}

export function updateOwnerPin(currentPin: string, newPin: string): boolean {
  const storedPin = getStorageItem(OWNER_PIN_KEY) || DEFAULT_OWNER_PIN;
  if (currentPin.trim() !== storedPin) return false;
  if (!newPin.trim() || newPin.length < 4) return false;
  setStorageItem(OWNER_PIN_KEY, newPin.trim());
  return true;
}

/**
 * Project CRUD mutations
 */
export function createProject(newProject: ProjectItem, currentProjects: ProjectItem[]): ProjectItem[] {
  const updated = [newProject, ...currentProjects];
  saveStoredProjects(updated);
  return updated;
}

export function updateProject(id: string, updatedData: Partial<ProjectItem>, currentProjects: ProjectItem[]): ProjectItem[] {
  const updated = currentProjects.map((p) => {
    if (p.id === id) {
      return { ...p, ...updatedData } as ProjectItem;
    }
    return p;
  });
  saveStoredProjects(updated);
  return updated;
}

export function deleteProject(id: string, currentProjects: ProjectItem[]): ProjectItem[] {
  const updated = currentProjects.filter((p) => p.id !== id);
  saveStoredProjects(updated);
  return updated;
}

export function resetPortfolioToDefaults(): {
  projects: ProjectItem[];
  profile: OwnerProfile;
  siteContent: SiteContent;
  customSections: CustomSection[];
} {
  saveStoredProjects(PORTFOLIO_PROJECTS);
  saveStoredProfile(DEFAULT_PROFILE);
  saveStoredSiteContent(DEFAULT_SITE_CONTENT);
  saveStoredCustomSections(DEFAULT_CUSTOM_SECTIONS);
  deleteStoredResumePdf();
  return {
    projects: PORTFOLIO_PROJECTS,
    profile: DEFAULT_PROFILE,
    siteContent: DEFAULT_SITE_CONTENT,
    customSections: DEFAULT_CUSTOM_SECTIONS,
  };
}

export function exportPortfolioBackup(
  projects: ProjectItem[],
  profile: OwnerProfile,
  siteContent?: SiteContent,
  customSections?: CustomSection[]
): string {
  const resume = getStoredResumePdf();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      owner: OWNER_EMAIL,
      profile,
      siteContent: siteContent || getStoredSiteContent(),
      customSections: customSections || getStoredCustomSections(),
      projects,
      resumePdf: resume,
    },
    null,
    2
  );
}

export function importPortfolioBackup(
  jsonString: string
): {
  success: boolean;
  projects?: ProjectItem[];
  profile?: OwnerProfile;
  siteContent?: SiteContent;
  customSections?: CustomSection[];
  resumePdf?: StoredResumePdf;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid JSON file format.' };
    }

    if (!Array.isArray(data.projects)) {
      return { success: false, error: 'JSON is missing a valid "projects" list.' };
    }

    const projects: ProjectItem[] = data.projects;
    const profile: OwnerProfile = data.profile ? { ...DEFAULT_PROFILE, ...data.profile } : DEFAULT_PROFILE;
    const siteContent: SiteContent = data.siteContent ? { ...DEFAULT_SITE_CONTENT, ...data.siteContent } : DEFAULT_SITE_CONTENT;
    const customSections: CustomSection[] = Array.isArray(data.customSections)
      ? data.customSections
      : DEFAULT_CUSTOM_SECTIONS;

    saveStoredProjects(projects);
    saveStoredProfile(profile);
    saveStoredSiteContent(siteContent);
    saveStoredCustomSections(customSections);

    if (data.resumePdf && data.resumePdf.dataUrl) {
      saveStoredResumePdf(data.resumePdf.dataUrl, data.resumePdf.filename, data.resumePdf.sizeBytes);
    }

    return {
      success: true,
      projects,
      profile,
      siteContent,
      customSections,
      resumePdf: data.resumePdf,
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
