import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearStoredCloudSyncCredentials,
  createSyncPackageString,
  extractGistId,
  isValidSnapshotPayload,
  parseSyncPackageString,
  preparePortableCloudSnapshot,
  resolveEffectiveCloudGistId,
  saveStoredCloudSyncCredentials,
} from './cloudSync';
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

test('extractGistId handles raw Gist IDs, full URLs, and whitespace safely', () => {
  const sampleId = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
  assert.equal(extractGistId(sampleId), sampleId);
  assert.equal(extractGistId(`  https://gist.github.com/avinash/${sampleId}  `), sampleId);
  assert.equal(extractGistId(`https://gist.github.com/${sampleId}`), sampleId);
  assert.equal(extractGistId(''), '');
});

test('isValidSnapshotPayload validates complete portfolio structure', () => {
  const valid = makeSnapshot();
  assert.equal(isValidSnapshotPayload(valid), true);
  assert.equal(isValidSnapshotPayload(null), false);
  assert.equal(isValidSnapshotPayload({ projects: [] }), false);
  assert.equal(
    isValidSnapshotPayload({ ...valid, customSections: 'not-an-array' }),
    false
  );
});

test('createSyncPackageString and parseSyncPackageString round-trip accurately', () => {
  const snap = makeSnapshot({
    siteContent: {
      ...DEFAULT_SITE_CONTENT,
      heroHeadline: 'Custom Vercel Edit Replicated Everywhere',
    },
  });
  const ts = 1765000000000;
  const serialized = createSyncPackageString(snap, ts);
  const parsed = parseSyncPackageString(serialized);

  assert.equal(parsed.ok, true);
  assert.equal(parsed.publishedAt, ts);
  assert.equal(parsed.snapshot?.siteContent.heroHeadline, 'Custom Vercel Edit Replicated Everywhere');

  const invalidJson = parseSyncPackageString('{ broken json');
  assert.equal(invalidJson.ok, false);

  const empty = parseSyncPackageString('   ');
  assert.equal(empty.ok, false);
});

test('resolveEffectiveCloudGistId prioritizes stored credentials then siteContent', () => {
  clearStoredCloudSyncCredentials();
  const contentGist = '11112222333344445555666677778888';
  assert.equal(resolveEffectiveCloudGistId({ cloudSyncGistId: contentGist }), contentGist);

  const storedGist = 'aaaabbbbccccddddeeeeffff11112222';
  saveStoredCloudSyncCredentials({ gistId: storedGist, githubToken: 'ghp_testtoken' });
  assert.equal(resolveEffectiveCloudGistId({ cloudSyncGistId: contentGist }), storedGist);
  clearStoredCloudSyncCredentials();
});

test('preparePortableCloudSnapshot isolates mutations and injects cloudSyncGistId', async () => {
  const orig = makeSnapshot();
  const targetGist = '99998888777766665555444433332222';
  const { portable, warnings } = await preparePortableCloudSnapshot(orig, targetGist);

  assert.deepEqual(warnings, []);
  assert.equal(portable.siteContent.cloudSyncGistId, targetGist);
  assert.notEqual(orig.siteContent.cloudSyncGistId, targetGist);
});
