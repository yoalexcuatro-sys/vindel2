'use client';

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { markProductAsSold, deleteProduct, Product } from '@/lib/products-service';
import { createProductLink } from '@/lib/slugs';
import { uploadAvatar } from '@/lib/storage-service';
import { useFavoriteProducts, useMyProducts, useNotifications, invalidateMyProductsCache, invalidateNotificationsCache, invalidateUserProfileCache } from '@/lib/swr-hooks';
import ProductCard from '@/components/ProductCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Star, Settings, Heart, User, Package, Clock, CheckCircle2, 
  ChevronRight, LayoutGrid, LogOut, BadgeCheck, Pencil, 
  FileText, Download, Megaphone, TrendingUp, Building2, 
  Eye, Euro, BarChart3, ShoppingBag, ArrowUpRight, ArrowDownRight,
  Receipt, Activity, Bell, Lock, List, Ban, AlertCircle, Loader2, Camera,
  Flag, ExternalLink, HeadphonesIcon, Globe, Monitor, AlertTriangle, 
  Crown, Zap, Award, X, Check, Timer, Trash2, Menu, Plus
} from 'lucide-react';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, Notification } from '@/lib/notifications-service';
import { subscribeToUserTickets, SupportTicket, STATUS_LABELS, CATEGORY_LABELS } from '@/lib/support-service';
import { getUserConversations, Conversation } from '@/lib/messages-service';
import { 
  PROMOTION_PLANS, 
  promoteProduct, 
  isProductPromoted, 
  getPromotionRemainingTime, 
  formatRemainingTime,
  getPromotionPlan,
  PromotionPlan
} from '@/lib/promotion-service';
import { getUserInvoices, printInvoice, Invoice } from '@/lib/invoices-service';
import { localidades } from '@/data/localidades';

// Lista de ciudades para autocompletado
const CITIES = ['Toată România', ...localidades.map(loc => `${loc.ciudad}, ${loc.judet}`)];

type ViewType = 'dashboard' | 'products' | 'profile' | 'favorites' | 'settings' | 'invoices' | 'promotion' | 'analytics' | 'notifications' | 'support';

// Helper function to format price with thousands separator
const formatPrice = (price: number): string => {
  return price.toLocaleString('ro-RO');
};

// Wrapper component to handle Suspense for useSearchParams
export default function ProfilePage() {
  return (
    <>
      <Suspense fallback={<ProfileLoadingFallback />}>
        <ProfilePageContent />
      </Suspense>
    </>
  );
}

function ProfileLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#13C1AC]" />
    </div>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, logout, loading: authLoading, profileLoading, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productFilter, setProductFilter] = useState<'active' | 'pending' | 'sold' | 'rejected'>('active');
  const [favoritesViewMode, setFavoritesViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCardTheme, setSelectedCardTheme] = useState<number>(() => {
    // Cargar tema guardado inmediatamente al inicializar
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_card_theme');
      return saved ? parseInt(saved) : 1;
    }
    return 1;
  });
  const [themeInitialized, setThemeInitialized] = useState(false);
  const [rejectionModal, setRejectionModal] = useState<{ show: boolean; reason: string; productTitle: string }>({ show: false, reason: '', productTitle: '' });
  
  // Promotion states
  const [promotionModal, setPromotionModal] = useState<{ 
    show: boolean; 
    selectedProduct: Product | null;
    selectedPlan: PromotionPlan | null;
    step: 'select-product' | 'select-plan' | 'confirm';
  }>({ show: false, selectedProduct: null, selectedPlan: null, step: 'select-product' });
  const [promotingProduct, setPromotingProduct] = useState(false);
  const [promotionError, setPromotionError] = useState<string | null>(null);
  
  // Sold modal state (for rating buyer)
  const [soldModal, setSoldModal] = useState<{
    show: boolean;
    product: Product | null;
    buyerName: string;
    buyerId: string;
    rating: number;
    review: string;
    potentialBuyers: { id: string; name: string; avatar: string }[];
    loadingBuyers: boolean;
  }>({ show: false, product: null, buyerName: '', buyerId: '', rating: 5, review: '', potentialBuyers: [], loadingBuyers: false });
  const [markingSold, setMarkingSold] = useState(false);
  
  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: false,
    showPhone: false,
    showOnline: true
  });
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  
  // Email verification state
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Password reset state
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  
  // Profile form state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const profileFormRef = useRef<HTMLFormElement>(null);
  
  // City search state
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  
  // Global promotion enabled state
  const [promotionEnabled, setPromotionEnabled] = useState(false);
  
  // ============================================
  // HOOKS CON CACHÉ SWR - Carga instantánea
  // ============================================
  
  // Productos del usuario con caché persistente
  const { data: products = [], isLoading: productsLoading, mutate: mutateProducts } = useMyProducts(user?.uid || null);
  
  // Favoritos con caché
  const { data: favoriteProducts, isLoading: favoritesLoading } = useFavoriteProducts(user?.uid || null);
  
  // Notificaciones con caché - siempre activo para mantener caché
  const { data: notifications = [], isLoading: notificationsLoading, mutate: mutateNotifications } = useNotifications(user?.uid || null);
  
  // Support tickets state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportTicketsLoading, setSupportTicketsLoading] = useState(true);
  
  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  
  const isBusiness = userProfile?.accountType === 'business';

  // ============================================
  // PRODUCTOS FILTRADOS CON MEMO - evita recálculos
  // ============================================
  
  const filteredProducts = useMemo(() => {
    const now = new Date();
    const filtered = products.filter(p => {
      // Pending: tiene status pending Y (tiene pendingUntil válido O no tiene pendingUntil - fue re-enviado)
      const isPending = p.status === 'pending' && (!p.pendingUntil || new Date(p.pendingUntil.seconds * 1000) > now);
      // Approved: status approved, o pending expirado, o sin status
      const isApproved = p.status === 'approved' || (p.status === 'pending' && p.pendingUntil && new Date(p.pendingUntil.seconds * 1000) <= now) || !p.status;
      const isRejected = p.status === 'rejected';
      
      if (productFilter === 'active') return !p.sold && isApproved;
      if (productFilter === 'sold') return p.sold;
      if (productFilter === 'pending') return isPending;
      if (productFilter === 'rejected') return isRejected;
      return false;
    });
    
    // Ordenar: productos promovidos primero
    return filtered.sort((a, b) => {
      const aPromoted = isProductPromoted(a) ? 1 : 0;
      const bPromoted = isProductPromoted(b) ? 1 : 0;
      return bPromoted - aPromoted; // Promovidos primero
    });
  }, [products, productFilter]);

  // Marcar como inicializado después del primer render
  useEffect(() => {
    setThemeInitialized(true);
  }, []);

  // Load global promotion setting
  useEffect(() => {
    const loadPromotionSetting = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
        if (settingsDoc.exists()) {
          setPromotionEnabled(settingsDoc.data().promotionEnabled || false);
        }
      } catch (error) {
        console.error('Error loading promotion setting:', error);
      }
    };
    loadPromotionSetting();
  }, []);

  // Handle URL param for tab - reacts to URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    const view = searchParams.get('view');
    
    if (tab === 'notifications') {
      setActiveView('notifications');
      // Force refresh notifications when navigating to this tab
      if (user?.uid) {
        mutateNotifications();
      }
    } else if (tab === 'listings' || view === 'products') {
      setActiveView('products');
    } else if (tab === 'settings') {
      setActiveView('settings');
    } else if (tab === 'favorites') {
      setActiveView('favorites');
    } else if (tab === 'profile') {
      setActiveView('profile');
    } else if (tab === 'support') {
      setActiveView('support');
    }
  }, [searchParams, user?.uid, mutateNotifications]);

  useEffect(() => {
    // Solo guardar si ya se inicializó (evita guardar el valor por defecto)
    if (typeof window !== 'undefined' && themeInitialized) {
        localStorage.setItem('user_card_theme', selectedCardTheme.toString());
        window.dispatchEvent(new Event('themeChange'));
    }
  }, [selectedCardTheme, themeInitialized]);

  // Load privacy settings from userProfile
  useEffect(() => {
    if (userProfile?.settings) {
      setPrivacySettings({
        profileVisible: userProfile.settings.profileVisible === true,
        showPhone: userProfile.settings.showPhone === true,
        showOnline: userProfile.settings.showOnline !== false
      });
    }
    // También inicializar la ubicación
    if (userProfile?.location) {
      setSelectedLocation(userProfile.location);
    }
  }, [userProfile?.settings, userProfile?.location]);

  // Load support tickets
  useEffect(() => {
    if (!user?.uid) {
      setSupportTickets([]);
      setSupportTicketsLoading(false);
      return;
    }
    
    setSupportTicketsLoading(true);
    const unsubscribe = subscribeToUserTickets(user.uid, (tickets) => {
      setSupportTickets(tickets);
      setSupportTicketsLoading(false);
    });
    
    return () => unsubscribe();
  }, [user?.uid]);

  // Load invoices
  useEffect(() => {
    if (!user?.uid) {
      setInvoices([]);
      setInvoicesLoading(false);
      return;
    }
    
    setInvoicesLoading(true);
    getUserInvoices(user.uid)
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setInvoicesLoading(false));
  }, [user?.uid]);

  // ============================================
  // CALLBACKS MEMORIZADOS - evitan re-renders
  // ============================================

  const handlePhotoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Te rog selectează o imagine validă.');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Imaginea este prea mare. Maxim 5MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const photoURL = await uploadAvatar(file, user.uid);
      await updateUserProfile({ photoURL });
      alert('Fotografia de profil a fost actualizată!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Nu s-a putut încărca fotografia. Încearcă din nou.');
    } finally {
      setUploadingPhoto(false);
    }
  }, [user, updateUserProfile]);

  // Open sold modal (to rate buyer) - load potential buyers from conversations
  const openSoldModal = useCallback(async (product: Product) => {
    setSoldModal({
      show: true,
      product,
      buyerName: '',
      buyerId: '',
      rating: 5,
      review: '',
      potentialBuyers: [],
      loadingBuyers: true
    });
    
    // Load conversations related to this product
    if (user?.uid) {
      try {
        const conversations = await getUserConversations(user.uid);
        // Filter conversations for this product and get other participants
        const buyers = conversations
          .filter(conv => conv.productId === product.id)
          .map(conv => {
            const otherUserId = conv.participants.find(p => p !== user.uid) || '';
            return {
              id: otherUserId,
              name: conv.participantNames[otherUserId] || 'Usuario',
              avatar: conv.participantAvatars[otherUserId] || ''
            };
          })
          .filter(buyer => buyer.id); // Remove empty entries
        
        setSoldModal(prev => ({
          ...prev,
          potentialBuyers: buyers,
          loadingBuyers: false
        }));
      } catch (error) {
        console.error('Error loading conversations:', error);
        setSoldModal(prev => ({ ...prev, loadingBuyers: false }));
      }
    }
  }, [user?.uid]);

  // Confirm mark as sold with rating
  const handleConfirmSold = useCallback(async () => {
    if (!soldModal.product) return;
    
    setMarkingSold(true);
    try {
      await markProductAsSold(soldModal.product.id);
      // TODO: Save buyer review if provided
      // For now, just mark as sold
      
      // Update local cache
      mutateProducts(
        products.map(p => p.id === soldModal.product!.id ? { ...p, sold: true } : p),
        { revalidate: false }
      );
      
      if (user?.uid) {
        invalidateMyProductsCache(user.uid);
      }
      
      // Close modal
      setSoldModal({ show: false, product: null, buyerName: '', buyerId: '', rating: 5, review: '', potentialBuyers: [], loadingBuyers: false });
    } catch (error) {
      console.error('Error marking product as sold:', error);
      alert('Nu s-a putut marca anunțul ca vândut. Încearcă din nou.');
    } finally {
      setMarkingSold(false);
    }
  }, [soldModal.product, products, mutateProducts, user?.uid]);

  // Delete sold product
  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (confirm('Ești sigur că vrei să ștergi acest anunț vândut?')) {
      try {
        await deleteProduct(productId);
        mutateProducts(
          products.filter(p => p.id !== productId),
          { revalidate: false }
        );
        if (user?.uid) {
          invalidateMyProductsCache(user.uid);
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Nu s-a putut șterge anunțul. Încearcă din nou.');
      }
    }
  }, [products, mutateProducts, user?.uid]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // Handler para enviar email de verificación
  const handleSendVerificationEmail = useCallback(async () => {
    if (!user || sendingVerification) return;
    
    setSendingVerification(true);
    setVerificationSent(false);
    
    try {
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          name: userProfile?.displayName || 'utilizator' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification email');
      }

      setVerificationSent(true);
      // Auto-hide success message after 10 seconds
      setTimeout(() => setVerificationSent(false), 10000);
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      alert('Eroare la trimiterea email-ului. Încearcă din nou.');
    } finally {
      setSendingVerification(false);
    }
  }, [user, userProfile, sendingVerification]);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (user) {
      await markAllNotificationsAsRead(user.uid);
      mutateNotifications(
        notifications.map(n => ({ ...n, read: true })),
        { revalidate: false }
      );
    }
  }, [user, notifications, mutateNotifications]);

  // Handler para guardar datos del perfil (incluyendo datos de empresa)
  const handleSaveProfile = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setSavingProfile(true);
    setProfileSaved(false);
    
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      // Datos básicos del perfil
      const profileData: Record<string, string | undefined> = {
        displayName: formData.get('displayName') as string || undefined,
        bio: formData.get('bio') as string || undefined,
        location: selectedLocation || formData.get('location') as string || undefined,
        phone: formData.get('phone') as string || undefined,
      };
      
      // Si es cuenta business, añadir datos de empresa
      if (userProfile?.accountType === 'business') {
        Object.assign(profileData, {
          businessName: formData.get('businessName') as string || undefined,
          cui: formData.get('cui') as string || undefined,
          nrRegistruComert: formData.get('nrRegistruComert') as string || undefined,
          reprezentantLegal: formData.get('reprezentantLegal') as string || undefined,
          adresaSediu: formData.get('adresaSediu') as string || undefined,
          oras: formData.get('oras') as string || undefined,
          judet: formData.get('judet') as string || undefined,
          codPostal: formData.get('codPostal') as string || undefined,
          telefonFirma: formData.get('telefonFirma') as string || undefined,
          emailFirma: formData.get('emailFirma') as string || undefined,
          website: formData.get('website') as string || undefined,
        });
      }
      
      // Filtrar valores undefined
      const cleanData = Object.fromEntries(
        Object.entries(profileData).filter(([_, v]) => v !== undefined && v !== '')
      );
      
      await updateUserProfile(cleanData);
      await invalidateUserProfileCache(user.uid);
      
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Nu s-au putut salva datele. Încearcă din nou.');
    } finally {
      setSavingProfile(false);
    }
  }, [user, userProfile?.accountType, updateUserProfile, selectedLocation]);

  // Handler para guardar configuración de privacidad
  const handleSavePrivacySettings = useCallback(async () => {
    if (!user) return;
    
    setSavingPrivacy(true);
    try {
      await updateUserProfile({
        settings: {
          profileVisible: privacySettings.profileVisible,
          showPhone: privacySettings.showPhone,
          showOnline: privacySettings.showOnline
        }
      });
      // Invalidar caché del perfil para que otros vean los cambios
      await invalidateUserProfileCache(user.uid);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      alert('Nu s-au putut salva setările. Încearcă din nou.');
    } finally {
      setSavingPrivacy(false);
    }
  }, [user, privacySettings, updateUserProfile]);

  // Handler para cambiar un toggle de privacidad
  const handlePrivacyToggle = useCallback((settingId: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [settingId]: !prev[settingId as keyof typeof prev]
    }));
  }, []);

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!notification.read && notification.id) {
      await markNotificationAsRead(notification.id);
      mutateNotifications(
        notifications.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        ),
        { revalidate: false }
      );
    }
    // Use the link stored in notification (should be /anunturi/... URL)
    if (notification.link) {
      router.push(notification.link);
    }
  }, [notifications, mutateNotifications, router]);

  const handleDeleteNotification = useCallback(async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Evitar que se active el click del contenedor
    try {
      await deleteNotification(notificationId);
      mutateNotifications(
        notifications.filter(n => n.id !== notificationId),
        { revalidate: false }
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications, mutateNotifications]);

  // Productos disponibles para promoción (activos y no promocionados)
  const availableForPromotion = useMemo(() => {
    const now = new Date();
    return products.filter(p => {
      // Solo productos aprobados y no vendidos
      const isApproved = p.status === 'approved' || (p.status === 'pending' && p.pendingUntil && new Date(p.pendingUntil.seconds * 1000) <= now) || !p.status;
      if (!isApproved || p.sold) return false;
      // No promocionados actualmente
      return !isProductPromoted(p);
    });
  }, [products]);

  // Productos actualmente promocionados
  const promotedProducts = useMemo(() => {
    return products.filter(p => isProductPromoted(p));
  }, [products]);

  // Handler para promocionar un producto
  const handlePromoteProduct = useCallback(async () => {
    if (!promotionModal.selectedProduct || !promotionModal.selectedPlan || !user || !userProfile) return;
    
    setPromotingProduct(true);
    setPromotionError(null);
    
    const result = await promoteProduct(
      promotionModal.selectedProduct.id,
      promotionModal.selectedPlan.id,
      user.uid,
      {
        displayName: userProfile.displayName || undefined,
        email: userProfile.email || undefined,
        phone: userProfile.phone,
        address: userProfile.location, // Using location as address
        accountType: userProfile.accountType,
        businessName: userProfile.businessName,
        cui: userProfile.cui,
        // Datos adicionales de empresa para facturación
        nrRegistruComert: userProfile.nrRegistruComert,
        adresaSediu: userProfile.adresaSediu,
        oras: userProfile.oras,
        judet: userProfile.judet,
        codPostal: userProfile.codPostal,
        tara: userProfile.tara,
        reprezentantLegal: userProfile.reprezentantLegal,
        telefonFirma: userProfile.telefonFirma,
        emailFirma: userProfile.emailFirma,
        website: userProfile.website
      }
    );
    
    if (result.success) {
      // Actualizar productos localmente
      mutateProducts();
      
      // Recargar facturas si se generó una
      if (result.invoice) {
        getUserInvoices(user.uid).then(setInvoices).catch(console.error);
      }
      
      setPromotionModal({ show: false, selectedProduct: null, selectedPlan: null, step: 'select-product' });
    } else {
      setPromotionError(result.error || 'A apărut o eroare');
    }
    
    setPromotingProduct(false);
  }, [promotionModal.selectedProduct, promotionModal.selectedPlan, user, userProfile, mutateProducts]);

  // Exportar datos a CSV - solo para cuentas business
  const handleExportCSV = useCallback(() => {
    if (!products.length) {
      alert('Nu ai anunțuri de exportat.');
      return;
    }
    
    // Crear encabezados CSV
    const headers = ['Titlu', 'Categorie', 'Preț', 'Monedă', 'Locație', 'Stare', 'Vizualizări', 'Status', 'Data publicării'];
    
    // Crear filas de datos
    const rows = products.map(p => {
      const publishDate = p.publishedAt?.seconds 
        ? new Date(p.publishedAt.seconds * 1000).toLocaleDateString('ro-RO')
        : '-';
      return [
        `"${(p.title || '').replace(/"/g, '""')}"`,
        p.category || '-',
        p.price || 0,
        p.currency || 'LEI',
        `"${(p.location || '').replace(/"/g, '""')}"`,
        p.condition || '-',
        p.views || 0,
        p.sold ? 'Vândut' : p.status === 'approved' ? 'Activ' : p.status === 'pending' ? 'În așteptare' : 'Respins',
        publishDate
      ].join(',');
    });
    
    // Combinar todo
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Crear y descargar archivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `anunturi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [products]);

  // Memoized menu items - evita recreación en cada render
  const menuItems = useMemo(() => [
    { id: 'dashboard', label: 'Panou de control', icon: LayoutGrid },
    ...(isBusiness ? [{ id: 'analytics', label: 'Statistici', icon: BarChart3 }] : []),
    { id: 'products', label: 'Anunțurile mele', icon: Package },
    { id: 'notifications', label: 'Notificări', icon: Bell },
    { id: 'support', label: 'Suport', icon: HeadphonesIcon },
    { id: 'profile', label: 'Datele mele', icon: User },
    { id: 'favorites', label: 'Favorite', icon: Heart },
    { id: 'invoices', label: 'Facturi', icon: FileText },
    ...(promotionEnabled ? [{ id: 'promotion', label: 'Promovare', icon: Megaphone }] : []),
    { id: 'settings', label: 'Setări', icon: Settings },
  ], [isBusiness, promotionEnabled]);

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .skeleton-shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
          }
        `}</style>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Skeleton */}
            <aside className="w-full lg:w-64 shrink-0">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-center pb-5 border-b border-gray-100">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full skeleton-shimmer"></div>
                  <div className="h-5 w-32 mx-auto skeleton-shimmer rounded mb-2"></div>
                  <div className="h-4 w-24 mx-auto skeleton-shimmer rounded"></div>
                </div>
                <nav className="mt-5 space-y-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-11 skeleton-shimmer rounded-xl"></div>
                  ))}
                </nav>
              </div>
            </aside>
            {/* Main Content Skeleton */}
            <main className="flex-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <div className="h-8 w-64 skeleton-shimmer rounded mb-2"></div>
                <div className="h-4 w-48 skeleton-shimmer rounded"></div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="w-10 h-10 skeleton-shimmer rounded-xl mb-3"></div>
                    <div className="h-7 w-20 skeleton-shimmer rounded mb-2"></div>
                    <div className="h-4 w-24 skeleton-shimmer rounded"></div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // If no user, redirect to login (handled by ProtectedRoute)
  if (!user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <style jsx>{`
            @keyframes shimmer {
              0% { background-position: -1000px 0; }
              100% { background-position: 1000px 0; }
            }
            .skeleton-shimmer {
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 1000px 100%;
              animation: shimmer 2s infinite;
            }
          `}</style>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <aside className="w-full lg:w-64 shrink-0">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="text-center pb-5 border-b border-gray-100">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full skeleton-shimmer"></div>
                    <div className="h-5 w-32 mx-auto skeleton-shimmer rounded mb-2"></div>
                  </div>
                  <nav className="mt-5 space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-11 skeleton-shimmer rounded-xl"></div>
                    ))}
                  </nav>
                </div>
              </aside>
              <main className="flex-1">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="h-8 w-64 skeleton-shimmer rounded mb-2"></div>
                  <div className="h-4 w-48 skeleton-shimmer rounded"></div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // If user exists but profile is still loading
  if (profileLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <style jsx>{`
            @keyframes shimmer {
              0% { background-position: -1000px 0; }
              100% { background-position: 1000px 0; }
            }
            .skeleton-shimmer {
              background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
              background-size: 1000px 100%;
              animation: shimmer 2s infinite;
            }
          `}</style>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <aside className="w-full lg:w-64 shrink-0">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="text-center pb-5 border-b border-gray-100">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full skeleton-shimmer"></div>
                    <div className="h-5 w-32 mx-auto skeleton-shimmer rounded mb-2"></div>
                    <div className="h-4 w-24 mx-auto skeleton-shimmer rounded"></div>
                  </div>
                  <nav className="mt-5 space-y-2">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="h-11 skeleton-shimmer rounded-xl"></div>
                    ))}
                  </nav>
                </div>
              </aside>
              <main className="flex-1">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-8 w-64 skeleton-shimmer rounded mb-2"></div>
                      <div className="h-4 w-48 skeleton-shimmer rounded"></div>
                    </div>
                    <div className="h-10 w-32 skeleton-shimmer rounded-xl"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                      <div className="w-10 h-10 skeleton-shimmer rounded-xl mb-3"></div>
                      <div className="h-7 w-20 skeleton-shimmer rounded mb-2"></div>
                      <div className="h-4 w-24 skeleton-shimmer rounded"></div>
                    </div>
                  ))}
                </div>
              </main>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // If user exists and profile loading finished, but no profile found
  if (!userProfile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-sm max-w-md mx-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Profil Inexistent</h2>
            <p className="text-gray-500 mb-6">
              Nu am putut găsi profilul tău. Este posibil să fi apărut o eroare la înregistrare.
            </p>
            <button
               onClick={handleLogout}
               className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-[#13C1AC] hover:bg-[#0da896]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Deconectează-te
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <div className={isBusiness ? 'min-h-screen bg-slate-900' : 'min-h-screen bg-gray-50 relative'}>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-fadeInLeft { animation: fadeInLeft 0.4s ease-out forwards; }
        .animate-fadeInScale { animation: fadeInScale 0.4s ease-out forwards; }
        .animate-delay-100 { animation-delay: 0.1s; opacity: 0; }
        .animate-delay-200 { animation-delay: 0.2s; opacity: 0; }
        .animate-delay-300 { animation-delay: 0.3s; opacity: 0; }
        .animate-delay-400 { animation-delay: 0.4s; opacity: 0; }
        
        /* Hide scrollbar */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Background Waves for entire page */}
      {!isBusiness && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute top-0 w-full h-64 hidden sm:block">
            <path fill="#13C1AC" fillOpacity="0.05" d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,144C1248,117,1344,75,1392,53.3L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute top-0 w-full h-48 hidden sm:block">
            <path fill="#13C1AC" fillOpacity="0.08" d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,128C672,107,768,85,864,90.7C960,96,1056,128,1152,138.7C1248,149,1344,139,1392,133.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
        </div>
      )}

      {/* ===== MOBILE BOTTOM SHEET MENU ===== */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl overflow-hidden transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-5 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${
                  isBusiness ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gradient-to-br from-[#13C1AC] to-teal-500'
                }`}>
                  {isBusiness ? (
                    <Building2 className="w-7 h-7 text-white" />
                  ) : userProfile.photoURL ? (
                    <Image src={userProfile.photoURL} alt="" width={56} height={56} className="w-14 h-14 rounded-2xl object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold text-lg">
                    {isBusiness ? userProfile.businessName : (userProfile.displayName || 'Contul Meu')}
                  </h3>
                  <p className="text-gray-500 text-sm truncate max-w-[180px]">
                    {userProfile.email}
                  </p>
                </div>
              </div>
              {userProfile.verified && (
                <span className="flex items-center gap-1 px-3 py-1.5 bg-[#13C1AC]/10 text-[#13C1AC] rounded-full text-xs font-semibold border border-[#13C1AC]/20">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verificat
                </span>
              )}
            </div>

            {/* Grid Menu */}
            <div className="px-4 pb-4">
              <div className="grid grid-cols-4 gap-2">
                {menuItems.map((item) => {
                  const unreadCount = item.id === 'notifications' ? notifications.filter(n => !n.read).length : 0;
                  const openTicketsCount = item.id === 'support' ? supportTickets.filter(t => t.status === 'open' || t.status === 'in-progress').length : 0;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id as ViewType);
                        setMobileMenuOpen(false);
                      }}
                      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 ${
                        isActive 
                          ? 'bg-[#13C1AC] text-white shadow-lg shadow-[#13C1AC]/30' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="text-[10px] font-medium text-center leading-tight line-clamp-1">
                        {item.label.split(' ')[0]}
                      </span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold rounded-full text-white bg-red-500 shadow-sm">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                      {openTicketsCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold rounded-full text-white bg-amber-500 shadow-sm">
                          {openTicketsCount > 9 ? '9+' : openTicketsCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout Button */}
            <div className="px-4 pb-6">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-500 rounded-2xl font-semibold border border-red-100 active:scale-[0.98] transition-all"
              >
                <LogOut className="w-5 h-5" />
                Deconectare
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* ===== SIDEBAR (Hidden on mobile) - FIXED ===== */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="fixed top-[5.5rem] w-64 animate-fadeInLeft">
              <div className={`rounded-2xl overflow-hidden relative max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide ${isBusiness ? 'bg-slate-800' : 'bg-white border border-gray-200 shadow-lg'}`}>
              
              {/* Decorative Waves Background in Sidebar */}
              <div className="absolute top-0 left-0 right-0 h-28 overflow-hidden pointer-events-none">
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="absolute w-full h-full">
                  <path d="M0,100 C150,140 350,60 500,100 L500,0 L0,0 Z" className={isBusiness ? 'fill-teal-600/30' : 'fill-[#13C1AC]/20'}></path>
                </svg>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="absolute w-full h-full">
                  <path d="M0,70 C100,110 400,30 500,70 L500,0 L0,0 Z" className={isBusiness ? 'fill-teal-500/20' : 'fill-[#13C1AC]/10'}></path>
                </svg>
              </div>
              
              <div className="p-5 relative z-10">
              {/* Avatar/Logo */}
              <div className={`text-center pb-5 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-100'}`}>
                {isBusiness ? (
                  <>
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-3 ring-4 ring-white/20 shadow-lg">
                      <Building2 className="w-9 h-9 text-white" />
                    </div>
                    <h2 className="font-bold text-white text-lg">{userProfile.businessName}</h2>
                    <p className="text-slate-400 text-sm mt-1">{userProfile.cui}</p>
                  </>
                ) : (
                  <>
                    <div className="relative w-20 h-20 mx-auto mb-3">
                      {userProfile.photoURL ? (
                        <Image src={userProfile.photoURL} alt="" width={80} height={80} className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100 shadow-md" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[#13C1AC] flex items-center justify-center ring-4 ring-gray-100 shadow-md">
                          <span className="text-2xl font-bold text-white">
                            {(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h2 className="font-bold text-gray-900 text-lg">{userProfile.displayName || 'Utilizator'}</h2>
                  </>
                )}
                
                {userProfile.verified && (
                  <span className={`inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full text-xs font-semibold ${isBusiness ? 'bg-teal-500/20 text-teal-400' : 'bg-[#13C1AC]/10 text-[#13C1AC] border border-[#13C1AC]/20'}`}>
                    <BadgeCheck className="w-4 h-4" />
                    {isBusiness ? 'Firmă Verificată' : 'Verificat'}
                  </span>
                )}
              </div>

              {/* Menu */}
              <nav className="mt-5 space-y-1">
                {menuItems.map((item) => {
                  const unreadCount = item.id === 'notifications' ? notifications.filter(n => !n.read).length : 0;
                  const openTicketsCount = item.id === 'support' ? supportTickets.filter(t => t.status === 'open' || t.status === 'in-progress').length : 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id as ViewType)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        activeView === item.id
                          ? 'bg-[#13C1AC] text-white shadow-md shadow-[#13C1AC]/20'
                          : isBusiness 
                            ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                            : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                      {unreadCount > 0 && (
                        <span className="relative flex items-center ml-auto">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-red-500">
                            {unreadCount}
                          </span>
                        </span>
                      )}
                      {openTicketsCount > 0 && (
                        <span className="relative flex items-center ml-auto">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-amber-500">
                            {openTicketsCount}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
                
                <div className={`pt-4 mt-4 border-t ${isBusiness ? 'border-slate-700' : 'border-gray-100'}`}>
                  <button 
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${isBusiness ? 'text-red-400 hover:bg-red-500/10' : 'text-red-500 hover:bg-red-50'}`}
                  >
                    <LogOut className="w-5 h-5" />
                    Deconectare
                  </button>
                </div>
              </nav>
              </div>
              </div>
            </div>
          </aside>

          {/* ===== MAIN CONTENT ===== */}
          <main className="flex-1 min-w-0">
            
            {/* ========== DASHBOARD ========== */}
            {activeView === 'dashboard' && (
              <div className="space-y-4 sm:space-y-6">
                
                {/* Welcome Banner */}
                <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-fadeInUp ${isBusiness ? 'bg-gradient-to-r from-teal-600 to-teal-500' : 'bg-white border border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h1 className={`text-lg sm:text-2xl font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                        Salut, {(userProfile.displayName || 'Utilizator').split(' ')[0]}! 👋
                      </h1>
                      <p className={`mt-0.5 sm:mt-1 text-sm sm:text-base ${isBusiness ? 'text-teal-100' : 'text-gray-500'}`}>
                        {isBusiness ? 'Iată performanța afacerii tale' : 'Iată un rezumat al activității tale'}
                      </p>
                    </div>
                    <Link 
                      href="/publish"
                      className={`hidden sm:inline-flex px-5 py-2.5 rounded-xl font-semibold transition-colors ${
                        isBusiness ? 'bg-white text-teal-600 hover:bg-teal-50' : 'bg-teal-500 text-white hover:bg-teal-600'
                      }`}
                    >
                      + Adaugă anunț
                    </Link>
                  </div>
                </div>

                {/* Stats Grid - BUSINESS */}
                {isBusiness && (() => {
                  // Calcular estadísticas reales
                  const totalRevenue = products.filter(p => p.sold).reduce((sum, p) => sum + (p.price || 0), 0);
                  const soldCount = products.filter(p => p.sold).length;
                  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
                  const activeProducts = products.filter(p => !p.sold && p.status === 'approved').length;
                  const conversionRate = totalViews > 0 ? ((soldCount / totalViews) * 100).toFixed(1) : '0.0';
                  
                  // Formatear números grandes
                  const formatNumber = (num: number) => {
                    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                    return num.toString();
                  };
                  
                  return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Venituri */}
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 animate-fadeInScale animate-delay-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <Euro className="w-5 h-5 text-emerald-400" />
                        </div>
                        {soldCount > 0 && (
                          <span className="flex items-center text-xs font-semibold text-emerald-400">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {soldCount} vândute
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-white">{formatPrice(totalRevenue)} lei</p>
                      <p className="text-sm text-slate-400 mt-1">Venituri totale</p>
                    </div>

                    {/* Anunțuri Active */}
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 animate-fadeInScale animate-delay-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-blue-400" />
                        </div>
                        {activeProducts > 0 && (
                          <span className="flex items-center text-xs font-semibold text-emerald-400">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            activ
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-white">{activeProducts}</p>
                      <p className="text-sm text-slate-400 mt-1">Anunțuri active</p>
                    </div>

                    {/* Vizualizări */}
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 animate-fadeInScale animate-delay-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <Eye className="w-5 h-5 text-purple-400" />
                        </div>
                        {totalViews > 0 && (
                          <span className="flex items-center text-xs font-semibold text-emerald-400">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            total
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-white">{formatNumber(totalViews)}</p>
                      <p className="text-sm text-slate-400 mt-1">Vizualizări totale</p>
                    </div>

                    {/* Conversie */}
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 animate-fadeInScale animate-delay-400">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className={`flex items-center text-xs font-semibold ${parseFloat(conversionRate) > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {parseFloat(conversionRate) > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : null}
                          {parseFloat(conversionRate) > 0 ? 'activ' : '-'}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">{conversionRate}%</p>
                      <p className="text-sm text-slate-400 mt-1">Rată conversie</p>
                    </div>
                  </div>
                  );
                })()}

                {/* Stats Grid - PERSONAL */}
                {!isBusiness && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {/* Active Products */}
                    <div className="group relative bg-white p-2.5 sm:p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-[#13C1AC]/5 rounded-bl-full -mr-2 -mt-2"></div>
                        <div className="relative flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 sm:p-2 bg-[#13C1AC]/10 rounded-lg text-[#13C1AC]">
                                    <Package className="w-4 h-4" />
                                </div>
                                <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full uppercase">
                                    Activ
                                </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{products.length}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-500">Anunțuri active</p>
                        </div>
                    </div>

                    {/* Sold */}
                    <div className="group relative bg-white p-2.5 sm:p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-purple-50 rounded-bl-full -mr-2 -mt-2"></div>
                        <div className="relative flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                {products.filter(p => p.sold).length > 0 && (
                                  <span className="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full uppercase">
                                      Vândute
                                  </span>
                                )}
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{products.filter(p => p.sold).length}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-500">Produse vândute</p>
                        </div>
                    </div>

                    {/* Favorites */}
                    <div className="group relative bg-white p-2.5 sm:p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-red-50 rounded-bl-full -mr-2 -mt-2"></div>
                        <div className="relative flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg text-red-500">
                                    <Heart className="w-4 h-4" />
                                </div>
                                {favoriteProducts && favoriteProducts.length > 0 && (
                                  <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full uppercase">
                                      Salvate
                                  </span>
                                )}
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{favoriteProducts?.length || 0}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-500">Favorite salvate</p>
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="group relative bg-white p-2.5 sm:p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-amber-50 rounded-bl-full -mr-2 -mt-2"></div>
                        <div className="relative flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 sm:p-2 bg-amber-50 rounded-lg text-amber-500">
                                    <Star className="w-4 h-4" />
                                </div>
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full uppercase">
                                    Top Seller
                                </span>
                            </div>
                            <div className="flex items-baseline gap-0.5">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{userProfile.rating}</h3>
                                <span className="text-[10px] text-gray-400">/ 5.0</span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500">Rating vânzător</p>
                        </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions - Business */}
                {isBusiness && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={handleExportCSV}
                      className="flex items-center gap-4 p-5 bg-slate-800 border border-slate-700 rounded-2xl hover:border-teal-500/50 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Download className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Export Date</p>
                        <p className="text-sm text-slate-400">Descarcă rapoarte CSV</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveView('promotion')}
                      className="flex items-center gap-4 p-5 bg-slate-800 border border-slate-700 rounded-2xl hover:border-teal-500/50 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-teal-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Promovare</p>
                        <p className="text-sm text-slate-400">Crește vizibilitatea</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveView('invoices')}
                      className="flex items-center gap-4 p-5 bg-slate-800 border border-slate-700 rounded-2xl hover:border-teal-500/50 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Facturare</p>
                        <p className="text-sm text-slate-400">Generează facturi</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Recent Products */}
                <div className={`rounded-2xl overflow-hidden ${isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                  <div className={`flex items-center justify-between p-5 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-200'}`}>
                    <h3 className={`font-medium text-base ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Ultimele Anunțuri</h3>
                    <button 
                      onClick={() => setActiveView('products')}
                      className="text-teal-500 text-sm font-semibold hover:underline flex items-center gap-1"
                    >
                      Vezi toate <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {products.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {products.slice(0, 5).map((product) => (
                        <div 
                          key={product.id} 
                          onClick={() => router.push(createProductLink(product))}
                          className={`flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 ${
                            isBusiness 
                              ? 'hover:bg-teal-500/10' 
                              : 'hover:bg-[#13C1AC]/5'
                          }`}
                        >
                          {/* Product Image */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-black/5">
                            <img 
                              src={product.image} 
                              alt={product.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h4 className={`font-semibold text-sm sm:text-base truncate ${
                                  isBusiness ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {product.title}
                                </h4>
                                {/* Description */}
                                {product.description && (
                                  <p className={`text-xs mt-1 line-clamp-1 ${
                                    isBusiness ? 'text-slate-400' : 'text-gray-500'
                                  }`}>
                                    {product.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {product.category}
                                  </span>
                                  <span className={`w-1 h-1 rounded-full ${isBusiness ? 'bg-slate-600' : 'bg-gray-300'}`}></span>
                                  <span className={`text-xs ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                                    {product.location}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Price */}
                              <div className="text-right flex-shrink-0">
                                <p className={`font-bold text-base sm:text-lg ${
                                  isBusiness ? 'text-teal-400' : 'text-[#13C1AC]'
                                }`}>
                                  {formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'Lei'}
                                </p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                                  product.status === 'approved' 
                                    ? isBusiness ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                    : product.status === 'pending'
                                    ? isBusiness ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                    : isBusiness ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                                }`}>
                                  {product.status === 'approved' ? 'Activ' : product.status === 'pending' ? 'În așteptare' : 'Respins'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Arrow */}
                          <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                            isBusiness ? 'text-slate-500' : 'text-gray-400'
                          }`} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isBusiness ? 'bg-slate-700' : 'bg-gray-100'}`}>
                        <Package className={`w-8 h-8 ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`} />
                      </div>
                      <p className={`font-medium ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Nu ai anunțuri încă</p>
                      <p className={`text-sm mt-1 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Adaugă primul tău anunț</p>
                      <Link href="/publish" className="inline-block mt-4 px-5 py-2.5 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors">
                        Adaugă anunț
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========== ANALYTICS ========== */}
            {activeView === 'analytics' && isBusiness && (() => {
              // Calcular estadísticas reales por categoría
              const categoryStats = products.reduce((acc, p) => {
                const cat = p.category || 'Altele';
                if (!acc[cat]) acc[cat] = { count: 0, views: 0, revenue: 0 };
                acc[cat].count += 1;
                acc[cat].views += p.views || 0;
                if (p.sold) acc[cat].revenue += p.price || 0;
                return acc;
              }, {} as Record<string, { count: number; views: number; revenue: number }>);
              
              const totalProducts = products.length;
              const sortedCategories = Object.entries(categoryStats)
                .map(([name, stats]) => ({
                  name,
                  ...stats,
                  percentage: totalProducts > 0 ? Math.round((stats.count / totalProducts) * 100) : 0
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
              
              // Calcular visualizaciones por mes (últimos 12 meses simulados basados en views totales)
              const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
              const avgMonthlyViews = Math.round(totalViews / 12);
              
              // Top productos por visualizaciones
              const topProducts = [...products]
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, 5);
              
              // Colores para categorías
              const categoryColors = ['bg-teal-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
              
              return (
              <div className="space-y-6">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6">Statistici Performanță</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Vizualizări per Produs */}
                    <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-400 mb-4">Top Produse după Vizualizări</h3>
                      {topProducts.length > 0 ? (
                        <div className="space-y-3">
                          {topProducts.map((product, i) => (
                            <div key={product.id} className="flex items-center gap-3">
                              <span className="text-slate-500 text-sm w-4">{i + 1}.</span>
                              <img src={product.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{product.title}</p>
                                <p className="text-xs text-slate-400">{product.views || 0} vizualizări</p>
                              </div>
                              {product.sold && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                                  Vândut
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm text-center py-8">Nu ai produse încă</p>
                      )}
                    </div>
                    
                    {/* Categorii */}
                    <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-400 mb-4">Distribuție pe Categorii</h3>
                      {sortedCategories.length > 0 ? (
                        <div className="space-y-4">
                          {sortedCategories.map((cat, i) => (
                            <div key={cat.name}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300">{cat.name}</span>
                                <span className="text-slate-500">{cat.percentage}% ({cat.count})</span>
                              </div>
                              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${categoryColors[i] || 'bg-slate-500'}`} 
                                  style={{ width: `${cat.percentage}%` }} 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm text-center py-8">Nu ai produse încă</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Resumen general */}
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 text-center">
                      <p className="text-2xl font-bold text-white">{products.length}</p>
                      <p className="text-xs text-slate-400 mt-1">Total Anunțuri</p>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 text-center">
                      <p className="text-2xl font-bold text-emerald-400">{products.filter(p => p.sold).length}</p>
                      <p className="text-xs text-slate-400 mt-1">Vândute</p>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 text-center">
                      <p className="text-2xl font-bold text-purple-400">{totalViews.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 mt-1">Vizualizări Totale</p>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 text-center">
                      <p className="text-2xl font-bold text-amber-400">{Object.keys(categoryStats).length}</p>
                      <p className="text-xs text-slate-400 mt-1">Categorii Active</p>
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* ========== PRODUCTS ========== */}
            {activeView === 'products' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] sm:min-h-[600px] relative">
                {/* Decorative Waves */}
                <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden pointer-events-none hidden sm:block">
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute w-full h-full">
                    <path d="M0,60 C300,100 600,20 900,60 C1050,80 1150,40 1200,60 L1200,0 L0,0 Z" fill="#9CA3AF" fillOpacity="0.12"></path>
                  </svg>
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute w-full h-full">
                    <path d="M0,40 C200,80 500,10 800,50 C1000,70 1100,30 1200,40 L1200,0 L0,0 Z" fill="#9CA3AF" fillOpacity="0.06"></path>
                  </svg>
                </div>
                
                <div className="p-3 sm:p-6 border-b border-gray-100 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm sm:text-xl font-bold text-gray-900">Anunțurile Mele</h2>
                      <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5">Gestionează produsele tale</p>
                    </div>
                    <Link 
                      href="/publish" 
                      className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#13C1AC] text-white text-[11px] sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:bg-[#10a593] transition-all shadow-sm active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Adaugă</span>
                    </Link>
                  </div>
                </div>
                
                {/* Product Status Tabs - Compact Pills */}
                <div className="px-3 py-2 sm:p-4 border-b border-gray-100 relative z-10">
                  <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                    {[
                      { id: 'active', label: 'Active', icon: Package, count: products.filter(p => p.status === 'approved' || (!p.status && !p.sold)).length, color: 'emerald' },
                      { id: 'pending', label: 'Așteptare', icon: Clock, count: products.filter(p => p.status === 'pending').length, color: 'amber' },
                      { id: 'rejected', label: 'Respinse', icon: Ban, count: products.filter(p => p.status === 'rejected').length, color: 'red' },
                      { id: 'sold', label: 'Vândute', icon: CheckCircle2, count: products.filter(p => p.sold).length, color: 'gray' },
                    ].map((tab) => {
                      const isActive = productFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setProductFilter(tab.id as any)}
                          className={`relative flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
                            isActive
                              ? 'bg-[#13C1AC] text-white shadow-md shadow-[#13C1AC]/25'
                              : 'bg-white text-gray-600 border border-gray-200 shadow-sm hover:border-gray-300'
                          }`}
                        >
                          <tab.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className={`min-w-[16px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center text-[9px] sm:text-xs font-bold rounded-full ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : tab.color === 'amber' && tab.count > 0 ? 'bg-amber-100 text-amber-600'
                              : tab.color === 'red' && tab.count > 0 ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product List */}
                <div className="p-2 sm:p-4 relative z-10">
                  {productsLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-16">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#13C1AC]/10 flex items-center justify-center mb-2 sm:mb-3">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-[#13C1AC]" />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">Se încarcă anunțurile...</p>
                    </div>
                  ) : filteredProducts.length > 0 ? (
                    <div className="space-y-1.5 sm:space-y-2">
                      {filteredProducts.map((product) => {
                        const isPromoted = isProductPromoted(product);
                        const remainingTime = isPromoted ? getPromotionRemainingTime(product) : null;
                        const promotionLabel = 'Promovat';
                        
                        return (
                        <div key={product.id} className={`bg-white rounded-xl sm:rounded-2xl border overflow-hidden transition-all duration-200 active:scale-[0.99] ${isPromoted ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100 hover:border-gray-200'}`}>
                          <div className="flex items-stretch">
                            {/* Product Image - Compact */}
                            <div className="w-16 sm:w-24 flex-shrink-0 relative">
                              <img className="h-full w-full object-cover bg-gray-100 aspect-square" src={product.image} alt="" />
                              {/* Promotion Badge on Image */}
                              {isPromoted && (
                                <div className="absolute top-1 left-1/2 -translate-x-1/2">
                                  <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold text-white shadow-sm ${product.promotionType === 'lunar' ? 'bg-gradient-to-r from-[#13C1AC] to-emerald-500' : product.promotionType === 'saptamanal' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}>
                                    <Crown className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                    Promovat
                                  </span>
                                </div>
                              )}
                              {/* Status indicator on image for mobile */}
                              <div className="absolute bottom-1 right-1 sm:hidden">
                                {productFilter === 'active' && (
                                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white shadow-sm">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                  </span>
                                )}
                                {productFilter === 'pending' && (
                                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white shadow-sm">
                                    <Clock className="w-2.5 h-2.5" />
                                  </span>
                                )}
                                {productFilter === 'rejected' && (
                                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white shadow-sm">
                                    <Ban className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Product Info - Compact */}
                            <div className="flex-1 min-w-0 p-2 sm:p-4 flex flex-col justify-center">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-[12px] sm:text-sm font-semibold text-gray-900 line-clamp-1">{product.title}</h3>
                                  {/* Description - max 200 characters */}
                                  {product.description && (
                                    <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5 line-clamp-1 hidden sm:block">
                                      {product.description.length > 200 ? product.description.slice(0, 200) + '...' : product.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                                    <span className="text-[13px] sm:text-base font-bold text-[#13C1AC]">{formatPrice(product.price)} €</span>
                                    {product.negotiable && (
                                      <span className="text-[8px] sm:text-[9px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">Neg.</span>
                                    )}
                                  </div>
                                  <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 line-clamp-1 flex items-center gap-1">
                                    <span className="truncate">{product.location}</span>
                                    {product.publishedAt?.seconds && (
                                      <>
                                        <span>•</span>
                                        <span>{new Date(product.publishedAt.seconds * 1000).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</span>
                                      </>
                                    )}
                                  </p>
                                  {/* Promotion Time Remaining */}
                                  {isPromoted && remainingTime && (
                                    <p className="text-[9px] sm:text-[10px] text-amber-600 font-medium mt-0.5 sm:mt-1 flex items-center gap-1">
                                      <Timer className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                                      {formatRemainingTime(remainingTime)}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Desktop Status Badge */}
                                <div className="hidden sm:block flex-shrink-0">
                                  {productFilter === 'active' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Activ
                                    </span>
                                  )}
                                  {productFilter === 'pending' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-600">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Moderare
                                    </span>
                                  )}
                                  {productFilter === 'rejected' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-600">
                                      <Ban className="h-3 w-3 mr-1" />
                                      Respins
                                    </span>
                                  )}
                                  {productFilter === 'sold' && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-600">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Vândut
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions Bar - Compact */}
                          <div className="flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-50/80 border-t border-gray-100">
                            {productFilter === 'active' && (
                              <div className="flex items-center justify-end gap-1 w-full">
                                {/* Botón Promover - solo si no está promocionado */}
                                {!isPromoted && (
                                  <button 
                                    onClick={() => {
                                      window.scrollTo(0, 0);
                                      setActiveView('promotion');
                                    }}
                                    className="flex items-center justify-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-md sm:rounded-lg transition-all active:scale-95" 
                                  >
                                    <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    <span className="hidden sm:inline">Promovează</span>
                                    <span className="sm:hidden">Promo</span>
                                  </button>
                                )}
                                <button 
                                  onClick={() => router.push(`/publish/edit/${product.id}`)}
                                  className="flex items-center justify-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-md sm:rounded-lg transition-all active:scale-95" 
                                >
                                  <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button 
                                  onClick={() => openSoldModal(product)} 
                                  className="flex items-center justify-center gap-0.5 sm:gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md sm:rounded-lg transition-all active:scale-95" 
                                >
                                  <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  <span>Vândut</span>
                                </button>
                              </div>
                            )}
                            {productFilter === 'pending' && (
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-amber-600">
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                  <span className="font-medium">În moderare</span>
                                </div>
                                <span className="text-[9px] sm:text-[10px] text-gray-400">~24h</span>
                              </div>
                            )}
                            {productFilter === 'rejected' && (
                              <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                                <button 
                                  onClick={() => setRejectionModal({ 
                                    show: true, 
                                    reason: product.rejectionReason || 'Anunțul nu respectă regulile platformei.', 
                                    productTitle: product.title 
                                  })}
                                  className="flex-1 flex items-center justify-center gap-0.5 px-2 py-1 text-[10px] sm:text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md sm:rounded-lg transition-all active:scale-95"
                                >
                                  <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  <span>Motiv</span>
                                </button>
                                <button 
                                  onClick={() => router.push(`/publish/edit/${product.id}`)}
                                  className="flex-1 flex items-center justify-center gap-0.5 px-2 py-1 text-[10px] sm:text-[11px] font-semibold text-white bg-[#13C1AC] hover:bg-[#10a593] rounded-md sm:rounded-lg transition-all active:scale-95"
                                >
                                  <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  <span>Corectează</span>
                                </button>
                              </div>
                            )}
                            {productFilter === 'sold' && (
                              <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                                <Link 
                                  href={createProductLink(product)}
                                  className="flex-1 flex items-center justify-center gap-0.5 px-2 py-1 text-[10px] sm:text-[11px] font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-md sm:rounded-lg transition-all active:scale-95"
                                >
                                  <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  <span>Vezi</span>
                                </Link>
                                <button 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="flex items-center justify-center gap-0.5 px-2 py-1 text-[10px] sm:text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md sm:rounded-lg transition-all active:scale-95"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                        {productFilter === 'rejected' ? <Ban className="h-7 w-7 sm:h-9 sm:w-9 text-gray-300" /> : <Package className="h-7 w-7 sm:h-9 sm:w-9 text-gray-300" />}
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Nu ai anunțuri {productFilter === 'active' ? 'active' : productFilter === 'pending' ? 'în așteptare' : productFilter === 'rejected' ? 'respinse' : 'vândute'}</h3>
                      <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-xs">
                        {productFilter === 'active' ? 'Publică primul tău anunț și începe să vinzi!' : 'Nu ai produse în această categorie.'}
                      </p>
                      {productFilter === 'active' && (
                        <Link href="/publish" className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-[#13C1AC] text-white rounded-xl font-semibold shadow-md shadow-[#13C1AC]/25 hover:bg-[#0da896] transition-all active:scale-95 text-sm">
                          <Package className="w-4 h-4" />
                          Publică anunț
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========== PROFILE ========== */}
            {activeView === 'profile' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                {/* Decorative Waves */}
                <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden pointer-events-none hidden sm:block">
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute w-full h-full">
                    <path d="M0,60 C300,100 600,20 900,60 C1050,80 1150,40 1200,60 L1200,0 L0,0 Z" fill="#9CA3AF" fillOpacity="0.12"></path>
                  </svg>
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute w-full h-full">
                    <path d="M0,40 C200,80 500,10 800,50 C1000,70 1100,30 1200,40 L1200,0 L0,0 Z" fill="#9CA3AF" fillOpacity="0.06"></path>
                  </svg>
                </div>
                
                <div className="p-4 sm:p-8 border-b border-gray-100 relative z-10">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Datele Mele</h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Informații personale și de contact</p>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      userProfile.accountType === 'business' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {userProfile.accountType === 'business' ? (
                        <>
                          <Building2 className="w-3.5 h-3.5" />
                          Cont Firmă
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5" />
                          Cont Personal
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 sm:p-8 relative z-10">
                  <form ref={profileFormRef} onSubmit={handleSaveProfile} className="space-y-6 sm:space-y-8">
                    {/* Section: Public Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                      <div className="md:col-span-1">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">Profil Public</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Cum te văd alți utilizatori pe platformă.</p>
                        
                        <div className="mt-4 flex justify-center md:justify-start">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <div 
                            className="relative group cursor-pointer"
                            onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                          >
                            {uploadingPhoto ? (
                              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-100">
                                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#13C1AC]" />
                              </div>
                            ) : userProfile.photoURL ? (
                              <Image src={userProfile.photoURL} alt="Avatar" width={96} height={96} className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover group-hover:opacity-75 transition-opacity ring-4 ring-gray-100" />
                            ) : (
                              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-[#13C1AC] flex items-center justify-center ring-4 ring-gray-100 group-hover:opacity-75 transition-opacity">
                                <span className="text-xl sm:text-2xl font-bold text-white">{(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}</span>
                              </div>
                            )}
                            {!uploadingPhoto && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full bg-black/40 transition-opacity">
                                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-[#13C1AC] rounded-full p-1 sm:p-1.5 shadow-lg border-2 border-white">
                              <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-2 text-center md:text-left">Click pentru a schimba</p>
                      </div>

                      <div className="md:col-span-2 space-y-4 sm:space-y-6">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nume utilizator</label>
                          <input type="text" defaultValue={userProfile.displayName || ''} readOnly className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm text-sm p-2.5 sm:p-3 bg-gray-100 cursor-not-allowed" />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bio</label>
                          <textarea rows={3} name="bio" defaultValue={userProfile.bio || ''} className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-gray-50" />
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Descriere scurtă care va apărea în profilul tău.</p>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Localitate</label>
                          <div className="relative">
                            <input 
                              type="text"
                              name="location"
                              value={citySearch !== '' ? citySearch : selectedLocation}
                              onChange={(e) => { 
                                const val = e.target.value;
                                setCitySearch(val);
                                if (val === '') {
                                  setSelectedLocation('');
                                }
                                setShowCityDropdown(true);
                              }}
                              onFocus={() => { 
                                if (selectedLocation) {
                                  setCitySearch(selectedLocation);
                                }
                                setShowCityDropdown(true);
                              }}
                              placeholder="Caută orașul..."
                              className="block w-full px-4 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-gray-50"
                            />
                            
                            {showCityDropdown && citySearch.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl max-h-60 overflow-y-auto">
                                {CITIES.filter(city => city.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 10).length > 0 ? (
                                  CITIES.filter(city => city.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 10).map((city) => (
                                    <button
                                      key={city}
                                      type="button"
                                      onClick={() => { setSelectedLocation(city); setCitySearch(''); setShowCityDropdown(false); }}
                                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm border-b border-gray-100 last:border-b-0 ${
                                        selectedLocation === city ? 'bg-[#13C1AC]/10 text-[#13C1AC]' : 'text-gray-700'
                                      }`}
                                    >
                                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      </svg>
                                      <span className="flex-1">{city}</span>
                                      {selectedLocation === city && (
                                        <Check className="w-4 h-4 text-[#13C1AC]" />
                                      )}
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-3 text-gray-500 text-sm text-center">
                                    Nu s-a găsit orașul "{citySearch}"
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Section: Private Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                      <div className="md:col-span-1">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">Date Personale</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Informații private pentru gestionarea contului și verificare.</p>
                      </div>

                      <div className="md:col-span-2 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" defaultValue={userProfile.email || ''} readOnly className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm text-sm p-2.5 sm:p-3 bg-gray-100 cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Telefon</label>
                            <input type="tel" name="phone" defaultValue={userProfile.phone || ''} className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700">Verificări</label>
                          
                          {/* Email Verification */}
                          {user?.emailVerified ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="bg-white p-1.5 sm:p-2 rounded-full mr-3 sm:mr-4 border border-green-100 shadow-sm">
                                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-green-900">Email verificat</p>
                                  <p className="text-xs text-green-700 mt-0.5">Adresa ta de email este confirmată.</p>
                                </div>
                              </div>
                              <span className="flex items-center text-xs font-bold text-green-700 bg-white/50 px-3 py-1 rounded-full border border-green-200">
                                <BadgeCheck className="w-3 h-3 mr-1" />
                                Activ
                              </span>
                            </div>
                          ) : verificationSent ? (
                            <div className="bg-teal-50 border border-teal-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="bg-teal-100 p-1.5 sm:p-2 rounded-full mr-3 sm:mr-4 border border-teal-200 shadow-sm">
                                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-teal-800">Email trimis!</p>
                                  <p className="text-xs text-teal-600 mt-0.5">Verifică inbox-ul pentru a confirma.</p>
                                </div>
                              </div>
                              <span className="flex items-center text-xs font-bold text-teal-600 bg-white px-3 py-1.5 rounded-full border border-teal-200">
                                ✓ Trimis
                              </span>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="bg-white p-1.5 sm:p-2 rounded-full mr-3 sm:mr-4 border border-gray-200 shadow-sm">
                                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-700">Email neverificat</p>
                                  <p className="text-xs text-gray-500 mt-0.5">Verifică-ți adresa de email.</p>
                                </div>
                              </div>
                              <button 
                                onClick={handleSendVerificationEmail}
                                disabled={sendingVerification}
                                className="flex items-center text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-50"
                              >
                                {sendingVerification ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Se trimite...
                                  </>
                                ) : (
                                  'Verifică'
                                )}
                              </button>
                            </div>
                          )}

                          {/* Phone Verification */}
                          {userProfile?.phone ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="bg-white p-2 rounded-full mr-4 border border-green-100 shadow-sm">
                                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-green-900">Telefon verificat</p>
                                  <p className="text-xs text-green-700 mt-0.5">Numărul tău de mobil este conectat.</p>
                                </div>
                              </div>
                              <span className="flex items-center text-xs font-bold text-green-700 bg-white/50 px-3 py-1 rounded-full border border-green-200">
                                <BadgeCheck className="w-3 h-3 mr-1" />
                                Activ
                              </span>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="bg-white p-2 rounded-full mr-4 border border-gray-200 shadow-sm">
                                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-700">Telefon neverificat</p>
                                  <p className="text-xs text-gray-500 mt-0.5">Adaugă un număr de telefon.</p>
                                </div>
                              </div>
                              <span className="flex items-center text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                                Inactiv
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Section: Security */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                      <div className="md:col-span-1">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                          Securitate
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Gestionează parola și securitatea contului.</p>
                      </div>

                      <div className="md:col-span-2">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-gray-900">Parolă</p>
                            <p className="text-xs text-gray-500 mt-0.5">Ultima modificare: niciodată</p>
                          </div>
                          <button 
                            type="button"
                            onClick={async () => {
                              if (!user?.email) return;
                              setSendingPasswordReset(true);
                              try {
                                const response = await fetch('/api/send-reset-email', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email: user.email })
                                });
                                if (response.ok) {
                                  setPasswordResetSent(true);
                                  setTimeout(() => setPasswordResetSent(false), 10000);
                                }
                              } catch (error) {
                                console.error('Error sending password reset:', error);
                              } finally {
                                setSendingPasswordReset(false);
                              }
                            }}
                            disabled={sendingPasswordReset || passwordResetSent}
                            className="text-xs sm:text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingPasswordReset ? (
                              <span className="flex items-center gap-1.5">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Trimitem...
                              </span>
                            ) : passwordResetSent ? (
                              <span className="flex items-center gap-1.5 text-green-600">
                                <Check className="w-3 h-3" />
                                Email trimis!
                              </span>
                            ) : (
                              'Schimbă parola'
                            )}
                          </button>
                        </div>
                        {passwordResetSent && (
                          <p className="text-xs text-green-600 mt-2">✓ Verifică-ți emailul pentru linkul de resetare a parolei.</p>
                        )}
                      </div>
                    </div>

                    {/* ========== BUSINESS DATA SECTION (Only for business accounts) ========== */}
                    {isBusiness && (
                      <>
                        <hr className="border-gray-200" />
                        
                        {/* Section: Company Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                          <div className="md:col-span-1">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                              Date Firmă
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Informații despre compania ta pentru facturare și conformitate legală.</p>
                          </div>

                          <div className="md:col-span-2 space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Denumire Firmă *</label>
                                <input 
                                  type="text" 
                                  name="businessName"
                                  defaultValue={userProfile.businessName || ''} 
                                  placeholder="SC Exemplu SRL"
                                  className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" 
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">CUI/CIF *</label>
                                <input 
                                  type="text" 
                                  name="cui"
                                  defaultValue={userProfile.cui || ''} 
                                  placeholder="RO12345678"
                                  className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" 
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nr. Registrul Comerțului *</label>
                                <input 
                                  type="text" 
                                  name="nrRegistruComert"
                                  defaultValue={userProfile.nrRegistruComert || ''} 
                                  placeholder="J12/1234/2024"
                                  className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" 
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reprezentant Legal *</label>
                                <input 
                                  type="text" 
                                  name="reprezentantLegal"
                                  defaultValue={userProfile.reprezentantLegal || ''} 
                                  placeholder="Ion Popescu"
                                  className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" 
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Section: Fiscal Address */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                          <div className="md:col-span-1">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Adresă Sediu Social
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Adresa oficială a firmei pentru documente fiscale.</p>
                          </div>

                          <div className="md:col-span-2 space-y-4 sm:space-y-6">
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Adresă Completă *</label>
                              <input 
                                type="text" 
                                name="adresaSediu"
                                defaultValue={userProfile.adresaSediu || ''} 
                                placeholder="Strada Exemplu, Nr. 10, Bl. A1, Sc. 2, Ap. 15"
                                className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" 
                              />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Oraș *</label>
                                <input 
                                  type="text" 
                                  name="oras"
                                  defaultValue={userProfile.oras || ''} 
                                  placeholder="București"
                                  className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" 
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Județ *</label>
                                <input 
                                  type="text" 
                                  name="judet"
                                  defaultValue={userProfile.judet || ''} 
                                  placeholder="București"
                                  className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" 
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Cod Poștal</label>
                                <input 
                                  type="text" 
                                  name="codPostal"
                                  defaultValue={userProfile.codPostal || ''} 
                                  placeholder="010101"
                                  className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" 
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Țară</label>
                                <input 
                                  type="text" 
                                  defaultValue={userProfile.tara || 'România'} 
                                  className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-gray-50" 
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <hr className="border-gray-200" />

                        {/* Section: Business Contact */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                          <div className="md:col-span-1">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                              Contact Firmă
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">Informații de contact afișate pe facturi și profil.</p>
                          </div>

                          <div className="md:col-span-2 space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Telefon Firmă</label>
                                <input 
                                  type="tel" 
                                  name="telefonFirma"
                                  defaultValue={userProfile.telefonFirma || ''} 
                                  placeholder="+40 21 123 4567"
                                  className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" 
                                />
                              </div>
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Firmă</label>
                                <input 
                                  type="email" 
                                  name="emailFirma"
                                  defaultValue={userProfile.emailFirma || ''} 
                                  placeholder="contact@firma.ro"
                                  className="block w-full rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" 
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Website</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Globe className="h-4 w-4 text-gray-400" />
                                </div>
                                <input 
                                  type="url" 
                                  name="website"
                                  defaultValue={userProfile.website || ''} 
                                  placeholder="https://www.firma.ro"
                                  className="block w-full pl-10 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm p-2.5 sm:p-3 bg-white" 
                                />
                              </div>
                            </div>

                            {/* Business Verification Status */}
                            <div className={`rounded-xl p-4 flex items-center justify-between ${
                              userProfile.verified 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-amber-50 border border-amber-200'
                            }`}>
                              <div className="flex items-center">
                                <div className={`p-2 rounded-full mr-4 ${
                                  userProfile.verified 
                                    ? 'bg-white border border-green-100' 
                                    : 'bg-white border border-amber-100'
                                }`}>
                                  {userProfile.verified ? (
                                    <BadgeCheck className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                  )}
                                </div>
                                <div>
                                  <p className={`text-sm font-bold ${
                                    userProfile.verified ? 'text-green-900' : 'text-amber-900'
                                  }`}>
                                    {userProfile.verified ? 'Firmă Verificată' : 'Verificare în așteptare'}
                                  </p>
                                  <p className={`text-xs mt-0.5 ${
                                    userProfile.verified ? 'text-green-700' : 'text-amber-700'
                                  }`}>
                                    {userProfile.verified 
                                      ? 'Datele firmei au fost verificate.' 
                                      : 'Completează toate datele pentru verificare.'}
                                  </p>
                                </div>
                              </div>
                              <span className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full ${
                                userProfile.verified 
                                  ? 'text-green-700 bg-white/50 border border-green-200' 
                                  : 'text-amber-700 bg-white/50 border border-amber-200'
                              }`}>
                                {userProfile.verified ? (
                                  <>
                                    <BadgeCheck className="w-3 h-3 mr-1" />
                                    Verificat
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 mr-1" />
                                    În curs
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex justify-end pt-4 gap-4">
                      <button type="button" className="bg-white border border-gray-300 text-gray-700 font-medium py-2.5 px-6 rounded-xl hover:bg-gray-50 transition-colors">
                        Anulează
                      </button>
                      <button 
                        type="submit" 
                        disabled={savingProfile}
                        className="bg-teal-500 text-white font-medium py-2.5 px-6 rounded-xl hover:bg-teal-600 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {savingProfile ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Se salvează...
                          </>
                        ) : profileSaved ? (
                          <>
                            <Check className="w-4 h-4" />
                            Salvat!
                          </>
                        ) : (
                          'Salvează modificările'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ========== FAVORITES ========== */}
            {activeView === 'favorites' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">Favoritele Mele ❤️</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Produse pe care le-ai salvat pentru mai târziu.</p>
                  </div>
                  
                  {/* View Toggle */}
                  <div className="flex bg-gray-100 p-1 rounded-lg sm:rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setFavoritesViewMode('grid')}
                      className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${favoritesViewMode === 'grid' ? 'bg-white text-[#13C1AC] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Vizualizare Grilă"
                    >
                      <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => setFavoritesViewMode('list')}
                      className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all ${favoritesViewMode === 'list' ? 'bg-white text-[#13C1AC] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Vizualizare Listă"
                    >
                      <List className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* Favorites Grid/List */}
                <div className="p-4 sm:p-8">
                  {favoritesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#13C1AC]" />
                    </div>
                  ) : favoriteProducts && favoriteProducts.length > 0 ? (
                    favoritesViewMode === 'grid' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {favoriteProducts.map((product) => (
                          <ProductCard key={`${product.id}-theme-${selectedCardTheme}`} product={product} />
                        ))}
                      </div>
                    ) : (
                      /* List View */
                      <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                        {favoriteProducts.map((product) => (
                          <div 
                            key={product.id} 
                            onClick={() => router.push(createProductLink(product))}
                            className="flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 hover:bg-[#13C1AC]/5 bg-white"
                          >
                            {/* Product Image */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-black/5">
                              <img 
                                src={product.image} 
                                alt={product.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                    {product.title}
                                  </h4>
                                  {product.description && (
                                    <p className="text-xs mt-1 line-clamp-1 text-gray-500">
                                      {product.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      {product.category}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span className="text-xs text-gray-500">
                                      {product.location}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Price */}
                                <div className="text-right flex-shrink-0">
                                  <p className="font-bold text-base sm:text-lg text-[#13C1AC]">
                                    {formatPrice(product.price)} {product.currency === 'EUR' ? '€' : 'Lei'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Arrow */}
                            <ChevronRight className="w-5 h-5 flex-shrink-0 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    /* Empty state - no favorites yet */
                    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gray-50 rounded-full flex items-center justify-center mb-3 sm:mb-4 text-gray-300">
                        <Heart className="h-8 w-8 sm:h-10 sm:w-10" />
                      </div>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">Nu ai favorite încă</h3>
                      <p className="text-gray-500 mt-1 max-w-sm text-xs sm:text-sm px-4">Apasă pe inimă pentru a salva produsele care îți plac.</p>
                      <Link href="/" className="mt-4 sm:mt-6 px-5 sm:px-6 py-2 sm:py-2.5 bg-[#13C1AC] text-white rounded-lg sm:rounded-xl font-semibold text-sm hover:bg-[#0ea896] transition-colors">
                        Explorează produse
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========== INVOICES ========== */}
            {activeView === 'invoices' && (
              <div className={`rounded-xl sm:rounded-2xl overflow-hidden ${isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                <div className={`p-4 sm:p-6 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`text-lg sm:text-xl font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Facturi</h2>
                    <span className={`text-xs sm:text-sm ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                      {invoices.length} {invoices.length === 1 ? 'factură' : 'facturi'}
                    </span>
                  </div>
                </div>
                
                {invoicesLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                    <Loader2 className={`h-8 w-8 animate-spin ${isBusiness ? 'text-teal-400' : 'text-[#13C1AC]'}`} />
                    <p className={`mt-3 text-sm ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Se încarcă facturile...</p>
                  </div>
                ) : invoices.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {invoices.map((invoice) => {
                      const issuedDate = invoice.issuedAt && typeof invoice.issuedAt === 'object' && 'seconds' in invoice.issuedAt
                        ? new Date((invoice.issuedAt as any).seconds * 1000)
                        : new Date();
                      
                      return (
                        <div 
                          key={invoice.id}
                          className={`p-4 sm:p-5 hover:bg-gray-50 transition-colors ${isBusiness ? 'hover:bg-slate-700/50' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            {/* Invoice Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-semibold text-sm sm:text-base ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                                  {invoice.seriesNumber}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                                  invoice.status === 'paid' 
                                    ? 'bg-green-100 text-green-700' 
                                    : invoice.status === 'pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {invoice.status === 'paid' ? 'Plătită' : invoice.status === 'pending' ? 'În așteptare' : 'Anulată'}
                                </span>
                              </div>
                              
                              <p className={`text-xs sm:text-sm truncate ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                                {invoice.items[0]?.description || 'Servicii promovare'}
                              </p>
                              
                              <div className="flex items-center gap-3 mt-2 text-[10px] sm:text-xs">
                                <span className={isBusiness ? 'text-slate-500' : 'text-gray-400'}>
                                  {issuedDate.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <span className={isBusiness ? 'text-slate-500' : 'text-gray-400'}>•</span>
                                <span className={isBusiness ? 'text-slate-500' : 'text-gray-400'}>
                                  {invoice.clientType === 'business' ? 'Persoană juridică' : 'Persoană fizică'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Amount & Actions */}
                            <div className="flex flex-col items-end gap-2">
                              <span className={`font-bold text-base sm:text-lg ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                                {invoice.total.toFixed(2)} €
                              </span>
                              
                              <button
                                onClick={() => printInvoice(invoice)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                  isBusiness 
                                    ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' 
                                    : 'bg-[#13C1AC]/10 text-[#13C1AC] hover:bg-[#13C1AC]/20'
                                }`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Descarcă</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Empty state - no invoices yet */
                  <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                    <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 ${isBusiness ? 'bg-slate-700 text-slate-500' : 'bg-gray-50 text-gray-300'}`}>
                      <FileText className="h-8 w-8 sm:h-10 sm:w-10" />
                    </div>
                    <h3 className={`text-base sm:text-lg font-medium ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Nu ai facturi încă</h3>
                    <p className={`mt-1 max-w-sm text-xs sm:text-sm px-4 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                      Facturile pentru promovările tale vor apărea aici după achiziție.
                    </p>
                    <button 
                      onClick={() => setActiveView('promotion')}
                      className={`mt-4 sm:mt-6 px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm transition-colors ${
                        isBusiness 
                          ? 'bg-teal-500 text-white hover:bg-teal-600' 
                          : 'bg-[#13C1AC] text-white hover:bg-[#0ea896]'
                      }`}
                    >
                      Vezi planuri de promovare
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ========== PROMOTION ========== */}
            {activeView === 'promotion' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-xl sm:rounded-2xl p-4 sm:p-8 text-white">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Megaphone className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                    <div>
                      <h2 className="text-lg sm:text-2xl font-bold">Promovează-ți Anunțurile</h2>
                      <p className="text-teal-100 text-xs sm:text-base">Vinde de până la 3x mai rapid cu promovare</p>
                    </div>
                  </div>
                </div>

                {/* Promotion Plans - ARRIBA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {PROMOTION_PLANS.map((plan, i) => (
                    <div key={plan.id} className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-6 ${
                      plan.popular 
                        ? isBusiness ? 'bg-slate-900 border-2 border-teal-500' : 'bg-white border-2 border-teal-500'
                        : isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
                    }`}>
                      {plan.popular && (
                        <span className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-0.5 sm:py-1 bg-teal-500 text-white text-[10px] sm:text-xs font-bold rounded-full">
                          Popular
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        {plan.id === 'zilnic' && <Zap className="w-5 h-5 text-orange-500" />}
                        {plan.id === 'saptamanal' && <Award className="w-5 h-5 text-purple-500" />}
                        {plan.id === 'lunar' && <Crown className="w-5 h-5 text-amber-500" />}
                        <h3 className={`text-base sm:text-lg font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                      </div>
                      <div className="mt-3 sm:mt-4 mb-4 sm:mb-6">
                        <span className={`text-2xl sm:text-3xl font-black ${isBusiness ? 'text-white' : 'text-gray-900'}`}>{plan.price}€</span>
                        <span className={`text-xs sm:text-sm ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>/{plan.duration} zile</span>
                      </div>
                      <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                        {plan.features.map((f, j) => (
                          <li key={j} className={`flex items-center gap-2 text-xs sm:text-sm ${isBusiness ? 'text-slate-300' : 'text-gray-600'}`}>
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button 
                        onClick={() => {
                          if (availableForPromotion.length === 0) {
                            alert('Nu ai anunțuri disponibile pentru promovare. Toate anunțurile tale sunt deja promovate sau nu ai anunțuri active.');
                            return;
                          }
                          setPromotionModal({ 
                            show: true, 
                            selectedProduct: null, 
                            selectedPlan: plan, 
                            step: 'select-product' 
                          });
                        }}
                        disabled={availableForPromotion.length === 0}
                        className={`w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          plan.popular 
                            ? 'bg-teal-500 text-white hover:bg-teal-600' 
                            : isBusiness ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Alege
                      </button>
                    </div>
                  ))}
                </div>

                {/* Currently Promoted Products - ABAJO */}
                {promotedProducts.length > 0 && (
                  <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 ${isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                    <h3 className={`flex items-center gap-2 font-semibold text-sm sm:text-base mb-4 ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                      Anunțuri Promovate Active ({promotedProducts.length})
                    </h3>
                    <div className="space-y-3">
                      {promotedProducts.map(product => {
                        const remaining = getPromotionRemainingTime(product);
                        const plan = product.promotionType ? getPromotionPlan(product.promotionType) : null;
                        const badgeIcons: Record<string, any> = { 'zilnic': Zap, 'saptamanal': Award, 'lunar': Crown };
                        const BadgeIcon = product.promotionType ? badgeIcons[product.promotionType] : Zap;
                        const badgeColors: Record<string, string> = {
                          'zilnic': 'from-amber-500 to-orange-500',
                          'saptamanal': 'from-purple-500 to-pink-500',
                          'lunar': 'from-yellow-400 to-amber-500'
                        };
                        
                        return (
                          <div key={product.id} className={`flex items-center gap-3 sm:gap-4 p-3 rounded-xl ${isBusiness ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                            {/* Product Image */}
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0">
                              <Image
                                src={product.images?.[0] || product.image || '/placeholder.jpg'}
                                alt={product.title}
                                fill
                                className="object-cover"
                              />
                              {/* Badge */}
                              <div className={`absolute top-1 right-1 px-1.5 py-0.5 text-[8px] font-bold rounded bg-gradient-to-r ${product.promotionType ? badgeColors[product.promotionType] : ''} text-white flex items-center gap-0.5`}>
                                <BadgeIcon className="w-2.5 h-2.5" />
                                {plan?.badge}
                              </div>
                            </div>
                            
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-sm truncate ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                                {product.title}
                              </h4>
                              <p className={`text-xs ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                                {plan?.name} • {plan?.price} lei
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Timer className="w-3.5 h-3.5 text-[#13C1AC]" />
                                <span className={`text-xs font-medium ${isBusiness ? 'text-teal-400' : 'text-teal-600'}`}>
                                  {formatRemainingTime(remaining)} rămase
                                </span>
                              </div>
                            </div>
                            
                            {/* Link to product */}
                            <Link 
                              href={createProductLink(product)}
                              className={`p-2 rounded-lg transition-colors ${isBusiness ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-gray-200 text-gray-400'}`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Info box */}
                <div className={`rounded-xl p-4 ${isBusiness ? 'bg-slate-800/50 border border-slate-700' : 'bg-blue-50 border border-blue-100'}`}>
                  <div className="flex gap-3">
                    <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${isBusiness ? 'text-blue-400' : 'text-blue-500'}`} />
                    <div>
                      <h4 className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-blue-900'}`}>Cum funcționează promovarea?</h4>
                      <ul className={`mt-2 space-y-1 text-xs ${isBusiness ? 'text-slate-400' : 'text-blue-700'}`}>
                        <li>• Anunțurile promovate apar în topul rezultatelor de căutare</li>
                        <li>• Badge-ul special atrage mai mulți cumpărători</li>
                        <li>• Nu poți promova același anunț de mai multe ori simultan</li>
                        <li>• După expirarea promovării, poți reînnoi</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== PROMOTION MODAL ========== */}
            {promotionModal.show && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className={`w-full max-w-lg rounded-2xl overflow-hidden ${isBusiness ? 'bg-slate-800' : 'bg-white'}`}>
                  {/* Modal Header */}
                  <div className={`p-4 sm:p-6 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {promotionModal.selectedPlan?.id === 'zilnic' && <Zap className="w-6 h-6 text-orange-500" />}
                        {promotionModal.selectedPlan?.id === 'saptamanal' && <Award className="w-6 h-6 text-purple-500" />}
                        {promotionModal.selectedPlan?.id === 'lunar' && <Crown className="w-6 h-6 text-amber-500" />}
                        <div>
                          <h2 className={`text-lg font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                            {promotionModal.step === 'select-product' ? 'Selectează Anunțul' : 'Confirmă Promovarea'}
                          </h2>
                          <p className={`text-sm ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                            Plan {promotionModal.selectedPlan?.name} • {promotionModal.selectedPlan?.price} lei
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPromotionModal({ show: false, selectedProduct: null, selectedPlan: null, step: 'select-product' })}
                        className={`p-2 rounded-full transition-colors ${isBusiness ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Modal Content */}
                  <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
                    {promotionModal.step === 'select-product' && (
                      <div className="space-y-3">
                        {availableForPromotion.length === 0 ? (
                          <div className="text-center py-8">
                            <Package className={`w-12 h-12 mx-auto mb-3 ${isBusiness ? 'text-slate-600' : 'text-gray-300'}`} />
                            <p className={`${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                              Nu ai anunțuri disponibile pentru promovare
                            </p>
                          </div>
                        ) : (
                          availableForPromotion.map(product => (
                            <button
                              key={product.id}
                              onClick={() => setPromotionModal(prev => ({ 
                                ...prev, 
                                selectedProduct: product, 
                                step: 'confirm' 
                              }))}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                                isBusiness 
                                  ? 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-teal-500' 
                                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-teal-500'
                              }`}
                            >
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                                <Image
                                  src={product.images?.[0] || product.image || '/placeholder.jpg'}
                                  alt={product.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-sm truncate ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                                  {product.title}
                                </h4>
                                <p className={`text-sm font-semibold ${isBusiness ? 'text-teal-400' : 'text-teal-600'}`}>
                                  {product.price.toLocaleString('ro-RO')} {product.currency || 'LEI'}
                                </p>
                              </div>
                              <ChevronRight className={`w-5 h-5 ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`} />
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    
                    {promotionModal.step === 'confirm' && promotionModal.selectedProduct && (
                      <div className="space-y-4">
                        {/* Selected Product Preview */}
                        <div className={`flex items-center gap-3 p-4 rounded-xl ${isBusiness ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                            <Image
                              src={promotionModal.selectedProduct.images?.[0] || promotionModal.selectedProduct.image || '/placeholder.jpg'}
                              alt={promotionModal.selectedProduct.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium truncate ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                              {promotionModal.selectedProduct.title}
                            </h4>
                            <p className={`text-sm font-semibold ${isBusiness ? 'text-teal-400' : 'text-teal-600'}`}>
                              {promotionModal.selectedProduct.price.toLocaleString('ro-RO')} {promotionModal.selectedProduct.currency || 'LEI'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Plan Summary */}
                        <div className={`p-4 rounded-xl ${isBusiness ? 'bg-teal-500/10 border border-teal-500/20' : 'bg-teal-50 border border-teal-100'}`}>
                          <h4 className={`font-semibold mb-2 ${isBusiness ? 'text-teal-400' : 'text-teal-700'}`}>
                            Rezumat Plan {promotionModal.selectedPlan?.name}
                          </h4>
                          <div className={`space-y-1 text-sm ${isBusiness ? 'text-slate-300' : 'text-gray-600'}`}>
                            <div className="flex justify-between">
                              <span>Durată:</span>
                              <span className="font-medium">{promotionModal.selectedPlan?.duration} {promotionModal.selectedPlan?.duration === 1 ? 'zi' : 'zile'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Badge:</span>
                              <span className="font-medium">{promotionModal.selectedPlan?.badge}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-dashed border-teal-500/30">
                              <span className="font-semibold">Total:</span>
                              <span className="font-bold text-lg">{promotionModal.selectedPlan?.price} lei</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Billing Information */}
                        <div className={`p-4 rounded-xl ${isBusiness ? 'bg-slate-700/50 border border-slate-600' : 'bg-gray-50 border border-gray-200'}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Receipt className={`w-4 h-4 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`} />
                            <h4 className={`font-semibold text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                              Date facturare
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              userProfile.accountType === 'business'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {userProfile.accountType === 'business' ? 'Persoană Juridică' : 'Persoană Fizică'}
                            </span>
                          </div>
                          
                          <div className={`space-y-2 text-sm ${isBusiness ? 'text-slate-300' : 'text-gray-600'}`}>
                            {userProfile.accountType === 'business' ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Denumire:</span>
                                  <span className="font-medium">{userProfile.businessName || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">CUI:</span>
                                  <span className="font-medium">{userProfile.cui || '-'}</span>
                                </div>
                                {userProfile.nrRegistruComert && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Reg. Com.:</span>
                                    <span className="font-medium">{userProfile.nrRegistruComert}</span>
                                  </div>
                                )}
                                {userProfile.adresaSediu && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Adresă:</span>
                                    <span className="font-medium text-right max-w-[200px]">
                                      {[userProfile.adresaSediu, userProfile.oras, userProfile.judet].filter(Boolean).join(', ')}
                                    </span>
                                  </div>
                                )}
                                {userProfile.emailFirma && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Email:</span>
                                    <span className="font-medium">{userProfile.emailFirma}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Nume:</span>
                                  <span className="font-medium">{userProfile.displayName || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Email:</span>
                                  <span className="font-medium">{userProfile.email || '-'}</span>
                                </div>
                                {userProfile.location && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Localitate:</span>
                                    <span className="font-medium">{userProfile.location}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          
                          {userProfile.accountType === 'business' && (!userProfile.businessName || !userProfile.cui) && (
                            <div className={`mt-3 p-2 rounded-lg text-xs flex items-center gap-2 ${
                              isBusiness ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
                            }`}>
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              Completează datele firmei în secțiunea &quot;Datele mele&quot; pentru facturi complete.
                            </div>
                          )}
                        </div>
                        
                        {/* Error message */}
                        {promotionError && (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {promotionError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Modal Footer */}
                  <div className={`p-4 sm:p-6 border-t ${isBusiness ? 'border-slate-700' : 'border-gray-200'}`}>
                    <div className="flex gap-3">
                      {promotionModal.step === 'confirm' && (
                        <button
                          onClick={() => setPromotionModal(prev => ({ ...prev, step: 'select-product', selectedProduct: null }))}
                          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                            isBusiness ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Înapoi
                        </button>
                      )}
                      <button
                        onClick={promotionModal.step === 'confirm' ? handlePromoteProduct : () => {}}
                        disabled={
                          promotionModal.step === 'select-product' || 
                          !promotionModal.selectedProduct || 
                          promotingProduct
                        }
                        className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          promotionModal.step === 'confirm' 
                            ? 'bg-teal-500 text-white hover:bg-teal-600'
                            : isBusiness ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {promotingProduct ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Se procesează...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Confirmă și Plătește
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== SETTINGS ========== */}
            {activeView === 'settings' && (
              <div className={`rounded-xl sm:rounded-2xl overflow-hidden ${isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                <div className={`p-4 sm:p-6 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-200'}`}>
                  <h2 className={`text-lg sm:text-xl font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Setări</h2>
                  <p className={`text-sm mt-1 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Gestionează preferințele și securitatea contului tău</p>
                </div>
                
                <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">

                  {/* Theme Selection */}
                  <div>
                    <h3 className={`flex items-center gap-2 font-semibold text-sm sm:text-base mb-4 sm:mb-6 ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                      <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                      Aspect Card Produs
                    </h3>
                    <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Alege stilul de afișare pentru anunțurile din platformă.</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {/* DESIGN 6: Social Market (Vinted Style) */}
                        <div 
                           onClick={() => setSelectedCardTheme(6)}
                           className={`group border border-gray-100/50 bg-white rounded-xl p-1.5 cursor-pointer transition-all duration-300 ring-2 ${selectedCardTheme === 6 ? 'ring-[#13C1AC]' : 'ring-transparent'} relative`}
                        >
                           {selectedCardTheme === 6 && (
                            <div className="absolute top-2 right-2 z-20">
                              <div className="bg-[#13C1AC] text-white p-1 rounded-full shadow-md">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            </div>
                           )}
                           <div className="aspect-[3/4] rounded-lg overflow-hidden relative mb-1.5 bg-gray-50">
                                <img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80" alt="" className="w-full h-full object-cover" />
                                <div className="absolute bottom-1.5 left-1.5 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-full z-20">
                                   <span className="text-[8px] font-semibold text-white/90">1 / 4</span>
                                </div>
                           </div>
                           <div className="px-1">
                                <div className="flex justify-between items-start mb-0.5">
                                   <h4 className="text-sm font-bold text-gray-900">50 €</h4>
                                   <Heart className="w-4 h-4 text-gray-900 stroke-[1.5]" />
                                </div>
                                <h3 className="text-gray-500 text-xs leading-tight truncate font-normal">
                                  iPhone 7 rosa
                                </h3>
                           </div>
                           <div className="mt-2 text-center">
                             <span className="text-xs font-semibold text-[#13C1AC]">Vinted</span>
                             <span className="text-[10px] text-gray-400 ml-1">(#6)</span>
                           </div>
                        </div>

                        {/* DESIGN 7: Auto/Imobiliare (Detail Focused) */}
                        <div 
                           onClick={() => setSelectedCardTheme(7)}
                           className={`group bg-white rounded-xl border border-gray-300 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 ring-2 ${selectedCardTheme === 7 ? 'ring-[#13C1AC]' : 'ring-transparent'} relative`}
                        >
                           {selectedCardTheme === 7 && (
                            <div className="absolute top-2 right-2 z-20">
                              <div className="bg-[#13C1AC] text-white p-1 rounded-full shadow-md">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            </div>
                           )}
                           <div className="relative aspect-[4/3] bg-gray-100 border-b border-gray-100">
                                <img src="https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=500&q=80" alt="" className="w-full h-full object-cover" />
                           </div>
                           
                           <div className="p-2.5 flex flex-col">
                                <div className="flex justify-between items-start">
                                   <h4 className="text-base font-extrabold text-gray-900">27.500 €</h4>
                                   <Heart className="w-4 h-4 stroke-2 text-gray-400" />
                                </div>
                                <h3 className="text-gray-800 text-sm font-medium truncate">Audi Q3 2020</h3>
                                <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-semibold rounded mt-1.5 w-fit">Folosit</span>
                           </div>
                           <div className="py-2 text-center border-t border-gray-100">
                             <span className="text-xs font-semibold text-[#13C1AC]">Auto</span>
                             <span className="text-[10px] text-gray-400 ml-1">(#7)</span>
                           </div>
                        </div>

                        {/* DESIGN 8: Friendly Card (Requested) */}
                        <div 
                           onClick={() => setSelectedCardTheme(8)}
                           className={`group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 ring-2 ${selectedCardTheme === 8 ? 'ring-[#13C1AC]' : 'ring-transparent'} relative`}
                        >
                           {selectedCardTheme === 8 && (
                            <div className="absolute top-2 right-2 z-20">
                              <div className="bg-[#13C1AC] text-white p-1 rounded-full shadow-md">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            </div>
                           )}
                           <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md text-red-500">
                                  <Heart className="h-3.5 w-3.5 fill-current" />
                                </div>
                           </div>
                           <div className="p-2.5">
                             <h3 className="text-sm font-normal text-gray-900 truncate mb-2">iPhone 14 Pro Max</h3>
                             <div className="flex items-center justify-between">
                               <span className="text-sm font-bold text-gray-900">3.500 <span className="font-normal text-gray-400 text-xs">lei</span></span>
                               <span className="px-2 py-1 bg-[#13C1AC]/10 text-[#13C1AC] font-semibold rounded text-[10px]">Contactează</span>
                             </div>
                           </div>
                           <div className="py-2 text-center border-t border-gray-100">
                             <span className="text-xs font-semibold text-[#13C1AC]">Shop</span>
                             <span className="text-[10px] text-gray-400 ml-1">(#8)</span>
                           </div>
                        </div>

                        {/* DESIGN 9: Original Classic (vindel23 style) */}
                        <div 
                           onClick={() => setSelectedCardTheme(9)}
                           className={`group bg-white rounded-xl overflow-hidden cursor-pointer border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ring-2 ${selectedCardTheme === 9 ? 'ring-[#13C1AC]' : 'ring-transparent'} relative`}
                        >
                           {selectedCardTheme === 9 && (
                            <div className="absolute top-2 right-2 z-20">
                              <div className="bg-[#13C1AC] text-white p-1 rounded-full shadow-md">
                                <CheckCircle2 className="w-3 h-3" />
                              </div>
                            </div>
                           )}
                           <div className="relative h-32 bg-gray-100 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&q=80" alt="" className="w-full h-full object-cover" />
                                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 text-white text-[10px] font-semibold rounded backdrop-blur-sm">
                                    Reservat
                                </div>
                           </div>
                           <div className="p-2.5">
                             <p className="text-base font-bold text-gray-900 mb-0.5">4.500 Lei</p>
                             <p className="text-xs text-gray-700 truncate">MacBook Air M1</p>
                             <p className="text-[10px] text-gray-400 mt-1.5">București</p>
                           </div>
                           <div className="py-2 text-center border-t border-gray-100">
                             <span className="text-xs font-semibold text-[#13C1AC]">Clasic</span>
                             <span className="text-[10px] text-gray-400 ml-1">(#9)</span>
                           </div>
                        </div>
                    </div>
                  </div>

                  <hr className={isBusiness ? 'border-slate-700' : 'border-gray-200'} />

                  {/* ===== NOTIFICATIONS PREFERENCES ===== */}
                  <div>
                    <h3 className={`flex items-center gap-2 font-semibold text-sm sm:text-base mb-4 ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                      Preferințe Notificări
                    </h3>
                    <div className="space-y-3">
                      {[
                        { id: 'msg', label: 'Mesaje noi', desc: 'Primește notificări când primești un mesaj' },
                        { id: 'offers', label: 'Oferte și promoții', desc: 'Informații despre reduceri și campanii' },
                        { id: 'price', label: 'Alertă de preț', desc: 'Notifică-mă când prețul unui produs favorizat scade' },
                        { id: 'news', label: 'Noutăți platformă', desc: 'Funcționalități noi și actualizări' },
                        { id: 'email', label: 'Newsletter email', desc: 'Rezumat săptămânal cu cele mai bune oferte' },
                      ].map((setting) => (
                        <div key={setting.id} className={`flex items-center justify-between py-3 px-4 rounded-lg ${isBusiness ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                          <div>
                            <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>{setting.label}</p>
                            <p className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-500'}`}>{setting.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked={true} className="sr-only peer" />
                            <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#13C1AC] ${isBusiness ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr className={isBusiness ? 'border-slate-700' : 'border-gray-200'} />

                  {/* ===== PRIVACY ===== */}
                  <div>
                    <h3 className={`flex items-center gap-2 font-semibold text-sm sm:text-base mb-4 ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                      Confidențialitate
                    </h3>
                    <div className="space-y-3">
                      {[
                        { id: 'profileVisible', label: 'Profil public', desc: 'Permite altor utilizatori să vadă profilul tău. Dacă este dezactivat, doar urmăritorii tăi pot vedea profilul.' },
                        { id: 'showPhone', label: 'Afișează telefonul', desc: 'Afișează numărul de telefon în anunțuri' },
                        { id: 'showOnline', label: 'Status online', desc: 'Arată când ești activ pe platformă' },
                      ].map((setting) => (
                        <div key={setting.id} className={`flex items-center justify-between py-3 px-4 rounded-lg ${isBusiness ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                          <div className="flex-1 pr-4">
                            <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>{setting.label}</p>
                            <p className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-500'}`}>{setting.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input 
                              type="checkbox" 
                              checked={privacySettings[setting.id as keyof typeof privacySettings]} 
                              onChange={() => handlePrivacyToggle(setting.id)}
                              className="sr-only peer" 
                            />
                            <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#13C1AC] ${isBusiness ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Nota sobre perfil privado */}
                    {!privacySettings.profileVisible && (
                      <div className={`mt-4 p-3 rounded-lg ${isBusiness ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                        <p className={`text-xs ${isBusiness ? 'text-amber-400' : 'text-amber-700'}`}>
                          <Lock className="inline w-3.5 h-3.5 mr-1" />
                          Cu profilul privat, doar persoanele care te urmăresc pot vedea anunțurile tale și informațiile profilului.
                        </p>
                      </div>
                    )}
                  </div>

                  <hr className={isBusiness ? 'border-slate-700' : 'border-gray-200'} />

                  {/* ===== SECURITY ===== */}
                  <div>
                    <h3 className={`flex items-center gap-2 font-semibold text-sm sm:text-base mb-4 ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-[#13C1AC]" />
                      Securitate
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Change Password */}
                      <div className={`p-4 rounded-xl ${isBusiness ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Parolă</p>
                            <p className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-500'}`}>Ultima modificare: niciodată</p>
                          </div>
                          <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isBusiness 
                              ? 'bg-slate-600 text-white hover:bg-slate-500' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}>
                            Schimbă parola
                          </button>
                        </div>
                      </div>

                      {/* Two Factor Auth */}
                      <div className={`p-4 rounded-xl ${isBusiness ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Autentificare în 2 pași</p>
                            <p className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-500'}`}>Protejează-ți contul cu verificare suplimentară</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isBusiness ? 'bg-slate-600 text-slate-400' : 'bg-gray-200 text-gray-500'}`}>
                            În curând
                          </span>
                        </div>
                      </div>

                      {/* Active Sessions */}
                      <div className={`p-4 rounded-xl ${isBusiness ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Sesiuni active</p>
                            <p className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-500'}`}>Dispozitive conectate la contul tău</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${isBusiness ? 'bg-slate-600/50' : 'bg-white border border-gray-200'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBusiness ? 'bg-slate-500' : 'bg-gray-100'}`}>
                            <Monitor className={`w-5 h-5 ${isBusiness ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Acest dispozitiv</p>
                            <p className={`text-xs ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Activ acum • Chrome pe macOS</p>
                          </div>
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className={isBusiness ? 'border-slate-700' : 'border-gray-200'} />

                  {/* ===== SAVE BUTTON ===== */}
                  <div className="flex justify-end">
                    <button 
                      onClick={handleSavePrivacySettings}
                      disabled={savingPrivacy}
                      className="px-6 py-2.5 bg-[#13C1AC] text-white rounded-lg text-sm font-semibold hover:bg-[#0fa899] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingPrivacy ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Se salvează...
                        </>
                      ) : (
                        'Salvează modificările'
                      )}
                    </button>
                  </div>

                  <hr className={isBusiness ? 'border-slate-700' : 'border-gray-200'} />

                  {/* ===== DANGER ZONE ===== */}
                  <div className={`p-4 rounded-xl ${isBusiness ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
                    <h3 className="font-semibold text-red-500 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Zonă periculoasă
                    </h3>
                    <p className={`text-sm mb-4 ${isBusiness ? 'text-slate-400' : 'text-gray-600'}`}>
                      Aceste acțiuni sunt permanente și nu pot fi anulate.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isBusiness 
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}>
                        Dezactivează contul
                      </button>
                      <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                        Șterge contul definitiv
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== NOTIFICATIONS ========== */}
            {activeView === 'notifications' && (
              <div className={`rounded-xl sm:rounded-2xl overflow-hidden ${isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                <div className={`p-4 sm:p-6 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-200'} flex justify-between items-center`}>
                  <h2 className={`text-lg sm:text-xl font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Notificări</h2>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className={`text-sm font-medium ${isBusiness ? 'text-teal-400 hover:text-teal-300' : 'text-[#13C1AC] hover:text-[#0da896]'}`}
                    >
                      Marchează toate ca citite
                    </button>
                  )}
                </div>
                
                <div className="divide-y divide-gray-100">
                  {/* Solo mostrar loader si está cargando Y no hay datos en caché */}
                  {notificationsLoading && notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                      <p className="mt-2 text-gray-500">Se încarcă notificările...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className={`w-12 h-12 mx-auto mb-3 ${isBusiness ? 'text-slate-600' : 'text-gray-300'}`} />
                      <p className={`font-medium ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Nu ai notificări</p>
                      <p className={`text-sm mt-1 ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`}>Vei primi notificări când cineva interacționează cu anunțurile tale.</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-4 sm:p-5 flex gap-4 transition-colors cursor-pointer ${
                          notification.read 
                            ? (isBusiness ? 'bg-slate-800' : 'bg-white') 
                            : (isBusiness ? 'bg-slate-700/50' : 'bg-blue-50/50')
                        } hover:${isBusiness ? 'bg-slate-700' : 'bg-gray-50'}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Icon based on type */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === 'report_received' 
                            ? 'bg-orange-100 text-orange-600' 
                            : notification.type === 'report_resolved'
                            ? 'bg-green-100 text-green-600'
                            : notification.type === 'product_approved'
                            ? 'bg-emerald-100 text-emerald-600'
                            : notification.type === 'product_rejected'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {notification.type === 'report_received' && <Flag className="w-5 h-5" />}
                          {notification.type === 'report_resolved' && <CheckCircle2 className="w-5 h-5" />}
                          {notification.type === 'product_approved' && <CheckCircle2 className="w-5 h-5" />}
                          {notification.type === 'product_rejected' && <Ban className="w-5 h-5" />}
                          {notification.type === 'new_message' && <Bell className="w-5 h-5" />}
                          {notification.type === 'system' && <Bell className="w-5 h-5" />}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-semibold text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                                {notification.title}
                                {!notification.read && (
                                  <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </p>
                              <p className={`text-sm mt-0.5 ${isBusiness ? 'text-slate-400' : 'text-gray-600'}`}>
                                {notification.message}
                              </p>
                            </div>
                            {notification.metadata?.productImage && (
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                <Image 
                                  src={notification.metadata.productImage} 
                                  alt="" 
                                  width={48} 
                                  height={48} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-2">
                            <div className="flex items-center gap-2">
                              <Clock className={`w-3.5 h-3.5 ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`} />
                              <span className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`}>
                                {notification.createdAt?.seconds 
                                  ? new Date(notification.createdAt.seconds * 1000).toLocaleDateString('ro-RO', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'Acum'
                                }
                              </span>
                              {notification.link && (
                                <>
                                  <span className={`${isBusiness ? 'text-slate-600' : 'text-gray-300'}`}>•</span>
                                  <span className={`text-xs flex items-center gap-1 ${isBusiness ? 'text-teal-400' : 'text-[#13C1AC]'}`}>
                                    Vezi detalii <ExternalLink className="w-3 h-3" />
                                  </span>
                                </>
                              )}
                            </div>
                            <button
                              onClick={(e) => notification.id && handleDeleteNotification(e, notification.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isBusiness 
                                  ? 'text-slate-500 hover:text-red-400 hover:bg-slate-700' 
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                              title="Șterge notificarea"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ========== SUPPORT ========== */}
            {activeView === 'support' && (
              <div className={`rounded-xl sm:rounded-2xl overflow-hidden ${isBusiness ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                <div className={`p-4 sm:p-6 border-b ${isBusiness ? 'border-slate-700' : 'border-gray-200'}`}>
                  <h2 className={`text-lg sm:text-xl font-bold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>Suport</h2>
                  <p className={`text-sm mt-1 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                    Contactează echipa de suport sau vezi tichetele tale
                  </p>
                </div>
                
                <div className="p-4 sm:p-6 space-y-4">
                  {/* New Ticket CTA */}
                  <Link
                    href="/contact"
                    className={`block p-5 rounded-xl border-2 border-dashed transition-all hover:scale-[1.01] ${
                      isBusiness 
                        ? 'border-slate-600 hover:border-teal-500 bg-slate-700/30' 
                        : 'border-gray-200 hover:border-[#13C1AC] bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isBusiness ? 'bg-teal-500/20' : 'bg-[#13C1AC]/10'}`}>
                        <HeadphonesIcon className={`w-6 h-6 ${isBusiness ? 'text-teal-400' : 'text-[#13C1AC]'}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                          Deschide un tichet nou
                        </p>
                        <p className={`text-sm ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                          Ai o întrebare sau o problemă? Suntem aici să te ajutăm.
                        </p>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`} />
                    </div>
                  </Link>

                  {/* Quick Links */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/ajutor"
                      className={`p-4 rounded-xl transition-colors ${
                        isBusiness 
                          ? 'bg-slate-700 hover:bg-slate-600' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                        Centru de ajutor
                      </p>
                      <p className={`text-xs mt-1 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                        Răspunsuri rapide
                      </p>
                    </Link>
                    <Link
                      href="/cum-sa-vinzi"
                      className={`p-4 rounded-xl transition-colors ${
                        isBusiness 
                          ? 'bg-slate-700 hover:bg-slate-600' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                        Cum să vinzi
                      </p>
                      <p className={`text-xs mt-1 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                        Ghid pentru vânzători
                      </p>
                    </Link>
                  </div>

                  {/* Info */}
                  <div className={`p-4 rounded-xl ${isBusiness ? 'bg-slate-700/50' : 'bg-blue-50'}`}>
                    <div className="flex items-start gap-3">
                      <Clock className={`w-5 h-5 mt-0.5 ${isBusiness ? 'text-teal-400' : 'text-blue-500'}`} />
                      <div>
                        <p className={`font-medium text-sm ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                          Timp mediu de răspuns: &lt; 24 ore
                        </p>
                        <p className={`text-xs mt-1 ${isBusiness ? 'text-slate-400' : 'text-gray-600'}`}>
                          Programul de suport: Luni - Vineri, 9:00 - 18:00
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User's Tickets */}
                  {supportTicketsLoading ? (
                    <div className="py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                      <p className={`text-sm mt-2 ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>Se încarcă tichetele...</p>
                    </div>
                  ) : supportTickets.length > 0 && (
                    <div className="space-y-3">
                      <h3 className={`font-semibold text-sm ${isBusiness ? 'text-slate-300' : 'text-gray-700'}`}>
                        Tichetele tale ({supportTickets.length})
                      </h3>
                      {supportTickets.map((ticket) => (
                        <Link
                          key={ticket.id}
                          href={`/suport/${ticket.id}`}
                          className={`block p-4 rounded-xl transition-all hover:scale-[1.01] ${
                            isBusiness 
                              ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600' 
                              : 'bg-white border border-gray-200 hover:border-[#13C1AC]/50 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className={`font-medium ${isBusiness ? 'text-white' : 'text-gray-900'}`}>
                              {ticket.subject}
                            </p>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                              ticket.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
                              ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {STATUS_LABELS[ticket.status]}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${isBusiness ? 'text-slate-400' : 'text-gray-500'}`}>
                              {CATEGORY_LABELS[ticket.category]}
                            </span>
                            <span className={`text-xs ${isBusiness ? 'text-slate-500' : 'text-gray-400'}`}>
                              {ticket.updatedAt.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Modal Marcar como Vendido con Valoración */}
      {soldModal.show && soldModal.product && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSoldModal({ show: false, product: null, buyerName: '', buyerId: '', rating: 5, review: '', potentialBuyers: [], loadingBuyers: false })}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header verde */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Felicitări pentru vânzare! 🎉</h3>
                  <p className="text-green-100 text-sm truncate max-w-[250px]">{soldModal.product.title}</p>
                </div>
              </div>
            </div>
            
            {/* Contenido */}
            <div className="p-6 space-y-5">
              {/* Seleccionar comprador del chat */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Selectează cumpărătorul
                </label>
                
                {soldModal.loadingBuyers ? (
                  <div className="flex items-center gap-2 text-gray-500 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Se încarcă conversațiile...</span>
                  </div>
                ) : soldModal.potentialBuyers.length > 0 ? (
                  <div className="space-y-2">
                    {soldModal.potentialBuyers.map((buyer) => (
                      <button
                        key={buyer.id}
                        type="button"
                        onClick={() => setSoldModal(prev => ({ 
                          ...prev, 
                          buyerId: buyer.id, 
                          buyerName: buyer.name 
                        }))}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          soldModal.buyerId === buyer.id 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {buyer.avatar ? (
                          <img src={buyer.avatar} alt={buyer.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                            <span className="text-white font-bold">{buyer.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{buyer.name}</span>
                        {soldModal.buyerId === buyer.id && (
                          <Check className="w-5 h-5 text-green-500 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-xl">
                    <p className="text-sm">Nu ai conversații pentru acest produs.</p>
                    <p className="text-xs mt-1">Poți introduce manual numele cumpărătorului mai jos.</p>
                  </div>
                )}
                
                {/* Campo manual si no hay compradores o quiere escribir otro */}
                <div className="mt-3">
                  <input
                    type="text"
                    value={soldModal.buyerName}
                    onChange={(e) => setSoldModal(prev => ({ ...prev, buyerName: e.target.value, buyerId: '' }))}
                    placeholder={soldModal.potentialBuyers.length > 0 ? "Sau scrie alt nume..." : "ex: Maria Popescu"}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Rating con estrellas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Evaluează cumpărătorul
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSoldModal(prev => ({ ...prev, rating: star }))}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-8 h-8 ${star <= soldModal.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    {soldModal.rating === 5 && 'Excelent'}
                    {soldModal.rating === 4 && 'Foarte bun'}
                    {soldModal.rating === 3 && 'Bun'}
                    {soldModal.rating === 2 && 'Satisfăcător'}
                    {soldModal.rating === 1 && 'Slab'}
                  </span>
                </div>
              </div>

              {/* Recenzie */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recenzie (opțional)
                </label>
                <textarea
                  value={soldModal.review}
                  onChange={(e) => setSoldModal(prev => ({ ...prev, review: e.target.value }))}
                  placeholder="Spune-ne cum a fost experiența cu cumpărătorul..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs text-green-800">
                  <strong>💚 Mulțumim!</strong> Recenzia ta ajută comunitatea să aibă tranzacții mai sigure.
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setSoldModal({ show: false, product: null, buyerName: '', buyerId: '', rating: 5, review: '', potentialBuyers: [], loadingBuyers: false })}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Anulează
              </button>
              <button
                onClick={handleConfirmSold}
                disabled={markingSold}
                className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {markingSold ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Se procesează...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Marchează vândut
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Motivo de Rechazo */}
      {rejectionModal.show && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setRejectionModal({ show: false, reason: '', productTitle: '' })}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con gradiente rojo */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Ban className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Anunț Respins</h3>
                  <p className="text-red-100 text-sm truncate max-w-[250px]">{rejectionModal.productTitle}</p>
                </div>
              </div>
            </div>
            
            {/* Contenido */}
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Motivul respingerii:</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{rejectionModal.reason}</p>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                <p className="text-xs text-amber-800">
                  <strong>💡 Sugestie:</strong> Poți edita anunțul pentru a-l face conform regulilor și îl poți republica.
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setRejectionModal({ show: false, reason: '', productTitle: '' })}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
              >
                Am înțeles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE FLOATING MENU BUTTON ===== */}
      {!mobileMenuOpen && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-3 font-semibold rounded-full shadow-lg active:scale-95 transition-all ${
            isBusiness 
              ? 'bg-teal-500 text-white shadow-teal-500/30 hover:bg-teal-400' 
              : 'bg-[#13C1AC] text-white shadow-[#13C1AC]/30 hover:bg-[#0da896]'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>{menuItems.find(item => item.id === activeView)?.label || 'Meniu'}</span>
        </button>
      )}
    </div>
  );
}
