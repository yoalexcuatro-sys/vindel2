'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Settings, 
  BarChart3, 
  LogOut, 
  ShieldCheck, 
  Menu,
  X,
  Globe,
  Megaphone,
  Scale
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      // Contar solo los que aún no se auto-aprobaron
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
      // AQUÍ: En producción, deberías verificar si currentUser.email === 'admin@vindel.ro' 
      // o si tiene un rol de admin en la base de datos.
      // Por ahora permitimos el acceso para que puedas verlo y probarlo.
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading Admin Suite...</div>;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', badge: null },
    { icon: ShoppingBag, label: 'Anunțuri', href: '/admin/products', badge: null },
    { icon: ShieldCheck, label: 'Moderare', href: '/admin/moderation', badge: pendingCount > 0 ? pendingCount : null },
    { icon: Megaphone, label: 'Marketing', href: '/admin/promotions', badge: null },
    { icon: Users, label: 'Utilizatori', href: '/admin/users', badge: null },
    { icon: Globe, label: 'SEO & Config', href: '/admin/seo', badge: null },
    { icon: Scale, label: 'Legal & GDPR', href: '/admin/legal', badge: null },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-white transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 shadow-xl`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-[#13C1AC] p-1.5 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-wide">Vindel Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2 mt-4">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu Principal</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-[#13C1AC] text-white shadow-lg shadow-teal-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span className="font-medium text-sm flex-1">{item.label}</span>
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
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-[#0f172a]">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                    {user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">Admin</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
            </div>
            <button 
                onClick={() => auth.signOut()}
                className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
            >
                <LogOut className="w-4 h-4" />
                <span>Deconectare</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
           <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
             <Menu className="w-6 h-6" />
           </button>
        </header>
        
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
}
