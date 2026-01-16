'use client';

import { useState, use, useEffect } from 'react';
import { Product } from '@/lib/products-service';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';
import { MapPin, Star, Calendar, ShieldCheck, Package } from 'lucide-react';
import { useUserProducts, useUserProfile } from '@/lib/swr-hooks';
import Avatar from '@/components/Avatar';

export default function UserProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<'selling' | 'reviews'>('selling');
  const [currentTheme, setCurrentTheme] = useState(1);
  
  // SWR para productos del usuario - carga instantánea
  const { data: products, isLoading: loading } = useUserProducts(id);
  
  // SWR para perfil del usuario (foto actualizada)
  const { data: userProfile } = useUserProfile(id);

  // Listen for theme changes
  useEffect(() => {
    const loadTheme = () => {
      const saved = localStorage.getItem('user_card_theme');
      if (saved) setCurrentTheme(parseInt(saved));
    };
    loadTheme();
    window.addEventListener('themeChange', loadTheme);
    return () => window.removeEventListener('themeChange', loadTheme);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13C1AC]"></div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Utilizator negăsit</h1>
        <p className="text-gray-500">Acest utilizator nu există sau nu are anunțuri.</p>
      </div>
    );
  }

  // Get user info from first product, with photo from profile
  const user = {
    ...products[0].seller,
    avatar: userProfile?.photoURL || products[0].seller.avatar
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8 sm:pb-12">
      {/* Header / Cover */}
      <div className="bg-[#13C1AC] h-24 sm:h-32 w-full absolute top-16 z-0"></div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10 pt-8 sm:pt-12">
        
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col md:flex-row items-center w-full">
                <div className="relative mb-3 md:mb-0 md:mr-6">
                    <Avatar 
                        src={user.avatar} 
                        name={user.name} 
                        size="xl" 
                        className="border-4 border-white shadow-md sm:w-28 sm:h-28"
                    />
                     <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-white rounded-full p-0.5 sm:p-1 shadow-sm text-[#13C1AC]" title="Perfil verificado">
                        <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                     </div>
                </div>
                
                <div className="text-center md:text-left flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start text-xs sm:text-sm text-gray-500 gap-2 sm:gap-4 mb-2 sm:mb-3">
                         <div className="flex items-center">
                            <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-medium text-gray-900 mr-1">{user.rating || 0}</span>
                            <span>({user.reviews || 0} recenzii)</span>
                         </div>
                         <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            Pe Vindel din {user.joined || '2024'}
                         </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-3 md:mt-0 flex gap-2 sm:gap-3 w-full md:w-auto">
                 <button className="flex-1 md:flex-none border border-[#13C1AC] text-[#13C1AC] bg-white hover:bg-teal-50 font-semibold sm:font-bold py-2 px-4 sm:px-6 rounded-full transition-colors text-sm sm:text-base">
                    Chat
                </button>
                 <button className="flex-1 md:flex-none bg-[#13C1AC] text-white font-semibold sm:font-bold py-2 px-4 sm:px-6 rounded-full hover:bg-[#10a593] transition-colors shadow-sm text-sm sm:text-base">
                    Seguir
                </button>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 sm:mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
                <button 
                    onClick={() => setActiveTab('selling')}
                    className={`flex-1 min-w-[100px] sm:min-w-[120px] py-3 sm:py-4 text-xs sm:text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'selling' ? 'border-[#13C1AC] text-[#13C1AC]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    În vânzare ({products.length})
                </button>
                <button 
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 min-w-[100px] sm:min-w-[120px] py-3 sm:py-4 text-xs sm:text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-[#13C1AC] text-[#13C1AC]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Recenzii ({user.reviews || 0})
                </button>
            </div>

            <div className="p-3 sm:p-6">
                {activeTab === 'selling' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                        {products.map(product => (
                            <ProductCard key={`${product.id}-theme-${currentTheme}`} product={product} />
                        ))}
                         {products.length === 0 && (
                            <p className="col-span-full text-center text-gray-500 py-8 sm:py-10 text-sm sm:text-base">Acest utilizator nu are produse în vânzare.</p>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center">
                        <Star className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm sm:text-base">Nu există recenzii încă.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
