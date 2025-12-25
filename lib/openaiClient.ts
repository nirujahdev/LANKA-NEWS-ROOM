import OpenAI from 'openai';
import { env } from './env';
import { withRetry } from './retry';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function summarizeEnglish(sources: { title: string; content: string }[], previous?: string | null) {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You are a neutral news summarization engine.

Your job is to write concise, factual, multi-source news summaries.
You must strictly follow journalistic neutrality.

Rules you must follow:
- Use ONLY the information provided in the sources
- Do NOT add assumptions, opinions, or predictions
- Do NOT exaggerate or sensationalize
- Do NOT invent names, numbers, or events
- If sources disagree, explicitly say "reports vary" and state both versions
- Prefer facts confirmed by multiple sources
- Write in clear, simple language
- Tone must be calm, factual, and professional
- No emojis, no headlines in ALL CAPS

Output style:
- 1 short lead sentence
- 2–4 supporting sentences
- Past tense
- Third-person`
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
        max_tokens: 400
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
      content: `Translate the following English news summary into formal written ${langLabel}.

Rules:
- Preserve meaning exactly
- Do NOT add or remove information
- Use formal news-style ${langLabel}
- Avoid informal or conversational language${target === 'ta' ? '\n- Avoid informal or spoken Tamil' : ''}`
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
      content: `You are a professional news summarization engine for Sri Lankan news aggregation.

CORE PRINCIPLES:
- Journalistic neutrality: No opinions, no bias, no sensationalism
- Multi-source verification: Prioritize facts confirmed by multiple sources
- Factual accuracy: Every number, name, date, and location must appear in at least one source
- Chronological clarity: Present events in time order when relevant
- Context preservation: Maintain important context (who, what, when, where, why, how)

QUALITY STANDARDS:
- Summary length: 100-150 words
- Structure: 1 lead sentence + 3-5 supporting sentences
- Tone: Calm, factual, professional
- Tense: Past tense, third person
- Language: Write in ${langLabel}
- Style: Clear, simple, accessible

VERIFICATION RULES:
- If sources disagree: Explicitly state "reports vary" and present both versions
- If information is uncertain: Use phrases like "according to sources" or "reports indicate"
- If numbers differ: State the range or most commonly cited figure
- If names/entities differ: Use the most frequently mentioned version

OUTPUT FORMAT:
- Lead sentence: Most important fact (who/what/when)
- Supporting sentences: Key details, context, and implications
- No emojis, no ALL CAPS, no exclamation marks
- No assumptions beyond what sources provide`
    },
    {
      role: 'user',
      content: `${prior}Summarize the following news reports into ONE comprehensive, neutral news brief in ${langLabel}.

INSTRUCTIONS:
1. Combine all sources into a single coherent narrative
2. Include only verified facts present in the sources
3. If a fact appears in only one source, mention it but note the source
4. If information conflicts, clearly state the discrepancy
5. Maintain chronological order when relevant
6. Include key numbers, dates, locations, and entities
7. Keep summary between 100-150 words

SOURCES (ordered by recency and importance):
${sourceText}

Generate a professional news summary in ${langLabel} following all rules above.`
    }
  ];

  const completion = await client.chat.completions.create({
    model: env.SUMMARY_MODEL,
    messages,
    temperature: 0.2,
    max_tokens: 500,
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
      content: `Translate the following ${fromLabel} news summary into formal written ${toLabel}.

Rules:
- Preserve meaning exactly
- Do NOT add or remove information
- Use formal news-style ${toLabel}
- Avoid informal or conversational language
- Maintain the same tone and structure
- Keep all numbers, names, dates, and locations accurate${to === 'ta' ? '\n- Avoid informal or spoken Tamil' : ''}`
    },
    { role: 'user', content: text }
  ];

  // Use retry logic for translation
  return withRetry(
    async () => {
      const completion = await client.chat.completions.create({
        model: env.SUMMARY_TRANSLATE_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 500
      });
      const translated = completion.choices[0]?.message?.content?.trim();
      if (!translated) {
        throw new Error('Empty translation response');
      }
      return translated;
    },
    {
      maxRetries: 3,
      retryDelay: 1000,
      onRetry: (attempt, error) => {
        console.warn(`[OpenAI] Retry ${attempt}/3 for translateFromTo (${from}→${to}): ${error.message}`);
      }
    }
  )();
}

// Export translateFromTo for use in pipeline
export { translateFromTo };

function buildSourcePrompt(sources: { title: string; content: string }[], previous?: string | null) {
  const trimmed = sources
    .slice(0, env.MAX_SUMMARY_ARTICLES)
    .map(
      (s, idx) =>
        `Source ${idx + 1} Title: ${s.title}\nSource ${idx + 1} Text: ${s.content.slice(0, 1500)}`
    )
    .join('\n\n');

  const prior = previous ? `Previous summary:\n${previous}\n\nUpdate only if new facts appear.\n\n` : '';

  return `${prior}Summarize the following news reports into ONE neutral, factual news brief.

Instructions:
- Combine all sources into a single clear summary
- Include only verified facts
- If a fact appears in only one source, mention the source explicitly
- If information conflicts, clearly state that reports differ
- Keep the summary under 120 words

Sources:
${trimmed}`;
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
      content: `You are an SEO specialist for a Sri Lankan news aggregation website.

Your task: Generate SEO-optimized meta title and description from a news summary.

STRICT RULES FOR META TITLE:
- Length: EXACTLY 50-60 characters (hard limit)
- Must describe the real-world event clearly
- Must include "${countryRef}" or "${language === 'en' ? 'Sri Lankan' : ''}" when relevant
- Must NOT be clickbait
- Format: "[Key event] – ${countryRef} | ${siteName}"
- Use only information present in the summary
- No assumptions, no opinions
- If event is uncertain, use neutral phrasing ("reports say")

STRICT RULES FOR META DESCRIPTION:
- Length: EXACTLY 140-160 characters
- Neutral, factual tone
- One concise sentence
- Must not claim exclusivity or opinion
- Should imply multi-source verification
- Use format: "Based on reports from multiple verified sources, [factual statement]"
- Must be different from the title (not copied text)

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
  const siteName = 'Lanka News Room';
  const countryRef = language === 'en' ? 'Sri Lanka' : language === 'si' ? 'ශ්‍රී ලංකා' : 'இலங்கை';
  
  // Remove quotes, emojis, special chars
  let cleaned = title
    .replace(/["'""]/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .replace(/[^\w\s\-–—|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure format includes country and site name if not present
  if (!cleaned.includes(countryRef) && !cleaned.includes('Sri Lanka') && !cleaned.includes('Sri Lankan')) {
    cleaned = `${cleaned} – ${countryRef}`;
  }
  if (!cleaned.includes(siteName)) {
    cleaned = `${cleaned} | ${siteName}`;
  }

  // Enforce length limit
  if (cleaned.length > 60) {
    cleaned = cleaned.slice(0, 57) + '...';
  }
  if (cleaned.length < 50) {
    // Pad if too short (unlikely but handle it)
    cleaned = cleaned + ' | ' + siteName;
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

  // Ensure it implies multi-source verification (for English)
  if (language === 'en' && !cleaned.toLowerCase().includes('source') && !cleaned.toLowerCase().includes('report')) {
    cleaned = `Based on reports from multiple verified sources, ${cleaned}`;
  }

  // Enforce length limit
  if (cleaned.length > 160) {
    cleaned = cleaned.slice(0, 157) + '...';
  }
  if (cleaned.length < 140) {
    // If too short, it's okay - just return as is
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
  language: 'en' | 'si' | 'ta'
): Promise<{
  seo_title: string;
  meta_description: string;
  slug: string;
  og_title: string;
  og_description: string;
  topic: string;
  city: string | null;
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
      content: `You are an SEO editor for a Sri Lanka news website.

Your task: Extract structured SEO data from news articles.

RULES:
1. seo_title: 50-65 chars, clear, include "${countryRef}" if relevant, format: "[Event] – ${countryRef} | Lanka News Room"
2. meta_description: 150-160 chars, natural, includes main entity + impact
3. slug: lowercase, hyphen-separated, 4-9 words, no stopwords (a, the, is, etc.)
4. og_title: can be slightly longer than seo_title (up to 70 chars)
5. og_description: same as meta_description
6. topic: ONE of [politics, economy, sports, crime, education, health, environment, technology, culture, other]
7. city: ONE of [colombo, kandy, galle, jaffna, trincomalee, batticaloa, matara, negombo, anuradhapura, other] or null
8. primary_entity: main person/organization mentioned (or null)
9. event_type: ONE of [election, court, accident, protest, announcement, budget, policy, crime, disaster, sports_event, other] or null

CRITICAL:
- Must match summary facts ONLY
- No quotes, no emojis
- No "Breaking:" unless truly breaking
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
  "city": "..." or null,
  "primary_entity": "..." or null,
  "event_type": "..." or null
}`
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
    
    return {
      seo_title: validateAndCleanTitle(result.seo_title || headline, language),
      meta_description: validateAndCleanDescription(result.meta_description || summary, language),
      slug: cleanSlug(result.slug || headline),
      og_title: result.og_title || validateAndCleanTitle(result.seo_title || headline, language),
      og_description: result.og_description || validateAndCleanDescription(result.meta_description || summary, language),
      topic: validateTopic(result.topic),
      city: validateCity(result.city),
      primary_entity: result.primary_entity || null,
      event_type: validateEventType(result.event_type)
    };
  } catch (error) {
    console.error('Error parsing comprehensive SEO:', error);
    // Fallback
    return {
      seo_title: validateAndCleanTitle(headline, language),
      meta_description: validateAndCleanDescription(summary, language),
      slug: cleanSlug(headline),
      og_title: validateAndCleanTitle(headline, language),
      og_description: validateAndCleanDescription(summary, language),
      topic: 'other',
      city: null,
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
  const validTopics = ['politics', 'economy', 'sports', 'crime', 'education', 'health', 'environment', 'technology', 'culture', 'other'];
  if (!topic) return 'other';
  const normalized = topic.toLowerCase().trim();
  return validTopics.includes(normalized) ? normalized : 'other';
}

/**
 * Validate city against allowed list
 */
function validateCity(city: string | null | undefined): string | null {
  if (!city) return null;
  const validCities = ['colombo', 'kandy', 'galle', 'jaffna', 'trincomalee', 'batticaloa', 'matara', 'negombo', 'anuradhapura', 'other'];
  const normalized = city.toLowerCase().trim();
  return validCities.includes(normalized) ? normalized : null;
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
  city: string | null,
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
- Include city if provided
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
City: ${city || 'N/A'}
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
    if (city) baseKeywords.push(city);
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
    if (city) fallback.push(city);
    if (primaryEntity) fallback.push(primaryEntity);
    return fallback;
  }
}

