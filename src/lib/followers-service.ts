import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  updateDoc,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { createNotification } from './notifications-service';

// ============================================
// TYPES
// ============================================

export interface FollowRelation {
  id: string;
  followerId: string;      // El que sigue
  followedId: string;      // El que es seguido
  createdAt: Timestamp;
}

export interface FollowerInfo {
  id: string;
  displayName?: string;
  photoURL?: string;
  followedAt: Timestamp;
}

// ============================================
// FOLLOW/UNFOLLOW OPERATIONS
// ============================================

/**
 * Seguir a un usuario
 * Crea documento en la colección 'followers' y actualiza contadores
 */
export async function followUser(followerId: string, followedId: string): Promise<void> {
  if (followerId === followedId) {
    throw new Error('No puedes seguirte a ti mismo');
  }

  const followDocId = `${followerId}_${followedId}`;
  const followRef = doc(db, 'followers', followDocId);
  
  // Verificar si ya sigue
  const existingFollow = await getDoc(followRef);
  if (existingFollow.exists()) {
    return; // Ya lo sigue
  }

  const batch = writeBatch(db);

  // Crear la relación de seguimiento
  batch.set(followRef, {
    followerId,
    followedId,
    createdAt: serverTimestamp()
  });

  // Incrementar contador de "following" para el seguidor
  const followerRef = doc(db, 'users', followerId);
  batch.update(followerRef, {
    'stats.following': increment(1)
  });

  // Incrementar contador de "followers" para el seguido
  const followedRef = doc(db, 'users', followedId);
  batch.update(followedRef, {
    'stats.followers': increment(1)
  });

  await batch.commit();
  
  // Crear notificación para el usuario seguido
  try {
    // Obtener datos del seguidor para la notificación
    const followerSnapshot = await getDoc(followerRef);
    const followerData = followerSnapshot.data();
    const followerName = followerData?.displayName || 'Un usuario';
    const followerAvatar = followerData?.photoURL || null;
    
    await createNotification({
      userId: followedId,
      type: 'new_follower',
      title: 'Urmăritor nou',
      message: `${followerName} a început să te urmărească`,
      link: `/user/${followerId}`,
      metadata: {
        followerId,
        followerName,
        followerAvatar
      }
    });
  } catch (error) {
    console.error('Error creating follow notification:', error);
  }
}

/**
 * Dejar de seguir a un usuario
 */
export async function unfollowUser(followerId: string, followedId: string): Promise<void> {
  const followDocId = `${followerId}_${followedId}`;
  const followRef = doc(db, 'followers', followDocId);
  
  // Verificar si existe la relación
  const existingFollow = await getDoc(followRef);
  if (!existingFollow.exists()) {
    return; // No lo seguía
  }

  const batch = writeBatch(db);

  // Eliminar la relación de seguimiento
  batch.delete(followRef);

  // Decrementar contador de "following" para el seguidor
  const followerRef = doc(db, 'users', followerId);
  batch.update(followerRef, {
    'stats.following': increment(-1)
  });

  // Decrementar contador de "followers" para el seguido
  const followedRef = doc(db, 'users', followedId);
  batch.update(followedRef, {
    'stats.followers': increment(-1)
  });

  await batch.commit();
}

// ============================================
// CHECK OPERATIONS
// ============================================

/**
 * Verificar si un usuario sigue a otro
 */
export async function isFollowing(followerId: string, followedId: string): Promise<boolean> {
  if (!followerId || !followedId) return false;
  
  const followDocId = `${followerId}_${followedId}`;
  const followRef = doc(db, 'followers', followDocId);
  const snapshot = await getDoc(followRef);
  
  return snapshot.exists();
}

/**
 * Verificar si un usuario puede ver el perfil de otro
 * Retorna true si:
 * - El perfil es público
 * - El usuario es el dueño del perfil
 * - El usuario sigue al dueño del perfil
 */
export async function canViewProfile(viewerId: string | null, profileOwnerId: string): Promise<{ canView: boolean; reason: 'public' | 'owner' | 'follower' | 'private' }> {
  // Obtener configuración de privacidad del perfil
  const ownerRef = doc(db, 'users', profileOwnerId);
  const ownerSnapshot = await getDoc(ownerRef);
  
  if (!ownerSnapshot.exists()) {
    return { canView: false, reason: 'private' };
  }
  
  const ownerData = ownerSnapshot.data();
  const isProfilePublic = ownerData?.settings?.profileVisible !== false; // Default: público
  
  // Si el perfil es público, cualquiera puede ver
  if (isProfilePublic) {
    return { canView: true, reason: 'public' };
  }
  
  // Si no hay viewer (no autenticado), no puede ver perfil privado
  if (!viewerId) {
    return { canView: false, reason: 'private' };
  }
  
  // Si es el dueño del perfil
  if (viewerId === profileOwnerId) {
    return { canView: true, reason: 'owner' };
  }
  
  // Verificar si el viewer sigue al dueño
  const follows = await isFollowing(viewerId, profileOwnerId);
  if (follows) {
    return { canView: true, reason: 'follower' };
  }
  
  return { canView: false, reason: 'private' };
}

// ============================================
// LIST OPERATIONS
// ============================================

/**
 * Obtener lista de seguidores de un usuario
 */
export async function getFollowers(userId: string): Promise<FollowerInfo[]> {
  const q = query(
    collection(db, 'followers'),
    where('followedId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const followerIds = snapshot.docs.map(doc => ({
    followerId: doc.data().followerId,
    followedAt: doc.data().createdAt
  }));

  // Obtener info de cada seguidor
  const followers: FollowerInfo[] = [];
  for (const { followerId, followedAt } of followerIds) {
    const userRef = doc(db, 'users', followerId);
    const userSnapshot = await getDoc(userRef);
    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      followers.push({
        id: followerId,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        followedAt
      });
    }
  }

  return followers;
}

/**
 * Obtener lista de usuarios que sigue un usuario
 */
export async function getFollowing(userId: string): Promise<FollowerInfo[]> {
  const q = query(
    collection(db, 'followers'),
    where('followerId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const followedIds = snapshot.docs.map(doc => ({
    followedId: doc.data().followedId,
    followedAt: doc.data().createdAt
  }));

  // Obtener info de cada usuario seguido
  const following: FollowerInfo[] = [];
  for (const { followedId, followedAt } of followedIds) {
    const userRef = doc(db, 'users', followedId);
    const userSnapshot = await getDoc(userRef);
    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      following.push({
        id: followedId,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        followedAt
      });
    }
  }

  return following;
}

// ============================================
// COUNT OPERATIONS
// ============================================

/**
 * Obtener número de seguidores
 */
export async function getFollowersCount(userId: string): Promise<number> {
  const q = query(
    collection(db, 'followers'),
    where('followedId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

/**
 * Obtener número de usuarios que sigue
 */
export async function getFollowingCount(userId: string): Promise<number> {
  const q = query(
    collection(db, 'followers'),
    where('followerId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// ============================================
// USER SETTINGS
// ============================================

/**
 * Actualizar configuración de privacidad del perfil
 */
export async function updateProfilePrivacy(userId: string, settings: {
  profileVisible?: boolean;
  showPhone?: boolean;
  showOnline?: boolean;
}): Promise<void> {
  const userRef = doc(db, 'users', userId);
  
  const updates: Record<string, any> = {};
  if (settings.profileVisible !== undefined) {
    updates['settings.profileVisible'] = settings.profileVisible;
  }
  if (settings.showPhone !== undefined) {
    updates['settings.showPhone'] = settings.showPhone;
  }
  if (settings.showOnline !== undefined) {
    updates['settings.showOnline'] = settings.showOnline;
  }
  
  await updateDoc(userRef, updates);
}

/**
 * Obtener configuración de privacidad de un usuario
 */
export async function getProfileSettings(userId: string): Promise<{
  profileVisible: boolean;
  showPhone: boolean;
  showOnline: boolean;
} | null> {
  const userRef = doc(db, 'users', userId);
  const snapshot = await getDoc(userRef);
  
  if (!snapshot.exists()) return null;
  
  const data = snapshot.data();
  return {
    profileVisible: data?.settings?.profileVisible === true, // Default: false
    showPhone: data?.settings?.showPhone === true,           // Default: false
    showOnline: data?.settings?.showOnline !== false          // Default: true
  };
}
