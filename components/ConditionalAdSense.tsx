'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { canLoadAds, waitForConsent } from '@/lib/consent/googleCmp';
import { shouldLoadAdsOnPage, hasPageContent } from '@/lib/adsense/contentCheck';

const ADSENSE_CLIENT_ID = 'ca-pub-8312977389353751';

/**
 * Conditionally loads AdSense script only after consent is granted
 * and only on pages with sufficient content.
 * 
 * Prevents "ads on screens without publisher content" violations by:
 * 1. Checking route-based exclusions
 * 2. Verifying page has actual content
 * 3. Waiting for consent (EEA/UK/CH users)
 */
export default function ConditionalAdSense() {
  const [shouldLoadAds, setShouldLoadAds] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // First check: Is this route allowed to have ads?
    if (!shouldLoadAdsOnPage(pathname)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AdSense] Route blocked:', pathname);
      }
      return;
    }

    // Second check: Does the page have content?
    // Wait a bit for content to load, then check multiple times
    let attempts = 0;
    const maxAttempts = 5; // Check up to 5 times (2.5 seconds total)
    
    const checkContent = setInterval(() => {
      attempts++;
      
      // Check if page has content
      if (!hasPageContent()) {
        if (attempts >= maxAttempts) {
          // After max attempts, give up
          if (process.env.NODE_ENV === 'development') {
            console.log('[AdSense] Page has no content after', attempts, 'attempts, blocking ads');
          }
          clearInterval(checkContent);
        }
        return;
      }

      // Content found! Now check consent
      clearInterval(checkContent);
      
      // Third check: Consent check
      if (canLoadAds()) {
        setShouldLoadAds(true);
        return;
      }

      // Wait for consent to be granted
      waitForConsent().then((canLoad) => {
        // Final content check before loading ads
        if (canLoad && hasPageContent()) {
          setShouldLoadAds(true);
        } else if (process.env.NODE_ENV === 'development') {
          console.log('[AdSense] Consent not granted or no content, ads will not load');
        }
      });
    }, 500); // Check every 500ms

    return () => clearInterval(checkContent);
  }, [pathname]);

  // Only load AdSense script if all checks pass
  if (!shouldLoadAds) {
    return null;
  }

  return (
    <Script
      id="google-adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}

