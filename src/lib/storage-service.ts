import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from './firebase';

// Generate a unique filename
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
}

// Upload a single image
export async function uploadImage(
  file: File,
  path: string = 'products'
): Promise<string> {
  const fileName = generateFileName(file.name);
  const storageRef = ref(storage, `${path}/${fileName}`);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
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
  const fileName = generateFileName(file.name);
  const storageRef = ref(storage, `avatars/${userId}/${fileName}`);
  
  await uploadBytes(storageRef, file);
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
