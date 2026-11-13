import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdaptiveGridClass } from './layoutHelpers';

test('getAdaptiveGridClass returns single-column layout for 0 or 1 items', () => {
  assert.equal(getAdaptiveGridClass(0, 'cards'), 'grid grid-cols-1 gap-6');
  assert.equal(getAdaptiveGridClass(1, 'cards'), 'grid grid-cols-1 gap-6');
  assert.equal(getAdaptiveGridClass(1, 'tools'), 'grid grid-cols-1 gap-6');
  assert.equal(getAdaptiveGridClass(1, 'stats'), 'grid grid-cols-1 gap-6');
});

test('getAdaptiveGridClass balances cards for 2, 3, 4, and 5+ items', () => {
  assert.equal(getAdaptiveGridClass(2, 'cards'), 'grid grid-cols-1 md:grid-cols-2 gap-6');
  assert.equal(getAdaptiveGridClass(3, 'cards'), 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6');
  assert.equal(getAdaptiveGridClass(4, 'cards'), 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6');
  assert.equal(getAdaptiveGridClass(5, 'cards'), 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6');
});

test('getAdaptiveGridClass balances split and tools variants cleanly', () => {
  assert.equal(getAdaptiveGridClass(2, 'split'), 'grid grid-cols-1 md:grid-cols-2 gap-5');
  assert.equal(getAdaptiveGridClass(3, 'tools'), 'grid grid-cols-1 md:grid-cols-3 gap-5');
  assert.equal(getAdaptiveGridClass(4, 'tools'), 'grid grid-cols-1 md:grid-cols-2 gap-5');
});

test('getAdaptiveGridClass balances stats KPI strips across counts', () => {
  assert.equal(getAdaptiveGridClass(2, 'stats'), 'grid grid-cols-1 sm:grid-cols-2 gap-4');
  assert.equal(getAdaptiveGridClass(3, 'stats'), 'grid grid-cols-1 sm:grid-cols-3 gap-4');
  assert.equal(getAdaptiveGridClass(4, 'stats'), 'grid grid-cols-2 md:grid-cols-4 gap-4');
  assert.equal(getAdaptiveGridClass(5, 'stats'), 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4');
  assert.equal(getAdaptiveGridClass(6, 'stats'), 'grid grid-cols-2 sm:grid-cols-3 gap-4');
});
