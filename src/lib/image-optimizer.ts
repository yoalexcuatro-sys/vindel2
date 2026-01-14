
/**
 * Image Optimization System
 * Handles client-side compression and conversion to WebP format
 */

interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
}

/**
 * Converts a File object to a optimized WebP Blob
 */
export async function optimizeImage(
  file: File,
  options: OptimizationOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 900,
    quality = 0.7
  } = options;

  return new Promise((resolve, reject) => {
    // 1. Create an image element to load the file
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      // 2. Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      // 3. Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // 4. Convert to WebP blob
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Image conversion failed'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Helper to process multiple files
 */
export async function optimizeImages(files: File[], options?: OptimizationOptions): Promise<File[]> {
  const promises = files.map(async (file) => {
    // Skip optimization if not an image
    if (!file.type.startsWith('image/')) return file;
    
    // Skip if already WebP (optional, but good practice to re-compress if needed or just skip)
    // if (file.type === 'image/webp') return file;

    try {
      const blob = await optimizeImage(file, options);
      // Create new File object with .webp extension
      const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
      return new File([blob], newName, { type: 'image/webp' });
    } catch (error) {
      console.warn(`Failed to optimize ${file.name}, using original.`, error);
      return file;
    }
  });

  return Promise.all(promises);
}
