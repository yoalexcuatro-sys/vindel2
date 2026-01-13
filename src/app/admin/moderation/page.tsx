'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  MessageSquare, 
  Flag, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Filter,
  Timer
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  orderBy, 
  limit,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, approveProduct, rejectProduct } from '@/lib/products-service';

// Types
interface Report {
  id: string;
  targetId: string; // Product ID or User ID
  targetType: 'product' | 'user'; 
  reason: string;
  description?: string;
  reporterId?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: any;
  targetData?: any; // To store fetched product/user data
}

// Helper: calcular tiempo restante para auto-aprobación
function getTimeRemaining(pendingUntil: Timestamp): string {
  const now = new Date();
  const until = pendingUntil.toDate();
  const diff = until.getTime() - now.getTime();
  
  if (diff <= 0) return 'Auto-aprobat';
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState<'approvals' | 'reports'>('approvals');
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState(0); // Para actualizar el contador de tiempo

  // Actualizar contador cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate(n => n + 1);
      // Filtrar productos que ya se auto-aprobaron (solo los que tienen pendingUntil)
      setPendingProducts(prev => prev.filter(p => {
        if (!p.pendingUntil) return true; // Sin pendingUntil = mantener
        return p.pendingUntil.toDate() > new Date();
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'approvals') {
        // Traer productos con status pending
        const q = query(
          collection(db, 'products'), 
          where('status', '==', 'pending'),
          orderBy('publishedAt', 'asc') // Los más antiguos primero
        );
        const snap = await getDocs(q);
        const now = new Date();
        
        // Mostrar TODOS los pending - con o sin pendingUntil
        // Los que no tienen pendingUntil o ya expiraron = necesitan revisión manual
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Product))
          .filter(p => {
            // Si no tiene pendingUntil, mostrarlo (producto viejo)
            if (!p.pendingUntil) return true;
            // Si tiene pendingUntil y aún no expiró, mostrarlo
            return p.pendingUntil.toDate() > now;
          });
        
        setPendingProducts(data);
      } else {
        // Fetch Reports
        const q = query(
          collection(db, 'reports'), 
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const reportsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Report));
        
        // Enrich reports with target data (e.g. product details)
        // This is a simplified version; in production you'd want to be careful with N+1 reads
        const enrichedReports = await Promise.all(reportsData.map(async (report) => {
            if (report.targetType === 'product') {
                try {
                    const productSnap = await getDocs(query(collection(db, 'products'), where('__name__', '==', report.targetId)));
                    if (!productSnap.empty) {
                        return { ...report, targetData: { id: productSnap.docs[0].id, ...productSnap.docs[0].data() } };
                    }
                } catch (e) { console.error(e); }
            }
            return report;
        }));
        
        setReports(enrichedReports);
      }
    } catch (e) {
      console.error("Error fetching moderation data", e);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleApproveProduct = async (id: string) => {
    if (!confirm("Ești sigur că aprobi acest anunț?")) return;
    try {
      await approveProduct(id);
      setPendingProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
      alert("Eroare la aprobare.");
    }
  };

  const handleRejectProduct = async (id: string) => {
    const reason = prompt("Motivul respingerii (opțional):");
    if (reason === null) return;
    try {
      await rejectProduct(id, reason || 'Nu respectă regulile platformei');
      setPendingProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
        console.error(e);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'dismiss' | 'delete_item') => {
      try {
          if (action === 'delete_item') {
             // Find report to get targetId
             const report = reports.find(r => r.id === reportId);
             if (report && report.targetType === 'product') {
                 await deleteDoc(doc(db, 'products', report.targetId));
             }
             await updateDoc(doc(db, 'reports', reportId), { status: 'resolved', resolution: 'item_deleted' });
          } else {
             await updateDoc(doc(db, 'reports', reportId), { status: 'dismissed' });
          }
          setReports(prev => prev.filter(r => r.id !== reportId));
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centru de Moderare</h1>
          <p className="text-gray-500">Gestionează aprobările și rapoartele utilizatorilor</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'approvals' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            Anunțuri în Așteptare
            {pendingProducts.length > 0 && (
                <span className="bg-indigo-100 text-indigo-600 text-xs py-0.5 px-2 rounded-full">
                    {pendingProducts.length}
                </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'reports' 
                ? 'border-red-600 text-red-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Flag className="w-4 h-4" />
            Rapoarte & Sesizări
            {reports.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs py-0.5 px-2 rounded-full">
                    {reports.length}
                </span>
            )}
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
            
            {/* APPROVALS TAB */}
            {activeTab === 'approvals' && (
                <div className="grid grid-cols-1 gap-4">
                    {pendingProducts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">Totul curat!</h3>
                            <p className="text-gray-500">Nu există anunțuri care necesită aprobare momentan.</p>
                        </div>
                    ) : (
                        pendingProducts.map(product => (
                            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-6">
                                {/* Image */}
                                <div className="w-full md:w-48 h-32 bg-gray-100 rounded-lg relative shrink-0 overflow-hidden border border-gray-100">
                                    {product.images && product.images[0] ? (
                                        <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                                    ) : product.image ? (
                                        <Image src={product.image} alt={product.title} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Fără imagine</div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mb-2">
                                                {product.category}
                                            </span>
                                            <h3 className="text-lg font-bold text-gray-900">{product.title}</h3>
                                            <p className="text-indigo-600 font-bold mt-1">{product.price} RON</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                                                <Clock className="w-3 h-3" />
                                                {product.publishedAt?.seconds ? new Date(product.publishedAt.seconds * 1000).toLocaleDateString() : '-'}
                                            </span>
                                            {/* Contador de auto-aprobación */}
                                            {product.pendingUntil && (
                                                <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
                                                    <Timer className="w-3 h-3 animate-pulse" />
                                                    <span>Auto-aprobare: {getTimeRemaining(product.pendingUntil)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                        {product.description}
                                    </p>

                                    {/* Seller info */}
                                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                        <span>Vânzător:</span>
                                        <span className="font-medium text-gray-700">{product.seller?.name || 'Anonim'}</span>
                                        <span>•</span>
                                        <span>{product.location}</span>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <Link 
                                                href={`/anunturi/${product.category}/${product.id}`} 
                                                target="_blank"
                                                className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1 btn-ghost"
                                            >
                                                <Eye className="w-4 h-4" /> Previzualizare
                                            </Link>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleRejectProduct(product.id)}
                                                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 transition-colors"
                                            >
                                               <XCircle className="w-4 h-4" /> Respinge
                                            </button>
                                            <button 
                                                onClick={() => handleApproveProduct(product.id)}
                                                className="px-4 py-1.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95"
                                            >
                                               <CheckCircle className="w-4 h-4" /> Aprobă Anunțul
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
                <div className="grid grid-cols-1 gap-4">
                     {reports.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">Nicio raportare</h3>
                            <p className="text-gray-500">Nu există sesizări nerezolvate.</p>
                        </div>
                    ) : (
                        reports.map(report => (
                            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-l-4 border-l-red-500 p-4">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded uppercase">
                                                {report.reason}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                ID: {report.id}
                                            </span>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <p className="text-gray-900 font-medium text-sm">
                                                Descriere utilizator: <span className="font-normal italic">"{report.description}"</span>
                                            </p>
                                        </div>

                                        {/* Target Preview */}
                                        {report.targetData && (
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex gap-3 mb-4">
                                                {report.targetData.images?.[0] && (
                                                    <div className="w-12 h-12 rounded bg-gray-200 relative overflow-hidden shrink-0">
                                                        <Image src={report.targetData.images[0]} fill alt="Target" className="object-cover" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{report.targetData.title || 'Element șters'}</p>
                                                    <p className="text-xs text-gray-500">ID: {report.targetId}</p>
                                                </div>
                                                <Link href={`/product/${report.targetId}`} target="_blank" className="ml-auto text-indigo-600 hover:text-indigo-800">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-row md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4">
                                        <button 
                                            onClick={() => handleResolveReport(report.id, 'dismiss')}
                                            className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded text-center"
                                        >
                                            Ignoră
                                        </button>
                                        <button 
                                            onClick={() => handleResolveReport(report.id, 'delete_item')}
                                            className="flex-1 px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded text-center shadow-sm"
                                        >
                                            Șterge Anunț
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

        </div>
      )}
    </div>
  );
}

function Shield({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    )
}
