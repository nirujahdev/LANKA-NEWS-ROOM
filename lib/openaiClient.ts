import OpenAI from 'openai';
import { env } from './env';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function summarizeEnglish(sources: { title: string; content: string }[], previous?: string | null) {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content:
        'You write neutral, factual news summaries in 3-6 sentences. Only use facts from sources. If conflicting numbers or facts, say "reports vary" and include both.'
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
    { role: 'system', content: `Translate to ${langLabel}. Do not add new facts.` },
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

  const prior = previous ? `Previous summary:\n${previous}\nUpdate only if new facts appear.\n\n` : '';

  return `${prior}Summarize the following news sources in English, 3-6 sentences, neutral tone, no speculation. If sources conflict, say "reports vary" and include both values. Do not add facts beyond the sources.\n\n${trimmed}`;
}

