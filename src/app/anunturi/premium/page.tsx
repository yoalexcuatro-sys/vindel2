'use client';

import { useMemo, useState } from 'react';
import { Crown, Award, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/products-service';
import { useHomeProducts } from '@/lib/swr-hooks';
import { Timestamp } from 'firebase/firestore';

// Helper: verificar si un producto está activamente promocionado como VIP o Premium
function isPremiumOrVipProduct(product: Product): boolean {
  if (!product.promoted || !product.promotionEnd) return false;
  if (product.promotionType !== 'lunar' && product.promotionType !== 'saptamanal') return false;
  
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

// Helper para obtener prioridad de promoción
function getPromotionPriority(product: Product): number {
  if (!product.promoted || !product.promotionType) return 0;
  const priorities: Record<string, number> = {
    'lunar': 3,      // VIP - highest
    'saptamanal': 2, // Premium
    'zilnic': 1,     // Promovat
  };
  return priorities[product.promotionType] || 0;
}

export default function PremiumPage() {
  const { data: products, isLoading } = useHomeProducts();
  const [filter, setFilter] = useState<'all' | 'vip' | 'premium'>('all');
  
  // Filtrar productos VIP y Premium
  const premiumProducts = useMemo(() => {
    if (!products) return [];
    let filtered = products.filter(isPremiumOrVipProduct);
    
    // Aplicar filtro adicional
    if (filter === 'vip') {
      filtered = filtered.filter(p => p.promotionType === 'lunar');
    } else if (filter === 'premium') {
      filtered = filtered.filter(p => p.promotionType === 'saptamanal');
    }
    
    // Ordenar por prioridad (VIP primero, luego Premium)
    return filtered.sort((a, b) => getPromotionPriority(b) - getPromotionPriority(a));
  }, [products, filter]);

  const vipCount = useMemo(() => {
    if (!products) return 0;
    return products.filter(p => isPremiumOrVipProduct(p) && p.promotionType === 'lunar').length;
  }, [products]);

  const premiumCount = useMemo(() => {
    if (!products) return 0;
    return products.filter(p => isPremiumOrVipProduct(p) && p.promotionType === 'saptamanal').length;
  }, [products]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#13C1AC] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Înapoi la pagina principală
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent flex items-center gap-3">
                <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
                Anunțuri Premium
              </h1>
              <p className="text-gray-500 mt-1">
                {premiumProducts.length} anunțuri promovate disponibile
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-xl aspect-[4/5]"></div>
                <div className="mt-2 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : premiumProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Nu există anunțuri {filter === 'vip' ? 'VIP' : filter === 'premium' ? 'Premium' : 'promovate'}
            </h2>
            <p className="text-gray-500 mb-6">
              Revino mai târziu sau verifică toate anunțurile disponibile.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#13C1AC] text-white rounded-lg hover:bg-[#0fa89a] transition-colors"
            >
              Vezi toate anunțurile
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {premiumProducts.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                priority={index < 10}
              />
            ))}
          </div>
        )}

        {/* Info Section - Compact */}
        <div className="mt-8 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 rounded-xl p-4 border border-amber-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Vrei să îți promovezi anunțul?</h3>
              <p className="text-xs text-gray-500">Crește vizibilitatea cu planurile noastre</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1.5 rounded-lg border border-gray-100">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              <span>1 zi</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1.5 rounded-lg border border-gray-100">
              <Award className="w-3.5 h-3.5 text-purple-500" />
              <span>7 zile</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 bg-white px-2.5 py-1.5 rounded-lg border border-gray-100">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>30 zile</span>
            </div>
            <Link 
              href="/profile?tab=promotion"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
            >
              <Crown className="w-4 h-4" />
              Promovează
            </Link>
          </div>
        </div>
    </main>
  );
}
