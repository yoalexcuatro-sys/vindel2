/**
 * Image utilities for fast loading with thumbnails
 * 
 * Strategy:
 * 1. If thumbImages exists in product, use those (400px thumbnails)
 * 2. If not, try to generate thumb URL from Firebase Storage URL pattern
 * 3. Fallback to original image with size hints
 */

// Placeholder blur data URL (tiny gray gradient)
export const BLUR_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmM2Y0ZjYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+';

// Teal placeholder for brand consistency
export const TEAL_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNFNUY5RjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNkMGY1ZjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+';

/**
 * Get thumbnail URL from a product
 * Falls back to original image if no thumb available
 */
export function getThumbUrl(
  images: string[] | undefined,
  thumbImages: string[] | undefined,
  index: number = 0
): string {
  // If we have thumbImages, use them
  if (thumbImages && thumbImages[index]) {
    return thumbImages[index];
  }
  
  // Otherwise return original or placeholder
  if (images && images[index]) {
    return images[index];
  }
  
  return BLUR_PLACEHOLDER;
}

/**
 * Get the large/original image URL
 */
export function getLargeUrl(
  images: string[] | undefined,
  index: number = 0
): string {
  if (images && images[index]) {
    return images[index];
  }
  return BLUR_PLACEHOLDER;
}

/**
 * Generate srcset for responsive images
 * Uses thumb for small screens, original for large
 */
export function generateSrcSet(
  thumbUrl: string,
  largeUrl: string
): string {
  if (thumbUrl === largeUrl) {
    return thumbUrl;
  }
  return `${thumbUrl} 400w, ${largeUrl} 800w`;
}

/**
 * Standard sizes attribute for product cards in grid
 */
export const CARD_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw';

/**
 * Preload an array of images
 */
export function preloadImages(urls: string[]): void {
  if (typeof window === 'undefined') return;
  
  urls.forEach(url => {
    if (url && !url.startsWith('data:')) {
      const img = new window.Image();
      img.src = url;
    }
  });
}

/**
 * Preload first N images from products array
 */
export function preloadProductThumbs(
  products: Array<{ images?: string[]; thumbImages?: string[]; image?: string }>,
  count: number = 10
): void {
  if (typeof window === 'undefined') return;
  
  const urlsToPreload: string[] = [];
  
  products.slice(0, count).forEach(product => {
    // Prefer thumbImages
    if (product.thumbImages && product.thumbImages[0]) {
      urlsToPreload.push(product.thumbImages[0]);
    } else if (product.images && product.images[0]) {
      urlsToPreload.push(product.images[0]);
    } else if (product.image) {
      urlsToPreload.push(product.image);
    }
  });
  
  preloadImages(urlsToPreload);
}
