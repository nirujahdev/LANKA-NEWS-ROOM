import OpenAI from 'openai';
import { env } from './env';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/**
 * Allowed categories for news classification
 */
export const ALLOWED_CATEGORIES = [
  'politics',
  'economy',
  'sports',
  'technology',
  'health',
  'education'
] as const;

export type Category = (typeof ALLOWED_CATEGORIES)[number];

/**
 * Categorizes a news cluster based on its articles.
 * Returns exactly one category from the allowed list.
 * Defaults to 'politics' if uncertain.
 */
export async function categorizeCluster(
  articles: Array<{ title: string; content_excerpt?: string | null }>
): Promise<Category> {
  if (articles.length === 0) {
    return 'politics'; // Default fallback
  }

  // Build content text from articles (title + excerpt)
  const contentText = articles
    .slice(0, 6) // Limit to 6 articles max
    .map((article, idx) => {
      const excerpt = article.content_excerpt?.slice(0, 500) || '';
      return `Article ${idx + 1}:\nTitle: ${article.title}\nContent: ${excerpt}`;
    })
    .join('\n\n');

  const prompt = `Given the following multi-source news content, assign ONE category.

Allowed categories:
politics, economy, sports, technology, health, education

Rules:
- Choose the most dominant theme.
- Use Sri Lankan context (e.g., ICC → sports, MOH → health, CEB → economy).
- Government-related news → politics
- Finance, fuel, prices → economy
- Disease, hospitals, health services → health
- Exams, schools, universities → education
- Return only the category word in lowercase.
- No extra text, no explanation.

Content:
${contentText}`;

  try {
    const completion = await client.chat.completions.create({
      model: env.SUMMARY_MODEL, // Use same model as summarization
      messages: [
        {
          role: 'system',
          content:
            'You are a neutral news classifier for a Sri Lanka news platform. Classify news strictly by topic. Return ONLY one category from the allowed list. Do not explain your reasoning.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for deterministic classification
      max_tokens: 20 // Category name only
    });

    const response = completion.choices[0]?.message?.content?.trim().toLowerCase() || '';

    // Validate response is an allowed category
    const category = ALLOWED_CATEGORIES.find((cat) => cat === response);
    if (category) {
      return category;
    }

    // Fallback: try to match partial or handle common variations
    if (response.includes('politic')) return 'politics';
    if (response.includes('econom')) return 'economy';
    if (response.includes('sport')) return 'sports';
    if (response.includes('tech')) return 'technology';
    if (response.includes('health')) return 'health';
    if (response.includes('educat')) return 'education';

    // Default fallback
    return 'politics';
  } catch (error) {
    console.error('Error categorizing cluster:', error);
    // Default fallback on error
    return 'politics';
  }
}

