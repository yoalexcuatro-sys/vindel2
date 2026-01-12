'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, MessageCircle, Heart, User, Menu, X, LogOut, Settings } from 'lucide-react';
import { useState, Suspense, useRef, useEffect } from 'react';
import SearchBar from './SearchBar';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, userProfile, logout, loading } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-[#13C1AC]">
              Vindel.ro
            </Link>
          </div>

          {/* Search Bar - Hidden on mobile, visible on md+ */}
          <div className="hidden md:flex flex-1 items-center justify-center px-8">
            <div className="w-full max-w-lg relative">
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
              <Link href="/messages" className="group flex flex-col items-center hover:text-[#13C1AC] transition-colors">
                 <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                 <span className="text-xs mt-1 font-medium">Chat</span>
              </Link>
              <button className="group flex flex-col items-center hover:text-[#13C1AC] transition-colors">
                 <Heart className="h-6 w-6 group-hover:scale-110 transition-transform" />
                 <span className="text-xs mt-1 font-medium">Favorite</span>
              </button>
              
              {/* User Menu */}
              {!loading && (
                user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="group flex flex-col items-center hover:text-[#13C1AC] transition-colors"
                    >
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt={user.displayName || 'Avatar'}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-[#13C1AC] transition-all"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#13C1AC] flex items-center justify-center text-white text-xs font-medium">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs mt-1 font-medium truncate max-w-[60px]">
                        {user.displayName?.split(' ')[0] || 'Tu'}
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
                          href="/profile" 
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          Setări
                        </Link>
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
          <div className="flex items-center md:hidden">
            <button 
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>
      
      {/* Search Bar for Mobile - Below header */}
      <div className="md:hidden px-4 py-2 pb-3 bg-white border-t border-gray-100">
          <Suspense fallback={<div className="h-10 bg-gray-100 rounded-full w-full animate-pulse" />}>
              <SearchBar variant="navbar" />
          </Suspense>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 absolute w-full z-50 shadow-lg">
              <div className="px-4 py-4 space-y-4">
                  <Link href="/publish" className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-full text-white bg-[#13C1AC] hover:bg-[#0da896] shadow-sm">
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Publică anunț
                  </Link>
                  <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                      <Link href="/messages" className="flex flex-col items-center text-gray-500 hover:text-[#13C1AC]">
                          <MessageCircle className="h-6 w-6 mb-1" />
                          <span className="text-xs">Chat</span>
                      </Link>
                      <button className="flex flex-col items-center text-gray-500 hover:text-[#13C1AC]">
                          <Heart className="h-6 w-6 mb-1" />
                          <span className="text-xs">Favorite</span>
                      </button>
                      {user ? (
                        <Link href="/profile" className="flex flex-col items-center text-gray-500 hover:text-[#13C1AC]">
                          <User className="h-6 w-6 mb-1" />
                          <span className="text-xs">Profil</span>
                        </Link>
                      ) : (
                        <Link href="/login" className="flex flex-col items-center text-gray-500 hover:text-[#13C1AC]">
                          <User className="h-6 w-6 mb-1" />
                          <span className="text-xs">Tu</span>
                        </Link>
                      )}
                  </div>
                  {user && (
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border-t border-gray-100 mt-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Deconectare
                    </button>
                  )}
              </div>
          </div>
      )}
    </nav>
  );
}
