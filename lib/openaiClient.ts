import OpenAI from 'openai';
import { env } from './env';

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

  const completion = await client.chat.completions.create({
    model: env.SUMMARY_MODEL,
    messages,
    temperature: 0.2,
    max_tokens: 400
  });
  return completion.choices[0]?.message?.content?.trim() || '';
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
  const completion = await client.chat.completions.create({
    model: env.SUMMARY_TRANSLATE_MODEL,
    messages,
    temperature: 0.2,
    max_tokens: 400
  });
  return completion.choices[0]?.message?.content?.trim() || '';
}

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

