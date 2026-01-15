import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  updateMetadata,
} from 'firebase/storage';
import { storage } from './firebase';
import { optimizeImage } from './image-optimizer';

// Cache control for images (1 year, immutable)
const CACHE_CONTROL = 'public,max-age=31536000,immutable';

// Generate a unique filename
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomString}.webp`;
}

// Image sizes configuration - optimized for fast loading
const IMAGE_SIZES = {
  thumb: { maxWidth: 300, maxHeight: 300, quality: 0.5 },
  medium: { maxWidth: 600, maxHeight: 450, quality: 0.55 },
  large: { maxWidth: 1200, maxHeight: 900, quality: 0.6 },
};

// Upload a single image with multiple sizes
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
  const thumbRef = ref(storage, `${path}/thumb/${baseName}`);
  const largeRef = ref(storage, `${path}/large/${baseName}`);

  const [thumbResult, largeResult] = await Promise.all([
    uploadBytes(thumbRef, thumbBlob, { 
      contentType: 'image/webp',
      cacheControl: CACHE_CONTROL,
    }),
    uploadBytes(largeRef, largeBlob, { 
      contentType: 'image/webp',
      cacheControl: CACHE_CONTROL,
    }),
  ]);

  // Get download URLs in parallel
  const [thumbUrl, largeUrl] = await Promise.all([
    getDownloadURL(thumbResult.ref),
    getDownloadURL(largeResult.ref),
  ]);

  return { thumb: thumbUrl, large: largeUrl };
}

// Upload a single image (backward compatible - returns large URL)
export async function uploadImage(
  file: File,
  path: string = 'products'
): Promise<string> {
  // Optimize image to WebP before upload
  let fileToUpload: Blob = file;
  if (file.type.startsWith('image/')) {
    try {
      fileToUpload = await optimizeImage(file, IMAGE_SIZES.large);
    } catch (e) {
      console.warn('Image optimization failed, uploading original', e);
    }
  }

  const fileName = generateFileName(file.name);
  const storageRef = ref(storage, `${path}/${fileName}`);
  
  const result = await uploadBytes(storageRef, fileToUpload, {
    contentType: 'image/webp',
    cacheControl: CACHE_CONTROL,
  });
  
  const downloadURL = await getDownloadURL(result.ref);
  return downloadURL;
}

// Upload multiple images
export async function uploadImages(
  files: File[],
  path: string = 'products'
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadImage(file, path));
  return Promise.all(uploadPromises);
}

// Delete an image by URL
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract the path from the URL
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

// Delete multiple images
export async function deleteImages(imageUrls: string[]): Promise<void> {
  const deletePromises = imageUrls.map((url) => deleteImage(url));
  await Promise.all(deletePromises);
}

// Upload user avatar
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<string> {
  // Optimize avatar (smaller dimensions)
  let fileToUpload: Blob = file;
  if (file.type.startsWith('image/')) {
    try {
      fileToUpload = await optimizeImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8
      });
    } catch (e) {
      console.warn('Avatar optimization failed, uploading original', e);
    }
  }

  const fileName = generateFileName(file.name);
  const storageRef = ref(storage, `avatars/${userId}/${fileName}`);
  
  await uploadBytes(storageRef, fileToUpload);
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
}

// Get all images in a folder
export async function listImages(path: string): Promise<string[]> {
  const listRef = ref(storage, path);
  const result = await listAll(listRef);
  
  const urls = await Promise.all(
    result.items.map((itemRef) => getDownloadURL(itemRef))
  );
  
  return urls;
}

// Compress image before upload (client-side)
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// Upload product images with compression
export async function uploadProductImages(
  files: File[],
  productId: string
): Promise<string[]> {
  const compressedFiles = await Promise.all(
    files.map((file) => compressImage(file))
  );
  
  return uploadImages(compressedFiles, `products/${productId}`);
}

// Upload product images with thumbnails - returns both large and thumb URLs
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
