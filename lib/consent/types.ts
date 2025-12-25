/**
 * TypeScript types for Google CMP and Consent Mode v2
 */

export interface ConsentState {
  ad_storage?: 'granted' | 'denied';
  analytics_storage?: 'granted' | 'denied';
  ad_user_data?: 'granted' | 'denied';
  ad_personalization?: 'granted' | 'denied';
  functionality_storage?: 'granted' | 'denied';
  personalization_storage?: 'granted' | 'denied';
  security_storage?: 'granted' | 'denied';
}

export interface ConsentEvent {
  event: 'consent';
  consent: ConsentState;
}

declare global {
  interface Window {
    dataLayer?: any[];
    googlefc?: {
      adsbygoogle?: Array<{
        event?: string;
        callback?: (consent: ConsentState) => void;
      }>;
    };
  }
}

