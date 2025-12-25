const numberPattern = /\b\d[\d,]*(\.\d+)?\b/g;
const entityPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g; // Names, places
const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi;

export interface FactCheckResult {
  needsReview: boolean;
  issues: string[];
  confidence: number; // 0-1
  verifiedFacts: {
    numbers: number;
    entities: number;
    dates: number;
  };
}

/**
 * Validate summary against source articles with enhanced fact-checking
 * @param summary - Generated summary text
 * @param sources - Array of source article texts
 * @returns Detailed fact-check result with confidence score
 */
export function validateSummary(summary: string, sources: string[]): FactCheckResult {
  const issues: string[] = [];
  
  // Extract facts from summary
  const summaryNumbers = new Set(extractNumbers(summary));
  const summaryEntities = new Set(extractEntities(summary));
  const summaryDates = new Set(extractDates(summary));
  
  // Extract facts from sources
  const sourceNumbers = new Set(sources.flatMap(extractNumbers));
  const sourceEntities = new Set(sources.flatMap(extractEntities));
  const sourceDates = new Set(sources.flatMap(extractDates));
  
  // Check numbers
  summaryNumbers.forEach(num => {
    if (!sourceNumbers.has(num)) {
      issues.push(`Number "${num}" not found in sources`);
    }
  });
  
  // Check entities (names, places) - allow some flexibility
  const entityMatches = Array.from(summaryEntities).filter(entity => {
    // Check if entity or similar variant exists in sources
    return Array.from(sourceEntities).some(sourceEntity => 
      sourceEntity.toLowerCase().includes(entity.toLowerCase()) ||
      entity.toLowerCase().includes(sourceEntity.toLowerCase())
    );
  });
  
  const unmatchedEntities = Array.from(summaryEntities).filter(e => 
    !entityMatches.includes(e)
  );
  
  unmatchedEntities.forEach(entity => {
    // Only flag if it's a proper noun (capitalized) and not a common word
    if (entity.length > 3 && /^[A-Z]/.test(entity)) {
      issues.push(`Entity "${entity}" not clearly found in sources`);
    }
  });
  
  // Check dates
  summaryDates.forEach(date => {
    if (!sourceDates.has(date)) {
      issues.push(`Date "${date}" not found in sources`);
    }
  });
  
  // Calculate confidence
  const totalFacts = summaryNumbers.size + summaryEntities.size + summaryDates.size;
  const verifiedFacts = {
    numbers: Array.from(summaryNumbers).filter(n => sourceNumbers.has(n)).length,
    entities: entityMatches.length,
    dates: Array.from(summaryDates).filter(d => sourceDates.has(d)).length
  };
  
  const verifiedCount = verifiedFacts.numbers + verifiedFacts.entities + verifiedFacts.dates;
  const confidence = totalFacts > 0 ? verifiedCount / totalFacts : 1;
  
  return {
    needsReview: issues.length > 0 || confidence < 0.8,
    issues,
    confidence,
    verifiedFacts
  };
}

/**
 * Backward compatibility: simple needs review check
 */
export function needsReview(summary: string, sources: string[]): boolean {
  return validateSummary(summary, sources).needsReview;
}

function extractNumbers(text: string): string[] {
  return (text.match(numberPattern) || []).map((n) => n.replace(/,/g, ''));
}

function extractEntities(text: string): string[] {
  // Extract capitalized words (likely names/places)
  const matches = text.match(entityPattern) || [];
  // Filter out common words
  const commonWords = new Set(['The', 'This', 'That', 'These', 'Those', 'They', 'There', 'When', 'Where', 'What', 'Who', 'Why', 'How']);
  return matches.filter(e => !commonWords.has(e) && e.length > 2);
}

function extractDates(text: string): string[] {
  return (text.match(datePattern) || []).map(d => d.toLowerCase());
}

