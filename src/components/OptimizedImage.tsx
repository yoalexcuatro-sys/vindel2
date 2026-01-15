'use client';

import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  thumbSrc?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Optimized Image Component
 * - Shows thumbnail first (instant)
 * - Loads full image in background
 * - Smooth transition when ready
 * - Fallback blur while loading
 */
export default function OptimizedImage({
  src,
  thumbSrc,
  alt,
  className = '',
  priority = false,
  onClick,
  style,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(thumbSrc || src);

  useEffect(() => {
    if (!thumbSrc || thumbSrc === src) {
      // No thumbnail, just load the main image
      setCurrentSrc(src);
      return;
    }

    // Start with thumbnail
    setCurrentSrc(thumbSrc);
    setIsLoaded(false);

    // Preload the large image
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
    img.src = src;

    return () => {
      img.onload = null;
    };
  }, [src, thumbSrc]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${className} ${!isLoaded && thumbSrc ? 'blur-[2px]' : ''} transition-all duration-200`}
      style={style}
      onClick={onClick}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      onLoad={() => {
        if (currentSrc === src) {
          setIsLoaded(true);
        }
      }}
    />
  );
}

/**
 * Simple preloader for images
 * Call this to warm up the cache
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage));
}
