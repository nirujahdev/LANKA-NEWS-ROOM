'use client';

import { useEffect } from 'react';
import { initializeGoogleCMP } from '@/lib/consent/googleCmp';

/**
 * Google CMP Component
 * 
 * Initializes Google Funding Choices and Consent Mode v2
 * Should be placed in the root layout
 */
export default function GoogleCMP() {
  useEffect(() => {
    // Initialize CMP on client-side only
    initializeGoogleCMP().catch((error) => {
      console.error('[CMP] Failed to initialize:', error);
    });
  }, []);

  return null; // This component doesn't render anything
}

