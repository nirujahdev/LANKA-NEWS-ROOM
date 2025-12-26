'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-4NNMYY2D1H';

/**
 * Google Analytics Component
 * 
 * Loads Google Analytics (gtag.js) with consent mode support
 * Note: Consent mode is initialized by GoogleCMP component before this loads
 */
export default function GoogleAnalytics() {
  return (
    <>
      {/* Google tag (gtag.js) - Deferred to reduce main thread blocking */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
        async
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}

