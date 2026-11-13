/**
 * Pure adaptive grid class helpers so sections automatically align and balance
 * cleanly without empty column holes whenever items or cards are added/removed.
 */
export function getAdaptiveGridClass(
  itemCount: number,
  variant: 'cards' | 'split' | 'stats' | 'tools' = 'cards'
): string {
  if (itemCount <= 1) {
    return 'grid grid-cols-1 gap-6';
  }

  if (variant === 'split' || variant === 'tools') {
    return 'grid grid-cols-1 md:grid-cols-2 gap-5';
  }

  if (variant === 'stats') {
    if (itemCount === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-4';
    if (itemCount === 3) return 'grid grid-cols-1 sm:grid-cols-3 gap-4';
    return 'grid grid-cols-2 md:grid-cols-4 gap-4';
  }

  // 'cards' layout
  if (itemCount === 2) {
    return 'grid grid-cols-1 md:grid-cols-2 gap-6';
  }
  if (itemCount === 4) {
    return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6';
  }
  return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
}
