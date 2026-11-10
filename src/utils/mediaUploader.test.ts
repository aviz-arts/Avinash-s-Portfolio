import test from 'node:test';
import assert from 'node:assert/strict';
import { formatFileSize } from './mediaUploader';

test('formatFileSize converts byte values to appropriate suffixes', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(500), '500 B');
  assert.equal(formatFileSize(1024), '1 KB');
  assert.equal(formatFileSize(1536), '1.5 KB');
  assert.equal(formatFileSize(1024 * 1024), '1 MB');
  assert.equal(formatFileSize(1024 * 1024 * 15.5), '15.5 MB');
});
