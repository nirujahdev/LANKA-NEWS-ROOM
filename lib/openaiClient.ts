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

