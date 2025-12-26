import OpenAI from 'openai';
import { env } from './env';
import { withRetry } from './retry';
import { normalizeTopicSlug } from './topics';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function summarizeEnglish(sources: { title: string; content: string }[], previous?: string | null) {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You are a professional news analysis engine for an AI-powered news analysis platform in Sri Lanka.

CORE PRINCIPLES:
- Journalistic neutrality: No opinions, no bias, no sensationalism, no editorializing
- Multi-source verification: Prioritize facts confirmed by 2+ sources
- Factual accuracy: Every number, name, date, and location must appear in at least one source
- Chronological clarity: Present events in time order when relevant
- Context preservation: Maintain important context (who, what, when, where, why, how)
- Insight-driven writing: Focus on explaining significance, context, and implications rather than just restating facts

QUALITY STANDARDS:
- Summary length: 250-700 words (aim for comprehensive, analytical coverage)
- Structure: 
  * Lead paragraph: Explain the significance and context of what happened, not just the facts
  * Main body: Key details, background, and analysis (5-10 sentences)
  * "Why this matters" section: 2-3 sentences explaining the significance and implications
  * "What to watch next" section: 2-3 bullet points on potential follow-ups, implications, or developments to monitor
- Tone: Calm, factual, professional, neutral, analytical
- Tense: Past tense, third person
- Style: Clear, simple, accessible language with explanatory focus
- No repetition: Avoid repeating the same information
- Analytical approach: Explain what happened and why it matters, rather than just restating facts

VERIFICATION RULES:
- If sources disagree: Explicitly state "reports vary" or "sources differ" and present both versions
- If information is uncertain: Use phrases like "sources indicate" or "information suggests"
- If numbers differ: State the range or most commonly cited figure
- If names/entities differ: Use the most frequently mentioned version
- Single-source facts: Include but note "according to one source" when only one source mentions it

STRICT PROHIBITIONS:
- Do NOT use aggregation-style language: "breaking", "latest", "reported by", "according to reports"
- Do NOT copy headline phrasing verbatim - always paraphrase and provide original analysis
- Do NOT add assumptions, opinions, predictions, or speculation
- Do NOT exaggerate or sensationalize
- Do NOT invent names, numbers, dates, or events
- Do NOT use emojis, ALL CAPS, or exclamation marks
- Do NOT use clickbait language or emotional language
- Do NOT write as a news brief - write as an analytical explanation

OUTPUT FORMAT:
- Lead paragraph: Explain the significance and context of the event, focusing on why it matters
- Main body: Key details, background, context, and analysis with proper source attribution
- "Why this matters" section: 2-3 sentences explaining significance and implications
- "What to watch next" section: 2-3 bullet points on follow-ups, implications, or developments to monitor
- Ensure all key information (who, what, when, where, why) is included
- Use analytical, explanatory language that provides insight, not just facts`
    },
    {
      role: 'user',
      content: buildSourcePrompt(sources, previous)
    }
  ];

  return withRetry(
    async () => {
      const completion = await client.chat.completions.create({
        model: env.SUMMARY_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 1200
      });
      return completion.choices[0]?.message?.content?.trim() || '';
    },
    {
      maxRetries: 3,
      delayMs: 2000,
      onRetry: (error, attempt) => {
        console.warn(`[OpenAI] Retry ${attempt}/3 for summarizeEnglish: ${error.message}`);
      }
    }
  );
}

export async function translateSummary(summaryEn: string, target: 'si' | 'ta') {
  const langLabel = target === 'si' ? 'Sinhala' : 'Tamil';
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { 
      role: 'system', 
      content: `Translate the following English news summary into formal written ${langLabel} for a Sri Lankan news analysis platform.

CRITICAL TRANSLATION RULES:
1. Accuracy: Preserve the EXACT meaning - do NOT add, remove, or change ANY information
2. Structure: Preserve all sections including:
   - Lead paragraph
   - Main body paragraphs
   - "Why this matters" section (if present)
   - "What to watch next" bullet points (if present)
3. Formality: Use formal written ${langLabel} appropriate for news analysis - NO colloquialisms, slang, or informal expressions
4. Grammar: Use proper ${langLabel} grammar and sentence structure
5. Names & Places: Keep ALL proper nouns (names, places, organizations) in their original form unless there is a standard ${langLabel} transliteration. For Sri Lankan names and places, use standard ${langLabel} transliterations when they exist.
6. Numbers & Dates: Preserve ALL numbers, dates, percentages, and statistics EXACTLY as written
7. Tone: Maintain neutral, factual, analytical tone - no emotional language
8. Context: Preserve Sri Lankan context and terminology accurately
${target === 'si' ? `9. Sinhala-Specific:
   - Use formal written Sinhala (not spoken/colloquial)
   - Use proper Sinhala script (සිංහල) and grammar
   - Maintain proper sentence structure
   - Use formal vocabulary throughout
   - Preserve all structural elements (paragraphs, bullet points, sections)
   - Avoid informal expressions or conversational language` : ''}${target === 'ta' ? `9. Tamil-Specific:
   - Use formal written Tamil (not spoken/colloquial)
   - Use proper Tamil script (தமிழ்) and grammar
   - Maintain proper sentence structure
   - Use formal vocabulary throughout
   - Preserve all structural elements (paragraphs, bullet points, sections)
   - Avoid informal expressions or conversational Tamil
   - Ensure proper Tamil grammar and word order` : ''}

OUTPUT REQUIREMENTS:
- Complete translation preserving all sections and structure
- Formal news analysis style
- All facts, numbers, and names preserved accurately
- Proper ${langLabel} grammar and vocabulary`
    },
    { role: 'user', content: summaryEn }
  ];
  return withRetry(
    async () => {
      const completion = await client.chat.completions.create({
        model: env.SUMMARY_TRANSLATE_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 400
      });
      return completion.choices[0]?.message?.content?.trim() || '';
    },
    {
      maxRetries: 3,
      delayMs: 2000,
      onRetry: (error, attempt) => {
        console.warn(`[OpenAI] Retry ${attempt}/3 for translateSummary: ${error.message}`);
      }
    }
  );
}

/**
 * Summarize articles in their source language
 * @param sources - Array of article sources with content
 * @param sourceLang - Detected source language
 * @param previous - Previous summary for updates
 * @returns Summary in source language
 */
export async function summarizeInSourceLanguage(
  sources: { title: string; content: string; weight?: number; publishedAt?: string }[],
  sourceLang: 'en' | 'si' | 'ta',
  previous?: string | null
): Promise<string> {
  const langLabel = sourceLang === 'en' ? 'English' : sourceLang === 'si' ? 'Sinhala' : 'Tamil';
  
  const sourceText = sources
    .map((s, idx) => {
      const date = s.publishedAt ? new Date(s.publishedAt).toLocaleDateString() : 'Date unknown';
      const weight = s.weight ? `[Priority: ${s.weight.toFixed(1)}]` : '';
      return `Source ${idx + 1} ${weight} - Published: ${date}
Title: ${s.title}
Content: ${s.content}`;
    })
    .join('\n\n---\n\n');

  const prior = previous 
    ? `Previous summary (for context only - update if new facts emerge):\n${previous}\n\n` 
    : '';

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You are a professional news analysis engine for an AI-powered news analysis platform in Sri Lanka.

CORE PRINCIPLES:
- Journalistic neutrality: No opinions, no bias, no sensationalism, no editorializing
- Multi-source verification: Prioritize facts confirmed by 2+ sources - VERIFY each fact against multiple sources before including
- Factual accuracy: Every number, name, date, and location must appear in at least one source - NEVER invent or assume
- Chronological clarity: Present events in time order when relevant
- Context preservation: Maintain important context (who, what, when, where, why, how)
- Prioritize recent information: Give more weight to newer sources when facts conflict
- Source attribution: Always attribute facts to sources when they differ or are uncertain
- Insight-driven writing: Focus on explaining significance, context, and implications rather than just restating facts

QUALITY STANDARDS:
- Summary length: 250-700 words (aim for comprehensive, analytical coverage - count words carefully)
- Structure: 
  * Lead paragraph: Explain the significance and context of what happened, not just the facts
  * Main body: Key details, background, and analysis (5-10 sentences)
  * "Why this matters" section: 2-3 sentences explaining the significance and implications
  * "What to watch next" section: 2-3 bullet points on potential follow-ups, implications, or developments to monitor
- Tone: Calm, factual, professional, neutral, analytical - NO emotional language
- Tense: Past tense, third person
- Language: Write in ${langLabel} using formal written style${sourceLang === 'si' ? '\n- Sinhala: Use formal written Sinhala (not spoken/colloquial). Use proper Sinhala script (සිංහල), grammar, and formal vocabulary. Maintain proper sentence structure. Avoid informal expressions, slang, or conversational language. Use standard Sinhala transliterations for Sri Lankan place names when they exist.' : ''}${sourceLang === 'ta' ? '\n- Tamil: Use formal written Tamil (not spoken/colloquial). Use proper Tamil script (தமிழ்), grammar, and formal vocabulary. Maintain proper sentence structure. Avoid informal expressions, slang, or conversational Tamil. Use standard Tamil transliterations for Sri Lankan place names when they exist. Ensure proper Tamil grammar and word order throughout.' : ''}
- Style: Clear, simple, accessible language with explanatory focus
- No repetition: Avoid repeating the same information in different sentences
- Coherence: Ensure logical flow between sentences
- Analytical approach: Explain what happened and why it matters, rather than just restating facts

VERIFICATION RULES:
- Fact verification: Before including any fact, check if it appears in 2+ sources. If only in one source, note "according to one source"
- If sources disagree: Explicitly state "reports vary" or "sources differ" and present both versions clearly with attribution
- If information is uncertain: Use phrases like "sources indicate" or "information suggests" - NEVER state uncertain information as fact
- If numbers differ: State the range (e.g., "between X and Y") or most commonly cited figure, noting "sources report different figures"
- If names/entities differ: Use the most frequently mentioned version, or note "also referred to as" if significant
- Single-source facts: Include but ALWAYS note "according to one source" when only one source mentions it
- Recent vs old information: When sources conflict, prefer information from more recent sources and note the discrepancy

STRICT PROHIBITIONS:
- Do NOT use aggregation-style language: "breaking", "latest", "reported by", "according to reports"
- Do NOT copy headline phrasing verbatim - always paraphrase and provide original analysis
- Do NOT add assumptions, opinions, predictions, or speculation - ONLY include verified facts
- Do NOT exaggerate or sensationalize - maintain neutral tone
- Do NOT invent names, numbers, dates, or events - if not in sources, do not include
- Do NOT use emojis, ALL CAPS, or exclamation marks
- Do NOT use clickbait language or emotional language
- Do NOT copy long passages verbatim from sources - paraphrase in your own words
- Do NOT make inferences beyond what sources explicitly state
- Do NOT write as a news brief - write as an analytical explanation

OUTPUT FORMAT:
- Lead paragraph: Explain the significance and context of the event, focusing on why it matters
- Main body: Key details, background, context, and analysis with proper source attribution
- "Why this matters" section: 2-3 sentences explaining significance and implications
- "What to watch next" section: 2-3 bullet points on follow-ups, implications, or developments to monitor
- Ensure all key information (who, what, when, where, why) is included
- Maintain logical flow and coherence
- Use analytical, explanatory language that provides insight, not just facts
- Use source attribution phrases: "sources indicate", "information suggests", "sources differ", "according to one source" when appropriate`
    },
    {
      role: 'user',
      content: `${prior}Analyze the following news reports and create ONE comprehensive, analytical explanation in ${langLabel}.

INSTRUCTIONS:
1. Write as an analytical explanation, not a news report - focus on significance, context, and implications
2. Combine all sources into a single coherent narrative that explains what happened and why it matters
3. Include only verified facts present in the sources
4. If a fact appears in only one source, mention it but note the source
5. If information conflicts, clearly state the discrepancy
6. Maintain chronological order when relevant
7. Include key numbers, dates, locations, and entities
8. Keep summary between 250-700 words (aim for comprehensive, analytical coverage)
9. Structure: 
   - Lead paragraph: Explain significance and context (why this matters)
   - Main body: Key details, background, and analysis (5-10 sentences)
   - "Why this matters" section: 2-3 sentences on significance and implications
   - "What to watch next" section: 2-3 bullet points on follow-ups or developments to monitor
10. Explain what happened and why it matters, rather than just restating facts
11. Avoid copying headline phrasing - provide original analytical perspective

SOURCES (ordered by recency and importance):
${sourceText}

Generate a professional analytical explanation in ${langLabel} following all rules above.`
    }
  ];

  const completion = await client.chat.completions.create({
    model: env.SUMMARY_MODEL,
    messages,
    temperature: 0.2,
        max_tokens: 1200,
    top_p: 0.9,
    frequency_penalty: 0.3,
    presence_penalty: 0.1
  });
  
  return completion.choices[0]?.message?.content?.trim() || '';
}

/**
 * Translate summary from source language to multiple target languages
 * Always returns all 3 languages, with fallback to English if translation fails
 * @param summary - Summary in source language
 * @param sourceLang - Source language code
 * @returns Object with translations in all 3 languages
 */
export async function translateToMultipleLanguages(
  summary: string,
  sourceLang: 'en' | 'si' | 'ta'
): Promise<{ en: string; si: string; ta: string }> {
  const result = {
    en: sourceLang === 'en' ? summary : '',
    si: sourceLang === 'si' ? summary : '',
    ta: sourceLang === 'ta' ? summary : ''
  };

  // Translate to the other 2 languages with retry and fallback
  if (sourceLang === 'en') {
    // English → Sinhala + Tamil
    const [sinhala, tamil] = await Promise.allSettled([
      translateFromTo(summary, 'en', 'si'),
      translateFromTo(summary, 'en', 'ta')
    ]);
    result.si = sinhala.status === 'fulfilled' && sinhala.value ? sinhala.value : summary; // Fallback to English
    result.ta = tamil.status === 'fulfilled' && tamil.value ? tamil.value : summary; // Fallback to English
  } else if (sourceLang === 'si') {
    // Sinhala → English + Tamil
    // First translate to English, then use English for Tamil if needed
    const [englishResult, tamilResult] = await Promise.allSettled([
      translateFromTo(summary, 'si', 'en'),
      translateFromTo(summary, 'si', 'ta')
    ]);
    
    const english = englishResult.status === 'fulfilled' && englishResult.value ? englishResult.value : summary;
    result.en = english;
    
    // If Tamil translation failed, translate from English instead
    if (tamilResult.status === 'fulfilled' && tamilResult.value) {
      result.ta = tamilResult.value;
    } else {
      // Fallback: translate from English to Tamil
      try {
        result.ta = await translateFromTo(english, 'en', 'ta');
      } catch {
        result.ta = english; // Final fallback to English
      }
    }
  } else if (sourceLang === 'ta') {
    // Tamil → English + Sinhala
    // First translate to English, then use English for Sinhala if needed
    const [englishResult, sinhalaResult] = await Promise.allSettled([
      translateFromTo(summary, 'ta', 'en'),
      translateFromTo(summary, 'ta', 'si')
    ]);
    
    const english = englishResult.status === 'fulfilled' && englishResult.value ? englishResult.value : summary;
    result.en = english;
    
    // If Sinhala translation failed, translate from English instead
    if (sinhalaResult.status === 'fulfilled' && sinhalaResult.value) {
      result.si = sinhalaResult.value;
    } else {
      // Fallback: translate from English to Sinhala
      try {
        result.si = await translateFromTo(english, 'en', 'si');
      } catch {
        result.si = english; // Final fallback to English
      }
    }
  }

  // Validate all 3 languages are present and non-empty
  if (!result.en || !result.si || !result.ta) {
    console.warn('[OpenAI] Some translations are missing, using fallbacks');
    // Ensure all are set - use English as ultimate fallback
    result.en = result.en || summary;
    result.si = result.si || result.en;
    result.ta = result.ta || result.en;
  }

  return result;
}

/**
 * Translate text from one language to another
 * @param text - Text to translate
 * @param from - Source language
 * @param to - Target language
 * @returns Translated text
 */
async function translateFromTo(
  text: string,
  from: 'en' | 'si' | 'ta',
  to: 'en' | 'si' | 'ta'
): Promise<string> {
  if (from === to) {
    return text; // No translation needed
  }

  const fromLabel = from === 'en' ? 'English' : from === 'si' ? 'Sinhala' : 'Tamil';
  const toLabel = to === 'en' ? 'English' : to === 'si' ? 'Sinhala' : 'Tamil';
  
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You are a professional news translator specializing in ${toLabel} translations for Sri Lankan news.

Your task: Translate the following ${fromLabel} news summary into formal, accurate ${toLabel}.

CRITICAL TRANSLATION RULES:
1. Accuracy: Preserve the EXACT meaning - do NOT add, remove, or change ANY information. Every fact, detail, and nuance must be preserved exactly. Verify that all factual information is maintained. Double-check that all key information (who, what, when, where, why, how) is present in the translation.
2. Formality: Use formal written ${toLabel} appropriate for news media - NO colloquialisms, slang, informal expressions, or spoken language patterns. This is formal news writing, not casual conversation. Use professional journalistic language.
3. Grammar: Use proper ${toLabel} grammar, sentence structure, and punctuation. Ensure all sentences are well-formed, coherent, and follow proper ${toLabel} grammatical rules. Check for subject-verb agreement, proper tense usage, and correct word order.
4. Terminology: Use standard ${toLabel} news terminology and formal vocabulary. Use established news language conventions and avoid informal or colloquial terms. For Sri Lankan news, use standard ${toLabel} terms for government institutions, political terms, and common news phrases.
5. Cultural Context: Preserve cultural context and nuances accurately. Adapt cultural references appropriately while maintaining complete factual accuracy. Understand Sri Lankan context when translating (e.g., government institutions, political parties, cultural events).
6. Names & Places: Keep ALL proper nouns (names, places, organizations, titles) in their original form unless there is a standard ${toLabel} transliteration. For Sri Lankan names and places, use standard ${toLabel} transliterations when they exist. Do NOT translate proper nouns unless there is an established translation. Verify spelling of all names and places.
7. Numbers & Dates: Preserve ALL numbers, dates, percentages, statistics, and numerical data EXACTLY as written - do NOT convert, modify, round, or approximate them. Every number must match the source. Dates should remain in the same format.
8. Tone: Maintain a neutral, factual news reporting tone - no emotional language, no sensationalism, no opinions, no editorializing. Use objective, professional language throughout.
9. Length: The translated text should be approximately the same length as the source text (within 10-15% variance is acceptable). Do not significantly expand or contract the content. Maintain the same level of detail.
10. Sentence Structure: Maintain the logical flow, structure, and organization of the source. Preserve paragraph breaks, sentence connections, and the overall narrative structure. Ensure smooth transitions between sentences.
11. Verification: Before completing the translation, verify that all numbers, dates, names, and facts from the source are present in the translation. Cross-check key information to ensure nothing is missing.
12. Quality Check: Read the translation once more to ensure it sounds natural in ${toLabel} while maintaining complete accuracy. The translation should read like original ${toLabel} news writing, not like a literal translation.
${to === 'si' ? `11. Sinhala-Specific:
    - Use formal written Sinhala (not spoken/colloquial)
    - Use proper Sinhala script and grammar
    - Use formal vocabulary appropriate for news media
    - Avoid spoken language patterns and informal expressions
    - Maintain proper Sinhala sentence structure and word order` : ''}${to === 'ta' ? `11. Tamil-Specific:
    - Use formal written Tamil (not spoken/colloquial)
    - Use proper Tamil script and grammar
    - Avoid informal expressions, slang, or colloquialisms
    - Use formal vocabulary appropriate for news media
    - Maintain proper Tamil sentence structure and word order` : ''}

OUTPUT REQUIREMENTS:
- Complete translation in ${toLabel}
- Same structure and paragraph breaks as source
- All facts, numbers, and names preserved accurately
- Formal news style appropriate for media publication
- Proper grammar and sentence flow
- Cultural context preserved appropriately`
    },
    { role: 'user', content: `Translate this news summary from ${fromLabel} to ${toLabel}:\n\n${text}` }
  ];

  // Use retry logic for translation
  return withRetry(
    async () => {
      const completion = await client.chat.completions.create({
        model: env.SUMMARY_TRANSLATE_MODEL,
        messages,
        temperature: 0.1,
        max_tokens: Math.ceil(text.length * 2.5)
      });
      const translated = completion.choices[0]?.message?.content?.trim();
      if (!translated) {
        throw new Error('Empty translation response');
      }
      return translated;
    },
    {
      maxRetries: 3,
      delayMs: 1000,
      onRetry: (error, attempt) => {
        console.warn(`[OpenAI] Retry ${attempt}/3 for translateFromTo (${from}→${to}): ${error.message}`);
      }
    }
  );
}

// Export translateFromTo for use in pipeline
export { translateFromTo };

/**
 * Translate headline from one language to another
 * Optimized for headlines (shorter, more concise than summaries)
 * @param headline - Headline to translate
 * @param from - Source language
 * @param to - Target language
 * @returns Translated headline
 */
export async function translateHeadline(
  headline: string,
  from: 'en' | 'si' | 'ta',
  to: 'en' | 'si' | 'ta'
): Promise<string> {
  if (from === to) {
    return headline; // No translation needed
  }

  const fromLabel = from === 'en' ? 'English' : from === 'si' ? 'Sinhala' : 'Tamil';
  const toLabel = to === 'en' ? 'English' : to === 'si' ? 'Sinhala' : 'Tamil';
  
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You are a professional news headline translator specializing in ${toLabel} translations for Sri Lankan news headlines.

Your task: Translate the following ${fromLabel} news headline into formal, accurate ${toLabel} headline.

CRITICAL HEADLINE TRANSLATION RULES:
1. Headline-Specific: This is a HEADLINE, not a summary. Keep it concise, impactful, and attention-grabbing while maintaining accuracy.
2. Length: Target 50-80 characters (headlines are shorter than summaries). Preserve key information but be concise.
3. Accuracy: Preserve the EXACT meaning - do NOT add, remove, or change ANY information. Every fact must be preserved exactly.
4. SEO-Friendly: Maintain SEO keywords and important entities in the target language when appropriate.
5. Formality: Use formal written ${toLabel} appropriate for news headlines - NO colloquialisms, slang, or informal expressions.
6. Grammar: Use proper ${toLabel} grammar and sentence structure appropriate for headlines.
7. Names & Places: Keep ALL proper nouns (names, places, organizations, titles) in their original form unless there is a standard ${toLabel} transliteration. For Sri Lankan names and places, use standard ${toLabel} transliterations when they exist (e.g., Colombo → කොළඹ, Jaffna → யாழ்ப்பாணம்).
8. Numbers & Dates: Preserve ALL numbers, dates, percentages, and statistics EXACTLY as written - do NOT convert, modify, round, or approximate them.
9. Tone: Maintain a neutral, factual news headline tone - no emotional language, no sensationalism.
10. Key Information: Extract and preserve the most important information (who, what, when, where) in the headline format.
11. Sri Lankan Context: Preserve Sri Lankan context and terminology accurately.
${to === 'si' ? `12. Sinhala-Specific:
    - Use formal written Sinhala appropriate for news headlines (not spoken/colloquial)
    - Use proper Sinhala script (සිංහල) and grammar
    - Keep headline concise and impactful (50-80 characters)
    - Use formal vocabulary appropriate for news headlines
    - Avoid informal expressions, slang, or conversational language
    - Maintain proper Sinhala sentence structure
    - Use standard Sinhala transliterations for Sri Lankan place names` : ''}${to === 'ta' ? `12. Tamil-Specific:
    - Use formal written Tamil appropriate for news headlines (not spoken/colloquial)
    - Use proper Tamil script (தமிழ்) and grammar
    - Keep headline concise and impactful (50-80 characters)
    - Use formal vocabulary appropriate for news headlines
    - Avoid informal expressions, slang, or conversational Tamil
    - Maintain proper Tamil sentence structure
    - Use standard Tamil transliterations for Sri Lankan place names` : ''}

EXAMPLES OF GOOD HEADLINE TRANSLATIONS:
${to === 'si' ? '- English: "President announces new economic policy" → Sinhala: "ජනාධිපතිවරයා නව ආර්ථික ප්‍රතිපත්තියක් ප්‍රකාශ කරයි"' : ''}${to === 'ta' ? '- English: "President announces new economic policy" → Tamil: "ஜனாதிபதி புதிய பொருளாதார கொள்கையை அறிவிக்கிறார்"' : ''}

OUTPUT REQUIREMENTS:
- Concise headline in ${toLabel} (50-80 characters)
- All facts, numbers, and names preserved accurately
- Formal news headline style
- SEO-friendly and impactful
- Proper grammar and structure
- Return ONLY the translated headline, no additional text`
    },
    { 
      role: 'user', 
      content: `Translate this news headline from ${fromLabel} to ${toLabel}:\n\n${headline}\n\nReturn ONLY the translated headline, no additional text.` 
    }
  ];

  // Use retry logic for translation
  return withRetry(
    async () => {
      const completion = await client.chat.completions.create({
        model: env.SUMMARY_TRANSLATE_MODEL || env.SUMMARY_MODEL,
        messages,
        temperature: 0.2, // Increased for more natural translations
        max_tokens: 150 // Headlines are shorter
      });
      const translated = completion.choices[0]?.message?.content?.trim();
      if (!translated) {
        throw new Error('Empty headline translation response');
      }
      // Clean up any extra text that might have been added
      const cleaned = translated.split('\n')[0].trim();
      return cleaned;
    },
    {
      maxRetries: 3,
      delayMs: 1000,
      onRetry: (error, attempt) => {
        console.warn(`[OpenAI] Retry ${attempt}/3 for translateHeadline (${from}→${to}): ${error.message}`);
      }
    }
  );
}

function buildSourcePrompt(sources: { title: string; content: string }[], previous?: string | null) {
  const trimmed = sources
    .slice(0, env.MAX_SUMMARY_ARTICLES)
    .map(
      (s, idx) =>
        `Source ${idx + 1} Title: ${s.title}\nSource ${idx + 1} Content: ${s.content.slice(0, 2500)}`
    )
    .join('\n\n---\n\n');

  const prior = previous 
    ? `Previous summary (for context only - update if new facts emerge):\n${previous}\n\n` 
    : '';

  return `${prior}Analyze the following news reports and create ONE comprehensive, analytical explanation.

INSTRUCTIONS:
1. Write as an analytical explanation, not a news report - focus on significance, context, and implications
2. Combine all sources into a single coherent narrative that explains what happened and why it matters
3. Include only verified facts present in the sources
4. If a fact appears in only one source, mention it but note "according to one source"
5. If information conflicts, clearly state "sources differ" and present both versions
6. Maintain chronological order when relevant
7. Include key numbers, dates, locations, and entities
8. Keep summary between 250-700 words (aim for comprehensive, analytical coverage)
9. Structure: 
   - Lead paragraph: Explain significance and context (why this matters)
   - Main body: Key details, background, and analysis (5-10 sentences)
   - "Why this matters" section: 2-3 sentences on significance and implications
   - "What to watch next" section: 2-3 bullet points on follow-ups or developments to monitor
10. Explain what happened and why it matters, rather than just restating facts
11. Avoid copying headline phrasing - provide original analytical perspective

SOURCES (ordered by importance):
${trimmed}

Generate a professional analytical explanation following all rules above.`;
}

/**
 * Generate SEO meta title and description from news summary
 * Follows Google News + Search best practices
 */
export async function generateSEOMetadata(
  summary: string,
  headline: string,
  language: 'en' | 'si' | 'ta'
): Promise<{ title: string; description: string }> {
  const langLabel = language === 'en' ? 'English' : language === 'si' ? 'Sinhala' : 'Tamil';
  const siteName = 'Lanka News Room';
  const countryRef = language === 'en' ? 'Sri Lanka' : language === 'si' ? 'ශ්‍රී ලංකා' : 'இலங்கை';

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You are an SEO specialist for an AI-powered news analysis platform in Sri Lanka.

Your task: Generate SEO-optimized meta title and description from a news summary.

STRICT RULES FOR META TITLE:
- Length: EXACTLY 50-60 characters (hard limit)
- Use insight-based phrasing: "Why [Event] Matters", "[Event] Explained", "What [Event] Means for [Context]"
- Focus on insight, explanation, or significance rather than just stating the event
- Must include "${countryRef}" or "${language === 'en' ? 'Sri Lankan' : ''}" when relevant
- Must NOT be clickbait
- Avoid generic phrases like "breaking news" or "latest update"
- Use only information present in the summary
- No assumptions, no opinions
- If event is uncertain, use neutral phrasing ("sources indicate")

STRICT RULES FOR META DESCRIPTION:
- Length: EXACTLY 140-160 characters
- Neutral, factual tone with focus on public impact and context
- One concise sentence
- Focus on public impact, context, and why readers should care
- Explain why this matters to readers
- Must not claim exclusivity or opinion
- Must be different from the title (not copied text)
- Avoid generic phrases like "breaking news" or "latest update"

Output format (JSON):
{
  "title": "[50-60 char meta title]",
  "description": "[140-160 char meta description]"
}`
    },
    {
      role: 'user',
      content: `Headline: ${headline}

Summary: ${summary}

Generate SEO meta title and description in ${langLabel} following the strict rules above.`
    }
  ];

  const completion = await client.chat.completions.create({
    model: env.SUMMARY_MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 200,
    response_format: { type: 'json_object' }
  });

  try {
    const result = JSON.parse(completion.choices[0]?.message?.content?.trim() || '{}');
    return {
      title: validateAndCleanTitle(result.title || headline, language),
      description: validateAndCleanDescription(result.description || summary, language)
    };
  } catch (error) {
    // Fallback to simple generation
    return {
      title: validateAndCleanTitle(headline, language),
      description: validateAndCleanDescription(summary, language)
    };
  }
}

/**
 * Validate and clean meta title
 */
function validateAndCleanTitle(title: string, language: 'en' | 'si' | 'ta'): string {
  // Remove quotes, emojis, special chars
  let cleaned = title
    .replace(/["'""]/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .replace(/[^\w\s\-–—|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove generic phrases that should be avoided
  cleaned = cleaned
    .replace(/\b(breaking|latest|reported by|according to reports)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Enforce length limit (50-60 characters)
  if (cleaned.length > 60) {
    cleaned = cleaned.slice(0, 57) + '...';
  }

  return cleaned.slice(0, 60);
}

/**
 * Validate and clean meta description
 */
function validateAndCleanDescription(description: string, language: 'en' | 'si' | 'ta'): string {
  // Remove quotes, emojis, special chars
  let cleaned = description
    .replace(/["'""]/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .replace(/[^\w\s\-–—.,!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove generic phrases that should be avoided
  cleaned = cleaned
    .replace(/\b(breaking|latest|reported by|according to reports|based on reports from multiple verified sources)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Enforce length limit (140-160 characters)
  if (cleaned.length > 160) {
    cleaned = cleaned.slice(0, 157) + '...';
  }

  return cleaned.slice(0, 160);
}

/**
 * Generate comprehensive SEO pack including title, description, slug, topic, city, entities
 * This follows Google's best practices for news SEO and programmatic SEO
 */
export async function generateComprehensiveSEO(
  summary: string,
  headline: string,
  articles: Array<{ title: string; content_excerpt?: string | null }>,
  language: 'en' | 'si' | 'ta',
  preserveTopic?: string
): Promise<{
  seo_title: string;
  meta_description: string;
  slug: string;
  og_title: string;
  og_description: string;
  topic: string;
  topics: string[];
  district: string | null;
  primary_entity: string | null;
  event_type: string | null;
}> {
  const langLabel = language === 'en' ? 'English' : language === 'si' ? 'Sinhala' : 'Tamil';
  const countryRef = language === 'en' ? 'Sri Lanka' : language === 'si' ? 'ශ්‍රී ලංකා' : 'இலங்கை';

  // Build context from articles
  const context = articles
    .slice(0, 6)
    .map((a, i) => `Source ${i + 1}: ${a.title}${a.content_excerpt ? '\n' + a.content_excerpt.slice(0, 200) : ''}`)
    .join('\n\n');

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You are an SEO editor for an AI-powered news analysis platform in Sri Lanka.

Your task: Extract structured SEO data from news articles.

RULES:
1. seo_title: 50-65 chars, use insight-based phrasing: "Why [Event] Matters", "[Event] Explained", "What [Event] Means for [Context]". Focus on insight, explanation, or significance rather than just stating the event. Include "${countryRef}" if relevant. Avoid generic phrases like "breaking news" or "latest update".
2. meta_description: 150-160 chars, natural, focus on public impact, context, and significance. Explain why this matters to readers. Includes main entity + impact. Avoid generic phrases like "breaking news" or "latest update".
3. slug: lowercase, hyphen-separated, 4-9 words, no stopwords (a, the, is, etc.)
4. og_title: can be slightly longer than seo_title (up to 70 chars), use same insight-based approach
5. og_description: same as meta_description
6. topic: PRIMARY topic from content topics [politics, economy, sports, crime, education, health, environment, technology, culture, society, other]
7. topics: ARRAY of topics - MUST include:
   - ONE geographic scope: "sri-lanka" (national/local news) OR "world" (global/international news)
   - ONE or more content topics: [politics, economy, sports, crime, education, health, environment, technology, culture, society]
   - Example: ["sri-lanka", "technology"] or ["world", "politics", "economy"]
   - Always include at least one geographic and one content topic
8. district: ONE of [colombo, kandy, galle, jaffna, anuradhapura, kurunegala, batticaloa, badulla, hambantota, gampaha, kalutara, matale, nuwara-eliya, matara, kilinochchi, mannar, vavuniya, mullaitivu, ampara, trincomalee, puttalam, polonnaruwa, moneragala, ratnapura, kegalle] or null
9. primary_entity: main person/organization mentioned (or null)
10. event_type: ONE of [election, court, accident, protest, announcement, budget, policy, crime, disaster, sports_event, other] or null

CRITICAL:
- Must match summary facts ONLY
- No quotes, no emojis
- Avoid generic phrases like "breaking news" or "latest update"
- If language is ta/si, write in that language
- Return ONLY valid JSON

OUTPUT JSON format:
{
  "seo_title": "...",
  "meta_description": "...",
  "slug": "...",
  "og_title": "...",
  "og_description": "...",
  "topic": "...",
  "topics": ["sri-lanka", "technology"],
  "district": "..." or null,
  "primary_entity": "..." or null,
  "event_type": "..." or null
}

EXAMPLES:
- Sri Lankan tech news: {"topic": "technology", "topics": ["sri-lanka", "technology"]}
- Global politics: {"topic": "politics", "topics": ["world", "politics"]}
- Local health news: {"topic": "health", "topics": ["sri-lanka", "health"]}
- International economy: {"topic": "economy", "topics": ["world", "economy"]}`
    },
    {
      role: 'user',
      content: `Language: ${langLabel}
Headline: ${headline}
Summary: ${summary}

Sources:
${context}

Generate comprehensive SEO pack in ${langLabel} following the rules above.`
    }
  ];

  const completion = await client.chat.completions.create({
    model: env.SUMMARY_MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 400,
    response_format: { type: 'json_object' }
  });

  try {
    const result = JSON.parse(completion.choices[0]?.message?.content?.trim() || '{}');
    
    // Validate and normalize topics array
    let topicsArray: string[] = [];
    if (Array.isArray(result.topics)) {
      topicsArray = result.topics
        .map((t: string) => {
          const normalized = normalizeTopicSlug(t);
          return normalized || null;
        })
        .filter((t: string | null): t is string => t !== null);
    }
    
    // Ensure we have at least one geographic and one content topic
    const hasGeographic = topicsArray.some(t => t === 'sri-lanka' || t === 'world');
    const hasContent = topicsArray.some(t => 
      ['politics', 'economy', 'sports', 'crime', 'education', 'health', 'environment', 'technology', 'culture', 'society'].includes(t)
    );
    
    // If missing geographic, add based on context (default to sri-lanka for local news)
    if (!hasGeographic) {
      topicsArray.unshift('sri-lanka');
    }
    
    // If missing content topic, use the primary topic
    if (!hasContent && result.topic) {
      const normalizedTopic = normalizeTopicSlug(result.topic);
      if (normalizedTopic && !topicsArray.includes(normalizedTopic)) {
        topicsArray.push(normalizedTopic);
      }
    }
    
    // Ensure we have at least 2 topics (geographic + content)
    if (topicsArray.length < 2) {
      const primaryTopic = validateTopic(result.topic);
      if (!topicsArray.includes(primaryTopic)) {
        topicsArray.push(primaryTopic);
      }
    }
    
    // Preserve "other" topic if explicitly requested
    const finalTopic = preserveTopic === 'other' ? 'other' : validateTopic(result.topic);
    const finalTopics = preserveTopic === 'other' 
      ? ['sri-lanka', 'other']
      : (topicsArray.length > 0 ? topicsArray : ['sri-lanka', finalTopic]);
    
    return {
      seo_title: validateAndCleanTitle(result.seo_title || headline, language),
      meta_description: validateAndCleanDescription(result.meta_description || summary, language),
      slug: cleanSlug(result.slug || headline),
      og_title: result.og_title || validateAndCleanTitle(result.seo_title || headline, language),
      og_description: result.og_description || validateAndCleanDescription(result.meta_description || summary, language),
      topic: finalTopic,
      topics: finalTopics,
      district: validateDistrict(result.district),
      primary_entity: result.primary_entity || null,
      event_type: validateEventType(result.event_type)
    };
  } catch (error) {
    console.error('Error parsing comprehensive SEO:', error);
    // Fallback
    const fallbackTopic = 'politics';
    return {
      seo_title: validateAndCleanTitle(headline, language),
      meta_description: validateAndCleanDescription(summary, language),
      slug: cleanSlug(headline),
      og_title: validateAndCleanTitle(headline, language),
      og_description: validateAndCleanDescription(summary, language),
      topic: fallbackTopic,
      topics: ['sri-lanka', fallbackTopic],
      district: null,
      primary_entity: null,
      event_type: null
    };
  }
}

/**
 * Clean and validate slug
 */
function cleanSlug(text: string): string {
  // Common stopwords to remove
  const stopwords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .split('-')
    .filter(word => !stopwords.includes(word)) // Remove stopwords
    .slice(0, 9) // Max 9 words
    .join('-')
    .slice(0, 100); // Max 100 chars
}

/**
 * Validate topic against allowed list
 */
function validateTopic(topic: string | null | undefined): string {
  if (!topic) return 'politics'; // Default to politics instead of 'other'
  const normalized = normalizeTopicSlug(topic);
  // Preserve "other" if it's explicitly set
  if (normalized === 'other') return 'other';
  // If normalized topic is valid, return it; otherwise default to 'politics'
  return normalized || 'politics';
}

/**
 * Validate district against allowed list (all 25 districts of Sri Lanka)
 */
function validateDistrict(district: string | null | undefined): string | null {
  if (!district) return null;
  const validDistricts = [
    'colombo', 'kandy', 'galle', 'jaffna', 'anuradhapura', 'kurunegala',
    'batticaloa', 'badulla', 'hambantota', 'gampaha', 'kalutara', 'matale',
    'nuwara-eliya', 'matara', 'kilinochchi', 'mannar', 'vavuniya', 'mullaitivu',
    'ampara', 'trincomalee', 'puttalam', 'polonnaruwa', 'moneragala', 'ratnapura', 'kegalle'
  ];
  const normalized = district.toLowerCase().trim().replace(/\s+/g, '-');
  return validDistricts.includes(normalized) ? normalized : null;
}

/**
 * Validate event type against allowed list
 */
function validateEventType(eventType: string | null | undefined): string | null {
  if (!eventType) return null;
  const validTypes = ['election', 'court', 'accident', 'protest', 'announcement', 'budget', 'policy', 'crime', 'disaster', 'sports_event', 'other'];
  const normalized = eventType.toLowerCase().trim();
  return validTypes.includes(normalized) ? normalized : null;
}

/**
 * Generate key facts from sources
 * Extracts 3-6 key facts as bullet points
 */
export async function generateKeyFacts(
  sources: Array<{ title: string; content: string }>,
  summary: string,
  language: 'en' | 'si' | 'ta'
): Promise<string[]> {
  const langLabel = language === 'en' ? 'English' : language === 'si' ? 'Sinhala' : 'Tamil';
  
  const sourceText = sources
    .slice(0, 6)
    .map((s, i) => `Source ${i + 1}: ${s.title}\n${s.content.slice(0, 500)}`)
    .join('\n\n');

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You are a news fact extractor. Extract 3-6 key facts from news sources.

RULES:
- Extract only verified facts present in the sources
- Each fact should be a complete, standalone statement
- Prioritize: who, what, when, where, why, how
- Include numbers, dates, locations, and entities
- Write in ${langLabel}
- Return as JSON array of strings
- No opinions, no speculation
- Each fact should be 10-30 words`
    },
    {
      role: 'user',
      content: `Summary: ${summary}

Sources:
${sourceText}

Extract 3-6 key facts in ${langLabel}. Return ONLY a JSON array of strings, no other text.`
    }
  ];

  try {
    const completion = await withRetry(() => client.chat.completions.create({
      model: env.SUMMARY_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 400,
      response_format: { type: 'json_object' }
    }));

    const response = completion.choices[0]?.message?.content?.trim() || '{}';
    const parsed = JSON.parse(response);
    
    // Handle both {facts: [...]} and {key_facts: [...]} formats
    const facts = parsed.facts || parsed.key_facts || parsed.keyFacts || [];
    
    // Ensure it's an array and limit to 6
    const result = Array.isArray(facts) ? facts.slice(0, 6) : [];
    
    // Filter out empty strings and ensure all are strings
    return result
      .filter((f: any) => f && typeof f === 'string' && f.trim().length > 0)
      .map((f: string) => f.trim());
  } catch (error) {
    console.error('[generateKeyFacts] Error:', error);
    // Fallback: extract simple facts from summary
    const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 5).map(s => s.trim());
  }
}

/**
 * Generate confirmed vs differs section
 * Compares sources to identify what's confirmed and what differs
 */
export async function generateConfirmedVsDiffers(
  sources: Array<{ title: string; content: string }>,
  summary: string,
  language: 'en' | 'si' | 'ta'
): Promise<string> {
  const langLabel = language === 'en' ? 'English' : language === 'si' ? 'Sinhala' : 'Tamil';
  
  const sourceText = sources
    .slice(0, 6)
    .map((s, i) => `Source ${i + 1} (${s.title}):\n${s.content.slice(0, 400)}`)
    .join('\n\n');

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You are a news fact-checker. Compare multiple sources to identify what's confirmed vs what differs.

RULES:
- Identify facts mentioned in 2+ sources (CONFIRMED)
- Identify facts mentioned in only 1 source (NEEDS VERIFICATION)
- Identify conflicting information between sources (DIFFERS)
- Write in ${langLabel}
- Keep response to 1-2 paragraphs (100-200 words)
- Be neutral and factual
- Format: First paragraph = confirmed facts, Second paragraph = differences/conflicts`
    },
    {
      role: 'user',
      content: `Summary: ${summary}

Sources:
${sourceText}

Analyze what's confirmed across multiple sources vs what differs. Write 1-2 paragraphs in ${langLabel}.`
    }
  ];

  try {
    const completion = await withRetry(() => client.chat.completions.create({
      model: env.SUMMARY_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 300,
    }));

    const result = completion.choices[0]?.message?.content?.trim() || '';
    return result || '';
  } catch (error) {
    console.error('[generateConfirmedVsDiffers] Error:', error);
    return '';
  }
}

/**
 * Generate SEO keywords
 * Creates 5-12 keywords including topic, location, entities, etc.
 */
export async function generateKeywords(
  headline: string,
  summary: string,
  topic: string | null,
  district: string | null,
  primaryEntity: string | null,
  eventType: string | null
): Promise<string[]> {
  
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You are an SEO keyword generator. Generate 5-12 relevant keywords for news articles.

RULES:
- Always include "Sri Lanka"
- Include topic if provided
- Include district if provided
- Include primary entity if provided
- Include event type if provided
- Add 2-4 related terms from headline/summary
- Return as JSON array of strings
- All keywords should be lowercase
- No duplicates`
    },
    {
      role: 'user',
      content: `Headline: ${headline}
Summary: ${summary.slice(0, 300)}
Topic: ${topic || 'N/A'}
District: ${district || 'N/A'}
Primary Entity: ${primaryEntity || 'N/A'}
Event Type: ${eventType || 'N/A'}

Generate 5-12 SEO keywords. Return ONLY a JSON array of strings, no other text.`
    }
  ];

  try {
    const completion = await withRetry(() => client.chat.completions.create({
      model: env.SUMMARY_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    }));

    const response = completion.choices[0]?.message?.content?.trim() || '{}';
    const parsed = JSON.parse(response);
    
    // Handle various response formats
    const keywords = parsed.keywords || parsed.key_words || parsed.keyWords || [];
    
    // Build base keywords
    const baseKeywords: string[] = ['Sri Lanka'];
    if (topic) baseKeywords.push(topic);
    if (district) baseKeywords.push(district);
    if (primaryEntity) baseKeywords.push(primaryEntity);
    if (eventType) baseKeywords.push(eventType);
    
    // Add AI-generated keywords
    const aiKeywords = Array.isArray(keywords) 
      ? keywords.filter((k: any) => k && typeof k === 'string' && k.trim().length > 0)
      : [];
    
    // Combine and deduplicate
    const allKeywords = [...baseKeywords, ...aiKeywords]
      .map(k => k.toLowerCase().trim())
      .filter((k, i, arr) => arr.indexOf(k) === i) // Remove duplicates
      .slice(0, 12); // Max 12 keywords
    
    return allKeywords;
  } catch (error) {
    console.error('[generateKeywords] Error:', error);
    // Fallback: basic keywords
    const fallback: string[] = ['Sri Lanka'];
    if (topic) fallback.push(topic);
    if (district) fallback.push(district);
    if (primaryEntity) fallback.push(primaryEntity);
    return fallback;
  }
}

/**
 * Validate summary quality
 * Checks if summary meets quality standards
 * @param summary - Summary text to validate
 * @returns Object with validation result and score
 */
export function validateSummaryQuality(summary: string): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  if (!summary || summary.trim().length === 0) {
    return { isValid: false, score: 0, issues: ['Summary is empty'] };
  }

  // Check minimum length (200 words - increased from 100)
  const wordCount = summary.trim().split(/\s+/).length;
  if (wordCount < 200) {
    issues.push(`Summary too short: ${wordCount} words (minimum 200)`);
    score -= 30;
  }

  // Check maximum length (600 words)
  if (wordCount > 600) {
    issues.push(`Summary too long: ${wordCount} words (maximum 600)`);
    score -= 20;
  }

  // Check for key information (who, what, when, where) - enhanced entity patterns
  const hasWho = /\b(?:minister|president|official|person|people|authority|organization|government|police|army|minister|mp|member|parliament|minister|secretary|director|chief|officer|leader|spokesperson|representative|committee|commission|department|ministry|court|judge|lawyer|defendant|plaintiff|company|corporation|institution|university|school|hospital|doctor|patient|student|teacher|citizen|resident|victim|suspect|witness)\b/i.test(summary);
  const hasWhat = summary.length > 50; // Basic check for content
  const hasWhen = /\b(?:today|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/i.test(summary);
  const hasWhere = /\b(?:colombo|kandy|galle|jaffna|sri lanka|sri lankan|lanka|district|province|city|town|village|north|south|east|west|central|northern|southern|eastern|western|province|region|area|location|site|venue|address)\b/i.test(summary);

  if (!hasWho) {
    issues.push('Missing "who" information (person/entity)');
    score -= 10;
  }
  if (!hasWhat) {
    issues.push('Missing "what" information (event/action)');
    score -= 10;
  }
  if (!hasWhen) {
    issues.push('Missing "when" information (time/date)');
    score -= 5;
  }
  if (!hasWhere) {
    issues.push('Missing "where" information (location)');
    score -= 5;
  }

  // Check for source attribution phrases (good practice)
  const hasSourceAttribution = /\b(?:according to|reports indicate|sources say|sources report|sources differ|reports vary|according to sources|according to one source|multiple sources|verified sources)\b/i.test(summary);
  if (!hasSourceAttribution && wordCount > 250) {
    // For longer summaries, source attribution is more important
    issues.push('Missing source attribution phrases (recommended for multi-source summaries)');
    score -= 5; // Minor penalty, not critical
  }

  // Check for placeholder text or errors
  const placeholderPatterns = [
    /\[.*?\]/g, // [placeholder]
    /TODO/i,
    /FIXME/i,
    /XXX/i,
    /placeholder/i,
    /lorem ipsum/i
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(summary)) {
      issues.push('Contains placeholder text');
      score -= 20;
      break;
    }
  }

  // Check for repetition (same sentence/phrase repeated)
  const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
  if (sentences.length > uniqueSentences.size + 1) {
    issues.push('Contains repetitive content');
    score -= 15;
  }

  // Check for proper structure (should have multiple sentences)
  if (sentences.length < 2) {
    issues.push('Summary too short or lacks structure (needs multiple sentences)');
    score -= 10;
  }

  // Check for sentence structure and coherence
  // Look for proper sentence endings and transitions
  const hasProperEndings = /[.!?]\s+[A-Z]/.test(summary); // Sentence ending followed by capital letter
  const hasTransitions = /\b(?:however|furthermore|additionally|meanwhile|accordingly|therefore|consequently|moreover|also|further|then|next|finally|in addition|as a result)\b/i.test(summary);
  
  if (sentences.length >= 3 && !hasProperEndings && !hasTransitions) {
    issues.push('Poor sentence structure or coherence (lacks proper transitions)');
    score -= 5;
  }

  // Check for neutral tone (no emotional language)
  const emotionalPatterns = [
    /\b(?:shocking|devastating|horrific|terrible|amazing|incredible|unbelievable|outrageous|scandalous)\b/i,
    /!{2,}/, // Multiple exclamation marks
    /\b(?:OMG|WOW|WTF)\b/i // Emotional acronyms
  ];
  
  for (const pattern of emotionalPatterns) {
    if (pattern.test(summary)) {
      issues.push('Contains emotional or sensational language (should be neutral)');
      score -= 10;
      break;
    }
  }

  // Check for factual consistency (numbers and dates)
  // Extract all numbers and dates
  const numbers = summary.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g) || [];
  const dates = summary.match(/\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})\b/gi) || [];
  
  // If multiple numbers/dates appear, check for obvious inconsistencies
  // (This is a basic check - more sophisticated validation would require context)
  if (numbers.length > 1) {
    const numericValues = numbers.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => !isNaN(n));
    // Check for extreme outliers (e.g., 5 vs 5000 in same context might be inconsistent)
    // This is a simplified check - in practice, context matters
  }

  // Basic grammar check (look for common errors)
  const grammarIssues = [
    /\s+\.\s+\./, // Double periods
    /\s+,\s+,/, // Double commas
    /\s{3,}/, // Multiple spaces
    /[A-Z]{3,}/, // ALL CAPS words (except acronyms)
  ];
  
  for (const pattern of grammarIssues) {
    if (pattern.test(summary)) {
      issues.push('Contains grammar or formatting issues');
      score -= 5;
      break;
    }
  }

  const isValid = score >= 60 && issues.length < 3;

  return {
    isValid,
    score: Math.max(0, score),
    issues
  };
}

/**
 * Validate translation quality
 * Checks if translation preserves all information and maintains quality
 * @param sourceText - Original text in source language
 * @param translatedText - Translated text
 * @param sourceLang - Source language code
 * @param targetLang - Target language code
 * @returns Object with validation result and score
 */
export function validateTranslationQuality(
  sourceText: string,
  translatedText: string,
  sourceLang: 'en' | 'si' | 'ta',
  targetLang: 'en' | 'si' | 'ta'
): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  if (!translatedText || translatedText.trim().length === 0) {
    return { isValid: false, score: 0, issues: ['Translation is empty'] };
  }

  if (!sourceText || sourceText.trim().length === 0) {
    return { isValid: false, score: 0, issues: ['Source text is empty'] };
  }

  // Check length similarity (translation should be within 15% of source length - stricter)
  const sourceWordCount = sourceText.trim().split(/\s+/).length;
  const translatedWordCount = translatedText.trim().split(/\s+/).length;
  const lengthRatio = translatedWordCount / sourceWordCount;
  
  if (sourceWordCount > 10) {
    if (lengthRatio < 0.85 || lengthRatio > 1.15) {
      issues.push(`Translation length differs significantly from source (ratio: ${lengthRatio.toFixed(2)}, source: ${sourceWordCount} words, translation: ${translatedWordCount} words)`);
      score -= 20;
    } else if (lengthRatio < 0.90 || lengthRatio > 1.10) {
      issues.push(`Translation length slightly differs from source (ratio: ${lengthRatio.toFixed(2)})`);
      score -= 10;
    }
  }

  // Extract numbers from source and translation - all should be preserved
  const sourceNumbers: string[] = sourceText.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g) || [];
  const translatedNumbers: string[] = translatedText.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g) || [];
  
  if (sourceNumbers.length > 0) {
    const missingNumbers = sourceNumbers.filter(num => !translatedNumbers.includes(num));
    if (missingNumbers.length > 0) {
      issues.push(`Missing numbers in translation: ${missingNumbers.slice(0, 3).join(', ')}`);
      score -= 20;
    }
  }

  // Extract dates from source and translation - all should be preserved
  const sourceDates = sourceText.match(/\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})\b/gi) || [];
  const translatedDates = translatedText.match(/\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})\b/gi) || [];
  
  if (sourceDates.length > 0) {
    // Check if dates are preserved (allowing for format differences)
    const sourceDateCount = sourceDates.length;
    const translatedDateCount = translatedDates.length;
    if (translatedDateCount < sourceDateCount * 0.8) {
      issues.push(`Missing dates in translation (source: ${sourceDateCount}, translation: ${translatedDateCount})`);
      score -= 15;
    }
  }

  // Check for proper nouns (names, places, organizations) - should be preserved
  // Enhanced check with stricter requirements
  if (sourceLang === 'en') {
    const properNouns = sourceText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    // Filter out common words that start with capital (like "The", "A", etc.)
    const significantProperNouns = properNouns.filter(noun => 
      !['The', 'A', 'An', 'This', 'That', 'These', 'Those', 'Sri', 'Lanka'].includes(noun) &&
      noun.length > 2 &&
      !noun.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)$/i)
    );
    
    // Check if proper nouns appear in translation (stricter - need at least 70% preserved)
    if (significantProperNouns.length > 0) {
      const preservedCount = significantProperNouns.filter(noun => {
        const nounLower = noun.toLowerCase();
        return translatedText.toLowerCase().includes(nounLower) || 
               translatedText.toLowerCase().includes(nounLower.replace(/\s+/g, ''));
      }).length;
      
      const preservationRate = preservedCount / significantProperNouns.length;
      if (preservationRate < 0.7) {
        issues.push(`Many proper nouns may be missing or incorrectly translated (${Math.round(preservationRate * 100)}% preserved, need 70%+)`);
        score -= 15;
      } else if (preservationRate < 0.85) {
        issues.push(`Some proper nouns may be missing (${Math.round(preservationRate * 100)}% preserved)`);
        score -= 5;
      }
    }
  }

  // Check sentence structure - translation should have similar sentence count
  const sourceSentences = sourceText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const translatedSentences = translatedText.split(/[.!?]+/).filter(s => s.trim().length > 10);

  // Check for formal language (no colloquialisms, slang, or informal expressions)
  // Enhanced check for formal language usage
  if (targetLang === 'si') {
    // Sinhala: Check for proper Sinhala script usage
    const hasSinhalaScript = /[ක-ෆ]/.test(translatedText);
    if (!hasSinhalaScript && translatedText.length > 50) {
      issues.push('May not contain proper Sinhala script (සිංහල)');
      score -= 15;
    }
    // Check for too many English words (informal)
    const englishWords = translatedText.match(/\b[A-Za-z]{3,}\b/g) || [];
    const totalWords = translatedText.split(/\s+/).length;
    if (totalWords > 0 && englishWords.length > totalWords * 0.2) {
      issues.push('Too many English words in Sinhala translation (should be formal Sinhala)');
      score -= 10;
    }
    // Check for common informal Sinhala patterns
    const informalPatterns = [/කොහොමද/i, /එහෙම/i, /මෙහෙම/i, /හරිද/i];
    if (informalPatterns.some(pattern => pattern.test(translatedText))) {
      issues.push('Contains informal/colloquial Sinhala expressions');
      score -= 10;
    }
    // Check for structure preservation (sections, bullet points)
    const hasWhyMatters = /(?:why|මන්ද|කුමක්|ඇයි).*(?:matters|වැදගත්|සැලකිය|ප්‍රමුඛ)/i.test(translatedText) || 
                          /වැදගත්කම|සැලකිය යුතු|ප්‍රමුඛ/.test(translatedText);
    const hasWatchNext = /(?:watch|next|ඊළඟ|ඉදිරියට|බලන්න)/i.test(translatedText) ||
                         /ඊළඟ|ඉදිරියට|බලන්න/.test(translatedText);
    if (sourceText.toLowerCase().includes('why this matters') && !hasWhyMatters) {
      issues.push('May not preserve "Why this matters" section structure');
      score -= 5;
    }
    if (sourceText.toLowerCase().includes('what to watch') && !hasWatchNext) {
      issues.push('May not preserve "What to watch next" section structure');
      score -= 5;
    }
  }
  
  if (targetLang === 'ta') {
    // Tamil: Check for proper Tamil script usage
    const hasTamilScript = /[அ-ஹ]/.test(translatedText);
    if (!hasTamilScript && translatedText.length > 50) {
      issues.push('May not contain proper Tamil script (தமிழ்)');
      score -= 15;
    }
    // Check for too many English words (informal)
    const englishWords = translatedText.match(/\b[A-Za-z]{3,}\b/g) || [];
    const totalWords = translatedText.split(/\s+/).length;
    if (totalWords > 0 && englishWords.length > totalWords * 0.2) {
      issues.push('Too many English words in Tamil translation (should be formal Tamil)');
      score -= 10;
    }
    // Check for common informal Tamil patterns
    const informalPatterns = [/எப்படி/i, /அப்படி/i, /இப்படி/i, /என்ன/i];
    if (informalPatterns.some(pattern => pattern.test(translatedText))) {
      issues.push('Contains informal/colloquial Tamil expressions');
      score -= 10;
    }
    // Check for structure preservation (sections, bullet points)
    const hasWhyMatters = /(?:why|ஏன்|எதற்கு|என்பதற்கு).*(?:matters|முக்கியம்|முக்கியத்துவம்|பிரதான)/i.test(translatedText) ||
                          /முக்கியம்|முக்கியத்துவம்|பிரதான/.test(translatedText);
    const hasWatchNext = /(?:watch|next|அடுத்து|முன்னோக்கி|பார்க்க)/i.test(translatedText) ||
                         /அடுத்து|முன்னோக்கி|பார்க்க/.test(translatedText);
    if (sourceText.toLowerCase().includes('why this matters') && !hasWhyMatters) {
      issues.push('May not preserve "Why this matters" section structure');
      score -= 5;
    }
    if (sourceText.toLowerCase().includes('what to watch') && !hasWatchNext) {
      issues.push('May not preserve "What to watch next" section structure');
      score -= 5;
    }
  }
  
  if (sourceSentences.length > 0) {
    const sentenceRatio = translatedSentences.length / sourceSentences.length;
    if (sentenceRatio < 0.7 || sentenceRatio > 1.5) {
      issues.push(`Sentence structure differs significantly (source: ${sourceSentences.length}, translation: ${translatedSentences.length})`);
      score -= 10;
    }
  }

  // Check for placeholder text or errors in translation
  const placeholderPatterns = [
    /\[.*?\]/g,
    /TODO/i,
    /FIXME/i,
    /XXX/i,
    /placeholder/i,
    /lorem ipsum/i
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(translatedText)) {
      issues.push('Contains placeholder text');
      score -= 20;
      break;
    }
  }

  // Check for repetition in translation
  const uniqueTranslatedSentences = new Set(translatedSentences.map(s => s.trim().toLowerCase()));
  if (translatedSentences.length > uniqueTranslatedSentences.size + 1) {
    issues.push('Contains repetitive content');
    score -= 10;
  }

  // Basic quality check - translation should not be too short
  if (translatedText.trim().length < 50) {
    issues.push('Translation is too short');
    score -= 15;
  }

  const isValid = score >= 60 && issues.length < 3;

  return {
    isValid,
    score: Math.max(0, score),
    issues
  };
}

/**
 * Validate headline translation quality
 * Optimized for headlines (shorter, more focused validation than full text)
 * @param sourceHeadline - Original headline in source language
 * @param translatedHeadline - Translated headline
 * @param sourceLang - Source language code
 * @param targetLang - Target language code
 * @returns Object with validation result and score
 */
export function validateHeadlineTranslationQuality(
  sourceHeadline: string,
  translatedHeadline: string,
  sourceLang: 'en' | 'si' | 'ta',
  targetLang: 'en' | 'si' | 'ta'
): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  if (!translatedHeadline || translatedHeadline.trim().length === 0) {
    return { isValid: false, score: 0, issues: ['Headline translation is empty'] };
  }

  if (!sourceHeadline || sourceHeadline.trim().length === 0) {
    return { isValid: false, score: 0, issues: ['Source headline is empty'] };
  }

  // Check headline length (headlines should be 30-100 characters, more flexible than summaries)
  const translatedLength = translatedHeadline.trim().length;
  if (translatedLength < 20) {
    issues.push(`Headline too short: ${translatedLength} characters (minimum 20)`);
    score -= 15;
  }
  if (translatedLength > 120) {
    issues.push(`Headline too long: ${translatedLength} characters (maximum 120)`);
    score -= 10;
  }

  // Check length similarity (headlines can vary more than full text, but should be reasonable)
  const sourceLength = sourceHeadline.trim().length;
  const lengthRatio = translatedLength / sourceLength;
  
  if (sourceLength > 10) {
    // Allow more flexibility for headlines (30-200% range)
    if (lengthRatio < 0.3 || lengthRatio > 2.0) {
      issues.push(`Headline length differs significantly from source (ratio: ${lengthRatio.toFixed(2)})`);
      score -= 15;
    } else if (lengthRatio < 0.5 || lengthRatio > 1.5) {
      issues.push(`Headline length differs from source (ratio: ${lengthRatio.toFixed(2)})`);
      score -= 5;
    }
  }

  // Extract numbers from source and translation - all should be preserved
  const sourceNumbers: string[] = sourceHeadline.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g) || [];
  const translatedNumbers: string[] = translatedHeadline.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g) || [];
  
  if (sourceNumbers.length > 0) {
    const missingNumbers = sourceNumbers.filter(num => !translatedNumbers.includes(num));
    if (missingNumbers.length > 0) {
      issues.push(`Missing numbers in headline translation: ${missingNumbers.slice(0, 3).join(', ')}`);
      score -= 25; // More critical for headlines
    }
  }

  // Extract dates from source and translation - all should be preserved
  const sourceDates = sourceHeadline.match(/\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})\b/gi) || [];
  const translatedDates = translatedHeadline.match(/\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4})\b/gi) || [];
  
  if (sourceDates.length > 0) {
    const sourceDateCount = sourceDates.length;
    const translatedDateCount = translatedDates.length;
    if (translatedDateCount < sourceDateCount) {
      issues.push(`Missing dates in headline translation (source: ${sourceDateCount}, translation: ${translatedDateCount})`);
      score -= 20;
    }
  }

  // Check for proper nouns (names, places, organizations) - should be preserved
  if (sourceLang === 'en') {
    const properNouns = sourceHeadline.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const significantProperNouns = properNouns.filter(noun => 
      !['The', 'A', 'An', 'This', 'That', 'These', 'Those', 'Sri', 'Lanka'].includes(noun) &&
      noun.length > 2 &&
      !noun.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)$/i)
    );
    
    if (significantProperNouns.length > 0) {
      const preservedCount = significantProperNouns.filter(noun => {
        const nounLower = noun.toLowerCase();
        return translatedHeadline.toLowerCase().includes(nounLower) || 
               translatedHeadline.toLowerCase().includes(nounLower.replace(/\s+/g, ''));
      }).length;
      
      const preservationRate = preservedCount / significantProperNouns.length;
      if (preservationRate < 0.6) {
        issues.push(`Many proper nouns missing in headline translation (${Math.round(preservationRate * 100)}% preserved, need 60%+)`);
        score -= 20;
      } else if (preservationRate < 0.8) {
        issues.push(`Some proper nouns may be missing (${Math.round(preservationRate * 100)}% preserved)`);
        score -= 10;
      }
    }
  }

  // Check for formal language (for Sinhala and Tamil)
  if (targetLang === 'si') {
    // Sinhala: Check for proper Sinhala script usage
    const hasSinhalaScript = /[ක-ෆ]/.test(translatedHeadline);
    if (!hasSinhalaScript && translatedHeadline.length > 10) {
      issues.push('May not contain proper Sinhala script (සිංහල)');
      score -= 15;
    }
    // Check for too many English words (informal)
    const englishWords = translatedHeadline.match(/\b[A-Za-z]{3,}\b/g) || [];
    const totalWords = translatedHeadline.split(/\s+/).length;
    if (totalWords > 0 && englishWords.length > totalWords * 0.3) {
      issues.push('Too many English words in Sinhala headline (should be formal Sinhala)');
      score -= 10;
    }
    // Check for informal Sinhala patterns (colloquial expressions)
    const informalPatterns = [/කොහොමද/i, /එහෙම/i, /මෙහෙම/i];
    if (informalPatterns.some(pattern => pattern.test(translatedHeadline))) {
      issues.push('Contains informal/colloquial Sinhala expressions');
      score -= 10;
    }
  }
  
  if (targetLang === 'ta') {
    // Tamil: Check for proper Tamil script usage
    const hasTamilScript = /[அ-ஹ]/.test(translatedHeadline);
    if (!hasTamilScript && translatedHeadline.length > 10) {
      issues.push('May not contain proper Tamil script (தமிழ்)');
      score -= 15;
    }
    // Check for too many English words (informal)
    const englishWords = translatedHeadline.match(/\b[A-Za-z]{3,}\b/g) || [];
    const totalWords = translatedHeadline.split(/\s+/).length;
    if (totalWords > 0 && englishWords.length > totalWords * 0.3) {
      issues.push('Too many English words in Tamil headline (should be formal Tamil)');
      score -= 10;
    }
    // Check for informal Tamil patterns (colloquial expressions)
    const informalPatterns = [/எப்படி/i, /அப்படி/i, /இப்படி/i];
    if (informalPatterns.some(pattern => pattern.test(translatedHeadline))) {
      issues.push('Contains informal/colloquial Tamil expressions');
      score -= 10;
    }
  }

  // Check for placeholder text or errors
  const placeholderPatterns = [
    /\[.*?\]/g,
    /TODO/i,
    /FIXME/i,
    /XXX/i,
    /placeholder/i,
    /lorem ipsum/i
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(translatedHeadline)) {
      issues.push('Contains placeholder text');
      score -= 30;
      break;
    }
  }

  // Check for basic structure (should have some content, not just punctuation)
  const contentWords = translatedHeadline.trim().split(/\s+/).filter(w => w.length > 1);
  if (contentWords.length < 2) {
    issues.push('Headline too short or lacks content (needs at least 2 words)');
    score -= 20;
  }

  // Check for emotional/sensational language (should be neutral)
  const emotionalPatterns = [
    /\b(?:shocking|devastating|horrific|terrible|amazing|incredible|unbelievable|outrageous|scandalous)\b/i,
    /!{2,}/, // Multiple exclamation marks
    /\b(?:OMG|WOW|WTF)\b/i
  ];
  
  for (const pattern of emotionalPatterns) {
    if (pattern.test(translatedHeadline)) {
      issues.push('Contains emotional or sensational language (should be neutral)');
      score -= 10;
      break;
    }
  }

  const isValid = score >= 60 && issues.length < 4;

  return {
    isValid,
    score: Math.max(0, score),
    issues
  };
}
