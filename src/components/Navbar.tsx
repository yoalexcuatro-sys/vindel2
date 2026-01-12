'use client';

import Link from 'next/link';
import { PlusCircle, MessageCircle, Heart, User, Menu, X } from 'lucide-react';
import { useState, Suspense } from 'react';
import SearchBar from './SearchBar';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              <Link href="/chat" className="group flex flex-col items-center hover:text-[#13C1AC] transition-colors">
                 <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                 <span className="text-xs mt-1 font-medium">Chat</span>
              </Link>
              <button className="group flex flex-col items-center hover:text-[#13C1AC] transition-colors">
                 <Heart className="h-6 w-6 group-hover:scale-110 transition-transform" />
                 <span className="text-xs mt-1 font-medium">Favorite</span>
              </button>
              <Link href="/register" className="group flex flex-col items-center hover:text-[#13C1AC] transition-colors">
                 <User className="h-6 w-6 group-hover:scale-110 transition-transform" />
                 <span className="text-xs mt-1 font-medium">Tu</span>
              </Link>
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
                      <Link href="/chat" className="flex flex-col items-center text-gray-500 hover:text-[#13C1AC]">
                          <MessageCircle className="h-6 w-6 mb-1" />
                          <span className="text-xs">Chat</span>
                      </Link>
                      <button className="flex flex-col items-center text-gray-500 hover:text-[#13C1AC]">
                          <Heart className="h-6 w-6 mb-1" />
                          <span className="text-xs">Favorite</span>
                      </button>
                      <Link href="/register" className="flex flex-col items-center text-gray-500 hover:text-[#13C1AC]">
                          <User className="h-6 w-6 mb-1" />
                          <span className="text-xs">Tu</span>
                      </Link>
                  </div>
              </div>
          </div>
      )}
    </nav>
  );
}
