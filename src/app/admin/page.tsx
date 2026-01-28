'use client';

import { useState, useEffect } from 'react';
import { 
  Users,
  ShoppingBag,
  MessageCircle,
  Eye,
  TrendingUp, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useAdminStats } from '@/lib/swr-hooks';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper to format time ago
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Acum';
  if (diffMins < 60) return `Acum ${diffMins} minute`;
  if (diffHours < 24) return `Acum ${diffHours} ore`;
  return `Acum ${diffDays} zile`;
}

export default function AdminDashboard() {
  const { data: stats, isLoading: loading } = useAdminStats();
  const [pendingCount, setPendingCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  
  // Cargar contadores de pendientes y reportes
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Contar anuncios pendientes (solo los que aún no expiraron)
        const pendingQ = query(
          collection(db, 'products'), 
          where('status', '==', 'pending')
        );
        const pendingSnap = await getDocs(pendingQ);
        const now = new Date();
        const validPending = pendingSnap.docs.filter(doc => {
          const data = doc.data();
          // Si no tiene pendingUntil, es un producto viejo que necesita revisión
          if (!data.pendingUntil) return true;
          // Si tiene pendingUntil y aún no expiró, necesita revisión
          return data.pendingUntil.toDate() > now;
        });
        setPendingCount(validPending.length);
        
        // Contar reportes pendientes
        const reportsQ = query(
          collection(db, 'reports'), 
          where('status', '==', 'pending')
        );
        const reportsSnap = await getDocs(reportsQ);
        setReportsCount(reportsSnap.size);
      } catch (e) {
        console.error('Error fetching counts', e);
      }
    };
    fetchCounts();
  }, []);
  
  const dbStatus = stats?.dbStatus || 'checking';
  const totalUsers = stats?.totalUsers || 0;
  const totalProducts = stats?.totalProducts || 0;
  const totalMessages = stats?.totalMessages || 0;
  const totalViews = stats?.totalViews || 0;
  const apiLatency = stats?.apiLatency || 0;
  const recentActivity = stats?.recentActivity || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile optimized */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-[11px] sm:text-sm mt-0.5 truncate">Privire de ansamblu Vindu.ro</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full sm:rounded-lg border border-gray-200 shadow-sm">
          <div className={`w-2 h-2 rounded-full ${dbStatus === 'online' ? 'bg-green-500 shadow-sm shadow-green-500/50' : dbStatus === 'checking' ? 'bg-yellow-500 animate-pulse shadow-sm shadow-yellow-500/50' : 'bg-red-500 shadow-sm shadow-red-500/50'}`}></div>
          <span className="text-gray-600 font-medium">{dbStatus === 'online' ? 'Online' : dbStatus === 'checking' ? '...' : 'Offline'}</span>
        </div>
      </div>

      {/* Stats Grid - Horizontal scroll on mobile, grid on desktop */}
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 snap-x snap-mandatory scrollbar-hide">
          <StatCard 
            title="Utilizatori" 
            value={loading ? '...' : totalUsers.toLocaleString()} 
            subtitle="Conturi înregistrate"
            icon={Users} 
            color="blue"
          />
          <StatCard 
            title="Anunțuri" 
            value={loading ? '...' : totalProducts.toLocaleString()} 
            subtitle="Active pe platformă"
            icon={ShoppingBag} 
            color="emerald"
          />
          <StatCard 
            title="Vizualizări" 
            value={loading ? '...' : totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews.toString()} 
            subtitle="Total anunțuri"
            icon={Eye} 
            color="orange"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#13C1AC] to-teal-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              Activitate Recentă
            </h2>
          </div>
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="text-center text-gray-500 py-8 text-sm">
                <div className="w-8 h-8 border-2 border-[#13C1AC] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Se încarcă...
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">
                  📭
                </div>
                <p className="text-sm font-medium">Nu există activitate recentă</p>
                <p className="text-xs text-gray-400 mt-1">Activitatea va apărea aici</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all active:scale-[0.99]">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 text-lg sm:text-xl shadow-sm ${
                    activity.type === 'product' ? 'bg-gradient-to-br from-emerald-100 to-emerald-50' : 'bg-gradient-to-br from-blue-100 to-blue-50'
                  }`}>
                     {activity.type === 'product' ? '📦' : '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-semibold text-gray-900 truncate">
                       {activity.title}
                     </p>
                     <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                       <span className="truncate">{activity.type === 'product' ? 'Anunț nou' : 'Înregistrare'}</span>
                       <span className="text-gray-300">•</span>
                       <span className="shrink-0 text-gray-400">{timeAgo(activity.time)}</span>
                     </p>
                  </div>
                  <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0 ${
                    activity.type === 'product' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                  }`}>
                     {activity.type === 'product' ? 'Anunț' : 'User'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
           {/* Quick Actions */}
           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  Acțiuni Rapide
                </h2>
              </div>
              <div className="p-3 space-y-2">
                <Link 
                  href="/admin/moderation"
                  className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50 hover:border-amber-300 hover:shadow-md transition-all group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md">
                      <span className="text-lg">📋</span>
                    </div>
                    <div>
                      <span className="text-gray-900 font-semibold block text-sm">Anunțuri noi</span>
                      <span className="text-amber-600 text-xs">Necesită moderare</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingCount > 0 && (
                      <span className="bg-amber-500 text-white text-xs font-bold py-1 px-2.5 rounded-lg shadow-sm animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                    <span className="text-amber-500 text-lg group-hover:translate-x-1 transition-transform">›</span>
                  </div>
                </Link>
                
                <Link 
                  href="/admin/moderation?tab=reports"
                  className="flex items-center justify-between p-3.5 bg-gradient-to-r from-red-50 to-red-100/50 rounded-xl border border-red-200/50 hover:border-red-300 hover:shadow-md transition-all group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-md">
                      <span className="text-lg">🚨</span>
                    </div>
                    <div>
                      <span className="text-gray-900 font-semibold block text-sm">Rapoarte</span>
                      <span className="text-red-600 text-xs">Sesizări utilizatori</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {reportsCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold py-1 px-2.5 rounded-lg shadow-sm animate-pulse">
                        {reportsCount}
                      </span>
                    )}
                    <span className="text-red-500 text-lg group-hover:translate-x-1 transition-transform">›</span>
                  </div>
                </Link>
              </div>
           </div>

           {/* System Status */}
           <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl overflow-hidden text-white shadow-xl">
              <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dbStatus === 'online' ? 'bg-emerald-500/20' : dbStatus === 'checking' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                    <CheckCircle className={`w-4 h-4 ${dbStatus === 'online' ? 'text-emerald-400' : dbStatus === 'checking' ? 'text-yellow-400' : 'text-red-400'}`} />
                  </div>
                  Status Sistem
                </h2>
              </div>
              <div className="p-4 space-y-3">
                 <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-slate-300 text-sm">Database</span>
                    </div>
                    <span className={`font-mono text-xs px-2.5 py-1 rounded-lg font-semibold ${
                      dbStatus === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 
                      dbStatus === 'checking' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {dbStatus === 'checking' ? 'CHECK' : dbStatus.toUpperCase()}
                    </span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                      <span className="text-slate-300 text-sm">Firebase</span>
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg font-semibold bg-emerald-500/20 text-emerald-400">ACTIVE</span>
                 </div>
                 <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      <span className="text-slate-300 text-sm">Latency</span>
                    </div>
                    <span className={`font-mono text-xs px-2.5 py-1 rounded-lg font-semibold ${
                      apiLatency < 500 ? 'bg-emerald-500/20 text-emerald-400' : 
                      apiLatency < 1000 ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {loading ? '...' : `${apiLatency}ms`}
                    </span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colors: any = {
    blue: { bg: "bg-gradient-to-br from-blue-500 to-blue-600", light: "bg-blue-50", text: "text-blue-600" },
    emerald: { bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", light: "bg-emerald-50", text: "text-emerald-600" },
    purple: { bg: "bg-gradient-to-br from-purple-500 to-purple-600", light: "bg-purple-50", text: "text-purple-600" },
    orange: { bg: "bg-gradient-to-br from-orange-500 to-orange-600", light: "bg-orange-50", text: "text-orange-600" },
  };

  return (
    <div className="min-w-[140px] sm:min-w-0 snap-start bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 group">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${colors[color].bg} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
          <p className="text-sm font-semibold text-gray-700">{title}</p>
          <p className="text-[11px] text-gray-400 truncate">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}