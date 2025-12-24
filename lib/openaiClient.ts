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

