/**
 * Image optimization utilities
 * Provides helpers for optimizing images with CDN integration support
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png' | 'auto';
}

/**
 * Get optimized image URL
 * @param imageUrl - Original image URL
 * @param options - Optimization options
 * @returns Optimized image URL or null if invalid
 */
export function getOptimizedImageUrl(
  imageUrl: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string | null {
  if (!imageUrl || !imageUrl.startsWith('http')) {
    return null;
  }
  
  // Option 1: Use Next.js Image Optimization (handled automatically by Image component)
  // This is the default and works well for most cases
  
  // Option 2: Use external CDN (Cloudinary, Imgix, etc.)
  // Uncomment and configure if using external CDN:
  
  // Example with Cloudinary:
  // const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/fetch/`;
  // const params = new URLSearchParams({
  //   w: String(options.width || 800),
  //   h: String(options.height || 600),
  //   q: String(options.quality || 80),
  //   f: options.format || 'auto'
  // });
  // return `${cloudinaryUrl}${params.toString()}/${encodeURIComponent(imageUrl)}`;
  
  // Example with Imgix:
  // const imgixUrl = `https://${process.env.IMGIX_DOMAIN}/`;
  // const params = new URLSearchParams({
  //   url: imageUrl,
  //   w: String(options.width || 800),
  //   h: String(options.height || 600),
  //   q: String(options.quality || 80),
  //   fm: options.format || 'auto',
  //   fit: 'crop'
  // });
  // return `${imgixUrl}?${params.toString()}`;
  
  // Option 3: Use Supabase Storage with image transformations
  // if (imageUrl.includes('supabase.co')) {
  //   const url = new URL(imageUrl);
  //   url.searchParams.set('width', String(options.width || 800));
  //   url.searchParams.set('height', String(options.height || 600));
  //   url.searchParams.set('quality', String(options.quality || 80));
  //   if (options.format && options.format !== 'auto') {
  //     url.searchParams.set('format', options.format);
  //   }
  //   return url.toString();
  // }
  
  // For now, return original URL (Next.js Image component will optimize)
  return imageUrl;
}

/**
 * Get image placeholder for loading states
 * @returns Base64 encoded SVG placeholder
 */
export function getImagePlaceholder(): string {
  // Lightweight SVG placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI0Y1RjVGNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5QUEwQTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBsb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==';
}

/**
 * Get responsive image sizes for Next.js Image component
 * @param variant - Image variant (featured, default, compact)
 * @returns Sizes string for responsive images
 */
export function getResponsiveImageSizes(variant: 'featured' | 'default' | 'compact' = 'default'): string {
  switch (variant) {
    case 'featured':
      return '(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw';
    case 'compact':
      return '(max-width: 768px) 80px, 96px';
    case 'default':
    default:
      return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  }
}

/**
 * Validate image URL
 * @param url - Image URL to validate
 * @returns True if URL is valid
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get fallback image URL based on category
 * @param category - Article category
 * @returns Fallback image URL
 */
export function getFallbackImageUrl(category?: string | null): string {
  const categoryImages: Record<string, string> = {
    politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
    economy: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    sports: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
    technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    health: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
    education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
    environment: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&q=80',
    crime: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
    culture: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80'
  };
  
  return categoryImages[category?.toLowerCase() || ''] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
}

