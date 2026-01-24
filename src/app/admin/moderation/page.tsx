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
  limit,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, approveProduct, rejectProduct } from '@/lib/products-service';
import { createNotification } from '@/lib/notifications-service';

// Types
interface Report {
  id: string;
  targetId: string; // Product ID or User ID
  targetType: 'product' | 'user'; 
  reason: string;
  description?: string;
  reporterId?: string;
  reporterEmail?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: any;
  targetData?: any; // To store fetched product/user data
  productTitle?: string;
  productImage?: string;
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
  const [reportsCount, setReportsCount] = useState(0); // Contador de reportes para badge
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState(0); // Para actualizar el contador de tiempo
  
  // Estados para modales de confirmación
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: 'approve' | 'reject' | 'delete';
    productId: string;
    productTitle: string;
    reportId?: string;
  }>({ show: false, type: 'approve', productId: '', productTitle: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Cargar conteo de reportes al inicio
  useEffect(() => {
    const fetchReportsCount = async () => {
      try {
        const q = query(
          collection(db, 'reports'), 
          where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        setReportsCount(snap.size);
      } catch (e) {
        console.error("Error fetching reports count", e);
      }
    };
    fetchReportsCount();
  }, []);

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
        // Traer productos con status pending (sin orderBy para evitar índice)
        const q = query(
          collection(db, 'products'), 
          where('status', '==', 'pending')
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
          })
          .sort((a, b) => {
            // Ordenar por publishedAt (más antiguos primero)
            const timeA = a.publishedAt?.seconds || 0;
            const timeB = b.publishedAt?.seconds || 0;
            return timeA - timeB;
          });
        
        setPendingProducts(data);
      } else {
        // Fetch Reports - Query sin orderBy para evitar necesidad de índice compuesto
        const q = query(
          collection(db, 'reports'), 
          where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        // Ordenar en cliente por createdAt
        const reportsData = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Report))
          .sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA; // Más recientes primero
          });
        
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
        setReportsCount(enrichedReports.length); // Actualizar contador
      }
    } catch (e) {
      console.error("Error fetching moderation data", e);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleApproveProduct = async (id: string) => {
    try {
      await approveProduct(id);
      setPendingProducts(prev => prev.filter(p => p.id !== id));
      setConfirmModal({ show: false, type: 'approve', productId: '', productTitle: '' });
    } catch (e) {
      console.error(e);
      alert("Eroare la aprobare.");
    }
  };

  const handleRejectProduct = async (id: string, reason: string) => {
    try {
      await rejectProduct(id, reason || 'Nu respectă regulile platformei');
      setPendingProducts(prev => prev.filter(p => p.id !== id));
      setConfirmModal({ show: false, type: 'reject', productId: '', productTitle: '' });
      setRejectReason('');
    } catch (e) {
        console.error(e);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'dismiss' | 'delete_item') => {
      try {
          if (action === 'delete_item') {
             // Find report to get targetId and seller info
             const report = reports.find(r => r.id === reportId);
             if (report && report.targetType === 'product') {
                 // Pedir razón de eliminación
                 const reason = prompt(
                   'Motivul ștergerii anunțului (va fi trimis proprietarului):\n\n' +
                   'Exemplu: Anunțul încalcă regulile platformei privind conținutul fals/înșelător.'
                 );
                 
                 if (!reason) return; // Cancelado
                 
                 // Enviar notificación al vendedor
                 const sellerId = report.targetData?.sellerId;
                 const productTitle = report.targetData?.title || 'Anunț';
                 
                 if (sellerId) {
                   await createNotification({
                     userId: sellerId,
                     type: 'product_rejected',
                     title: '⚠️ Anunțul tău a fost șters',
                     message: `Anunțul "${productTitle}" a fost eliminat. Motiv: ${reason}`,
                     metadata: {
                       productId: report.targetId,
                       productTitle: productTitle,
                       reportReason: reason
                     }
                   });
                 }
                 
                 await deleteDoc(doc(db, 'products', report.targetId));
             }
             await updateDoc(doc(db, 'reports', reportId), { status: 'resolved', resolution: 'item_deleted' });
          } else {
             await updateDoc(doc(db, 'reports', reportId), { status: 'dismissed' });
          }
          setReports(prev => prev.filter(r => r.id !== reportId));
          setReportsCount(prev => prev - 1);
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <div className="relative space-y-4 sm:space-y-6">
      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-2xl font-bold text-gray-900">Moderare</h1>
          <p className="text-gray-500 text-[10px] sm:text-sm">Aprobări și rapoarte</p>
        </div>
      </div>

      {/* Tabs - Compact Pills */}
      <div className="flex gap-1.5 sm:gap-2">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
            activeTab === 'approvals' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' 
              : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
          }`}
        >
          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">En Așteptare</span>
          <span className={`min-w-[16px] sm:min-w-[18px] h-4 sm:h-[18px] flex items-center justify-center text-[9px] sm:text-[10px] font-bold rounded-full ${
            activeTab === 'approvals' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
          }`}>
              {pendingProducts.length}
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-semibold whitespace-nowrap transition-all active:scale-95 ${
            activeTab === 'reports' 
              ? 'bg-red-600 text-white shadow-md shadow-red-600/25' 
              : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
          }`}
        >
          <Flag className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Rapoarte</span>
          <span className={`min-w-[16px] sm:min-w-[18px] h-4 sm:h-[18px] flex items-center justify-center text-[9px] sm:text-[10px] font-bold rounded-full ${
            activeTab === 'reports' ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
          }`}>
              {reports.length > 0 ? reports.length : reportsCount}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8 sm:p-12">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-indigo-600 border-t-transparent"></div>
              <span className="text-xs sm:text-sm text-gray-500">Se încarcă...</span>
            </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
            
            {/* APPROVALS TAB */}
            {activeTab === 'approvals' && (
                <div className="space-y-2 sm:space-y-3">
                    {pendingProducts.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 bg-white rounded-xl border border-gray-200">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 bg-emerald-50 rounded-xl sm:rounded-2xl flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Totul curat!</h3>
                            <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5 sm:mt-1">Nu există anunțuri în așteptare.</p>
                        </div>
                    ) : (
                        pendingProducts.map(product => (
                            <div key={product.id} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Mobile: Horizontal, Desktop: Horizontal bigger */}
                                <div className="flex">
                                  {/* Image - Compact */}
                                  <div className="w-20 sm:w-36 h-20 sm:h-auto bg-gray-100 relative shrink-0 overflow-hidden">
                                      {product.images && product.images[0] ? (
                                          <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                                      ) : product.image ? (
                                          <Image src={product.image} alt={product.title} fill className="object-cover" />
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[9px] sm:text-xs">Fără img</div>
                                      )}
                                      {/* Auto-approval timer on image */}
                                      {product.pendingUntil && (
                                        <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 flex items-center gap-0.5 text-amber-700 bg-amber-100/90 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[8px] sm:text-[10px] font-semibold">
                                            <Timer className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse" />
                                            <span>{getTimeRemaining(product.pendingUntil)}</span>
                                        </div>
                                      )}
                                  </div>

                                  {/* Content - Compact */}
                                  <div className="flex-1 p-2 sm:p-4 min-w-0">
                                      <div className="flex items-start justify-between gap-1">
                                          <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] sm:text-xs font-medium bg-gray-100 text-gray-600 truncate max-w-[80px] sm:max-w-none">
                                                    {product.category}
                                                </span>
                                              </div>
                                              <h3 className="text-[11px] sm:text-base font-bold text-gray-900 line-clamp-1">{product.title}</h3>
                                              <p className="text-[12px] sm:text-base font-bold text-indigo-600">{product.price?.toLocaleString('ro-RO')} {product.currency === 'EUR' ? '€' : 'Lei'}</p>
                                          </div>
                                      </div>
                                      
                                      <p className="text-[9px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1.5 line-clamp-1 sm:line-clamp-2 hidden sm:block">
                                          {product.description}
                                      </p>

                                      {/* Seller info */}
                                      <div className="mt-1 sm:mt-2 flex items-center gap-1 text-[9px] sm:text-xs text-gray-400">
                                          <span className="font-medium text-gray-600 truncate">{product.seller?.name || 'Anonim'}</span>
                                          <span className="hidden sm:inline">•</span>
                                          <span className="hidden sm:inline truncate">{product.location}</span>
                                      </div>
                                  </div>
                                </div>

                                {/* Actions Bar - Compact */}
                                <div className="px-2 sm:px-4 py-1.5 sm:py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-1">
                                    <Link 
                                        href={`/anunturi/${product.category}/${product.id}`} 
                                        target="_blank"
                                        className="text-[10px] sm:text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-0.5 px-1.5 py-1 rounded-md hover:bg-white transition-colors"
                                    >
                                        <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 
                                        <span>Vezi</span>
                                    </Link>
                                    <div className="flex gap-1 sm:gap-2">
                                        <button 
                                            onClick={() => setConfirmModal({ 
                                              show: true, 
                                              type: 'reject', 
                                              productId: product.id, 
                                              productTitle: product.title 
                                            })}
                                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-md sm:rounded-lg flex items-center gap-0.5 sm:gap-1 transition-colors active:scale-95"
                                        >
                                           <XCircle className="w-3 h-3 sm:w-4 sm:h-4" /> 
                                           <span className="hidden sm:inline">Respinge</span>
                                        </button>
                                        <button 
                                            onClick={() => setConfirmModal({ 
                                              show: true, 
                                              type: 'approve', 
                                              productId: product.id, 
                                              productTitle: product.title 
                                            })}
                                            className="px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md sm:rounded-lg flex items-center gap-0.5 sm:gap-1.5 shadow-sm transition-all active:scale-95"
                                        >
                                           <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> 
                                           <span>Aprobă</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
                <div className="space-y-2 sm:space-y-4">
                     {reports.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 bg-white rounded-xl border border-gray-200">
                            <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                            <h3 className="text-sm sm:text-lg font-medium text-gray-900">Nicio raportare</h3>
                            <p className="text-gray-500 text-[10px] sm:text-sm">Nu există sesizări nerezolvate.</p>
                        </div>
                    ) : (
                        reports.map(report => (
                            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-l-4 border-l-red-500 p-2.5 sm:p-4">
                                <div className="flex flex-col gap-2 sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                            <span className="px-1.5 sm:px-2 py-0.5 bg-red-100 text-red-700 text-[9px] sm:text-xs font-bold rounded uppercase">
                                                {report.reason}
                                            </span>
                                            <span className="text-[9px] sm:text-xs text-gray-400">
                                                {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleDateString('ro-RO') : ''}
                                            </span>
                                        </div>
                                        
                                        {report.description && (
                                          <p className="text-gray-700 text-[10px] sm:text-sm mb-2 line-clamp-2">
                                            "{report.description}"
                                          </p>
                                        )}

                                        {/* Target Preview - Compact */}
                                        <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200 flex gap-2 sm:gap-3">
                                            {(report.productImage || report.targetData?.images?.[0]) && (
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-200 relative overflow-hidden shrink-0">
                                                    <Image 
                                                      src={report.productImage || report.targetData?.images?.[0]} 
                                                      fill 
                                                      alt="Target" 
                                                      className="object-cover" 
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] sm:text-sm font-bold text-gray-900 truncate">
                                                  {report.productTitle || report.targetData?.title || 'Element șters'}
                                                </p>
                                                {report.targetData?.price && (
                                                  <p className="text-[10px] sm:text-xs font-medium text-indigo-600">{report.targetData.price} RON</p>
                                                )}
                                                {report.targetData?.seller && (
                                                  <p className="text-[9px] sm:text-xs text-gray-500 mt-0.5">
                                                    {report.targetData.seller.name || 'Anonim'}
                                                  </p>
                                                )}
                                            </div>
                                            <Link 
                                              href={`/anunturi/${report.targetData?.category || 'general'}/${report.targetId}`} 
                                              target="_blank" 
                                              className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="flex gap-1.5 sm:gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                        <button 
                                            onClick={() => handleResolveReport(report.id, 'dismiss')}
                                            className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md sm:rounded text-center active:scale-95 transition-all"
                                        >
                                            Ignoră
                                        </button>
                                        <button 
                                            onClick={() => handleResolveReport(report.id, 'delete_item')}
                                            className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md sm:rounded text-center shadow-sm active:scale-95 transition-all"
                                        >
                                            Șterge
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

      {/* Modal de Confirmación - Compact Mobile */}
      {confirmModal.show && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setConfirmModal({ show: false, type: 'approve', productId: '', productTitle: '' });
            setRejectReason('');
          }}
        >
          <div 
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom sm:fade-in sm:zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar mobile */}
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header - Compact */}
            <div className={`px-4 sm:px-6 py-3 sm:py-4 ${
              confirmModal.type === 'approve' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                : 'bg-gradient-to-r from-red-500 to-red-600'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                  {confirmModal.type === 'approve' ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {confirmModal.type === 'approve' ? 'Aprobă Anunțul' : 'Respinge Anunțul'}
                  </h3>
                  <p className="text-white/80 text-[10px] sm:text-xs truncate">{confirmModal.productTitle}</p>
                </div>
              </div>
            </div>
            
            {/* Contenido - Compact */}
            <div className="p-3 sm:p-5">
              {confirmModal.type === 'approve' ? (
                <p className="text-gray-600 text-xs sm:text-sm">
                  Anunțul va fi publicat și vizibil pentru toți utilizatorii.
                </p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Anunțul va fi respins și proprietarul va primi o notificare.
                  </p>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                      Motivul respingerii (opțional)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Ex: Imagini neclare..."
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer - Compact */}
            <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gray-50 border-t border-gray-100 flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setConfirmModal({ show: false, type: 'approve', productId: '', productTitle: '' });
                  setRejectReason('');
                }}
                className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg sm:rounded-xl transition-colors active:scale-95"
              >
                Anulează
              </button>
              <button
                onClick={() => {
                  if (confirmModal.type === 'approve') {
                    handleApproveProduct(confirmModal.productId);
                  } else {
                    handleRejectProduct(confirmModal.productId, rejectReason);
                  }
                }}
                className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-colors active:scale-95 ${
                  confirmModal.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {confirmModal.type === 'approve' ? 'Aprobă' : 'Respinge'}
              </button>
            </div>
          </div>
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
