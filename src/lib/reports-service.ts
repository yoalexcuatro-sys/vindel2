import { 
  collection, 
  addDoc, 
  Timestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { notifyProductReported } from './notifications-service';

export interface Report {
  id?: string;
  targetId: string; // Product ID or User ID
  targetType: 'product' | 'user';
  reason: string;
  description?: string;
  reporterId?: string;
  reporterEmail?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Timestamp;
  productTitle?: string;
  productImage?: string;
  sellerId?: string; // Para notificar al vendedor
}

export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam sau înșelătorie' },
  { value: 'inappropriate', label: 'Conținut inadecvat' },
  { value: 'fake', label: 'Produs fals / contrafăcut' },
  { value: 'wrong-category', label: 'Categorie greșită' },
  { value: 'duplicate', label: 'Anunț duplicat' },
  { value: 'illegal', label: 'Produs interzis / ilegal' },
  { value: 'misleading', label: 'Informații înșelătoare' },
  { value: 'other', label: 'Alt motiv' },
];

/**
 * Create a new report for a product or user
 */
export async function createReport(data: {
  targetId: string;
  targetType: 'product' | 'user';
  reason: string;
  description?: string;
  reporterId?: string;
  reporterEmail?: string;
  productTitle?: string;
  productImage?: string;
  productCategory?: string;
  productLink?: string;
  sellerId?: string;
}): Promise<string> {
  const report: Omit<Report, 'id'> = {
    targetId: data.targetId,
    targetType: data.targetType,
    reason: data.reason,
    description: data.description || '',
    reporterId: data.reporterId,
    reporterEmail: data.reporterEmail,
    status: 'pending',
    createdAt: Timestamp.now(),
    productTitle: data.productTitle,
    productImage: data.productImage,
    sellerId: data.sellerId,
  };

  const docRef = await addDoc(collection(db, 'reports'), report);
  
  console.log('[REPORT] Created report:', docRef.id);
  console.log('[REPORT] sellerId:', data.sellerId);
  console.log('[REPORT] targetType:', data.targetType);
  
  // Notificar al vendedor si es un reporte de producto
  if (data.targetType === 'product' && data.sellerId) {
    console.log('[REPORT] Sending notification to seller:', data.sellerId);
    try {
      const notifId = await notifyProductReported({
        sellerId: data.sellerId,
        productId: data.targetId,
        productTitle: data.productTitle || 'Anunț',
        productImage: data.productImage,
        productCategory: data.productCategory,
        productLink: data.productLink,
        reportReason: data.reason,
        reportId: docRef.id,
      });
      console.log('[REPORT] Notification created:', notifId);
    } catch (e) {
      console.error('[REPORT] Error sending notification to seller:', e);
      // No fallar el reporte si la notificación falla
    }
  } else {
    console.log('[REPORT] Skipping notification - no sellerId or not product report');
  }
  
  return docRef.id;
}

/**
 * Check if user has already reported this item
 */
export async function hasUserReported(targetId: string, reporterId: string): Promise<boolean> {
  const q = query(
    collection(db, 'reports'),
    where('targetId', '==', targetId),
    where('reporterId', '==', reporterId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
