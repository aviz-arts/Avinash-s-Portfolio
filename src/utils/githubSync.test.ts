import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPortfolioDataDocument,
  createDataJsonExportString,
  decodeBase64Utf8,
  encodeBase64Utf8,
  isValidPortfolioDocument,
  parseDataJsonImportString,
  parseGitHubRepoSlug,
  snapshotFromPortfolioDocument,
} from './githubSync';
import {
  DEFAULT_CUSTOM_SECTIONS,
  DEFAULT_PROFILE,
  DEFAULT_RESUME_MILESTONES,
  DEFAULT_SITE_CONTENT,
  OwnerSessionSnapshot,
} from './portfolioStorage';
import { PORTFOLIO_PROJECTS } from '../data/portfolioData';

function makeSnapshot(overrides?: Partial<OwnerSessionSnapshot>): OwnerSessionSnapshot {
  return {
    projects: PORTFOLIO_PROJECTS,
    profile: DEFAULT_PROFILE,
    siteContent: DEFAULT_SITE_CONTENT,
    customSections: DEFAULT_CUSTOM_SECTIONS,
    resumeMilestones: DEFAULT_RESUME_MILESTONES,
    resumePdf: null,
    ...overrides,
  };
}

test('parseGitHubRepoSlug handles owner/repo, full GitHub URLs, and separate owner values', () => {
  assert.deepEqual(parseGitHubRepoSlug('avinash/portfolio'), {
    owner: 'avinash',
    repo: 'portfolio',
  });
  assert.deepEqual(parseGitHubRepoSlug('https://github.com/avinash/portfolio.git'), {
    owner: 'avinash',
    repo: 'portfolio',
  });
  assert.deepEqual(parseGitHubRepoSlug('portfolio', 'avinash'), {
    owner: 'avinash',
    repo: 'portfolio',
  });
});

test('encodeBase64Utf8 and decodeBase64Utf8 preserve Unicode portfolio characters', () => {
  const sample = 'Avinash · Game Designer — Lumen GI 45° · → Ready';
  const encoded = encodeBase64Utf8(sample);
  const decoded = decodeBase64Utf8(encoded);
  assert.equal(decoded, sample);
});

test('buildPortfolioDataDocument and isValidPortfolioDocument validate data.json shape', () => {
  const snap = makeSnapshot({
    siteContent: {
      ...DEFAULT_SITE_CONTENT,
      heroHeadline: 'Committed directly to data.json',
    },
  });
  const doc = buildPortfolioDataDocument(snap, 1765000000000);
  assert.equal(doc.version, 1);
  assert.equal(doc.updatedAt, 1765000000000);
  assert.equal(doc.siteContent.heroHeadline, 'Committed directly to data.json');
  assert.equal(isValidPortfolioDocument(doc), true);
  assert.equal(isValidPortfolioDocument(null), false);
  assert.equal(isValidPortfolioDocument({ projects: [] }), false);

  const restoredSnap = snapshotFromPortfolioDocument(doc);
  assert.equal(restoredSnap.siteContent.heroHeadline, 'Committed directly to data.json');
});

test('createDataJsonExportString and parseDataJsonImportString round-trip accurately', () => {
  const snap = makeSnapshot({
    siteContent: {
      ...DEFAULT_SITE_CONTENT,
      contactPhone: '+91 9000011111',
    },
  });
  const exported = createDataJsonExportString(snap, 1765111111111);
  const parsed = parseDataJsonImportString(exported);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data?.updatedAt, 1765111111111);
  assert.equal(parsed.data?.siteContent.contactPhone, '+91 9000011111');

  assert.equal(parseDataJsonImportString('').ok, false);
  assert.equal(parseDataJsonImportString('{ bad json').ok, false);
});
