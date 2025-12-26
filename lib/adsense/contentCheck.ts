/**
 * Content check utility for AdSense
 * 
 * Prevents AdSense from loading on pages without sufficient content
 * This helps avoid "ads on screens without publisher content" violations
 */

/**
 * Check if the current page has sufficient content to display ads
 * @param pathname - Current page pathname
 * @returns true if page should have ads, false otherwise
 */
export function shouldLoadAdsOnPage(pathname: string): boolean {
  // Never load ads on these routes (error pages, empty states, etc.)
  const blockedRoutes = [
    '/404',
    '/500',
    '/error',
    '/_error',
    '/api/',
    '/admin/',
  ];

  // Check if pathname matches any blocked route
  if (blockedRoutes.some(route => pathname.startsWith(route))) {
    return false;
  }

  // Allow ads on content pages
  return true;
}

/**
 * Check if page has actual content loaded
 * This is a client-side check that can be used in components
 */
export function hasPageContent(): boolean {
  if (typeof window === 'undefined') {
    return true; // Server-side, assume content exists
  }

  // First check: Block ads if page is in loading or error state
  const loadingIndicators = [
    '[data-loading="true"]',
    '.loading',
    '.error-state',
    '[data-error="true"]',
  ];

  for (const selector of loadingIndicators) {
    if (document.querySelector(selector)) {
      return false;
    }
  }

  // Second check: Look for actual content
  const contentSelectors = [
    '[data-news-content]',
    '[data-story-content]',
    'article',
    '.news-card',
    '.story-detail',
    'main article',
  ];

  // Check if any content elements exist with sufficient text
  for (const selector of contentSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      // Check if elements have actual text content
      for (const el of Array.from(elements)) {
        const text = el.textContent?.trim() || '';
        if (text.length > 100) { // Minimum content threshold (100 characters)
          return true;
        }
      }
    }
  }

  // Third check: Look for main content area with text
  const mainContent = document.querySelector('main');
  if (mainContent) {
    const mainText = mainContent.textContent?.trim() || '';
    if (mainText.length > 200) { // Main content should have substantial text
      return true;
    }
  }

  // Default: If we can't find content, don't load ads (safer approach)
  return false;
}

