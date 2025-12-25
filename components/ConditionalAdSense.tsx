'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { canLoadAds, waitForConsent } from '@/lib/consent/googleCmp';

const ADSENSE_CLIENT_ID = 'ca-pub-8312977389353751';

/**
 * Conditionally loads AdSense script only after consent is granted
 * For EEA/UK/CH users, this prevents ads from loading before consent
 */
export default function ConditionalAdSense() {
  const [shouldLoadAds, setShouldLoadAds] = useState(false);

  useEffect(() => {
    // Check if ads can be loaded immediately
    if (canLoadAds()) {
      setShouldLoadAds(true);
      return;
    }

    // Wait for consent to be granted
    waitForConsent().then((canLoad) => {
      if (canLoad) {
        setShouldLoadAds(true);
      } else if (process.env.NODE_ENV === 'development') {
        console.log('[AdSense] Consent not granted, ads will not load');
      }
    });
  }, []);

  // Only load AdSense script if consent is granted
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

