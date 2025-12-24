const stopWords = new Set([
  'the',
  'a',
  'an',
  'of',
  'in',
  'on',
  'and',
  'or',
  'to',
  'for',
  'with',
  'by',
  'at',
  'from'
]);

const synonymMap: Record<string, string> = {
  govt: 'government',
  gov: 'government',
  lanka: 'sri lanka',
  sl: 'sri lanka'
};

const knownPlaces = new Set(['colombo', 'jaffna', 'kandy', 'galle', 'matara', 'kurunegala']);

export function normalizeTitle(title: string): string[] {
  const lowered = title.toLowerCase();
  const tokens = lowered
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => synonymMap[t] || t)
    .flatMap((t) => t.split(' '))
    .filter((t) => t && !stopWords.has(t));
  return Array.from(new Set(tokens));
}

export function extractEntities(text: string): string[] {
  const capitalized = text.match(/\b[A-Z][a-z]+\b/g) || [];
  const lowered = capitalized.map((w) => w.toLowerCase());
  const matches = lowered.filter((w) => knownPlaces.has(w));
  return Array.from(new Set(matches));
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export function similarityScore(aTokens: string[], bTokens: string[], aEntities: string[], bEntities: string[]) {
  const jac = jaccard(new Set(aTokens), new Set(bTokens));
  const entityOverlap = jaccard(new Set(aEntities), new Set(bEntities));
  return 0.7 * jac + 0.3 * entityOverlap;
}

