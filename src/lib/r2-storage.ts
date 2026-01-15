/**
 * Cloudflare R2 Storage Service
 * 
 * R2 es compatible con S3, usa egress GRATIS
 * Reemplaza Firebase Storage para imágenes
 */

import { optimizeImage } from './image-optimizer';

// R2 Configuration from environment
const R2_ACCOUNT_ID = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || 'vindel-images';
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

// Image sizes configuration
const IMAGE_SIZES = {
  thumb: { maxWidth: 300, maxHeight: 300, quality: 0.5 },
  large: { maxWidth: 1200, maxHeight: 900, quality: 0.6 },
};

// Generate unique filename
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomString}.webp`;
}

// Get public URL for an object
function getPublicUrl(key: string): string {
  // Si tienes custom domain configurado en R2
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`;
  }
  // URL pública de R2 (necesitas habilitar acceso público en el bucket)
  return `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;
}

/**
 * Upload to R2 via API route (server-side)
 * El cliente envía el archivo a nuestra API, que lo sube a R2
 */
export async function uploadToR2(
  file: File | Blob,
  path: string,
  fileName: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);
  formData.append('fileName', fileName);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  const result = await response.json();
  return result.url;
}

/**
 * Upload image with optimization
 */
export async function uploadImage(
  file: File,
  path: string = 'products'
): Promise<string> {
  // Optimize image to WebP
  let fileToUpload: Blob = file;
  if (file.type.startsWith('image/')) {
    try {
      fileToUpload = await optimizeImage(file, IMAGE_SIZES.large);
    } catch (e) {
      console.warn('Image optimization failed, uploading original', e);
    }
  }

  const fileName = generateFileName(file.name);
  const key = `${path}/${fileName}`;
  
  return uploadToR2(fileToUpload, path, fileName);
}

/**
 * Upload image with thumb and large versions
 */
export async function uploadImageWithSizes(
  file: File,
  path: string = 'products'
): Promise<{ thumb: string; large: string }> {
  const baseName = generateFileName(file.name);
  
  // Generate optimized versions in parallel
  const [thumbBlob, largeBlob] = await Promise.all([
    optimizeImage(file, IMAGE_SIZES.thumb),
    optimizeImage(file, IMAGE_SIZES.large),
  ]);

  // Upload both versions in parallel
  const [thumbUrl, largeUrl] = await Promise.all([
    uploadToR2(thumbBlob, `${path}/thumb`, baseName),
    uploadToR2(largeBlob, `${path}/large`, baseName),
  ]);

  return { thumb: thumbUrl, large: largeUrl };
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: File[],
  path: string = 'products'
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadImage(file, path));
  return Promise.all(uploadPromises);
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<string> {
  let fileToUpload: Blob = file;
  if (file.type.startsWith('image/')) {
    try {
      fileToUpload = await optimizeImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8
      });
    } catch (e) {
      console.warn('Avatar optimization failed', e);
    }
  }

  const fileName = generateFileName(file.name);
  return uploadToR2(fileToUpload, `avatars/${userId}`, fileName);
}

/**
 * Upload product images with thumbnails
 */
export async function uploadProductImagesWithThumbs(
  files: File[],
  productId: string
): Promise<{ images: string[]; thumbImages: string[] }> {
  const results = await Promise.all(
    files.map((file) => uploadImageWithSizes(file, `products/${productId}`))
  );
  
  return {
    images: results.map(r => r.large),
    thumbImages: results.map(r => r.thumb),
  };
}

/**
 * Delete image from R2
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  const response = await fetch('/api/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl }),
  });

  if (!response.ok) {
    console.error('Failed to delete image');
  }
}

/**
 * Delete multiple images
 */
export async function deleteImages(imageUrls: string[]): Promise<void> {
  await Promise.all(imageUrls.map(url => deleteImage(url)));
}
