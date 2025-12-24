import { createHash } from 'crypto';

export function makeArticleHash(input: { url: string; guid?: string | null; title: string }): string {
  const basis = `${input.url}|${input.guid || ''}|${input.title}`;
  return createHash('md5').update(basis).digest('hex');
}

