import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAdaptiveGridClass,
  getBalancedContainerClass,
  getBalancedItemSpanClass,
} from './layoutHelpers';

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

test('getBalancedContainerClass and getBalancedItemSpanClass fill rows cleanly with zero orphan gaps', () => {
  // Split odd remainder spans full 2-col row on last item
  assert.match(getBalancedItemSpanClass(2, 3, 'split'), /md:col-span-2/);
  assert.doesNotMatch(getBalancedItemSpanClass(0, 3, 'split'), /md:col-span-2/);

  // 5 cards in 6-col desktop grid: 3 top (span-2 each = 6) + 2 bottom (span-3 each = 6)
  assert.match(getBalancedContainerClass(5, 'cards'), /lg:grid-cols-6/);
  assert.match(getBalancedItemSpanClass(0, 5, 'cards'), /lg:col-span-2/);
  assert.match(getBalancedItemSpanClass(3, 5, 'cards'), /lg:col-span-3/);
  assert.match(getBalancedItemSpanClass(4, 5, 'cards'), /lg:col-span-3/);

  // 5 stats in 12-col desktop grid: 3 top (span-4 = 12) + 2 bottom (span-6 = 12)
  assert.match(getBalancedContainerClass(5, 'stats'), /lg:grid-cols-12/);
  assert.match(getBalancedItemSpanClass(0, 5, 'stats'), /lg:col-span-4/);
  assert.match(getBalancedItemSpanClass(4, 5, 'stats'), /lg:col-span-6/);
});
