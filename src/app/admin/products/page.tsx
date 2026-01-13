'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Check, X, Trash2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, orderBy, limit, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, approveProduct, rejectProduct } from '@/lib/products-service';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would have pagination here
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('publishedAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(data);
      } catch (error) {
        console.error('Error fetching admin products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleApprove = async (productId: string) => {
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === productId ? {...p, status: 'approved'} : p));
      
      try {
          await approveProduct(productId);
      } catch (e) {
          console.error("Failed to approve", e);
      }
  };

  const handleReject = async (productId: string) => {
      const reason = prompt('Motivul respingerii:');
      if (!reason) return;
      
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === productId ? {...p, status: 'rejected', rejectionReason: reason} : p));
      
      try {
          await rejectProduct(productId, reason);
      } catch (e) {
          console.error("Failed to reject", e);
      }
  };

  const handleDelete = async (productId: string) => {
    if(!confirm("Ești sigur că vrei să ștergi acest anunț?")) return;
    
    setProducts(prev => prev.filter(p => p.id !== productId));
    try {
        await deleteDoc(doc(db, 'products', productId));
    } catch (e) {
        console.error("Failed to delete", e);
    }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anunțuri</h1>
          <p className="text-gray-500">Gestionează și moderează anunțurile de pe platformă</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Caută anunțuri..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
             </div>
             <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                <Filter className="w-5 h-5" />
             </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Produs</th>
                <th className="px-6 py-4">Categorie</th>
                <th className="px-6 py-4">Preț</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                        {product.images?.[0] ? (
                            <Image 
                                src={product.images[0]} 
                                alt={product.title} 
                                fill 
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{product.title}</p>
                        <Link 
                            href={`/product/${product.id}`} 
                            target="_blank"
                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-0.5"
                        >
                            Vezi anunț <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {product.price} RON
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const now = new Date();
                      const isPending = product.status === 'pending' && product.pendingUntil && new Date(product.pendingUntil.seconds * 1000) > now;
                      const isAutoApproved = product.status === 'pending' && product.pendingUntil && new Date(product.pendingUntil.seconds * 1000) <= now;
                      const displayStatus = product.status === 'approved' || isAutoApproved || !product.status ? 'approved' : 
                                           product.status === 'rejected' ? 'rejected' : 
                                           isPending ? 'pending' : 'approved';
                      
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                            ${displayStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${displayStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                            ${displayStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' : ''}
                            ${product.sold ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}
                        `}>
                            {product.sold ? 'Vândut' :
                             displayStatus === 'approved' ? 'Activ' :
                             displayStatus === 'pending' ? 'În așteptare' : 
                             'Respins'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {product.publishedAt?.seconds ? new Date(product.publishedAt.seconds * 1000).toLocaleDateString('ro-RO') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        {(() => {
                          const now = new Date();
                          const isPending = product.status === 'pending' && (!product.pendingUntil || new Date(product.pendingUntil.seconds * 1000) > now);
                          
                          if (isPending) {
                            return (
                              <>
                                <button 
                                    onClick={() => handleApprove(product.id)}
                                    title="Aprobă"
                                    className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleReject(product.id)}
                                    title="Respinge"
                                    className="p-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                              </>
                            );
                          }
                          return null;
                        })()}
                        <button 
                            onClick={() => handleDelete(product.id)}
                            title="Șterge"
                            className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}

                {products.length === 0 && (
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            Nu există anunțuri de afișat.
                        </td>
                    </tr>
                )}
            </tbody>
          </table>
        </div>
        
        {/* Simple Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
                Afișare 1-{products.length} din {products.length}
            </span>
            <div className="flex gap-2">
                <button className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                    Înapoi
                </button>
                <button className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>
                    Înainte
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
