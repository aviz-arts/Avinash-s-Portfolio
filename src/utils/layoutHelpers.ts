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

  if (variant === 'split') {
    return 'grid grid-cols-1 md:grid-cols-2 gap-5';
  }

  if (variant === 'tools') {
    if (itemCount === 3) return 'grid grid-cols-1 md:grid-cols-3 gap-5';
    return 'grid grid-cols-1 md:grid-cols-2 gap-5';
  }

  if (variant === 'stats') {
    if (itemCount === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-4';
    if (itemCount === 3) return 'grid grid-cols-1 sm:grid-cols-3 gap-4';
    if (itemCount === 5) return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4';
    if (itemCount === 6) return 'grid grid-cols-2 sm:grid-cols-3 gap-4';
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

/**
 * Zero-orphan responsive grid container helper: guarantees every row fills
 * 100% edge-to-edge with equal height rows and zero trailing negative space.
 */
export function getBalancedContainerClass(
  itemCount: number,
  variant: 'cards' | 'split' | 'stats' | 'tools' = 'cards'
): string {
  const gap = variant === 'stats' ? 'gap-4' : variant === 'tools' ? 'gap-5' : 'gap-6';
  if (itemCount <= 1) {
    return `grid grid-cols-1 ${gap} auto-rows-fr`;
  }

  if (variant === 'split') {
    return `grid grid-cols-1 md:grid-cols-2 ${gap} auto-rows-fr`;
  }

  if (variant === 'stats') {
    if (itemCount === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr';
    if (itemCount === 3) return 'grid grid-cols-1 sm:grid-cols-3 gap-4 auto-rows-fr';
    if (itemCount === 4) return 'grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr';
    return 'grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-fr';
  }

  if (variant === 'tools') {
    if (itemCount === 2 || itemCount === 4) {
      return 'grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-fr';
    }
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5 auto-rows-fr';
  }

  // 'cards'
  if (itemCount === 2) {
    return 'grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr';
  }
  if (itemCount === 4) {
    return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-fr';
  }
  return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 auto-rows-fr';
}

/**
 * Computes exact responsive column spans for each item inside `getBalancedContainerClass`
 * so odd remainders (e.g. 3rd card on tablet or 4th/5th cards on desktop) fill their row cleanly.
 */
export function getBalancedItemSpanClass(
  index: number,
  itemCount: number,
  variant: 'cards' | 'split' | 'stats' | 'tools' = 'cards'
): string {
  if (itemCount <= 1) {
    return 'h-full';
  }

  if (variant === 'split') {
    if (itemCount % 2 === 1 && index === itemCount - 1) {
      return 'md:col-span-2 h-full';
    }
    return 'h-full';
  }

  if (variant === 'stats') {
    if (itemCount <= 4) {
      return 'h-full';
    }
    const baseSpan = itemCount % 2 === 1 && index === itemCount - 1 ? 'col-span-2' : 'col-span-1';

    let smSpan = 'sm:col-span-2';
    const smRem = itemCount % 3;
    if (smRem === 1 && index >= itemCount - 4) {
      smSpan = 'sm:col-span-3';
    } else if (smRem === 2 && index >= itemCount - 2) {
      smSpan = 'sm:col-span-3';
    }

    let lgSpan = 'lg:col-span-3';
    if (itemCount === 5) {
      lgSpan = index < 3 ? 'lg:col-span-4' : 'lg:col-span-6';
    } else if (itemCount === 6) {
      lgSpan = 'lg:col-span-4';
    } else {
      const lgRem = itemCount % 4;
      if (lgRem === 1 && index >= itemCount - 9) {
        lgSpan = index < itemCount - 3 ? 'lg:col-span-4' : 'lg:col-span-4';
      } else if (lgRem === 2 && index >= itemCount - 2) {
        lgSpan = 'lg:col-span-6';
      } else if (lgRem === 3 && index >= itemCount - 3) {
        lgSpan = 'lg:col-span-4';
      }
      if (lgRem === 1 && itemCount > 5) {
        // Pair 3 + 2 on the tail rows so every row equals 12 cols cleanly
        lgSpan = index >= itemCount - 5 && index < itemCount - 2
          ? 'lg:col-span-4'
          : index >= itemCount - 2
          ? 'lg:col-span-6'
          : 'lg:col-span-3';
      }
    }

    return `${baseSpan} ${smSpan} ${lgSpan} h-full`;
  }

  // 'cards' and 'tools'
  if (itemCount === 2 || itemCount === 4) {
    return 'h-full';
  }

  const mdSpan =
    itemCount % 2 === 1 && index === itemCount - 1 ? 'md:col-span-2' : 'md:col-span-1';

  const lgRem = itemCount % 3;
  let lgSpan = 'lg:col-span-2';
  if (lgRem === 2 && index >= itemCount - 2) {
    lgSpan = 'lg:col-span-3';
  } else if (lgRem === 1 && index >= itemCount - 4) {
    lgSpan = 'lg:col-span-3';
  }

  return `${mdSpan} ${lgSpan} h-full`;
}
