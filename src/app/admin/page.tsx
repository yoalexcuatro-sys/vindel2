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
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeListings: 0,
    pendingListings: 0,
    pendingReports: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch users count
        const usersSnap = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnap.size;

        // Fetch all products
        const productsSnap = await getDocs(collection(db, 'products'));
        const products = productsSnap.docs.map(doc => doc.data());
        
        // Count active and pending
        const activeListings = products.filter(p => p.status === 'active' || !p.status).length;
        const pendingListings = products.filter(p => p.status === 'pending').length;

        // Fetch reports count
        const reportsQuery = query(
          collection(db, 'reports'),
          where('status', '==', 'pending')
        );
        const reportsSnap = await getDocs(reportsQuery);
        const pendingReports = reportsSnap.size;

        setStats({
          totalUsers,
          activeListings,
          pendingListings,
          pendingReports
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard General</h1>
        <p className="text-gray-500">Privire de ansamblu asupra platformei Vindel.ro</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Utilizatori Totali" 
          value={loading ? '...' : stats.totalUsers.toLocaleString()} 
          trend="+12%" 
          trendUp={true} 
          icon={Users} 
          color="blue"
        />
        <StatCard 
          title="Anunțuri Active" 
          value={loading ? '...' : stats.activeListings.toLocaleString()} 
          trend="+5%" 
          trendUp={true} 
          icon={ShoppingBag} 
          color="emerald"
        />
        <StatCard 
          title="Mesaje Azi" 
          value="342" 
          trend="+24%" 
          trendUp={true} 
          icon={MessageCircle} 
          color="purple"
        />
        <StatCard 
          title="Vizuale Totale" 
          value="45.2k" 
          trend="+18%" 
          trendUp={true} 
          icon={Eye} 
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            Activitate Recentă
          </h2>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                   {i % 2 === 0 ? '🛒' : '👤'}
                </div>
                <div>
                   <p className="text-sm font-medium text-gray-900">
                     {i % 2 === 0 ? 'Anunț nou: iPhone X 256GB' : 'Utilizator nou înregistrat: Marian Popescu'}
                   </p>
                   <p className="text-xs text-gray-500 mt-1">Acum {i * 15} minute</p>
                </div>
                <span className="ml-auto text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                   {i % 2 === 0 ? 'Publicat' : 'Verificat'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-6">
           {/* Pending Approvals */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                 <AlertCircle className="w-5 h-5 text-amber-500" />
                 De Aprobat
              </h2>
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100 mb-3">
                 <span className="text-amber-900 font-medium">
                   {loading ? '...' : stats.pendingListings} Anunțuri noi
                 </span>
                 <Link 
                   href="/admin/moderation"
                   className="text-xs font-bold bg-white px-3 py-1.5 rounded shadow-sm hover:shadow text-amber-600 transition-shadow"
                 >
                    Verifică
                 </Link>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                 <span className="text-red-900 font-medium">
                   {loading ? '...' : stats.pendingReports} Rapoarte
                 </span>
                 <Link 
                   href="/admin/moderation?tab=reports"
                   className="text-xs font-bold bg-white px-3 py-1.5 rounded shadow-sm hover:shadow text-red-600 transition-shadow"
                 >
                    Rezolvă
                 </Link>
              </div>
           </div>
              </div>
           </div>

           {/* System Status */}
           <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <CheckCircle className="w-5 h-5 text-emerald-400" />
                 System Status
              </h2>
              <div className="space-y-3 text-sm text-slate-300">
                 <div className="flex justify-between">
                    <span>Database</span>
                    <span className="text-emerald-400 font-mono">ONLINE</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Storage (Firebase)</span>
                    <span className="text-emerald-400 font-mono">34% Used</span>
                 </div>
                 <div className="flex justify-between">
                    <span>API Latency</span>
                    <span className="text-emerald-400 font-mono">24ms</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, trendUp, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trend}
        </span>
      </div>
      <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
