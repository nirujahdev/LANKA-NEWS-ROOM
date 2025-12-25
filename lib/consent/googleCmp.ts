/**
 * Google CMP (Funding Choices) Consent Management Platform
 * 
 * This module handles:
 * - Google Funding Choices CMP script injection
 * - Consent Mode v2 initialization
 * - Region detection (EEA, UK, Switzerland)
 * - Safe ad loading based on consent
 * 
 * Usage:
 * 1. Call `initializeGoogleCMP()` in your root layout or _app
 * 2. Ensure AdSense script only loads after consent is granted
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_GOOGLE_FUNDING_CHOICES_PUBLISHER_ID: Your Funding Choices Publisher ID from AdSense
 */

import type { ConsentState } from './types';

// EEA countries + UK + Switzerland (ISO 3166-1 alpha-2 codes)
const CONSENT_REQUIRED_REGIONS = new Set([
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
  'GB', // United Kingdom
  'CH', // Switzerland
]);

// Google Funding Choices Publisher ID (replace with your actual ID from AdSense)
const FUNDING_CHOICES_PUBLISHER_ID = process.env.NEXT_PUBLIC_GOOGLE_FUNDING_CHOICES_PUBLISHER_ID || '';

// Consent state type
export type ConsentState = 'granted' | 'denied' | 'pending';

// Region detection result
interface RegionInfo {
  countryCode: string | null;
  requiresConsent: boolean;
}

/**
 * Detect user's region from server-side headers (Cloudflare/Vercel)
 * Falls back to client-side detection if headers not available
 */
export async function detectRegion(): Promise<RegionInfo> {
  // Try server-side detection first (if available via headers)
  if (typeof window === 'undefined') {
    // Server-side: check for Cloudflare CF-IPCountry header or similar
    // This would need to be passed from middleware or API route
    return { countryCode: null, requiresConsent: false };
  }

  // Client-side fallback: use lightweight IP geolocation
  try {
    // Option 1: Use a free IP geolocation service (lightweight)
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      const countryCode = data.country_code || null;
      const requiresConsent = countryCode ? CONSENT_REQUIRED_REGIONS.has(countryCode) : false;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[CMP] Region detected:', { countryCode, requiresConsent });
      }
      
      return { countryCode, requiresConsent };
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CMP] Region detection failed, defaulting to no consent required:', error);
    }
  }

  // Default: assume non-EEA (no consent required)
  return { countryCode: null, requiresConsent: false };
}

/**
 * Initialize Consent Mode v2 with default values
 * Must be called BEFORE any Google tags load
 */
export function initializeConsentMode(requiresConsent: boolean): void {
  if (typeof window === 'undefined') return;

  // Initialize gtag dataLayer if it doesn't exist
  window.dataLayer = window.dataLayer || [];

  // Set default consent state
  const defaultConsent = requiresConsent ? 'denied' : 'granted';

  window.dataLayer.push({
    'event': 'consent',
    'consent': {
      'ad_storage': defaultConsent,
      'analytics_storage': defaultConsent,
      'ad_user_data': defaultConsent,
      'ad_personalization': defaultConsent,
      'functionality_storage': 'granted', // Required for site functionality
      'personalization_storage': defaultConsent,
      'security_storage': 'granted', // Required for security
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('[CMP] Consent Mode v2 initialized:', { defaultConsent, requiresConsent });
  }
}

/**
 * Update consent state after user interaction
 */
export function updateConsentState(consent: ConsentState): void {
  if (typeof window === 'undefined') return;

  const consentValue = consent === 'granted' ? 'granted' : 'denied';

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'consent',
    'consent': {
      'ad_storage': consentValue,
      'analytics_storage': consentValue,
      'ad_user_data': consentValue,
      'ad_personalization': consentValue,
      'functionality_storage': 'granted',
      'personalization_storage': consentValue,
      'security_storage': 'granted',
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('[CMP] Consent state updated:', consentValue);
  }
}

/**
 * Inject Google Funding Choices CMP script
 * Only loads if region requires consent
 */
export function injectFundingChoicesScript(publisherId: string): void {
  if (typeof window === 'undefined') return;
  if (!publisherId) {
    console.warn('[CMP] Funding Choices Publisher ID not configured');
    return;
  }

  // Check if script already exists
  const existingScript = document.querySelector('script[src*="fundingchoicesmessages"]');
  if (existingScript) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[CMP] Funding Choices script already loaded');
    }
    return;
  }

  // Create and inject script
  const script = document.createElement('script');
  script.src = `https://fundingchoicesmessages.google.com/i/${publisherId}?ers=1`;
  script.async = true;
  script.crossOrigin = 'anonymous';
  
  script.onload = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[CMP] Funding Choices script loaded');
    }
  };

  script.onerror = () => {
    console.error('[CMP] Failed to load Funding Choices script');
  };

  document.head.appendChild(script);
}

/**
 * Initialize Google CMP
 * Call this in your root layout or _app
 */
export async function initializeGoogleCMP(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Detect region
  const regionInfo = await detectRegion();

  // Initialize Consent Mode v2 with defaults
  initializeConsentMode(regionInfo.requiresConsent);

  // Only inject Funding Choices if consent is required
  if (regionInfo.requiresConsent && FUNDING_CHOICES_PUBLISHER_ID) {
    injectFundingChoicesScript(FUNDING_CHOICES_PUBLISHER_ID);

    // Listen for consent updates from Funding Choices
    // Funding Choices will call window.googlefc.adsbygoogle.push() when consent changes
    // We need to wait for the script to load before setting up the callback
    const setupFundingChoicesCallback = () => {
      if (window.googlefc) {
        window.googlefc.adsbygoogle = window.googlefc.adsbygoogle || [];
        window.googlefc.adsbygoogle.push({
          'event': 'consent',
          'callback': (consent: ConsentState) => {
            const consentState: ConsentState = 
              consent.ad_storage === 'granted' ? 'granted' : 'denied';
            updateConsentState(consentState);
            
            // Trigger custom event for ad loading
            window.dispatchEvent(new CustomEvent('consent-updated', { 
              detail: { consent: consentState } 
            }));
          }
        });
      } else {
        // Retry after a short delay if googlefc not ready
        setTimeout(setupFundingChoicesCallback, 100);
      }
    };
    
    // Wait a bit for Funding Choices to initialize
    setTimeout(setupFundingChoicesCallback, 500);
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[CMP] Consent not required for this region, skipping Funding Choices');
  }
}

/**
 * Check if ads can be loaded (consent granted or not required)
 */
export function canLoadAds(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if consent mode is set
  const dataLayer = window.dataLayer || [];
  const consentEvent = dataLayer.find((item: any) => item.event === 'consent');
  
  if (!consentEvent) return false;
  
  // If ad_storage is granted, ads can load
  return consentEvent.consent?.ad_storage === 'granted';
}

/**
 * Wait for consent to be granted before loading ads
 * Returns a promise that resolves when consent is granted or not required
 */
export function waitForConsent(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    // Check current consent state
    if (canLoadAds()) {
      resolve(true);
      return;
    }

    // Listen for consent updates
    const handleConsentUpdate = () => {
      if (canLoadAds()) {
        window.removeEventListener('consent-updated', handleConsentUpdate);
        resolve(true);
      }
    };

    window.addEventListener('consent-updated', handleConsentUpdate);

    // Timeout after 10 seconds (user might not interact)
    setTimeout(() => {
      window.removeEventListener('consent-updated', handleConsentUpdate);
      resolve(canLoadAds());
    }, 10000);
  });
}

