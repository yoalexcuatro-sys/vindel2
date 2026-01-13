'use client';

import { useState, useEffect } from 'react';
import { 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  deleteDoc, 
  where 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Check, X, Eye, Trash2, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface AdminProduct {
  id: string;
  title: string;
  price: number;
  image: string;
  status?: string; // pending, active, rejected
  seller: {
    name: string;
    email?: string;
  };
  location: string;
  publishedAt: any;
}

export default function ListingsModeration() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('publishedAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Default status simulation if field doesn't exist
        status: (doc.data() as any).status || 'active' 
      })) as AdminProduct[];
      
      setProducts(data);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleApprove = async (id: string) => {
    if (confirm('Aprobați acest anunț? va fi vizibil public.')) {
        try {
            await updateDoc(doc(db, 'products', id), { status: 'active' });
            setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'active' } : p));
        } catch (e) {
            alert('Eroare');
        }
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('De ce respingeți acest anunț?');
    if (reason) {
        try {
            await updateDoc(doc(db, 'products', id), { status: 'rejected', rejectionReason: reason });
            setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
        } catch (e) {
            alert('Eroare');
        }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Ești sigur? Această acțiune este ireversibilă.')) {
        try {
            await deleteDoc(doc(db, 'products', id));
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (e) {
            alert('Eroare');
        }
    }
  };

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => p.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Moderare Anunțuri</h1>
           <p className="text-gray-500">Gestioneaza, aprobă sau șterge anunțurile din platformă.</p>
        </div>
        
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Toate
            </button>
            <button 
                onClick={() => setFilter('pending')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'pending' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                În așteptare
            </button>
            <button 
                onClick={() => setFilter('active')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'active' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Active
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 font-medium">
                    <tr>
                        <th className="px-6 py-4">Produs</th>
                        <th className="px-6 py-4">Vânzător</th>
                        <th className="px-6 py-4">Preț</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Acțiuni</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Se încarcă anunțurile...</td></tr>
                    ) : filteredProducts.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Nu există anunțuri în această categorie.</td></tr>
                    ) : (
                        filteredProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0 max-w-[200px]">
                                            <div className="font-semibold text-gray-900 truncate" title={product.title}>{product.title}</div>
                                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                <span>{product.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{product.seller.name}</div>
                                    <div className="text-xs text-gray-400">Seller ID: {product.id.slice(0,5)}...</div>
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-900">
                                    {product.price} €
                                </td>
                                <td className="px-6 py-4">
                                    {product.status === 'active' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                            Activ
                                        </span>
                                    )}
                                    {product.status === 'pending' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                            In Aprobare
                                        </span>
                                    )}
                                    {product.status === 'rejected' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                            Respins
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {/* View Live */}
                                        <Link href={`/product/${product.id}`} target="_blank" className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                           <ExternalLink className="w-4 h-4" />
                                        </Link>
                                        
                                        {product.status !== 'active' && (
                                            <button 
                                                onClick={() => handleApprove(product.id)}
                                                className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                                title="Aprobă"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        
                                        {product.status !== 'rejected' && (
                                            <button 
                                                onClick={() => handleReject(product.id)}
                                                className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                                title="Respinge"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}

                                        <button 
                                            onClick={() => handleDelete(product.id)}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Șterge Definitiv"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
             </table>
         </div>
      </div>
    </div>
  );
}
