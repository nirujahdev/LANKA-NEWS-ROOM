const numberPattern = /\b\d[\d,]*(\.\d+)?\b/g;

export function needsReview(summary: string, sources: string[]): boolean {
  const summaryNumbers = new Set(extractNumbers(summary));
  const sourceNumbers = new Set(sources.flatMap(extractNumbers));

  for (const num of summaryNumbers) {
    if (!sourceNumbers.has(num)) {
      return true;
    }
  }
  return false;
}

function extractNumbers(text: string): string[] {
  return (text.match(numberPattern) || []).map((n) => n.replace(/,/g, ''));
}

