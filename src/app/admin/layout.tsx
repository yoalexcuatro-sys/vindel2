'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  LogOut, 
  ShieldCheck, 
  Menu,
  X,
  Globe,
  Megaphone,
  Scale,
  BadgeCheck,
  Loader2,
  HeadphonesIcon
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Escuchar cambios en productos pendientes en tiempo real
  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('status', '==', 'pending')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date();
      const count = snapshot.docs.filter(doc => {
        const data = doc.data();
        if (!data.pendingUntil) return false;
        return data.pendingUntil.toDate() > now;
      }).length;
      setPendingCount(count);
    });
    
    return () => unsubscribe();
  }, []);

  // Simple Admin Guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#13C1AC] mx-auto mb-4" />
          <p className="text-slate-400">Încărcăm panoul de administrare...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', badge: null },
    { icon: ShoppingBag, label: 'Anunțuri', href: '/admin/products', badge: null },
    { icon: ShieldCheck, label: 'Moderare', href: '/admin/moderation', badge: pendingCount > 0 ? pendingCount : null },
    { icon: HeadphonesIcon, label: 'Suport', href: '/admin/suport', badge: null },
    { icon: Megaphone, label: 'Marketing', href: '/admin/promotions', badge: null },
    { icon: Users, label: 'Utilizatori', href: '/admin/users', badge: null },
    { icon: Globe, label: 'SEO & Config', href: '/admin/seo', badge: null },
    { icon: Scale, label: 'Legal & GDPR', href: '/admin/legal', badge: null },
  ];

  return (
    <div className="min-h-screen bg-slate-900 relative">
      {/* Background Waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute top-0 w-full h-64">
          <path fill="#13C1AC" fillOpacity="0.05" d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,144C1248,117,1344,75,1392,53.3L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute top-0 w-full h-48">
          <path fill="#13C1AC" fillOpacity="0.08" d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,128C672,107,768,85,864,90.7C960,96,1056,128,1152,138.7C1248,149,1344,139,1392,133.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* ===== SIDEBAR ===== */}
          <aside className="w-full lg:w-64 shrink-0">
            {/* Mobile toggle */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors mb-4"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#13C1AC]" />
                <span className="text-sm font-medium">Vindel Admin</span>
              </div>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className={`rounded-2xl overflow-hidden relative bg-slate-800 border border-slate-700 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
              
              {/* Decorative Waves Background in Sidebar */}
              <div className="absolute top-0 left-0 right-0 h-28 overflow-hidden pointer-events-none">
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="absolute w-full h-full">
                  <path d="M0,100 C150,140 350,60 500,100 L500,0 L0,0 Z" className="fill-teal-600/30"></path>
                </svg>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="absolute w-full h-full">
                  <path d="M0,70 C100,110 400,30 500,70 L500,0 L0,0 Z" className="fill-teal-500/20"></path>
                </svg>
              </div>
              
              <div className="p-5 relative z-10">
                {/* Admin Logo/Avatar */}
                <div className="text-center pb-5 border-b border-slate-700">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-3 ring-4 ring-white/20 shadow-lg">
                    <ShieldCheck className="w-9 h-9 text-white" />
                  </div>
                  <h2 className="font-bold text-white text-lg">Vindel Admin</h2>
                  <p className="text-slate-400 text-sm mt-1 truncate px-2">{user?.email}</p>
                  
                  <span className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    <BadgeCheck className="w-4 h-4" />
                    Administrator
                  </span>
                </div>

                {/* Menu */}
                <nav className="mt-5 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-[#13C1AC] text-white shadow-md shadow-[#13C1AC]/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : 'bg-red-500 text-white animate-pulse'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                  
                  <div className="pt-4 mt-4 border-t border-slate-700">
                    <button 
                      onClick={() => auth.signOut()}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Deconectare
                    </button>
                  </div>
                </nav>
              </div>
            </div>
          </aside>

          {/* ===== MAIN CONTENT ===== */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 lg:p-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
