'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Shield, ShieldOff, Mail, Calendar, CheckCircle, XCircle, Crown, LayoutGrid, List, X, Eye, Package, Flag, Clock, MapPin, Phone, Building2, User, ExternalLink, Bell, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { collection, query, limit, getDocs, doc, updateDoc, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAdminUsers } from '@/lib/swr-hooks';
import { mutate } from 'swr';

interface UserProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    createdAt: any;
    role?: 'user' | 'admin';
    status?: 'active' | 'banned';
    accountType?: 'personal' | 'business';
    phone?: string;
    location?: string;
    companyName?: string;
    promotionEnabled?: boolean;
}

interface UserProduct {
    id: string;
    title: string;
    price: number;
    currency?: string;
    images?: string[];
    status?: string;
    createdAt?: any;
    views?: number;
}

interface UserReport {
    id: string;
    reason: string;
    reportedBy: string;
    createdAt: any;
    status?: string;
}

interface UserNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: any;
}

export default function AdminUsers() {
  const searchParams = useSearchParams();
  const uidParam = searchParams.get('uid');
  
  const { data: users = [], isLoading: loading } = useAdminUsers();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Auto-open user modal if uid param is provided
  useEffect(() => {
    if (uidParam && users.length > 0 && !selectedUser) {
      const userToOpen = users.find(u => u.uid === uidParam);
      if (userToOpen) {
        openUserDetail(userToOpen);
      }
    }
  }, [uidParam, users]);

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.companyName?.toLowerCase().includes(query)
    );
  });

  const handleToggleStatus = async (uid: string, currentStatus?: string) => {
      const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
      if(!confirm(`Confirmi ${newStatus === 'banned' ? 'blocarea' : 'deblocarea'} acestui utilizator?`)) return;

      // Optimistic update via SWR mutate
      mutate('admin-users', 
        users.map(u => u.uid === uid ? {...u, status: newStatus} : u),
        false
      );

      try {
          await updateDoc(doc(db, 'users', uid), { status: newStatus });
      } catch (e) {
          console.error("Failed", e);
          // Revalidate on error
          mutate('admin-users');
      }
  };

  const handleToggleRole = async (uid: string, currentRole?: string) => {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      if(!confirm(`Ești sigur că vrei să setezi acest utilizator ca ${newRole === 'admin' ? 'ADMINISTRATOR' : 'UTILIZATOR'}?`)) return;

      // Optimistic update via SWR mutate
      mutate('admin-users', 
        users.map(u => u.uid === uid ? {...u, role: newRole} : u),
        false
      );

      try {
          await updateDoc(doc(db, 'users', uid), { role: newRole });
      } catch (e) {
          console.error("Failed to update role", e);
          // Revalidate on error
          mutate('admin-users');
      }
  };

  const handleDeleteNotification = async (notificationId: string) => {
      if(!confirm('Ștergi această notificare?')) return;
      
      // Optimistic update
      setUserNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      try {
          await deleteDoc(doc(db, 'notifications', notificationId));
      } catch (e) {
          console.error("Failed to delete notification", e);
          alert('Eroare la ștergerea notificării');
      }
  };

  const handleDeleteAllNotifications = async (userId: string) => {
      if(!confirm('Ștergi TOATE notificările acestui utilizator?')) return;
      
      const notificationIds = userNotifications.map(n => n.id);
      
      // Optimistic update
      setUserNotifications([]);
      
      try {
          await Promise.all(notificationIds.map(id => deleteDoc(doc(db, 'notifications', id))));
      } catch (e) {
          console.error("Failed to delete all notifications", e);
          alert('Eroare la ștergerea notificărilor');
      }
  };

  const openUserDetail = async (user: UserProfile) => {
    setSelectedUser(user);
    setDetailLoading(true);
    setUserProducts([]);
    setUserReports([]);
    setUserNotifications([]);
    
    try {
      // Fetch user's products
      const productsQuery = query(
        collection(db, 'products'), 
        where('userId', '==', user.uid),
        limit(20)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const products = productsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as UserProduct));
      setUserProducts(products);
      
      // Fetch reports against this user
      const reportsQuery = query(
        collection(db, 'reports'), 
        where('reportedUserId', '==', user.uid),
        limit(10)
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      const reports = reportsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as UserReport));
      setUserReports(reports);
      
      // Fetch user's notifications
      const notificationsQuery = query(
        collection(db, 'notifications'), 
        where('userId', '==', user.uid),
        limit(50)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notifications = notificationsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as UserNotification));
      // Sort by date descending
      notifications.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setUserNotifications(notifications);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeUserDetail = () => {
    setSelectedUser(null);
    setUserProducts([]);
    setUserReports([]);
    setUserNotifications([]);
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );
  }

  return (
    <div className="relative">
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
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Utilizatori</h1>
            <p className="text-gray-500 text-sm mt-1">Administrare conturi și permisiuni</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
               <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                      type="text" 
                      placeholder="Caută utilizatori..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#13C1AC] focus:border-transparent shadow-sm"
                  />
               </div>
               {/* View Toggle */}
               <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-[#13C1AC] text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-[#13C1AC] text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
               </div>
          </div>
        </div>
      </div>

      {/* Users - Grid or List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.uid} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-gray-200 transition-all">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden shrink-0">
                  {user.photoURL ? (
                    <Image 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      fill 
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-lg">
                      {(user.displayName || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{user.displayName || 'Anonim'}</h3>
                    {user.role === 'admin' && (
                      <span className="shrink-0 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {user.createdAt?.seconds 
                      ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('ro-RO')
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {user.accountType === 'business' ? (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md text-xs font-medium">
                      Business
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-xs font-medium">
                      Personal
                    </span>
                  )}
                  {user.status === 'banned' ? (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Blocat
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Activ
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => openUserDetail(user)}
                    title="Ver detalles"
                    className="p-1.5 rounded-lg transition-colors bg-[#13C1AC]/10 text-[#13C1AC] hover:bg-[#13C1AC]/20"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleToggleRole(user.uid, user.role)}
                    title={user.role === 'admin' ? "Elimină Admin" : "Fă Admin"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      user.role === 'admin' 
                        ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(user.uid, user.status)}
                    title={user.status === 'banned' ? "Deblochează" : "Blochează"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      user.status === 'banned' 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-red-500 hover:bg-red-100'
                    }`}
                  >
                    {user.status === 'banned' ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilizator</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tip</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Înregistrat</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden shrink-0">
                          {user.photoURL ? (
                            <Image 
                              src={user.photoURL} 
                              alt={user.displayName || 'User'} 
                              fill 
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">
                              {(user.displayName || '?')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate">{user.displayName || 'Anonim'}</span>
                            {user.role === 'admin' && (
                              <span className="shrink-0 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.accountType === 'business' ? (
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md text-xs font-medium">
                          Business
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-xs font-medium">
                          Personal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.status === 'banned' ? (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md text-xs font-medium inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Blocat
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-xs font-medium inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Activ
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {user.createdAt?.seconds 
                        ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('ro-RO')
                        : 'N/A'
                      }
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openUserDetail(user)}
                          title="Ver detalles"
                          className="p-1.5 rounded-lg transition-colors bg-[#13C1AC]/10 text-[#13C1AC] hover:bg-[#13C1AC]/20"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleRole(user.uid, user.role)}
                          title={user.role === 'admin' ? "Elimină Admin" : "Fă Admin"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.role === 'admin' 
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(user.uid, user.status)}
                          title={user.status === 'banned' ? "Deblochează" : "Blochează"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.status === 'banned' 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                              : 'bg-gray-100 text-red-500 hover:bg-red-100'
                          }`}
                        >
                          {user.status === 'banned' ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {filteredUsers.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
            👥
          </div>
          <p className="text-gray-500">Nu există utilizatori înregistrați.</p>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeUserDetail}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-[#13C1AC] to-teal-500 p-6 pb-16">
              <button 
                onClick={closeUserDetail}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl bg-white/20 overflow-hidden shrink-0 border-4 border-white/30">
                  {selectedUser.photoURL ? (
                    <Image 
                      src={selectedUser.photoURL} 
                      alt={selectedUser.displayName || 'User'} 
                      fill 
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-3xl">
                      {(selectedUser.displayName || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-white">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{selectedUser.displayName || 'Anonim'}</h2>
                    {selectedUser.role === 'admin' && (
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">ADMIN</span>
                    )}
                  </div>
                  <p className="text-white/80 mt-1">{selectedUser.email}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedUser.createdAt?.seconds 
                        ? new Date(selectedUser.createdAt.seconds * 1000).toLocaleDateString('ro-RO', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'N/A'
                      }
                    </span>
                    {selectedUser.accountType === 'business' ? (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" /> Business
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" /> Personal
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Bar */}
            <div className="relative -mt-8 mx-6">
              <div className="bg-white rounded-xl shadow-lg p-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{userProducts.length}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Package className="w-3 h-3" /> Anunțuri
                  </div>
                </div>
                <div className="text-center border-x border-gray-100">
                  <div className="text-2xl font-bold text-gray-900">{userReports.length}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Flag className="w-3 h-3" /> Rapoarte
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {userProducts.reduce((acc, p) => acc + (p.views || 0), 0)}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Eye className="w-3 h-3" /> Vizualizări
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13C1AC]"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" /> Informații Cont
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">ID Utilizator</span>
                          <span className="text-gray-900 font-mono text-xs">{selectedUser.uid.slice(0, 12)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status</span>
                          {selectedUser.status === 'banned' ? (
                            <span className="text-red-600 font-medium">Blocat</span>
                          ) : (
                            <span className="text-green-600 font-medium">Activ</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Rol</span>
                          <span className="text-gray-900 capitalize">{selectedUser.role || 'user'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tip Cont</span>
                          <span className="text-gray-900 capitalize">{selectedUser.accountType || 'personal'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Contact
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Email</span>
                          <span className="text-gray-900">{selectedUser.email || 'N/A'}</span>
                        </div>
                        {selectedUser.phone && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Telefon</span>
                            <span className="text-gray-900">{selectedUser.phone}</span>
                          </div>
                        )}
                        {selectedUser.location && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Locație</span>
                            <span className="text-gray-900">{selectedUser.location}</span>
                          </div>
                        )}
                        {selectedUser.companyName && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Companie</span>
                            <span className="text-gray-900">{selectedUser.companyName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* User Products */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Anunțuri Publicate ({userProducts.length})
                    </h3>
                    {userProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {userProducts.map((product) => (
                          <div 
                            key={product.id} 
                            className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
                          >
                            <div className="relative w-14 h-14 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                              {product.images?.[0] ? (
                                <Image 
                                  src={product.images[0]} 
                                  alt={product.title} 
                                  fill 
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate text-sm">{product.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                <span className="font-semibold text-[#13C1AC]">{product.price?.toLocaleString('ro-RO')} {product.currency === 'EUR' ? '€' : 'Lei'}</span>
                                {product.views !== undefined && (
                                  <span className="flex items-center gap-0.5">
                                    <Eye className="w-3 h-3" /> {product.views}
                                  </span>
                                )}
                              </div>
                            </div>
                            <a 
                              href={`/product/${product.id}`} 
                              target="_blank"
                              className="p-2 rounded-lg bg-white text-gray-400 hover:text-[#13C1AC] transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 text-sm">
                        Acest utilizator nu are anunțuri publicate.
                      </div>
                    )}
                  </div>
                  
                  {/* Reports */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Flag className="w-4 h-4" /> Rapoarte Primite ({userReports.length})
                    </h3>
                    {userReports.length > 0 ? (
                      <div className="space-y-2">
                        {userReports.map((report) => (
                          <div 
                            key={report.id} 
                            className="flex items-center justify-between bg-red-50 rounded-xl p-3"
                          >
                            <div>
                              <p className="text-sm text-gray-900">{report.reason}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {report.createdAt?.seconds 
                                  ? new Date(report.createdAt.seconds * 1000).toLocaleDateString('ro-RO')
                                  : 'N/A'
                                }
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              report.status === 'resolved' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {report.status === 'resolved' ? 'Rezolvat' : 'În așteptare'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 text-sm">
                        Nu există rapoarte pentru acest utilizator.
                      </div>
                    )}
                  </div>
                  
                  {/* Notifications */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Notificări ({userNotifications.length})
                      </h3>
                      {userNotifications.length > 0 && (
                        <button
                          onClick={() => handleDeleteAllNotifications(selectedUser.uid)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Șterge toate
                        </button>
                      )}
                    </div>
                    {userNotifications.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {userNotifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`flex items-start justify-between gap-3 rounded-xl p-3 ${
                              notification.read ? 'bg-gray-50' : 'bg-blue-50'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  notification.type === 'report_received' 
                                    ? 'bg-orange-100 text-orange-700'
                                    : notification.type === 'report_resolved'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {notification.type}
                                </span>
                                {!notification.read && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-900 mt-1">{notification.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {notification.createdAt?.seconds 
                                  ? new Date(notification.createdAt.seconds * 1000).toLocaleString('ro-RO')
                                  : 'N/A'
                                }
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                              title="Șterge notificarea"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-500 text-sm">
                        Nu există notificări pentru acest utilizator.
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => {
                        handleToggleRole(selectedUser.uid, selectedUser.role);
                        closeUserDetail();
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedUser.role === 'admin'
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Crown className="w-4 h-4 inline mr-1" />
                      {selectedUser.role === 'admin' ? 'Elimină Admin' : 'Fă Admin'}
                    </button>
                    <button 
                      onClick={() => {
                        handleToggleStatus(selectedUser.uid, selectedUser.status);
                        closeUserDetail();
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedUser.status === 'banned'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {selectedUser.status === 'banned' ? (
                        <><Shield className="w-4 h-4 inline mr-1" /> Deblochează</>
                      ) : (
                        <><ShieldOff className="w-4 h-4 inline mr-1" /> Blochează</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
