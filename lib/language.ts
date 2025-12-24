type LangCode = 'en' | 'si' | 'ta' | 'unk';

const sinhalaRange = /[\u0D80-\u0DFF]/;
const tamilRange = /[\u0B80-\u0BFF]/;

export function detectLanguage(text?: string | null): LangCode {
  if (!text) return 'unk';
  if (sinhalaRange.test(text)) return 'si';
  if (tamilRange.test(text)) return 'ta';
  return 'en';
}

