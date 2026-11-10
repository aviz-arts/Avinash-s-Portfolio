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

  const updated = updateCustomSection('test-section-1', { title: 'Modified Section Title' }, withNew);
  const found = updated.find((s: any) => s.id === 'test-section-1');
  assert.equal(found?.title, 'Modified Section Title');

  const afterDelete = deleteCustomSection('test-section-1', updated);
  assert.equal(afterDelete.length, initialSections.length);
});


