'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, MessageCircle, Heart, User, Menu, X, LogOut, Settings, Shield, Bell, Home, Search, Plus } from 'lucide-react';
import { useState, Suspense, useRef, useEffect } from 'react';
import SearchBar from './SearchBar';
import { useAuth } from '@/lib/auth-context';
import { subscribeToUnreadCount } from '@/lib/messages-service';
import { subscribeToUnreadNotifications } from '@/lib/notifications-service';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [hideNavbar, setHideNavbar] = useState(false);
  const { user, userProfile, logout, loading } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isAdminPage = pathname?.startsWith('/admin');
  const isProfilePage = pathname === '/profile';
  const isSearchPage = pathname === '/search';
  
  // Check if current page matches a nav item
  const isActive = (path: string) => pathname === path;

  // Mark as mounted after hydration
  useEffect(() => {
    setMounted(true);
    // Load cached count after mount
    try {
      const cached = sessionStorage.getItem('unread-count-cache');
      if (cached) setUnreadCount(parseInt(cached, 10));
    } catch {}
  }, []);

  // Scroll detection for mobile search bar (only on home page) AND desktop navbar hide/show
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const mobileSearchThreshold = 150;
    const navbarHideThreshold = 100;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Mobile search bar logic (only on home page)
      if (isHomePage) {
        if (currentScrollY > mobileSearchThreshold) {
          setShowMobileSearch(true);
        } else {
          setShowMobileSearch(false);
        }
      } else {
        setShowMobileSearch(false);
      }
      
      // Desktop navbar hide/show logic
      // Hide when scrolling DOWN (currentScrollY > lastScrollY), show when scrolling UP
      if (currentScrollY > navbarHideThreshold) {
        if (currentScrollY > lastScrollY) {
          // Scrolling DOWN - hide navbar on desktop
          setHideNavbar(true);
        } else {
          // Scrolling UP - show navbar on desktop
          setHideNavbar(false);
        }
      } else {
        // Near top - always show
        setHideNavbar(false);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  // Subscribe to unread messages count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      sessionStorage.removeItem('unread-count-cache');
      return;
    }

    const unsubscribe = subscribeToUnreadCount(user.uid, (count) => {
      setUnreadCount(count);
      // Guardar en caché
      try {
        sessionStorage.setItem('unread-count-cache', count.toString());
      } catch {}
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to unread notifications count
  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }

    const unsubscribe = subscribeToUnreadNotifications(user.uid, (count) => {
      setNotificationCount(count);
    });

    return () => unsubscribe();
  }, [user]);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  // Fixed en móvil, fixed en desktop con transición para ocultar/mostrar
  const navbarClasses = `fixed left-0 right-0 top-0 z-50 bg-white border-b border-gray-100 shadow-sm transition-transform duration-300 ${hideNavbar ? 'md:-translate-y-full' : 'md:translate-y-0'}`;

  return (
    <>
    <nav className={navbarClasses}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl sm:text-2xl font-medium text-[#13C1AC] tracking-tight">
              Vindel<span className="font-light opacity-70">.ro</span>
            </Link>
          </div>

          {/* Mobile Search Bar - Appears on scroll */}
          <div 
            className={`md:hidden flex-1 mx-2 sm:mx-3 transition-all duration-300 ${
              showMobileSearch 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 -translate-y-2 pointer-events-none absolute'
            }`}
          >
            {showMobileSearch && (
              <Suspense fallback={<div className="h-9 bg-gray-100 rounded-full w-full animate-pulse" />}>
                <SearchBar variant="navbar" />
              </Suspense>
            )}
          </div>

          {/* Search Bar - Hidden on mobile, visible on md+ */}
          <div className="hidden md:flex flex-1 items-center justify-center px-8">
            <div className="w-full max-w-lg relative z-[100]">
              <Suspense fallback={<div className="h-10 bg-gray-100 rounded-full w-full animate-pulse" />}>
                 <SearchBar variant="navbar" />
              </Suspense>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-6">
            
            {/* CTA Button */}
            <Link href="/publish" className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-[#13C1AC] hover:bg-[#0da896] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13C1AC] shadow-sm hover:shadow-md transition-all">
              <PlusCircle className="h-5 w-5 mr-2" />
              Publică anunț
            </Link>

            {/* Icons */}
            <div className="flex items-center space-x-5 text-gray-500">
              <Link href="/messages" className="group flex flex-col items-center hover:text-[#13C1AC] transition-colors relative">
                 <div className="relative">
                   <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                   {mounted && unreadCount > 0 && (
                     <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                       {unreadCount > 9 ? '9+' : unreadCount}
                     </span>
                   )}
                 </div>
                 <span className="text-xs mt-1 font-medium">Chat</span>
              </Link>
              <Link href="/profile?tab=favorites" className="group flex flex-col items-center hover:text-[#13C1AC] transition-colors">
                 <Heart className="h-6 w-6 group-hover:scale-110 transition-transform" />
                 <span className="text-xs mt-1 font-medium">Favorite</span>
              </Link>
              
              {/* Notifications Bell - Only shown when logged in */}
              {user && (
                <Link href="/profile?tab=notifications" className="group flex flex-col items-center hover:text-[#13C1AC] transition-colors relative">
                  <div className="relative">
                    <Bell className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    {mounted && notificationCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">Notificări</span>
                </Link>
              )}
              
              {/* User Menu */}
              {!loading && (
                user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="group flex flex-col items-center hover:text-[#13C1AC] transition-colors"
                    >
                      {(userProfile?.photoURL || user.photoURL) ? (
                        <Image
                          src={userProfile?.photoURL || user.photoURL || ''}
                          alt={userProfile?.displayName || user.displayName || 'Avatar'}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-[#13C1AC] transition-all"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#13C1AC] flex items-center justify-center text-white text-xs font-medium">
                          {(userProfile?.displayName || user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs mt-1 font-medium truncate max-w-[60px]">
                        {userProfile?.displayName?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Tu'}
                      </span>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || 'Utilizator'}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link 
                          href="/profile" 
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          Profilul meu
                        </Link>
                        <Link 
                          href="/profile?tab=settings" 
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Setări
                        </Link>
                        {userProfile?.role === 'admin' && (
                          <Link 
                            href="/admin" 
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[#13C1AC] hover:bg-[#13C1AC]/10 font-medium"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Shield className="h-4 w-4" />
                            Panel Admin
                          </Link>
                        )}
                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Deconectare
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/login" className="group flex flex-col items-center hover:text-[#13C1AC] transition-colors">
                    <User className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <span className="text-xs mt-1 font-medium">Tu</span>
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-2">
            {/* Chat icon in top bar for mobile */}
            {user && (
              <Link href="/messages" className="relative p-1.5">
                <MessageCircle className="h-5 w-5 text-gray-500" />
                {mounted && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#13C1AC] text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
            {/* Notifications icon in top bar for mobile */}
            {user && (
              <Link href="/profile?tab=notifications" className="relative p-1.5">
                <Bell className="h-5 w-5 text-gray-500" />
                {mounted && notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Link>
            )}
            <button 
                className="p-1.5 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 absolute w-full z-50 shadow-lg">
              <div className="px-4 py-4 space-y-4">
                  <Link 
                    href="/publish" 
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-full text-white bg-[#13C1AC] hover:bg-[#0da896] shadow-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Publică anunț
                  </Link>
                  {user && (
                    <div className="border-t border-gray-100 pt-4 space-y-1">
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        <span className="text-sm font-medium">Profilul meu</span>
                      </Link>
                      <Link 
                        href="/profile?tab=settings" 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-5 w-5" />
                        <span className="text-sm font-medium">Setări</span>
                      </Link>
                      {userProfile?.role === 'admin' && (
                        <Link 
                          href="/admin" 
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#13C1AC] hover:bg-[#13C1AC]/10"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Shield className="h-5 w-5" />
                          <span className="text-sm font-medium">Panel Admin</span>
                        </Link>
                      )}
                      <button 
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-5 w-5" />
                        <span className="text-sm font-medium">Deconectare</span>
                      </button>
                    </div>
                  )}
                  {!user && (
                    <div className="border-t border-gray-100 pt-4">
                      <Link 
                        href="/login" 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        <span className="text-sm font-medium">Autentificare</span>
                      </Link>
                    </div>
                  )}
              </div>
          </div>
      )}
    </nav>
    </>
  );
}
