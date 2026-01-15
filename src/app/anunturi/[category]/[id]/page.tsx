'use client';

import { Heart, Share2, Eye, Flag, MessageCircle, MapPin, ShieldCheck, ChevronLeft, ChevronRight, Tag, Gauge, Ruler, Calendar, Hash, Car, CircleDot, Package, Settings, Zap, Thermometer, Clock, CheckCircle, Info, X, Home, Bed, Bath, Building, Sofa, Waves, ParkingCircle, Trees, Star, Sparkles, AlertTriangle, Truck, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getProducts, Product, incrementProductViews } from '@/lib/products-service';
import { getOrCreateConversation } from '@/lib/messages-service';
import { toggleFavorite } from '@/lib/favorites-service';
import { useAuth } from '@/lib/auth-context';
import ProductCard from '@/components/ProductCard';
import { extractIdFromSlug } from '@/lib/slugs';
import { useProduct, useUserProducts, useUserProfile, useUserFavorites } from '@/lib/swr-hooks';

// Helper para obtener info de condición
const getConditionInfo = (condition?: string): { label: string; color: string; icon: any } | null => {
  if (!condition) return null;
  const conditions: Record<string, { label: string; color: string; icon: any }> = {
    // Valores antiguos (compatibilidad)
    'new': { label: 'Nou', color: 'bg-emerald-500 text-white', icon: Star },
    'like-new': { label: 'Ca nou', color: 'bg-cyan-500 text-white', icon: Sparkles },
    'good': { label: 'Bună stare', color: 'bg-blue-500 text-white', icon: CheckCircle },
    'fair': { label: 'Folosit', color: 'bg-gray-500 text-white', icon: CheckCircle },
    // Electronice / Gaming
    'nou-sigilat': { label: 'Sigilat', color: 'bg-emerald-500 text-white', icon: Package },
    'nou-desigilat': { label: 'Nou', color: 'bg-blue-500 text-white', icon: Star },
    'ca-nou': { label: 'Ca nou', color: 'bg-cyan-500 text-white', icon: Sparkles },
    'folosit-functional': { label: 'Folosit', color: 'bg-gray-500 text-white', icon: CheckCircle },
    'defect': { label: 'Defect', color: 'bg-orange-500 text-white', icon: AlertTriangle },
    // General
    'nou': { label: 'Nou', color: 'bg-emerald-500 text-white', icon: Star },
    'folosit': { label: 'Folosit', color: 'bg-gray-500 text-white', icon: CheckCircle },
    // Auto-moto
    'accidentat': { label: 'Accidentat', color: 'bg-red-500 text-white', icon: AlertTriangle },
    'pentru-piese': { label: 'Pentru piese', color: 'bg-orange-500 text-white', icon: AlertTriangle },
    // Modă / Copii
    'nou-eticheta': { label: 'Nou cu etichetă', color: 'bg-emerald-500 text-white', icon: Package },
    'nou-fara-eticheta': { label: 'Nou', color: 'bg-blue-500 text-white', icon: Star },
    'vintage': { label: 'Vintage', color: 'bg-amber-600 text-white', icon: Clock },
    // Casă & Grădină
    'renovat': { label: 'Recondiționat', color: 'bg-indigo-500 text-white', icon: Sparkles },
    // Animale
    'disponibil': { label: 'Disponibil', color: 'bg-green-500 text-white', icon: CheckCircle },
    'rezervat': { label: 'Rezervat', color: 'bg-yellow-500 text-white', icon: Clock },
  };
  return conditions[condition] || null;
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const productId = params?.id ? extractIdFromSlug(params.id as string) : null;
  
  // SWR para producto - carga instantánea si está en caché
  const { data: product, isLoading: loading } = useProduct(productId);
  
  // SWR para productos del vendedor - solo cargar cuando tengamos el producto
  const { data: allSellerProducts } = useUserProducts(product?.sellerId || null);
  const sellerProducts = allSellerProducts?.filter(p => p.id !== product?.id).slice(0, 5) || [];
  
  // SWR para perfil del vendedor - usar datos del producto mientras tanto
  const { data: sellerProfile } = useUserProfile(product?.sellerId || null);
  const sellerAvatar = sellerProfile?.photoURL || product?.seller?.avatar;
  
  // SWR para favoritos del usuario
  const { data: favoriteIds, mutate: mutateFavorites } = useUserFavorites(user?.uid || null);
  const isFavorited = productId ? favoriteIds?.includes(productId) || false : false;
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasTrackedView = useRef(false);
  
  // Handle favorite toggle
  const handleFavoriteClick = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!productId) return;
    
    setIsFavoriteLoading(true);
    try {
      const newIsFavorited = await toggleFavorite(user.uid, productId);
      if (newIsFavorited) {
        mutateFavorites([...(favoriteIds || []), productId], false);
      } else {
        mutateFavorites(favoriteIds?.filter(id => id !== productId) || [], false);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsFavoriteLoading(false);
    }
  }, [user, productId, favoriteIds, mutateFavorites, router]);

  // Calcular imágenes (necesario antes del useEffect)
  const images = product ? (product.images && product.images.length > 0 ? product.images : [product.image]) : [];

  // Precargar todas las imágenes en segundo plano
  useEffect(() => {
    if (images.length <= 1) return;
    
    // Preload remaining images after first one
    const preloadImages = () => {
      images.slice(1).forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };
    
    // Delay slightly to not block first paint
    const timer = setTimeout(preloadImages, 100);
    return () => clearTimeout(timer);
  }, [images]);

  useEffect(() => {
    // Force scroll to top when entering the page to ensure full visibility
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Dynamic Title for SEO & UX
    if (product) {
      document.title = `${product.title} | Vindel`;
      
      // Incrementar visitas únicas
      if (!hasTrackedView.current && product.sellerId !== user?.uid) {
        hasTrackedView.current = true;
        incrementProductViews(product.id, user?.uid).catch(console.error);
      }
    }
  }, [product, user?.uid]);

  if (loading) {
    return (
        <div className="bg-gray-50 min-h-screen pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Skeleton Breadcrumb */}
            <div className="flex mb-6 gap-2">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column Skeleton */}
              <div className="lg:col-span-2 space-y-6">
                {/* Image Skeleton */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
                  <div className="p-4 flex gap-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-14 h-14 bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
                
                {/* Description Skeleton */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-4 w-4/6 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Right Column Skeleton */}
              <div className="space-y-6">
                {/* Price Card Skeleton */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="flex gap-2 mb-6">
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="h-12 w-full bg-[#13C1AC]/20 rounded-xl animate-pulse"></div>
                </div>

                {/* Seller Card Skeleton */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  }

  if (!product) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Anunț negăsit</h1>
            <Link href="/" className="text-[#13C1AC] hover:underline">
                Înapoi la pagina principală
            </Link>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-delay-100 { animation-delay: 0.1s; opacity: 0; }
        .animate-delay-200 { animation-delay: 0.2s; opacity: 0; }
        .animate-delay-300 { animation-delay: 0.3s; opacity: 0; }
        .animate-delay-400 { animation-delay: 0.4s; opacity: 0; }
      `}</style>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500 animate-fadeInUp">
            <Link href="/" className="hover:text-[#13C1AC]">Acasă</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column: Images & Description */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                
                {/* Image Gallery - Ultra Fast */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fadeInUp animate-delay-100">
                  {/* Main Image */}
                  <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-gray-100">
                    {/* First image always visible and eager loaded */}
                    <img 
                      src={images[0]} 
                      alt={product.title}
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ display: currentImageIndex === 0 ? 'block' : 'none' }}
                      loading="eager"
                      decoding="sync"
                      fetchPriority="high"
                    />
                    {/* Other images loaded in background */}
                    {images.slice(1).map((src, idx) => (
                      <img 
                        key={idx + 1}
                        src={src} 
                        alt={product.title}
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{ display: idx + 1 === currentImageIndex ? 'block' : 'none' }}
                        loading="eager"
                        decoding="async"
                      />
                    ))}
                    
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex(currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1)}
                          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-all"
                        >
                          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex(currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1)}
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-all"
                        >
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                    
                    {/* Action buttons */}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1.5 sm:gap-2">
                      <button 
                        onClick={handleFavoriteClick}
                        disabled={isFavoriteLoading}
                        className={`p-1.5 sm:p-2 rounded-full shadow-md transition-all ${isFavorited ? 'bg-red-500 text-white' : 'bg-white/90 hover:bg-white text-gray-600'} ${isFavoriteLoading ? 'opacity-50' : ''}`}
                      >
                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorited ? 'fill-current' : ''}`} />
                      </button>
                      <button className="p-1.5 sm:p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-all">
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      </button>
                    </div>
                    
                    {/* Views counter */}
                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-black/70 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {product.views || 0}
                    </div>
                  </div>

                  {/* Thumbnails - click or hover to change */}
                  {images.length > 1 && (
                    <div className="flex gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-gray-50 border-t border-gray-100 overflow-x-auto scrollbar-none">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          onMouseEnter={() => setCurrentImageIndex(idx)}
                          className={`relative w-11 h-11 sm:w-14 sm:h-14 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                            currentImageIndex === idx 
                              ? 'border-[#13C1AC]' 
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`Imagine ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description Card */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 animate-fadeInUp animate-delay-200">
                     <h2 className="description-text text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Descriere</h2>
                     <p className="description-text text-sm sm:text-base text-gray-600 whitespace-pre-line leading-relaxed">
                        {product.description}
                     </p>
                     
                     {/* Separator and footer */}
                     <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                          <div className="flex items-center gap-2 sm:gap-4">
                            {/* Ref Badge */}
                            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-50 rounded-lg">
                              <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
                              <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{product.id.toString().slice(0, 8)}</span>
                            </div>
                            
                            {/* Report Button */}
                            <button className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200">
                              <Flag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>Raportează</span>
                            </button>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-lg">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] sm:text-xs text-emerald-600 font-medium">Activ</span>
                          </div>
                        </div>
                     </div>
                </div>

                {/* Detalii / Caracteristici Card */}
                {product.customFields && Object.keys(product.customFields).length > 0 && (
                  <div className="relative rounded-xl shadow-sm overflow-hidden description-text animate-fadeInUp animate-delay-300">
                    {/* Fondo con ondas elegante */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-gray-50">
                      <svg className="absolute bottom-0 left-0 w-full h-24 text-[#13C1AC]/5" viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,101.3C1248,96,1344,64,1392,48L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"/>
                      </svg>
                      <svg className="absolute top-0 right-0 w-full h-20 text-[#13C1AC]/5 rotate-180" viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <path fill="currentColor" d="M0,32L60,37.3C120,43,240,53,360,69.3C480,85,600,107,720,101.3C840,96,960,64,1080,58.7C1200,53,1320,75,1380,85.3L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"/>
                      </svg>
                    </div>
                    
                    {/* Grid tabla simple */}
                    <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                      {Object.entries(product.customFields)
                        .filter(([key]) => key !== 'stareTehnica' && key !== 'stare')
                        .sort(([keyA], [keyB]) => {
                          // Ordenar: marca primero, luego model, después el resto
                          const order = ['marca', 'marcaAnvelopa', 'marcaJanta', 'model', 'tip', 'tipMoto', 'tipAnvelopa', 'tipJanta'];
                          const indexA = order.indexOf(keyA);
                          const indexB = order.indexOf(keyB);
                          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                          if (indexA !== -1) return -1;
                          if (indexB !== -1) return 1;
                          return 0;
                        })
                        .map(([key, value], idx, arr) => {
                        const fieldLabels: Record<string, string> = {
                          // Auto
                          'marca': 'Marcă', 'model': 'Model', 'anFabricatie': 'An fabricație',
                          'km': 'Kilometraj', 'combustibil': 'Combustibil', 'capacitate': 'Capacitate cilindrică',
                          'putere': 'Putere', 'cutie': 'Cutie de viteze', 'tractiune': 'Tracțiune',
                          'caroserie': 'Caroserie', 'culoare': 'Culoare', 'nrUsi': 'Număr uși',
                          'normaEuro': 'Normă poluare', 'vin': 'Serie șasiu (VIN)',
                          'inmatriculat': 'Înmatriculat RO', 'serviceBook': 'Carte service',
                          'primaInmatriculare': 'Prima înmatriculare',
                          // Moto
                          'tipMoto': 'Tip',
                          // Anvelope
                          'tipAnvelopa': 'Tip anvelopă', 'marcaAnvelopa': 'Marcă',
                          'latime': 'Lățime', 'inaltime': 'Înălțime profil', 'diametru': 'Diametru jantă',
                          'dimensiuneCompleta': 'Dimensiune completă', 'indiceIncarcatura': 'Indice de încărcătură',
                          'indiceViteza': 'Indice viteză', 'dotAnvelopa': 'DOT (data fabricație)', 'uzura': 'Uzură',
                          'bucati': 'Bucăți', 'runflat': 'Run Flat', 'ranforsat': 'Ranforsat (XL)',
                          'tipVehicul': 'Tip vehicul',
                          // Jante
                          'tipJanta': 'Tip jantă', 'marcaJanta': 'Marcă jantă', 'diametruJanta': 'Diametru',
                          'latimeJanta': 'Lățime (J)', 'et': 'ET (Offset)', 'pcd': 'PCD (găuri)',
                          'diametruCentral': 'Diametru central', 'stareJanta': 'Stare', 'bucatiJante': 'Bucăți',
                          'cuAnvelope': 'Cu anvelope', 'marcaAuto': 'Compatibil marcă', 'modelCompatibil': 'Modele compatibile',
                          // Piese
                          'categoriePiesa': 'Categorie piesă', 'tipPiesa': 'Tip piesă',
                          'compatibilitate': 'Compatibilitate', 'modelAuto': 'Model auto',
                          'codPiesa': 'Cod piesă / OEM', 'garantie': 'Garanție', 'producator': 'Producător',
                          // Imobiliare
                          'tipProprietate': 'Tip proprietate', 'suprafata': 'Suprafață',
                          'camere': 'Număr camere', 'bai': 'Băi', 'etaj': 'Etaj',
                          'anConstructie': 'An construcție', 'mobilat': 'Mobilat', 'parcare': 'Parcare',
                          'balcon': 'Balcon', 'terasa': 'Terasă', 'gradina': 'Grădină',
                          // Electronice
                          'stare': 'Stare', 'marime': 'Mărime',
                          // Transport/Utilaje
                          'tipTransport': 'Tip transport', 'tipUtilaj': 'Tip utilaj', 'oreFunc': 'Ore funcționare',
                          'tipRulota': 'Tip', 'locuri': 'Număr locuri', 'tipBarca': 'Tip', 'lungime': 'Lungime', 'motor': 'Motorizare',
                          // Joburi
                          'tipOferta': 'Tip ofertă', 'pozitie': 'Poziție', 'tipContract': 'Tip contract',
                          'nivelExperienta': 'Experiență', 'salariu': 'Salariu',
                        };
                        
                        const getLabel = (fieldKey: string): string => {
                          return fieldLabels[fieldKey] || fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        };
                        
                        const getIcon = (fieldKey: string) => {
                          const k = fieldKey.toLowerCase();
                          // Auto
                          if (k === 'km') return <Gauge className="w-3.5 h-3.5" />;
                          if (k === 'combustibil') return <Zap className="w-3.5 h-3.5" />;
                          if (k === 'putere' || k === 'capacitate') return <Gauge className="w-3.5 h-3.5" />;
                          if (k === 'cutie') return <Settings className="w-3.5 h-3.5" />;
                          if (k.includes('an') || k === 'primainmatriculare') return <Calendar className="w-3.5 h-3.5" />;
                          if (k.includes('marca') || k === 'model' || k === 'producator') return <Tag className="w-3.5 h-3.5" />;
                          if (k.includes('culoare')) return <CircleDot className="w-3.5 h-3.5" />;
                          if (k.includes('caroserie') || k.includes('tractiune') || k === 'tipmoto') return <Car className="w-3.5 h-3.5" />;
                          if (k === 'nrusi' || k.includes('usi')) return <Home className="w-3.5 h-3.5" />;
                          if (k === 'vin' || k.includes('cod')) return <Hash className="w-3.5 h-3.5" />;
                          if (k.includes('inmatriculat') || k === 'servicebook') return <CheckCircle className="w-3.5 h-3.5" />;
                          // Imobiliare
                          if (k.includes('camere')) return <Bed className="w-3.5 h-3.5" />;
                          if (k.includes('suprafata')) return <Ruler className="w-3.5 h-3.5" />;
                          if (k === 'bai') return <Bath className="w-3.5 h-3.5" />;
                          if (k === 'etaj') return <Building className="w-3.5 h-3.5" />;
                          if (k === 'mobilat') return <Sofa className="w-3.5 h-3.5" />;
                          if (k === 'parcare') return <ParkingCircle className="w-3.5 h-3.5" />;
                          if (k === 'gradina' || k === 'terasa') return <Trees className="w-3.5 h-3.5" />;
                          // Anvelope/Jante
                          if (k.includes('anvelopa') || k.includes('janta') || k.includes('diametru') || k.includes('latime') || k.includes('inaltime')) return <CircleDot className="w-3.5 h-3.5" />;
                          if (k === 'bucati' || k === 'bucatijante') return <Package className="w-3.5 h-3.5" />;
                          if (k === 'uzura' || k === 'starejanta') return <Info className="w-3.5 h-3.5" />;
                          // Default
                          return <Info className="w-3.5 h-3.5" />;
                        };
                        
                        // Calcular bordes
                        const cols = 4; // en desktop
                        const isLastInRow = (idx + 1) % cols === 0;
                        const totalRows = Math.ceil(arr.length / cols);
                        const currentRow = Math.floor(idx / cols);
                        const isLastRow = currentRow === totalRows - 1;
                        
                        return (
                          <div 
                            key={key} 
                            className={`px-2.5 sm:px-4 py-2.5 sm:py-3.5 
                              ${!isLastInRow ? 'border-r border-gray-200/50' : ''} 
                              ${!isLastRow ? 'border-b border-gray-200/50' : ''}
                            `}
                          >
                            <div className="flex items-center gap-1 sm:gap-1.5 text-[#13C1AC] text-[10px] sm:text-xs mb-0.5 sm:mb-1">
                              {getIcon(key)}
                              <span className="text-gray-400 truncate">{getLabel(key)}</span>
                            </div>
                            <div className="text-gray-800 font-semibold text-xs sm:text-sm truncate">{value as string}</div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Fila separada para Stare tehnica - con badges elegantes */}
                    {(product.customFields.stareTehnica || product.customFields.stare) && (
                      <div className="relative border-t border-gray-200/50 px-2.5 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center gap-1.5 text-[#13C1AC] text-[10px] sm:text-xs mb-2">
                          <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="text-gray-400">Stare tehnică</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {((product.customFields.stareTehnica || product.customFields.stare) as string)
                            .split(',')
                            .map((item, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 text-emerald-700 text-xs sm:text-sm font-medium rounded-full"
                              >
                                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {item.trim().replace(/-/g, ' ')}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Información básica cuando no hay customFields */}
                {(!product.customFields || Object.keys(product.customFields).length === 0) && (
                  <div className="relative rounded-xl shadow-sm overflow-hidden description-text">
                    {/* Fondo con ondas elegante */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-gray-50">
                      <svg className="absolute bottom-0 left-0 w-full h-24 text-[#13C1AC]/5" viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <path fill="currentColor" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,101.3C1248,96,1344,64,1392,48L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"/>
                      </svg>
                      <svg className="absolute top-0 right-0 w-full h-20 text-[#13C1AC]/5 rotate-180" viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <path fill="currentColor" d="M0,32L60,37.3C120,43,240,53,360,69.3C480,85,600,107,720,101.3C840,96,960,64,1080,58.7C1200,53,1320,75,1380,85.3L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"/>
                      </svg>
                    </div>
                    <div className="relative grid grid-cols-2 md:grid-cols-4">
                      <div className="px-4 py-3.5 border-r border-gray-100/50 border-b md:border-b-0">
                        <div className="text-gray-400 text-xs mb-0.5">Categorie</div>
                        <div className="text-gray-800 font-semibold text-sm">{product.category}</div>
                      </div>
                      {product.subcategory && (
                        <div className="px-4 py-3.5 border-r border-gray-100/50 border-b md:border-b-0">
                          <div className="text-gray-400 text-xs mb-0.5">Subcategorie</div>
                          <div className="text-gray-800 font-semibold text-sm">{product.subcategory}</div>
                        </div>
                      )}
                      <div className="px-4 py-3.5 border-r border-gray-100/50">
                        <div className="text-gray-400 text-xs mb-0.5">Locație</div>
                        <div className="text-gray-800 font-semibold text-sm">{product.location}</div>
                      </div>
                      <div className="px-4 py-3.5">
                        <div className="text-gray-400 text-xs mb-0.5">Predare</div>
                        <div className={`font-semibold text-sm flex items-center gap-1.5 ${product.deliveryType === 'shipping' || product.deliveryType === 'both' ? 'text-purple-600' : 'text-gray-800'}`}>
                          {product.deliveryType === 'shipping' || product.deliveryType === 'both' ? <Truck className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                          {product.deliveryType === 'shipping' ? 'Livrare' : 
                           product.deliveryType === 'both' ? 'Personal + Livrare' : 
                           'Predare personală'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Right Column: Price & Seller Info */}
            <div className="space-y-4 sm:space-y-6">
                
                {/* Price Card */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 animate-fadeInUp animate-delay-100">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <h1 className="description-text text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex-1 mr-4 line-clamp-2">
                            {product.title}
                        </h1>
                    </div>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 sm:mb-3">
                        {product.price} {product.currency === 'EUR' ? '€' : 'lei'}
                    </div>
                    
                    {/* Condition & Negotiable Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                        {/* Condition badge */}
                        {getConditionInfo(product.condition) ? (() => {
                          const conditionInfo = getConditionInfo(product.condition);
                          const Icon = conditionInfo?.icon;
                          return (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 ${conditionInfo?.color}`}>
                              {Icon && <Icon className="w-3 h-3" />}
                              {conditionInfo?.label}
                            </span>
                          );
                        })() : product.condition && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 bg-gray-500 text-white">
                            <CheckCircle className="w-3 h-3" />
                            {product.condition}
                          </span>
                        )}
                        
                        {/* Category badge if no condition */}
                        {!product.condition && product.category && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 bg-[#13C1AC] text-white">
                            <Tag className="w-3 h-3" />
                            {product.subcategory || product.category}
                          </span>
                        )}
                        
                        {/* Negotiable badge */}
                        {product.negotiable && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-1 bg-violet-500 text-white">
                            <MessageCircle className="w-3 h-3" />
                            Negociabil
                          </span>
                        )}
                    </div>
                    
                    <button 
                        onClick={async () => {
                            if (!user) {
                                router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
                                return;
                            }
                            if (product && user.uid !== product.sellerId) {
                                try {
                                    const conversationId = await getOrCreateConversation(
                                        user.uid,
                                        product.sellerId,
                                        {
                                            [user.uid]: userProfile?.displayName || user.displayName || 'Usuario',
                                            [product.sellerId]: product.seller.name
                                        },
                                        {
                                            [user.uid]: userProfile?.photoURL || user.photoURL || '',
                                            [product.sellerId]: sellerAvatar || ''
                                        },
                                        {
                                            productId: product.id,
                                            productTitle: product.title,
                                            productImage: product.images?.[0] || product.image || ''
                                        }
                                    );
                                    router.push(`/messages?conversation=${conversationId}`);
                                } catch (error) {
                                    console.error('Error creating conversation:', error);
                                }
                            }
                        }}
                        disabled={user?.uid === product?.sellerId}
                        className={`w-full font-bold py-2.5 sm:py-3 px-4 rounded-full transition-colors mb-2 sm:mb-3 flex items-center justify-center text-sm sm:text-base ${
                            user?.uid === product?.sellerId 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-[#13C1AC] text-white hover:bg-[#10a593] shadow-lg shadow-teal-500/30'
                        }`}
                    >
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        {user?.uid === product?.sellerId ? 'Tu anuncio' : 'Chat'}
                    </button>
                    <button className="w-full bg-[#E5F9F6] text-[#13C1AC] font-bold py-2.5 sm:py-3 px-4 rounded-full hover:bg-[#d0f5f0] transition-colors text-sm sm:text-base">
                        Cumpără acum
                    </button>
                </div>

                {/* Seller Card */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 animate-fadeInUp animate-delay-200">
                    <Link href={`/user/${product.seller.id}`} className="flex items-center mb-3 sm:mb-4 group cursor-pointer">
                        {sellerAvatar ? (
                          <img src={sellerAvatar} alt={product.seller.name} className="h-10 w-10 sm:h-14 sm:w-14 rounded-full object-cover border border-gray-100 mr-3 sm:mr-4 group-hover:opacity-80 transition-opacity" />
                        ) : (
                          <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-[#13C1AC] flex items-center justify-center mr-3 sm:mr-4 group-hover:opacity-80 transition-opacity">
                            <span className="text-base sm:text-xl font-bold text-white">{(product.seller.name || 'U')[0].toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-[#13C1AC] transition-colors">{product.seller.name}</h3>
                            <div className="flex items-center text-xs sm:text-sm">
                                <div className="flex text-yellow-400 mr-1">
                                    {[...Array(5)].map((_, i) => (
                                         <svg key={i} className={`h-3 w-3 sm:h-4 sm:w-4 ${i < Math.floor(product.seller.rating || 5) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                         </svg>
                                    ))}
                                </div>
                                <span className="text-gray-500">({product.seller.reviews || 0})</span>
                            </div>
                        </div>
                    </Link>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-gray-500 border-t border-gray-100 pt-3 sm:pt-4 mt-3 sm:mt-4 gap-2 sm:gap-0">
                        <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            <span className="truncate max-w-[150px] sm:max-w-none">{product.location}</span>
                        </div>
                        <div className="text-[11px] sm:text-sm">
                           Membru din {product.seller.joined || '2024'}
                        </div>
                    </div>
                </div>

                {/* Safety Tips */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 animate-fadeInUp animate-delay-300">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3">Sfaturi de siguranță</h3>
                    <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                        <li className="flex items-start">
                            <div className="bg-blue-50 p-0.5 sm:p-1 rounded-full text-blue-500 mr-2 sm:mr-3 mt-0.5">
                                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </div>
                            <span>Nu trimite bani înainte de a vedea produsul.</span>
                        </li>
                        <li className="flex items-start">
                             <div className="bg-blue-50 p-0.5 sm:p-1 rounded-full text-blue-500 mr-2 sm:mr-3 mt-0.5">
                                <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                             </div>
                            <span>Folosește chat-ul pentru a comunica.</span>
                        </li>
                    </ul>
                </div>

            </div>
        </div>

        {/* More from seller section */}
        {sellerProducts.length > 0 && (
          <div className="mt-6 sm:mt-10 bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Mai multe de la vânzător</h2>
              <span className="text-xs sm:text-sm text-gray-500 border border-gray-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                {sellerProducts.length} anunțuri
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
              {sellerProducts.map((item) => (
                 <div key={item.id} className="h-full">
                    <ProductCard product={item} />
                 </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
