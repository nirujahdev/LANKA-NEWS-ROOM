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

  // Filter out invalid URLs and irrelevant images (logos, ads, placeholders)
  const validImages = images.filter(img => {
    try {
      new URL(img.url);
      if (!img.url.startsWith('http')) return false;
      
      const urlLower = img.url.toLowerCase();
      
      // Filter out common placeholder/default images
      const placeholderPatterns = [
        'placeholder', 'default', 'no-image', 'noimage', 'missing',
        'logo', 'icon', 'avatar', 'profile-pic', 'user-icon',
        'advertisement', 'ad-', 'banner', 'promo', 'promotion',
        'pixel.gif', '1x1.gif', 'spacer.gif', 'transparent.gif',
        'loading', 'spinner', 'wait', 'coming-soon', 'favicon',
        'badge', 'button', 'widget', 'tracking', 'beacon', 'analytics'
      ];
      
      // Filter out images that are clearly not relevant
      if (placeholderPatterns.some(pattern => urlLower.includes(pattern))) {
        return false;
      }
      
      // Filter out very small images (likely icons/logos)
      // Check for size indicators in URL (e.g., 16x16, 32x32, 50x50)
      const sizeMatch = urlLower.match(/(\d+)x(\d+)/);
      if (sizeMatch) {
        const width = parseInt(sizeMatch[1]);
        const height = parseInt(sizeMatch[2]);
        // Skip if both dimensions are less than 100px (likely icon/logo)
        if (width < 100 && height < 100) {
          return false;
        }
      }
      
      // Filter out social media share buttons and widgets
      if (urlLower.includes('facebook') || urlLower.includes('twitter') || 
          urlLower.includes('instagram') || urlLower.includes('linkedin') ||
          urlLower.includes('social') || urlLower.includes('share')) {
        return false;
      }
      
      return true;
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
  // Create a description of each image based on URL patterns and file names
  const imageDescriptions = imageUrls.map((url, idx) => {
    const urlLower = url.toLowerCase();
    const urlPath = new URL(url).pathname.toLowerCase();
    const fileName = urlPath.split('/').pop() || '';
    
    let description = `Image ${idx + 1}: ${url}`;
    let contextHints: string[] = [];
    
    // Try to infer content from URL path and filename
    if (urlLower.includes('politics') || urlLower.includes('parliament') || urlLower.includes('minister') || 
        urlLower.includes('president') || urlLower.includes('government')) {
      contextHints.push('political/government');
    }
    if (urlLower.includes('sports') || urlLower.includes('cricket') || urlLower.includes('football') ||
        urlLower.includes('match') || urlLower.includes('game')) {
      contextHints.push('sports');
    }
    if (urlLower.includes('business') || urlLower.includes('economy') || urlLower.includes('market') ||
        urlLower.includes('finance') || urlLower.includes('bank')) {
      contextHints.push('business/economy');
    }
    if (urlLower.includes('health') || urlLower.includes('medical') || urlLower.includes('hospital') ||
        urlLower.includes('doctor') || urlLower.includes('patient')) {
      contextHints.push('health');
    }
    if (urlLower.includes('tech') || urlLower.includes('digital') || urlLower.includes('cyber') ||
        urlLower.includes('computer') || urlLower.includes('internet')) {
      contextHints.push('technology');
    }
    if (urlLower.includes('education') || urlLower.includes('school') || urlLower.includes('university')) {
      contextHints.push('education');
    }
    if (urlLower.includes('colombo') || urlLower.includes('kandy') || urlLower.includes('galle') ||
        urlLower.includes('jaffna') || urlLower.includes('sri-lanka') || urlLower.includes('lanka')) {
      contextHints.push('Sri Lankan location');
    }
    
    // Check filename for date patterns (suggests recent news photo)
    if (/\d{4}[_-]\d{2}[_-]\d{2}/.test(fileName) || /\d{8}/.test(fileName)) {
      contextHints.push('dated filename (likely recent)');
    }
    
    if (contextHints.length > 0) {
      description += ` (${contextHints.join(', ')})`;
    }
    
    return description;
  });

  const prompt = `You are an image selection expert for a news aggregation platform specializing in Sri Lankan news.

Given a news article headline and summary, select the MOST RELEVANT and HIGHEST QUALITY image from the list below.

Headline: ${headline}

Summary: ${summary.substring(0, 1000)}${summary.length > 1000 ? '...' : ''}

Available Images:
${imageDescriptions.join('\n')}

SELECTION CRITERIA (in order of importance):
1. RELEVANCE (MOST IMPORTANT): Image must directly relate to the main topic/event described in the headline and summary. The image should visually represent the key subject matter.
2. CONTENT MATCH: Image should show the actual subject matter mentioned in the article:
   - If article mentions a person → prefer images showing that person
   - If article mentions a location → prefer images of that location
   - If article describes an event → prefer images from that event
   - If article is about a policy/announcement → prefer images of relevant officials or context
3. NEWS VALUE: Prefer images that show actual news events, breaking news, or current happenings over generic stock photos
4. QUALITY: Prefer clear, high-resolution, professional news images over blurry, pixelated, or low-quality ones
5. CONTEXT APPROPRIATENESS: Image should be suitable for news context (avoid promotional material, ads, social media graphics, or unrelated content)

CRITICAL EXCLUSION RULES (DO NOT SELECT IF):
- Image URL contains: logo, icon, avatar, placeholder, default, advertisement, banner, promo
- Image appears to be a logo, brand mark, or corporate graphic
- Image is clearly an advertisement or promotional material
- Image is a generic stock photo with no connection to the specific news story
- Image is a social media graphic, meme, or infographic (unless the article is specifically about that)
- Image dimensions suggest it's an icon/logo (e.g., 16x16, 32x32, 50x50 pixels)

PREFERRED IMAGE TYPES:
- News photographs of actual events, people, or places mentioned in the article
- Images from press conferences, official events, or breaking news
- Images that show the specific subject matter (person, place, event) described in the headline
- High-quality, professional news photography

ANALYSIS PROCESS:
1. Read the headline and summary carefully to identify the main subject (who, what, where)
2. Examine each image URL and description for relevance to the main subject
3. Eliminate images that are clearly logos, ads, or placeholders
4. From remaining images, select the one that best represents the main news story
5. If no image is clearly relevant, select the one with highest priority (RSS Feed > Article Content > Article Page)

Return your response in this EXACT JSON format:
{
  "selectedIndex": <number 0 to ${imageUrls.length - 1}>,
  "reason": "<brief explanation in 1-2 sentences explaining why this image is most relevant and appropriate for this news story>"
}

IMPORTANT: Return ONLY valid JSON, no other text.`;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert image selection specialist for a news aggregation platform. Your job is to select the most relevant, high-quality news image that best represents the article content. Always return valid JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.2, // Lower temperature for more consistent, focused selection
    max_tokens: 250, // Increased for more detailed reasoning
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

