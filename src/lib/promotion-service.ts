import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Product, PromotionType } from './products-service';
import { createPromotionInvoice, Invoice } from './invoices-service';

// Planes de promoción disponibles
export interface PromotionPlan {
  id: PromotionType;
  name: string;
  price: number;
  duration: number; // días
  features: string[];
  badge: 'Promovat' | 'Premium' | 'VIP';
  popular?: boolean;
}

export const PROMOTION_PLANS: PromotionPlan[] = [
  {
    id: 'zilnic',
    name: 'Săptămânal',
    price: 1,
    duration: 7,
    features: ['Top 7 zile', 'Badge "Promovat"'],
    badge: 'Promovat',
  },
  {
    id: 'saptamanal',
    name: 'Bisăptămânal',
    price: 2,
    duration: 15,
    features: ['Top 15 zile', 'Badge Premium', 'Pagina principală'],
    badge: 'Premium',
    popular: true,
  },
  {
    id: 'lunar',
    name: 'Lunar',
    price: 4,
    duration: 30,
    features: ['Top 30 zile', 'Badge VIP', 'Toate beneficiile'],
    badge: 'VIP',
  },
];

// Obtener un plan por ID
export function getPromotionPlan(planId: PromotionType): PromotionPlan | undefined {
  return PROMOTION_PLANS.find(p => p.id === planId);
}

// Verificar si un producto está actualmente promocionado
export function isProductPromoted(product: Product): boolean {
  if (!product.promoted || !product.promotionEnd) return false;
  
  const now = new Date();
  let endDate: Date;
  
  if (product.promotionEnd instanceof Timestamp) {
    endDate = product.promotionEnd.toDate();
  } else if (typeof product.promotionEnd === 'object' && 'seconds' in product.promotionEnd) {
    endDate = new Date((product.promotionEnd as any).seconds * 1000);
  } else {
    return false;
  }
  
  return endDate > now;
}

// Obtener el tiempo restante de promoción
export function getPromotionRemainingTime(product: Product): { days: number; hours: number; minutes: number } | null {
  if (!product.promotionEnd) return null;
  
  let endDate: Date;
  
  if (product.promotionEnd instanceof Timestamp) {
    endDate = product.promotionEnd.toDate();
  } else if (typeof product.promotionEnd === 'object' && 'seconds' in product.promotionEnd) {
    endDate = new Date((product.promotionEnd as any).seconds * 1000);
  } else {
    return null;
  }
  
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  
  if (diffMs <= 0) return null;
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
}

// Formatear tiempo restante a string
export function formatRemainingTime(remaining: { days: number; hours: number; minutes: number } | null): string {
  if (!remaining) return 'Expirat';
  
  if (remaining.days > 0) {
    return `${remaining.days} ${remaining.days === 1 ? 'zi' : 'zile'} ${remaining.hours}h`;
  }
  if (remaining.hours > 0) {
    return `${remaining.hours}h ${remaining.minutes}min`;
  }
  return `${remaining.minutes} minute`;
}

// Obtener el badge de un producto promocionado
export function getPromotionBadge(product: Product): { label: string; color: string } | null {
  if (!isProductPromoted(product) || !product.promotionType) return null;
  
  const plan = getPromotionPlan(product.promotionType);
  if (!plan) return null;
  
  const badges: Record<string, { label: string; color: string }> = {
    'Promovat': { label: 'Promovat', color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' },
    'Premium': { label: 'Premium', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' },
    'VIP': { label: 'VIP', color: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' },
  };
  
  return badges[plan.badge] || null;
}

// Promover un producto
export async function promoteProduct(
  productId: string, 
  planId: PromotionType,
  userId: string,
  userProfile?: {
    displayName?: string;
    email?: string;
    phone?: string;
    address?: string;
    accountType?: 'personal' | 'business';
    businessName?: string;
    cui?: string;
    regCom?: string;
    // Datos adicionales de empresa para facturación
    nrRegistruComert?: string;
    adresaSediu?: string;
    oras?: string;
    judet?: string;
    codPostal?: string;
    tara?: string;
    reprezentantLegal?: string;
    telefonFirma?: string;
    emailFirma?: string;
    website?: string;
  }
): Promise<{ success: boolean; error?: string; invoice?: Invoice }> {
  try {
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Anunțul nu a fost găsit' };
    }
    
    const product = docSnap.data() as Product;
    
    // Verificar que el usuario es dueño del producto
    if (product.sellerId !== userId) {
      return { success: false, error: 'Nu ai permisiunea de a promova acest anunț' };
    }
    
    // Verificar si ya está promocionado
    if (isProductPromoted(product as Product)) {
      return { success: false, error: 'Acest anunț este deja promovat. Așteaptă să expire promovarea curentă.' };
    }
    
    const plan = getPromotionPlan(planId);
    if (!plan) {
      return { success: false, error: 'Plan de promovare invalid' };
    }
    
    // Calcular fechas
    const now = new Date();
    const endDate = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);
    
    // Actualizar producto - también aprobar automáticamente si está pendiente
    await updateDoc(docRef, {
      promoted: true,
      promotionType: planId,
      promotionStart: Timestamp.fromDate(now),
      promotionEnd: Timestamp.fromDate(endDate),
      status: 'approved', // Auto-aprobar al promocionar
      updatedAt: Timestamp.now(),
    });
    
    // Generar factura si tenemos datos del usuario
    let invoice: Invoice | undefined;
    if (userProfile) {
      try {
        invoice = await createPromotionInvoice(
          userId,
          userProfile,
          plan,
          productId,
          product.title,
          'card' // Método de pago por defecto
        );
      } catch (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        // No falla la promoción si la factura falla
      }
    }
    
    return { success: true, invoice };
  } catch (error) {
    console.error('Error promoting product:', error);
    return { success: false, error: 'A apărut o eroare. Încearcă din nou.' };
  }
}

// Cancelar promoción (para administradores o si el producto se vende)
export async function cancelPromotion(productId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, 'products', productId);
    
    await updateDoc(docRef, {
      promoted: false,
      promotionType: null,
      promotionStart: null,
      promotionEnd: null,
      updatedAt: Timestamp.now(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error canceling promotion:', error);
    return { success: false, error: 'Nu s-a putut anula promovarea' };
  }
}

// Verificar y limpiar promociones expiradas (para llamar periódicamente)
export async function checkAndCleanExpiredPromotions(product: Product): Promise<boolean> {
  if (!product.promoted) return false;
  
  if (!isProductPromoted(product)) {
    // Promoción expirada, limpiar
    try {
      await cancelPromotion(product.id);
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
}
