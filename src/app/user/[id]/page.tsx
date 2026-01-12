'use client';

import { useState, use, useEffect } from 'react';
import { getProducts, Product } from '@/lib/storage';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';
import { MapPin, Star, Calendar, ShieldCheck } from 'lucide-react';

export default function UserProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<'selling' | 'reviews'>('selling');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProducts(getProducts());
    setLoading(false);
  }, []);

  if (loading) return null;

  // Find user data from products (mocking a user database)
  const productWithSeller = products.find(p => p.seller.id === parseInt(id));
  
  if (!productWithSeller) {
      // In a real app we'd fetch user by ID directly.
      // Here if no product matches, user might not exist or has no products.
      notFound();
  }

  const user = productWithSeller.seller;

  // Filter products for this specific user
  const userProducts = products.filter(p => p.seller.id === parseInt(id));
  
  // Fake reviews for this user
  const reviews: any[] = [];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header / Cover */}
      <div className="bg-[#13C1AC] h-32 w-full absolute top-16 z-0"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-12">
        
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col md:flex-row items-center w-full">
                <div className="relative mb-4 md:mb-0 md:mr-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md object-cover"
                    />
                     <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-sm text-[#13C1AC]" title="Perfil verificado">
                        <ShieldCheck className="h-5 w-5 fill-current" />
                     </div>
                </div>
                
                <div className="text-center md:text-left flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start text-sm text-gray-500 gap-4 mb-3">
                         <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-medium text-gray-900 mr-1">{user.rating}</span>
                            <span>({user.reviews} valoraciones)</span>
                         </div>
                         <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            En Wallapop desde {user.joined}
                         </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-3 w-full md:w-auto">
                 <button className="flex-1 md:flex-none border border-[#13C1AC] text-[#13C1AC] bg-white hover:bg-teal-50 font-bold py-2 px-6 rounded-full transition-colors">
                    Chat
                </button>
                 <button className="flex-1 md:flex-none bg-[#13C1AC] text-white font-bold py-2 px-6 rounded-full hover:bg-[#10a593] transition-colors shadow-sm">
                    Seguir
                </button>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
                <button 
                    onClick={() => setActiveTab('selling')}
                    className={`flex-1 min-w-[120px] py-4 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'selling' ? 'border-[#13C1AC] text-[#13C1AC]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    En venta ({userProducts.length})
                </button>
                <button 
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 min-w-[120px] py-4 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-[#13C1AC] text-[#13C1AC]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Valoraciones ({user.reviews})
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'selling' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {userProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                         {userProducts.length === 0 && (
                            <p className="col-span-full text-center text-gray-500 py-10">Este usuario no tiene productos en venta actualmente.</p>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="space-y-6">
                        {reviews.map(review => (
                            <div key={review.id} className="flex space-x-4 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                                    {review.user.substring(0, 1)}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-gray-900">{review.user}</h4>
                                        <span className="text-xs text-gray-500">{review.date}</span>
                                    </div>
                                    <div className="flex text-yellow-400 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                                        ))}
                                    </div>
                                    <p className="text-gray-600 text-sm">{review.comment}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
