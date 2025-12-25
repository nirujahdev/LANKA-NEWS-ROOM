// Dynamic layout assignment system for news cards

export type LayoutType = 'featured' | 'grid' | 'list' | 'widget' | 'compact' | 'mixed';

export interface LayoutAssignment {
  layout: LayoutType;
  span?: number; // For grid layouts, how many columns to span
}

/**
 * Assigns layout type based on article position, importance, and context
 */
export function assignLayout(
  position: number,
  sourceCount: number = 0,
  isRecent: boolean = false
): LayoutAssignment {
  // Position 0: Always featured (first article)
  if (position === 0) {
    return { layout: 'featured' };
  }

  // Positions 1-2: Grid layout (2-column grid)
  if (position >= 1 && position <= 2) {
    return { layout: 'grid', span: 1 };
  }

  // Positions 3-5: List layout (standard list)
  if (position >= 3 && position <= 5) {
    return { layout: 'list' };
  }

  // Position 6: Widget layout (compact)
  if (position === 6) {
    return { layout: 'widget' };
  }

  // Positions 7-8: Grid layout again (2-column grid)
  if (position >= 7 && position <= 8) {
    return { layout: 'grid', span: 1 };
  }

  // Positions 9-11: List layout
  if (position >= 9 && position <= 11) {
    return { layout: 'list' };
  }

  // Every 6th position after 12: Mixed layout (for clusters)
  if (position >= 12 && position % 6 === 0) {
    return { layout: 'mixed' };
  }

  // Positions 13-15: Grid layout
  if (position >= 13 && position <= 15) {
    return { layout: 'grid', span: 1 };
  }

  // High source count (important story): Featured or Grid
  if (sourceCount >= 5 && position < 20) {
    if (position % 3 === 0) {
      return { layout: 'featured' };
    }
    return { layout: 'grid', span: 1 };
  }

  // Recent articles: Prefer grid or featured
  if (isRecent && position < 10) {
    if (position % 4 === 0) {
      return { layout: 'featured' };
    }
    return { layout: 'grid', span: 1 };
  }

  // Default: List layout
  return { layout: 'list' };
}

/**
 * Groups articles for grid layouts
 */
export function groupForGrid(assignments: LayoutAssignment[]): number[][] {
  const groups: number[][] = [];
  let currentGroup: number[] = [];

  assignments.forEach((assignment, index) => {
    if (assignment.layout === 'grid') {
      currentGroup.push(index);
      if (currentGroup.length === 2) {
        groups.push(currentGroup);
        currentGroup = [];
      }
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

