'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Shield, ShieldOff, Mail, Calendar, CheckCircle, XCircle, Crown } from 'lucide-react';
import Image from 'next/image';
import { collection, query, limit, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserProfile {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    createdAt: any;
    role?: 'user' | 'admin';
    status?: 'active' | 'banned';
    accountType?: 'personal' | 'business';
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), limit(50));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleToggleStatus = async (uid: string, currentStatus?: string) => {
      const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
      if(!confirm(`Confirmi ${newStatus === 'banned' ? 'blocarea' : 'deblocarea'} acestui utilizator?`)) return;

      // Optimistic
      setUsers(prev => prev.map(u => u.uid === uid ? {...u, status: newStatus} : u));

      try {
          await updateDoc(doc(db, 'users', uid), { status: newStatus });
      } catch (e) {
          console.error("Failed", e);
      }
  };

  const handleToggleRole = async (uid: string, currentRole?: string) => {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      if(!confirm(`Ești sigur că vrei să setezi acest utilizator ca ${newRole === 'admin' ? 'ADMINISTRATOR' : 'UTILIZATOR'}?`)) return;

      // Optimistic update
      setUsers(prev => prev.map(u => u.uid === uid ? {...u, role: newRole} : u));

      try {
          await updateDoc(doc(db, 'users', uid), { role: newRole });
      } catch (e) {
          console.error("Failed to update role", e);
      }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Utilizatori</h1>
          <p className="text-gray-500">Administrare conturi și permisiuni</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Caută utilizatori..."
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
                <th className="px-6 py-4">Utilizator</th>
                <th className="px-6 py-4">Tip Cont</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Data Înregistrării</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                        {user.photoURL ? (
                            <Image 
                                src={user.photoURL} 
                                alt={user.displayName || 'User'} 
                                fill 
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                                {(user.displayName || '?')[0].toUpperCase()}
                            </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.displayName || 'Anonim'}</p>
                        <span className="text-xs text-gray-500 font-mono">ID: {user.uid.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.accountType === 'business' ? (
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-purple-200">
                            Business
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-200">
                            Personal
                        </span>
                    )}
                    {user.role === 'admin' && (
                        <span className="ml-2 inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-orange-200">
                            Admin
                        </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                     <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {user.createdAt?.seconds 
                            ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('ro-RO')
                            : 'N/A'
                        }
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     {user.status === 'banned' ? (
                         <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-200">
                            <XCircle className="w-3 h-3" /> Blocat
                         </span>
                     ) : (
                         <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-200">
                            <CheckCircle className="w-3 h-3" /> Activ
                         </span>
                     )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => handleToggleRole(user.uid, user.role)}
                            title={user.role === 'admin' ? "Elimină drepturi Admin" : "Promovează la Admin"}
                            className={`p-2 rounded hover:bg-gray-100 border border-gray-200 transition-colors ${user.role === 'admin' ? 'text-amber-500 bg-amber-50 border-amber-200' : 'text-gray-400'}`}
                        >
                            <Crown className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleToggleStatus(user.uid, user.status)}
                            title={user.status === 'banned' ? "Deblochează" : "Blochează"}
                            className={`p-2 rounded hover:bg-gray-100 border border-gray-200 transition-colors ${user.status === 'banned' ? 'text-green-600' : 'text-red-600'}`}
                        >
                            {user.status === 'banned' ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Nu există utilizatori înregistrați.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
