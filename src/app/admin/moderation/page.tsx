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
    <div className="relative space-y-6">
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
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-gray-900">Centru de Moderare</h1>
          <p className="text-gray-500 text-sm mt-1">Gestionează aprobările și rapoartele utilizatorilor</p>
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
            {(reportsCount > 0 || reports.length > 0) && (
                <span className="relative flex items-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative bg-red-500 text-white text-xs font-bold py-0.5 px-2 rounded-full">
                        {reports.length > 0 ? reports.length : reportsCount}
                    </span>
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
                                                onClick={() => setConfirmModal({ 
                                                  show: true, 
                                                  type: 'reject', 
                                                  productId: product.id, 
                                                  productTitle: product.title 
                                                })}
                                                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 transition-colors"
                                            >
                                               <XCircle className="w-4 h-4" /> Respinge
                                            </button>
                                            <button 
                                                onClick={() => setConfirmModal({ 
                                                  show: true, 
                                                  type: 'approve', 
                                                  productId: product.id, 
                                                  productTitle: product.title 
                                                })}
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
                                                {report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000).toLocaleString('ro-RO') : ''}
                                            </span>
                                        </div>
                                        
                                        {report.description && (
                                          <div className="mb-4">
                                            <p className="text-gray-900 font-medium text-sm">
                                                Detalii: <span className="font-normal italic">"{report.description}"</span>
                                            </p>
                                          </div>
                                        )}
                                        
                                        {report.reporterEmail && (
                                          <p className="text-xs text-gray-400 mb-3">
                                            Raportat de: {report.reporterEmail}
                                          </p>
                                        )}

                                        {/* Target Preview - use stored data or fetched data */}
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex gap-3 mb-4">
                                            {(report.productImage || report.targetData?.images?.[0]) && (
                                                <div className="w-14 h-14 rounded-lg bg-gray-200 relative overflow-hidden shrink-0">
                                                    <Image 
                                                      src={report.productImage || report.targetData?.images?.[0]} 
                                                      fill 
                                                      alt="Target" 
                                                      className="object-cover" 
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                  {report.productTitle || report.targetData?.title || 'Element șters'}
                                                </p>
                                                <p className="text-xs text-gray-500">ID: {report.targetId.slice(0, 12)}...</p>
                                                {report.targetData?.price && (
                                                  <p className="text-xs font-medium text-indigo-600">{report.targetData.price} RON</p>
                                                )}
                                                {/* Seller/User info */}
                                                {report.targetData?.seller && (
                                                  <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                                                    <p className="text-xs text-gray-500">
                                                      Vânzător: <span className="font-semibold text-gray-700">{report.targetData.seller.name || 'Anonim'}</span>
                                                    </p>
                                                    {report.targetData?.sellerId && (
                                                      <Link 
                                                        href={`/admin/users?uid=${report.targetData.sellerId}`}
                                                        className="text-[10px] text-indigo-500 hover:text-indigo-700 font-mono flex items-center gap-1 mt-0.5"
                                                      >
                                                        UID: {report.targetData.sellerId.slice(0, 16)}...
                                                        <ExternalLink className="w-3 h-3" />
                                                      </Link>
                                                    )}
                                                  </div>
                                                )}
                                            </div>
                                            <Link 
                                              href={`/anunturi/${report.targetData?.category || 'general'}/${report.targetId}`} 
                                              target="_blank" 
                                              className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </div>
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

      {/* Modal de Confirmación */}
      {confirmModal.show && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setConfirmModal({ show: false, type: 'approve', productId: '', productTitle: '' });
            setRejectReason('');
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`px-6 py-5 ${
              confirmModal.type === 'approve' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                : 'bg-gradient-to-r from-red-500 to-red-600'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  {confirmModal.type === 'approve' ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <XCircle className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {confirmModal.type === 'approve' ? 'Aprobă Anunțul' : 'Respinge Anunțul'}
                  </h3>
                  <p className="text-white/80 text-sm truncate max-w-[250px]">{confirmModal.productTitle}</p>
                </div>
              </div>
            </div>
            
            {/* Contenido */}
            <div className="p-6">
              {confirmModal.type === 'approve' ? (
                <p className="text-gray-600">
                  Anunțul va fi publicat și vizibil pentru toți utilizatorii. Ești sigur că vrei să aprobi acest anunț?
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Anunțul va fi respins și proprietarul va primi o notificare.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivul respingerii (opțional)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Ex: Imagini neclare, descriere incompletă..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setConfirmModal({ show: false, type: 'approve', productId: '', productTitle: '' });
                  setRejectReason('');
                }}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
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
                className={`flex-1 py-2.5 font-semibold rounded-xl transition-colors ${
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
