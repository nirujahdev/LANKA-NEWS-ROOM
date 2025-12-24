const numberPattern = /\b\d[\d,]*(\.\d+)?\b/g;

export function needsReview(summary: string, sources: string[]): boolean {
  const summaryNumbers = new Set(extractNumbers(summary));
  const sourceNumbers = new Set(sources.flatMap(extractNumbers));

  // Use Array.from() for ES5 compatibility
  for (const num of Array.from(summaryNumbers)) {
    if (!sourceNumbers.has(num)) {
      return true;
    }
  }
  return false;
}

function extractNumbers(text: string): string[] {
  return (text.match(numberPattern) || []).map((n) => n.replace(/,/g, ''));
}

