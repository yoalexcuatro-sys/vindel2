'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingBag, 
  MessageCircle, 
  TrendingUp, 
  Eye, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DashboardStats {
  totalUsers: number;
  activeListings: number;
  pendingListings: number;
  pendingReports: number;
  messagesToday: number;
  totalViews: number;
  dbStatus: 'online' | 'offline' | 'checking';
  apiLatency: number;
}

interface RecentActivity {
  id: string;
  type: 'product' | 'user';
  title: string;
  status: string;
  createdAt: Date;
}

// Helper to format time ago
function timeAgo(date: Date): string {
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
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeListings: 0,
    pendingListings: 0,
    pendingReports: 0,
    messagesToday: 0,
    totalViews: 0,
    dbStatus: 'checking',
    apiLatency: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const startTime = performance.now();
      let dbStatus: 'online' | 'offline' = 'offline';
      
      try {
        // Fetch users
        const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(10)));
        dbStatus = 'online'; // If we got here, DB is online
        const totalUsers = usersSnap.size;
        const recentUsers: RecentActivity[] = usersSnap.docs.slice(0, 5).map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'user' as const,
            title: `Utilizator nou înregistrat: ${data.name || data.email || 'Anonim'}`,
            status: 'Verificat',
            createdAt: data.createdAt?.toDate() || new Date()
          };
        });

        // Fetch all products
        const productsSnap = await getDocs(query(collection(db, 'products'), orderBy('publishedAt', 'desc'), limit(10)));
        const products = productsSnap.docs.map(doc => doc.data());
        
        // Count active and pending
        const activeListings = products.filter(p => p.status === 'active' || !p.status).length;
        const pendingListings = products.filter(p => p.status === 'pending').length;

        const recentProducts: RecentActivity[] = productsSnap.docs.slice(0, 5).map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: 'product' as const,
            title: `Anunț nou: ${data.title || 'Fără titlu'}`,
            status: data.status === 'pending' ? 'În așteptare' : 'Publicat',
            createdAt: data.publishedAt?.toDate() || new Date()
          };
        });

        // Merge and sort by date
        const allActivity = [...recentUsers, ...recentProducts]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 8);

        setRecentActivity(allActivity);

        // Fetch reports count
        const reportsQuery = query(
          collection(db, 'reports'),
          where('status', '==', 'pending')
        );
        const reportsSnap = await getDocs(reportsQuery);
        const pendingReports = reportsSnap.size;

        // Fetch messages from today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const messagesSnap = await getDocs(collection(db, 'messages'));
        const messagesToday = messagesSnap.docs.filter(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate();
          return createdAt && createdAt >= today;
        }).length;

        // Calculate total views from all products
        const allProductsSnap = await getDocs(collection(db, 'products'));
        const totalViews = allProductsSnap.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.views || 0);
        }, 0);

        const apiLatency = Math.round(performance.now() - startTime);

        setStats({
          totalUsers,
          activeListings,
          pendingListings,
          pendingReports,
          messagesToday,
          totalViews,
          dbStatus,
          apiLatency
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, dbStatus: 'offline' }));
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard General</h1>
          <p className="text-gray-500 text-sm mt-1">Privire de ansamblu asupra platformei Vindel.ro</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className={`w-2 h-2 rounded-full ${stats.dbStatus === 'online' ? 'bg-green-500' : stats.dbStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span>{stats.dbStatus === 'online' ? 'Sistem Operațional' : stats.dbStatus === 'checking' ? 'Se verifică...' : 'Offline'}</span>
        </div>
      </div>

      {/* Stats Grid - 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Utilizatori" 
          value={loading ? '...' : stats.totalUsers.toLocaleString()} 
          subtitle="Conturi înregistrate"
          icon={Users} 
          color="blue"
        />
        <StatCard 
          title="Anunțuri" 
          value={loading ? '...' : stats.activeListings.toLocaleString()} 
          subtitle="Active pe platformă"
          icon={ShoppingBag} 
          color="emerald"
        />
        <StatCard 
          title="Mesaje Azi" 
          value={loading ? '...' : stats.messagesToday.toLocaleString()} 
          subtitle="Conversații"
          icon={MessageCircle} 
          color="purple"
        />
        <StatCard 
          title="Vizualizări" 
          value={loading ? '...' : stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}k` : stats.totalViews.toString()} 
          subtitle="Total anunțuri"
          icon={Eye} 
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#13C1AC]" />
            Activitate Recentă
          </h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Se încarcă...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  📭
                </div>
                Nu există activitate recentă
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${
                    activity.type === 'product' ? 'bg-emerald-50' : 'bg-blue-50'
                  }`}>
                     {activity.type === 'product' ? '📦' : '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-gray-900 truncate">
                       {activity.title}
                     </p>
                     <p className="text-xs text-gray-400 mt-0.5">{timeAgo(activity.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                    activity.status === 'În așteptare' 
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                     {activity.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
           {/* Pending Approvals */}
           <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                 <AlertCircle className="w-5 h-5 text-amber-500" />
                 Acțiuni Rapide
              </h2>
              <div className="space-y-3">
                <Link 
                  href="/admin/moderation"
                  className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100 hover:border-amber-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📋</span>
                    <div>
                      <span className="text-amber-900 font-semibold block text-sm">Anunțuri noi</span>
                      <span className="text-amber-600 text-xs">{loading ? '...' : stats.pendingListings} în așteptare</span>
                    </div>
                  </div>
                  <span className="text-amber-500 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                
                <Link 
                  href="/admin/moderation?tab=reports"
                  className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 hover:border-red-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🚨</span>
                    <div>
                      <span className="text-red-900 font-semibold block text-sm">Rapoarte</span>
                      <span className="text-red-600 text-xs">{loading ? '...' : stats.pendingReports} de rezolvat</span>
                    </div>
                  </div>
                  <span className="text-red-500 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
           </div>

           {/* System Status */}
           <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                 <CheckCircle className={`w-5 h-5 ${stats.dbStatus === 'online' ? 'text-emerald-400' : stats.dbStatus === 'checking' ? 'text-yellow-400' : 'text-red-400'}`} />
                 Status Sistem
              </h2>
              <div className="space-y-3 text-sm">
                 <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Database</span>
                    <span className={`font-mono text-xs px-2 py-1 rounded ${
                      stats.dbStatus === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 
                      stats.dbStatus === 'checking' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {stats.dbStatus === 'checking' ? 'CHECKING' : stats.dbStatus.toUpperCase()}
                    </span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Firebase</span>
                    <span className="font-mono text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">ACTIVE</span>
                 </div>
                 <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Latency</span>
                    <span className={`font-mono text-xs px-2 py-1 rounded ${
                      stats.apiLatency < 500 ? 'bg-emerald-500/20 text-emerald-400' : 
                      stats.apiLatency < 1000 ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {loading ? '...' : `${stats.apiLatency}ms`}
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
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    purple: "bg-purple-50 text-purple-600 ring-purple-100",
    orange: "bg-orange-50 text-orange-600 ring-orange-100",
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 group">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colors[color]} ring-4 ring-opacity-50 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
