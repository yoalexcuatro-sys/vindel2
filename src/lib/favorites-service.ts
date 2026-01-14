import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const FAVORITES_COLLECTION = 'favorites';

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: Timestamp;
}

// Add product to favorites
export async function addToFavorites(userId: string, productId: string): Promise<void> {
  const favoriteId = `${userId}_${productId}`;
  const docRef = doc(db, FAVORITES_COLLECTION, favoriteId);
  
  await setDoc(docRef, {
    userId,
    productId,
    createdAt: serverTimestamp(),
  });
}

// Remove product from favorites
export async function removeFromFavorites(userId: string, productId: string): Promise<void> {
  const favoriteId = `${userId}_${productId}`;
  const docRef = doc(db, FAVORITES_COLLECTION, favoriteId);
  await deleteDoc(docRef);
}

// Check if product is in favorites
export async function isProductFavorited(userId: string, productId: string): Promise<boolean> {
  const favoriteId = `${userId}_${productId}`;
  const docRef = doc(db, FAVORITES_COLLECTION, favoriteId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

// Get all favorite product IDs for a user
export async function getUserFavoriteIds(userId: string): Promise<string[]> {
  const q = query(
    collection(db, FAVORITES_COLLECTION),
    where('userId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data().productId);
}

// Toggle favorite status
export async function toggleFavorite(userId: string, productId: string): Promise<boolean> {
  const isFavorited = await isProductFavorited(userId, productId);
  
  if (isFavorited) {
    await removeFromFavorites(userId, productId);
    return false;
  } else {
    await addToFavorites(userId, productId);
    return true;
  }
}
