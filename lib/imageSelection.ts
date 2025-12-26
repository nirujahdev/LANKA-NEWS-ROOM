import OpenAI from 'openai';
import { env } from './env';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/**
 * Select the best/most relevant image from multiple article images using AI
 * @param images - Array of image objects with URL and source information
 * @param headline - Article headline
 * @param summary - Article summary
 * @returns Selected image URL or null if no suitable image found
 */
export async function selectBestImage(
  images: Array<{ url: string; source: string }>,
  headline: string,
  summary: string
): Promise<string | null> {
  if (!images || images.length === 0) {
    return null;
  }

  // If only one image, return it
  if (images.length === 1) {
    return images[0].url;
  }

  // Filter out invalid URLs
  const validImages = images.filter(img => {
    try {
      new URL(img.url);
      return img.url.startsWith('http');
    } catch {
      return false;
    }
  });

  if (validImages.length === 0) {
    return null;
  }

  if (validImages.length === 1) {
    return validImages[0].url;
  }

  try {
    // Use AI to analyze and select the best image
    const result = await analyzeImageRelevance(
      validImages.map(img => img.url),
      headline,
      summary
    );

    if (result.selectedIndex >= 0 && result.selectedIndex < validImages.length) {
      console.log(`[Image Selection] Selected image ${result.selectedIndex + 1}/${validImages.length}: ${result.reason}`);
      return validImages[result.selectedIndex].url;
    }
  } catch (error) {
    console.error('[Image Selection] AI selection failed:', error);
  }

  // Fallback: return first valid image
  return validImages[0].url;
}

/**
 * Analyze image relevance using AI
 * @param imageUrls - Array of image URLs to analyze
 * @param headline - Article headline
 * @param summary - Article summary
 * @returns Selected image index and reason
 */
export async function analyzeImageRelevance(
  imageUrls: string[],
  headline: string,
  summary: string
): Promise<{ selectedIndex: number; reason: string }> {
  // Create a description of each image based on URL patterns
  const imageDescriptions = imageUrls.map((url, idx) => {
    const urlLower = url.toLowerCase();
    let description = `Image ${idx + 1}: ${url}`;
    
    // Try to infer content from URL
    if (urlLower.includes('politics') || urlLower.includes('parliament') || urlLower.includes('minister')) {
      description += ' (appears to be political/government related)';
    } else if (urlLower.includes('sports') || urlLower.includes('cricket') || urlLower.includes('football')) {
      description += ' (appears to be sports related)';
    } else if (urlLower.includes('business') || urlLower.includes('economy') || urlLower.includes('market')) {
      description += ' (appears to be business/economy related)';
    } else if (urlLower.includes('health') || urlLower.includes('medical') || urlLower.includes('hospital')) {
      description += ' (appears to be health related)';
    } else if (urlLower.includes('tech') || urlLower.includes('digital') || urlLower.includes('cyber')) {
      description += ' (appears to be technology related)';
    }
    
    return description;
  });

  const prompt = `You are an image selection expert for a news aggregation platform. 
  
Given a news article headline and summary, select the MOST RELEVANT image from the list below.

Headline: ${headline}

Summary: ${summary}

Available Images:
${imageDescriptions.join('\n')}

SELECTION CRITERIA (in order of importance):
1. Relevance: Image should directly relate to the main topic/event described in the headline and summary
2. Content Match: Image should show the actual subject matter (people, places, events) mentioned in the article
3. Recency: Prefer images that appear current and specific to the event (avoid generic stock photos, logos, or unrelated images)
4. Quality: Prefer clear, professional images over blurry, pixelated, or low-quality ones
5. Appropriateness: Image should be suitable for news context (avoid promotional material, ads, or unrelated graphics)

CRITICAL RULES:
- If an image is clearly a logo, advertisement, or unrelated graphic, DO NOT select it
- Prefer images that show actual news events, people, or locations mentioned in the article
- If multiple images are relevant, choose the one that best represents the main event/topic
- Avoid selecting placeholder images, default images, or generic graphics

Return your response in this EXACT JSON format:
{
  "selectedIndex": <number 0 to ${imageUrls.length - 1}>,
  "reason": "<brief explanation in 1 sentence explaining why this image is most relevant>"
}

IMPORTANT: Return ONLY valid JSON, no other text.`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an image selection expert. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 200,
    response_format: { type: 'json_object' }
  });

  const responseText = completion.choices[0]?.message?.content?.trim();
  if (!responseText) {
    throw new Error('Empty response from AI');
  }

  try {
    const result = JSON.parse(responseText);
    
    // Validate response
    if (typeof result.selectedIndex !== 'number' || 
        result.selectedIndex < 0 || 
        result.selectedIndex >= imageUrls.length) {
      throw new Error('Invalid selectedIndex');
    }

    return {
      selectedIndex: result.selectedIndex,
      reason: result.reason || 'No reason provided'
    };
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

