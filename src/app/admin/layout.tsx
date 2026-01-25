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
  HeadphonesIcon,
  Home
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Marcar como montado después de la hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // No mostrar nada hasta que estemos montados (evita hydration mismatch)
  if (!mounted || loading) {
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
    { icon: Home, label: 'Vindel.ro', href: '/', badge: null },
  ];

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-x-hidden">
      {/* Background Waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute top-0 w-full h-64">
          <path fill="#13C1AC" fillOpacity="0.05" d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,144C1248,117,1344,75,1392,53.3L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute top-0 w-full h-48">
          <path fill="#13C1AC" fillOpacity="0.08" d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,128C672,107,768,85,864,90.7C960,96,1056,128,1152,138.7C1248,149,1344,139,1392,133.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>

      {/* Mobile Header - Fixed at top */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#13C1AC] to-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Vindel Admin</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors active:scale-95"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sheet Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)} 
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      {/* Mobile Bottom Sheet Menu */}
      <div className={`lg:hidden fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${
        sidebarOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="bg-slate-800 rounded-t-3xl border-t border-slate-700 max-h-[85vh] overflow-hidden">
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-slate-600" />
          </div>
          
          {/* Header */}
          <div className="px-5 pb-4 border-b border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#13C1AC] to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-white text-lg">Panel Admin</h2>
                <p className="text-slate-400 text-sm truncate">{user?.email}</p>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <BadgeCheck className="w-3 h-3" />
                Admin
              </span>
            </div>
          </div>
          
          {/* Menu Grid */}
          <div className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-140px)]">
            <div className="grid grid-cols-4 gap-4 mb-5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSidebarOpen(false);
                    }}
                    className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl text-center transition-all active:scale-95 aspect-square ${
                      isActive
                        ? 'bg-gradient-to-br from-[#13C1AC] to-teal-600 text-white shadow-lg shadow-teal-500/30'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-white/20' : 'bg-slate-600/50'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium leading-tight line-clamp-1">{item.label}</span>
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold px-1 rounded-full bg-red-500 text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={() => {
                setSidebarOpen(false);
                auth.signOut();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors active:scale-[0.98]"
            >
              <LogOut className="w-5 h-5" />
              Deconectare
            </button>
          </div>
          
          {/* Safe area padding for iOS */}
          <div className="h-6 bg-slate-800" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-16 lg:pt-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          
          {/* ===== SIDEBAR (Desktop Only) ===== */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="rounded-2xl overflow-hidden relative bg-slate-800 border border-slate-700 sticky top-8">
              
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
              <div className="p-4 sm:p-6 lg:p-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
