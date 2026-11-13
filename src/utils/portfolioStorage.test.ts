import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyOwnerCredentials,
  createProject,
  updateProject,
  deleteProject,
  exportPortfolioBackup,
  importPortfolioBackup,
  DEFAULT_PROFILE,
  DEFAULT_OWNER_PIN,
  OWNER_EMAIL,
  DEFAULT_SITE_CONTENT,
  updateSiteContentKey,
  generateDefaultResumePdfDataUrl,
  createCustomSection,
  updateCustomSection,
  deleteCustomSection,
  DEFAULT_AVATAR_URL,
  DEFAULT_CUSTOM_SECTIONS,
  CustomSection,
  generateTwoFactorCode,
  verifyTwoFactorCode,
  MASTER_2FA_BACKUP_CODE,
  DEFAULT_RESUME_MILESTONES,
  createOwnerSessionSnapshot,
  getChangedOwnerSections,
  hasUnsavedOwnerChanges,
  saveOwnerSessionSnapshot,
  getStoredProjects,
  getStoredProfile,
  getStoredSiteContent,
  getStoredCustomSections,
  getStoredResumeMilestones,
  getStoredResumePdf,
} from './portfolioStorage';
import { ProjectItem } from '../types/portfolio';

const mockProject: ProjectItem = {
  id: 'test-cyber-hub',
  title: 'Test Cyber Hub',
  subtitle: 'Test Subtitle',
  category: 'lighting',
  engine: 'Unreal Engine 5.4',
  role: 'Senior Lighting Artist',
  year: '2025',
  duration: '5 Months',
  featured: true,
  heroType: 'video',
  summary: 'Test summary statement',
  creativeIntent: 'Test intent',
  technicalChallenge: 'Test challenge',
  solution: 'Test solution',
  lightingSetup: {
    keyLight: 'Test Key Light',
    fillBounce: 'Test Bounce',
    volumetricFog: 'Test Fog',
    colorPalette: ['#ffffff', '#000000'],
    exposureEV: 'EV 8.0',
  },
  metrics: [{ label: 'Frametime', value: '16.6ms', detail: 'Target' }],
  passes: [{ id: 'final', name: 'Final', description: 'Desc', type: 'final', accentColor: '#fff' }],
  tags: ['UE5', 'Lighting'],
  dummySceneStyle: 'cyberpunk',
};

test('verifyOwnerCredentials accurately checks owner email and PIN', () => {
  // Correct credentials: email aviz.arts@gmail.com and passcode 5904
  assert.equal(OWNER_EMAIL, 'aviz.arts@gmail.com');
  assert.equal(DEFAULT_OWNER_PIN, '5904');
  assert.equal(verifyOwnerCredentials('aviz.arts@gmail.com', '5904'), true);
  assert.equal(verifyOwnerCredentials('AVIZ.ARTS@GMAIL.COM', '5904'), true);

  // Wrong email
  assert.equal(verifyOwnerCredentials('intruder@gmail.com', '5904'), false);

  // Wrong PIN
  assert.equal(verifyOwnerCredentials('aviz.arts@gmail.com', 'wrongpass123'), false);
});

test('2FA Authenticator app TOTP and one-time code verification operates with high security', async () => {
  const { calculateTotpCode, verifyAuthenticatorAppCode, getOtpAuthUri, getStoredTotpSecret } = await import('./portfolioStorage');

  // Verify Authenticator TOTP calculation
  const currentSecret = getStoredTotpSecret();
  assert.ok(currentSecret.length >= 8);

  const totpCode = await calculateTotpCode(currentSecret);
  assert.equal(totpCode.length, 6);
  assert.ok(/^\d{6}$/.test(totpCode));

  // Verify authenticator app validation with TOTP code
  const isTotpValid = await verifyAuthenticatorAppCode(totpCode);
  assert.equal(isTotpValid, true);

  // Verify otpauth URI formatting for Google Authenticator / Microsoft Authenticator
  const otpUri = getOtpAuthUri();
  assert.ok(otpUri.startsWith('otpauth://totp/'));
  assert.ok(otpUri.includes('secret='));
  assert.ok(otpUri.includes('issuer=Avinash%20Portfolio'));

  // Test one-time dispatch code
  const { code, expiresAt } = generateTwoFactorCode();
  assert.equal(code.length, 6);
  assert.ok(expiresAt > Date.now());

  // Correct dispatch code verifies
  assert.equal(await verifyTwoFactorCode(code), true);

  // Authenticator TOTP code verifies via universal 2FA
  assert.equal(await verifyTwoFactorCode(totpCode), true);

  // Master recovery code verifies
  assert.equal(await verifyTwoFactorCode(MASTER_2FA_BACKUP_CODE), true);
  assert.equal(await verifyTwoFactorCode('590426'), true);
  assert.equal(await verifyTwoFactorCode('5904'), true);

  // Invalid 2FA code rejected
  assert.equal(await verifyTwoFactorCode('000000'), false);
  assert.equal(await verifyTwoFactorCode(''), false);
});

test('createProject adds new project to beginning of array', () => {
  const initial = [mockProject];
  const newProj: ProjectItem = { ...mockProject, id: 'new-project-2', title: 'Second Project' };

  const updated = createProject(newProj, initial);
  assert.equal(updated.length, 2);
  assert.equal(updated[0].id, 'new-project-2');
  assert.equal(updated[1].id, 'test-cyber-hub');
});

test('updateProject modifies existing project fields without mutating others', () => {
  const initial = [mockProject];
  const updated = updateProject(
    'test-cyber-hub',
    { title: 'Updated Title', year: '2026' },
    initial
  );

  assert.equal(updated.length, 1);
  assert.equal(updated[0].title, 'Updated Title');
  assert.equal(updated[0].year, '2026');
  assert.equal(updated[0].engine, 'Unreal Engine 5.4'); // untouched
});

test('deleteProject removes specified project by ID', () => {
  const initial = [mockProject, { ...mockProject, id: 'to-delete' }];
  const updated = deleteProject('to-delete', initial);

  assert.equal(updated.length, 1);
  assert.equal(updated[0].id, 'test-cyber-hub');
});

test('export and import portfolio backup preserves data integrity', () => {
  const projects = [mockProject];
  const backupJson = exportPortfolioBackup(projects, DEFAULT_PROFILE);

  const importResult = importPortfolioBackup(backupJson);
  assert.equal(importResult.success, true);
  assert.ok(importResult.projects);
  assert.equal(importResult.projects.length, 1);
  assert.equal(importResult.projects[0].title, 'Test Cyber Hub');
  assert.equal(importResult.profile?.email, OWNER_EMAIL);

  // Malformed JSON check
  const badResult = importPortfolioBackup('{ broken json ');
  assert.equal(badResult.success, false);
});

test('updateSiteContentKey correctly updates individual site lines', () => {
  const updated = updateSiteContentKey('heroHeadline', 'New Custom Horizon', DEFAULT_SITE_CONTENT);
  assert.equal(updated.heroHeadline, 'New Custom Horizon');
  assert.equal(updated.heroKickerName, DEFAULT_SITE_CONTENT.heroKickerName);
});

test('generateDefaultResumePdfDataUrl produces valid PDF data URI', () => {
  const dataUrl = generateDefaultResumePdfDataUrl();
  assert.ok(dataUrl.startsWith('data:application/pdf;base64,'));
});

test('custom sections CRUD and default avatar verification', () => {
  assert.equal(DEFAULT_AVATAR_URL, '/assets/aistudio/pic_fe23a188.jpg');
  assert.ok(DEFAULT_CUSTOM_SECTIONS.length >= 2);

  const initialSections = [...DEFAULT_CUSTOM_SECTIONS];
  const newSec = {
    id: 'test-section-1',
    tab: 'work' as const,
    kicker: 'Test Kicker',
    title: 'Test Section Title',
    description: 'Test Section Description',
    layout: 'cards' as const,
    visible: true,
    order: 99,
    items: [],
  };

  const withNew = createCustomSection(newSec, initialSections);
  assert.equal(withNew.length, initialSections.length + 1);

  // Test adding a stats section to the resume tab
  const statsSec = {
    id: 'test-stats-resume',
    tab: 'resume' as const,
    kicker: 'PRODUCTION BENCHMARKS',
    title: 'Shipped Releases & Benchmarks',
    description: '4 Titles, 100% Core, 7+ Years, 60 FPS',
    layout: 'stats' as const,
    visible: true,
    order: 100,
    items: [
      { id: 'stat-1', title: '4 Titles', subtitle: 'Shipped Releases', description: '', tag: '' },
      { id: 'stat-2', title: '100% Core', subtitle: 'Game Design Focus', description: '', tag: 'red' },
    ],
  };
  const withStats = createCustomSection(statsSec, withNew);
  const foundStats = withStats.find((s: any) => s.id === 'test-stats-resume');
  assert.equal(foundStats?.layout, 'stats');
  assert.equal(foundStats?.tab, 'resume');
  assert.equal(foundStats?.items.length, 2);

  // Test adding an executive profile callout to the contact tab
  const calloutSec = {
    id: 'test-callout-contact',
    tab: 'contact' as const,
    kicker: 'EXECUTIVE DESIGN PROFILE',
    title: 'Core Philosophy',
    description: 'Professional Game Designer with passion as Lighting Artist',
    layout: 'callout' as const,
    visible: true,
    order: 101,
    items: [],
  };
  const withCallout = createCustomSection(calloutSec, withStats);
  const foundCallout = withCallout.find((s: any) => s.id === 'test-callout-contact');
  assert.equal(foundCallout?.layout, 'callout');
  assert.equal(foundCallout?.tab, 'contact');

  const updated = updateCustomSection('test-section-1', { title: 'Modified Section Title' }, withCallout);
  const found = updated.find((s: any) => s.id === 'test-section-1');
  assert.equal(found?.title, 'Modified Section Title');

  const afterDelete = deleteCustomSection('test-section-1', updated);
  assert.equal(afterDelete.length, initialSections.length + 2);
});

test('built-in section toggles and benchmark fields update accurately in siteContent', async () => {
  const { DEFAULT_SITE_CONTENT, updateSiteContentKey } = await import('./portfolioStorage');
  assert.equal(DEFAULT_SITE_CONTENT.resumeShowBenchmarks, true);
  assert.equal(DEFAULT_SITE_CONTENT.resumeShowExecutiveProfile, true);
  assert.equal(DEFAULT_SITE_CONTENT.resumeBenchmark1Value, '4 Titles');
  assert.equal(DEFAULT_SITE_CONTENT.resumeBenchmark2Value, '100% Core');

  // Toggle benchmark section visibility off
  const hiddenBenchmarks = updateSiteContentKey('resumeShowBenchmarks', 'false', DEFAULT_SITE_CONTENT);
  assert.equal(hiddenBenchmarks.resumeShowBenchmarks, false);

  // Restore benchmark section visibility
  const restoredBenchmarks = updateSiteContentKey('resumeShowBenchmarks', 'true', hiddenBenchmarks);
  assert.equal(restoredBenchmarks.resumeShowBenchmarks, true);

  // Update executive kicker
  const updatedExec = updateSiteContentKey('resumeExecutiveKicker', 'LEAD SYSTEMS ARCHITECT', DEFAULT_SITE_CONTENT);
  assert.equal(updatedExec.resumeExecutiveKicker, 'LEAD SYSTEMS ARCHITECT');
});

test('resume milestones CRUD maintains milestone state and photo links', async () => {
  const {
    DEFAULT_RESUME_MILESTONES,
    createResumeMilestone,
    updateResumeMilestone,
    deleteResumeMilestone,
  } = await import('./portfolioStorage');

  assert.ok(DEFAULT_RESUME_MILESTONES.length >= 3);
  const initial = [...DEFAULT_RESUME_MILESTONES];

  const newMilestone = {
    id: 'test-milestone-99',
    year: '2026',
    role: 'Lead Systems Architect',
    studio: 'Titan Interactive',
    description: 'Core combat pacing and dynamic lighting implementation.',
    achievements: ['Designed 60fps console combat loop', 'Authored VSM lighting pipeline'],
    techStack: ['UE5.4', 'Lumen', 'Blueprints'],
    photoUrl: 'https://example.com/test-milestone.jpg',
    photoCaption: 'Level geometry blockout',
  };

  const added = createResumeMilestone(newMilestone, initial);
  assert.equal(added.length, initial.length + 1);
  assert.equal(added[0].id, 'test-milestone-99');

  const updated = updateResumeMilestone('test-milestone-99', { role: 'Principal Designer' }, added);
  assert.equal(updated[0].role, 'Principal Designer');

  const deleted = deleteResumeMilestone('test-milestone-99', updated);
  assert.equal(deleted.length, initial.length);
});

test('recognized owner device toggles maintain private visibility', async () => {
  const { isRecognizedOwnerDevice, setRecognizedOwnerDevice } = await import('./portfolioStorage');

  // Initial or reset state
  setRecognizedOwnerDevice(false);
  assert.equal(isRecognizedOwnerDevice(), false);

  // Mark as owner's recognized device
  setRecognizedOwnerDevice(true);
  assert.equal(isRecognizedOwnerDevice(), true);

  // Forget device
  setRecognizedOwnerDevice(false);
  assert.equal(isRecognizedOwnerDevice(), false);
});

test('featured social platform URLs (LinkedIn, ArtStation, Instagram) can be updated accurately', () => {
  assert.ok(DEFAULT_SITE_CONTENT.socialLinkedinUrl);
  assert.ok(DEFAULT_SITE_CONTENT.socialArtstationUrl);
  assert.ok(DEFAULT_SITE_CONTENT.socialInstagramUrl);

  const updated1 = updateSiteContentKey('socialLinkedinUrl', 'https://linkedin.com/in/avinash-custom', DEFAULT_SITE_CONTENT);
  assert.equal(updated1.socialLinkedinUrl, 'https://linkedin.com/in/avinash-custom');

  const updated2 = updateSiteContentKey('socialArtstationUrl', 'https://artstation.com/aviz-lighting', updated1);
  assert.equal(updated2.socialArtstationUrl, 'https://artstation.com/aviz-lighting');

  const updated3 = updateSiteContentKey('socialInstagramUrl', 'https://instagram.com/aviz.arts', updated2);
  assert.equal(updated3.socialInstagramUrl, 'https://instagram.com/aviz.arts');
});

test('contactProjectOptions can be updated via array or string lines', () => {
  assert.ok(Array.isArray(DEFAULT_SITE_CONTENT.contactProjectOptions));
  assert.equal(DEFAULT_SITE_CONTENT.contactProjectOptions.length, 5);

  const customList = [
    'Systems & Combat Verbs',
    '3D Arena Encounter Blockout',
    'UE5 Volumetric Lighting',
  ];

  const updatedArray = updateSiteContentKey('contactProjectOptions', customList, DEFAULT_SITE_CONTENT);
  assert.deepEqual(updatedArray.contactProjectOptions, customList);

  const updatedNewline = updateSiteContentKey('contactProjectOptions', 'Option A\nOption B\nOption C', updatedArray);
  assert.deepEqual(updatedNewline.contactProjectOptions, ['Option A', 'Option B', 'Option C']);
});

test('owner session snapshot detects changes across all editable slices and restores baseline cleanly', () => {
  const initialState = createOwnerSessionSnapshot({
    projects: [mockProject],
    profile: DEFAULT_PROFILE,
    siteContent: DEFAULT_SITE_CONTENT,
    customSections: DEFAULT_CUSTOM_SECTIONS,
    resumeMilestones: DEFAULT_RESUME_MILESTONES,
    resumePdf: null,
  });

  // Baseline clone does not share object references
  const current = createOwnerSessionSnapshot(initialState);
  assert.equal(hasUnsavedOwnerChanges(initialState, current), false);
  assert.deepEqual(getChangedOwnerSections(initialState, current), []);
  assert.equal(hasUnsavedOwnerChanges(null, current), false);

  // Modify each slice and confirm accurate detection
  current.siteContent.heroHeadline = 'Edited Headline';
  current.projects[0].title = 'Edited Project Title';
  current.profile.name = 'Avinash R';
  current.customSections[0].title = 'Updated Custom Section';
  current.resumeMilestones[0].role = 'Principal Game Designer';
  current.resumePdf = {
    dataUrl: 'data:application/pdf;base64,AAAA',
    filename: 'Resume_v2.pdf',
    uploadedAt: '2026-11-13T10:00:00.000Z',
    sizeBytes: 1024,
  };

  assert.equal(hasUnsavedOwnerChanges(initialState, current), true);
  const changed = getChangedOwnerSections(initialState, current);
  assert.deepEqual(changed, [
    'Projects & Case Studies',
    'Profile & Bio',
    'Site Copy & Contact Links',
    'Custom Sections',
    'Career Milestones',
    'Resume PDF',
  ]);

  // Save edited snapshot, then restore baseline (simulating Discard Changes)
  saveOwnerSessionSnapshot(current);
  assert.equal(getStoredSiteContent().heroHeadline, 'Edited Headline');
  assert.equal(getStoredResumePdf()?.filename, 'Resume_v2.pdf');

  saveOwnerSessionSnapshot(initialState);
  assert.equal(getStoredSiteContent().heroHeadline, DEFAULT_SITE_CONTENT.heroHeadline);
  assert.equal(getStoredProjects()[0].title, 'Test Cyber Hub');
  assert.equal(getStoredProfile().name, DEFAULT_PROFILE.name);
  assert.equal(getStoredCustomSections()[0].title, DEFAULT_CUSTOM_SECTIONS[0].title);
  assert.equal(getStoredResumeMilestones()[0].role, DEFAULT_RESUME_MILESTONES[0].role);
  assert.equal(getStoredResumePdf(), null);
});

test('custom TOTP secret rotation enforces private 2FA and custom passcode disables factory PIN', async () => {
  const {
    isCustomTotpSecretConfigured,
    generateRandomTotpSecret,
    saveStoredTotpSecret,
    calculateTotpCode,
    verifyTwoFactorCode,
    verifyOwnerPasscode,
    updateOwnerPin,
    verifyOwnerCredentials,
  } = await import('./portfolioStorage');

  assert.equal(isCustomTotpSecretConfigured(), false);
  const rotatedSecret = generateRandomTotpSecret(32);
  assert.equal(rotatedSecret.length, 32);
  assert.ok(/^[A-Z2-7]{32}$/.test(rotatedSecret));

  saveStoredTotpSecret(rotatedSecret);
  assert.equal(isCustomTotpSecretConfigured(), true);

  // Step 1 default PIN '5904' is rejected once custom TOTP secret is active
  assert.equal(await verifyTwoFactorCode('5904'), false);

  // Valid TOTP code generated from the new rotated secret succeeds
  const validCode = await calculateTotpCode(rotatedSecret);
  assert.equal(await verifyTwoFactorCode(validCode), true);

  // Changing passcode replaces factory PIN '5904'
  assert.equal(verifyOwnerPasscode('5904'), true);
  assert.equal(updateOwnerPin('5904', '884422'), true);
  assert.equal(verifyOwnerPasscode('884422'), true);
  assert.equal(verifyOwnerPasscode('5904'), false);
  assert.equal(verifyOwnerCredentials('aviz.arts@gmail.com', '884422'), true);
  assert.equal(verifyOwnerCredentials('aviz.arts@gmail.com', '5904'), false);
});

test('stripUnityReferences and defaults contain zero Unity mentions', async () => {
  const { stripUnityReferences } = await import('./portfolioStorage');
  assert.equal(stripUnityReferences('Unity HDRP Lighting'), 'Unreal Engine 5.4 Lighting');
  assert.equal(stripUnityReferences('Unity C# Prototyping'), 'Unreal Engine Blueprints & C++');
  assert.equal(/\bunity\b/i.test(JSON.stringify(DEFAULT_SITE_CONTENT)), false);
  assert.equal(/\bunity\b/i.test(JSON.stringify(DEFAULT_PROFILE)), false);
  assert.equal(/\bunity\b/i.test(JSON.stringify(DEFAULT_RESUME_MILESTONES)), false);
});

test('dynamic resolvers and synchronized per-tab visibility flags work cleanly', async () => {
  const {
    resolveLevelCards,
    resolveAboutStats,
    resolveResumeBenchmarks,
    resolveResumeSkills,
    resolveResumeEducation,
  } = await import('./portfolioStorage');

  assert.equal(resolveLevelCards(DEFAULT_SITE_CONTENT).length, 3);
  assert.equal(resolveAboutStats(DEFAULT_SITE_CONTENT, DEFAULT_PROFILE).length, 4);
  assert.equal(resolveResumeBenchmarks(DEFAULT_SITE_CONTENT).length, 4);
  assert.equal(resolveResumeSkills(DEFAULT_SITE_CONTENT).length, 4);
  assert.equal(resolveResumeEducation(DEFAULT_SITE_CONTENT).length, 1);

  const toggled = updateSiteContentKey('workShowReelPlayer', false, DEFAULT_SITE_CONTENT);
  assert.equal(toggled.workShowReelPlayer, false);
  const restored = updateSiteContentKey('workShowReelPlayer', 'true', toggled);
  assert.equal(restored.workShowReelPlayer, true);

  const customStats = updateSiteContentKey(
    'aboutStats',
    [{ id: 's1', value: '5 Titles', label: 'Shipped', detail: 'Console & PC' }],
    restored
  );
  assert.equal(resolveAboutStats(customStats, DEFAULT_PROFILE).length, 1);
});

