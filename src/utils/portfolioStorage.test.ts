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
  // Correct credentials
  assert.equal(verifyOwnerCredentials(OWNER_EMAIL, DEFAULT_OWNER_PIN), true);
  assert.equal(verifyOwnerCredentials('AVIZ.ARTS@GMAIL.COM', DEFAULT_OWNER_PIN), true);

  // Wrong email
  assert.equal(verifyOwnerCredentials('intruder@gmail.com', DEFAULT_OWNER_PIN), false);

  // Wrong PIN
  assert.equal(verifyOwnerCredentials(OWNER_EMAIL, 'wrongpass123'), false);
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


