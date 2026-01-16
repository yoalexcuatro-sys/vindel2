import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

export type NotificationType = 
  | 'report_received'      // Vendedor: tu anuncio fue reportado
  | 'report_resolved'      // Vendedor: se resolvió el reporte
  | 'product_approved'     // Vendedor: tu anuncio fue aprobado
  | 'product_rejected'     // Vendedor: tu anuncio fue rechazado
  | 'new_message'          // Usuario: nuevo mensaje
  | 'price_drop'           // Usuario: bajó el precio de un favorito
  | 'system';              // Sistema: avisos generales

export interface Notification {
  id?: string;
  userId: string;           // Destinatario
  type: NotificationType;
  title: string;
  message: string;
  link?: string;            // URL para navegar al hacer click
  read: boolean;
  createdAt: Timestamp;
  metadata?: {
    productId?: string;
    productTitle?: string;
    productImage?: string;
    reportReason?: string;
    reportId?: string;
  };
}

/**
 * Create a notification for a user
 */
export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Notification['metadata'];
}): Promise<string> {
  const notification: Omit<Notification, 'id'> = {
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link,
    read: false,
    createdAt: Timestamp.now(),
    metadata: data.metadata,
  };

  const docRef = await addDoc(collection(db, 'notifications'), notification);
  return docRef.id;
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  // Simple query - filter read status in client to avoid composite index
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  return snap.docs.filter(d => d.data().read === false).length;
}

/**
 * Subscribe to unread notifications count (real-time)
 */
export function subscribeToUnreadNotifications(
  userId: string,
  callback: (count: number) => void
): () => void {
  console.log('[NOTIFICATIONS-SUBSCRIBE] Subscribing for user:', userId);
  
  // Simple query - filter read status in client to avoid composite index
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const unreadCount = snapshot.docs.filter(d => d.data().read === false).length;
    console.log('[NOTIFICATIONS-SUBSCRIBE] Total docs:', snapshot.docs.length, 'Unread:', unreadCount);
    snapshot.docs.forEach(d => {
      const data = d.data();
      console.log('[NOTIFICATIONS-SUBSCRIBE] Doc:', d.id, 'userId:', data.userId, 'read:', data.read);
    });
    callback(unreadCount);
  }, (error) => {
    console.error('Error subscribing to notifications:', error);
    callback(0);
  });
}

/**
 * Get recent notifications for a user
 */
export async function getNotifications(userId: string, maxResults: number = 20): Promise<Notification[]> {
  console.log('[NOTIFICATIONS] Fetching notifications for user:', userId);
  
  // Simple query without orderBy to avoid composite index requirement
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    limit(maxResults * 2) // Get more to account for sorting
  );
  
  const snap = await getDocs(q);
  console.log('[NOTIFICATIONS] Found', snap.docs.length, 'notifications');
  
  const notifications = snap.docs
    .map(d => {
      const data = d.data();
      console.log('[NOTIFICATIONS] Notification:', d.id, data.type, data.title);
      return { id: d.id, ...data } as Notification;
    })
    .sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA; // Most recent first
    })
    .slice(0, maxResults);
    
  console.log('[NOTIFICATIONS] Returning', notifications.length, 'notifications');
  return notifications;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notifRef = doc(db, 'notifications', notificationId);
  await updateDoc(notifRef, { read: true });
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const notifRef = doc(db, 'notifications', notificationId);
  await deleteDoc(notifRef);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  
  const snap = await getDocs(q);
  const updates = snap.docs.map(d => updateDoc(d.ref, { read: true }));
  await Promise.all(updates);
}

/**
 * Create notification when a product is reported
 * Also sends email to seller (when email service is configured)
 */
export async function notifyProductReported(data: {
  sellerId: string;
  sellerEmail?: string; // Para email
  productId: string;
  productTitle: string;
  productImage?: string;
  productCategory?: string;
  productLink?: string;
  reportReason: string;
  reportId: string;
}): Promise<string> {
  const reasonLabels: Record<string, string> = {
    'spam': 'spam sau înșelătorie',
    'inappropriate': 'conținut inadecvat',
    'fake': 'produs fals',
    'wrong-category': 'categorie greșită',
    'duplicate': 'anunț duplicat',
    'illegal': 'produs interzis',
    'misleading': 'informații înșelătoare',
    'other': 'alt motiv',
  };

  const reasonLabel = reasonLabels[data.reportReason] || data.reportReason;

  console.log('[NOTIFY] Creating notification for seller:', data.sellerId);
  console.log('[NOTIFY] Product:', data.productTitle);
  console.log('[NOTIFY] Reason:', reasonLabel);

  // Create in-app notification
  const notificationId = await createNotification({
    userId: data.sellerId,
    type: 'report_received',
    title: 'Anunț raportat',
    message: `Anunțul tău "${data.productTitle}" a fost raportat pentru ${reasonLabel}. Echipa noastră va verifica.`,
    link: data.productLink || `/anunturi/${data.productCategory || 'general'}/${data.productId}`,
    metadata: {
      productId: data.productId,
      productTitle: data.productTitle,
      productImage: data.productImage,
      reportReason: data.reportReason,
      reportId: data.reportId,
    },
  });

  console.log('[NOTIFY] Notification created with ID:', notificationId);

  // TODO: Send email notification when email service is configured
  // Example with Firebase Functions or external service:
  // if (data.sellerEmail) {
  //   await sendEmail({
  //     to: data.sellerEmail,
  //     subject: 'Anunțul tău a fost raportat - Vindel',
  //     template: 'report-received',
  //     data: {
  //       productTitle: data.productTitle,
  //       reason: reasonLabel,
  //       actionUrl: 'https://vindel.ro/profile?tab=notifications'
  //     }
  //   });
  // }

  return notificationId;
}

/**
 * Create notification when a report is resolved
 */
export async function notifyReportResolved(data: {
  sellerId: string;
  productId: string;
  productTitle: string;
  dismissed: boolean; // true = reporte descartado, false = acción tomada
}): Promise<string> {
  return createNotification({
    userId: data.sellerId,
    type: 'report_resolved',
    title: data.dismissed ? 'Reporte descărtat' : 'Reporte rezolvat',
    message: data.dismissed 
      ? `Reportul pentru "${data.productTitle}" a fost verificat și descărtat. Anunțul tău rămâne activ.`
      : `Reportul pentru "${data.productTitle}" a fost verificat. Te rugăm să verifici starea anunțului.`,
    link: `/profile?tab=listings`,
    metadata: {
      productId: data.productId,
      productTitle: data.productTitle,
    },
  });
}
