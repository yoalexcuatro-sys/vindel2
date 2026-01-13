'use client';

import { useState } from 'react';
import { 
  Megaphone, 
  Tag, 
  Gift, 
  Users, 
  TrendingUp, 
  Plus, 
  Save, 
  Loader2,
  DollarSign,
  Percent,
  Check,
  Zap
} from 'lucide-react';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState<'pricing' | 'offers'>('pricing');
  const [loading, setLoading] = useState(false);
  
  // Section 1: Promotion Pricing Control
  const [promoPrices, setPromoPrices] = useState([
    { id: 'gold', name: 'Gold (Prima Pagină)', duration: '7 zile', price: 15, currency: 'EUR', active: true, color: 'from-amber-400 to-yellow-600' },
    { id: 'silver', name: 'Silver (În Categorie)', duration: '7 zile', price: 8, currency: 'EUR', active: true, color: 'from-slate-300 to-slate-500' },
    { id: 'bronze', name: 'Bronze (Evidențiat)', duration: '3 zile', price: 3, currency: 'EUR', active: true, color: 'from-orange-700 to-amber-900' },
  ]);

  // Section 2: Create Offer/Coupon
  const [offer, setOffer] = useState({
    code: '',
    discount: 10,
    type: 'percent', // percent or fixed
    target: 'all', // all or specific
    targetUserId: '',
    expiryDate: ''
  });

  const handlePriceChange = (id: string, newPrice: number) => {
    setPromoPrices(prev => prev.map(p => p.id === id ? { ...p, price: newPrice } : p));
  };

  const handleSavePrices = async () => {
    setLoading(true);
    try {
        await setDoc(doc(db, 'settings', 'promo_pricing'), { items: promoPrices });
        // Simulate delay
        await new Promise(r => setTimeout(r, 1000));
        alert('Prețurile au fost actualizate!');
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        await addDoc(collection(db, 'coupons'), {
            ...offer,
            createdAt: serverTimestamp(),
            status: 'active'
        });
        alert(`Oferta ${offer.code} a fost creată!`);
        setOffer({...offer, code: '', discount: 10}); // Reset
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="relative space-y-8">
      {/* Header with waves */}
      <div className="relative bg-gradient-to-r from-slate-50 to-gray-100 -mx-6 lg:-mx-8 -mt-6 lg:-mt-8 px-6 lg:px-8 pt-6 lg:pt-8 pb-16 mb-6 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-16">
            <path fill="white" d="M0,64 C288,89 432,24 720,49 C1008,74 1152,100 1440,64 L1440,120 L0,120 Z"></path>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-12 opacity-50">
            <path fill="white" d="M0,96 C144,80 288,48 432,48 C576,48 720,80 864,80 C1008,80 1152,64 1296,48 L1440,32 L1440,120 L0,120 Z"></path>
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing & Promovare</h1>
            <p className="text-gray-500 text-sm mt-1">Gestionează pachetele de promovare și ofertele speciale</p>
          </div>
        
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
              <button 
                  onClick={() => setActiveTab('pricing')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
                      activeTab === 'pricing' ? 'bg-[#13C1AC] text-white shadow' : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                  <Tag className="w-4 h-4" />
                  Tarife Promovare
              </button>
              <button 
                  onClick={() => setActiveTab('offers')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
                      activeTab === 'offers' ? 'bg-[#13C1AC] text-white shadow' : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                  <Gift className="w-4 h-4" />
                  Oferte Utilizatori
              </button>
          </div>
        </div>
      </div>

      {/* --- TAB 1: PRICING CONTROL --- */}
      {activeTab === 'pricing' && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {promoPrices.map((pkg) => (
                      <div key={pkg.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
                          {/* Card Header */}
                          <div className={`h-2 bg-gradient-to-r ${pkg.color}`}></div>
                          <div className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                  <div className={`p-3 rounded-xl bg-opacity-10 ${pkg.id === 'gold' ? 'bg-amber-500 text-amber-600' : pkg.id === 'silver' ? 'bg-slate-500 text-slate-600' : 'bg-orange-800 text-orange-800'}`}>
                                      <Zap className="w-6 h-6" />
                                  </div>
                                  <div className="flex flex-col items-end">
                                      <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">PREȚ ACTUAL</span>
                                      <span className="text-2xl font-black text-gray-900">{pkg.price} {pkg.currency}</span>
                                  </div>
                              </div>
                              
                              <h3 className="text-lg font-bold text-gray-900 mb-1">{pkg.name}</h3>
                              <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                                  <ClockIcon />
                                  Durată: {pkg.duration}
                              </p>

                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Modifică Preț ({pkg.currency})</label>
                                  <div className="flex items-center gap-3">
                                      <button 
                                        onClick={() => handlePriceChange(pkg.id, Math.max(0, pkg.price - 1))}
                                        className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-red-500 hover:text-red-500 transition-colors"
                                      >
                                          -
                                      </button>
                                      <input 
                                        type="number" 
                                        value={pkg.price}
                                        onChange={(e) => handlePriceChange(pkg.id, parseInt(e.target.value) || 0)}
                                        className="flex-1 text-center font-bold text-gray-900 bg-transparent border-none focus:ring-0 text-lg"
                                      />
                                      <button 
                                        onClick={() => handlePriceChange(pkg.id, pkg.price + 1)}
                                        className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-green-500 hover:text-green-500 transition-colors"
                                      >
                                          +
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>

              <div className="flex justify-end p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <button 
                    onClick={handleSavePrices}
                    disabled={loading}
                    className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all active:scale-95"
                  >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvează Configurația
                  </button>
              </div>
          </div>
      )}

      {/* --- TAB 2: OFFERS & COUPONS --- */}
      {activeTab === 'offers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Offer Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                          <Gift className="w-6 h-6" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">Creează Ofertă Nouă</h2>
                  </div>

                  <form onSubmit={handleCreateOffer} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cod Cupon / Titlu Ofertă</label>
                          <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">#</span>
                              <input 
                                type="text" 
                                value={offer.code}
                                onChange={(e) => setOffer({...offer, code: e.target.value.toUpperCase()})}
                                placeholder="ex: VARA2024"
                                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-bold uppercase"
                                required
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Valoare</label>
                              <div className="flex">
                                  <input 
                                    type="number" 
                                    value={offer.discount}
                                    onChange={(e) => setOffer({...offer, discount: parseInt(e.target.value)})}
                                    className="w-full px-4 py-2 border border-l border-t border-b border-gray-200 rounded-l-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                  />
                                  <select 
                                    value={offer.type}
                                    onChange={(e) => setOffer({...offer, type: e.target.value})}
                                    className="border border-gray-200 rounded-r-lg bg-gray-50 px-2 text-sm text-gray-600 focus:outline-none"
                                  >
                                      <option value="percent">%</option>
                                      <option value="fixed">EUR</option>
                                  </select>
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Dată Expirare</label>
                              <input 
                                type="date" 
                                value={offer.expiryDate}
                                onChange={(e) => setOffer({...offer, expiryDate: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                              />
                          </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Destinatar</label>
                          <div className="flex gap-4 mb-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="target" 
                                    checked={offer.target === 'all'}
                                    onChange={() => setOffer({...offer, target: 'all'})}
                                    className="text-pink-600 focus:ring-pink-500"
                                  />
                                  <span className="text-sm text-gray-600">Toți Utilizatorii</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="target" 
                                    checked={offer.target === 'specific'}
                                    onChange={() => setOffer({...offer, target: 'specific'})}
                                    className="text-pink-600 focus:ring-pink-500"
                                  />
                                  <span className="text-sm text-gray-600">Un Utilizator</span>
                              </label>
                          </div>

                          {offer.target === 'specific' && (
                               <input 
                                 type="text" 
                                 placeholder="Introdu ID utilizator sau Email"
                                 value={offer.targetUserId}
                                 onChange={(e) => setOffer({...offer, targetUserId: e.target.value})}
                                 className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm bg-gray-50"
                               />
                          )}
                      </div>

                      <button 
                        type="submit"
                        disabled={loading || !offer.code}
                        className="w-full bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                      >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
                          Lansează Ofertă
                      </button>
                  </form>
              </div>

              {/* Tips / Preview */}
              <div className="space-y-6">
                 <div className="bg-gradient-to-br from-[#0f172a] to-[#334155] rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10">
                         <Megaphone className="w-32 h-32" />
                     </div>
                     <h3 className="text-lg font-bold mb-2">Previzualizare Notificare</h3>
                     <p className="text-slate-300 text-sm mb-6">Așa va apărea oferta la utilizatori</p>
                     
                     <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                         <div className="flex gap-3">
                             <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center shrink-0">
                                 <Gift className="w-6 h-6 text-white" />
                             </div>
                             <div>
                                 <p className="font-bold text-white text-sm">Ai primit un cadou!</p>
                                 <p className="text-slate-200 text-xs mt-0.5">
                                     Folosește codul <span className="font-mono bg-white/20 px-1 rounded text-pink-300">{offer.code || 'COD'}</span> pentru 
                                     {offer.type === 'percent' ? ` ${offer.discount}% reducere` : ` ${offer.discount} EUR credit`} la următoarea promovare.
                                 </p>
                             </div>
                         </div>
                     </div>
                 </div>

                 <div className="bg-white rounded-xl border border-gray-200 p-6">
                     <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Statistici Impact
                     </h3>
                     <div className="space-y-4">
                         <div className="flex justify-between items-center text-sm">
                             <span className="text-gray-500">Rata de conversie cupoane</span>
                             <span className="font-bold text-gray-900">24%</span>
                         </div>
                         <div className="w-full bg-gray-100 rounded-full h-2">
                             <div className="bg-green-500 h-2 rounded-full w-[24%]"></div>
                         </div>
                     </div>
                 </div>
              </div>
          </div>
      )}
    </div>
  );
}

function ClockIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
