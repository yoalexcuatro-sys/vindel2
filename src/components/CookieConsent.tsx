'use client';

import { useState, useEffect } from 'react';
import { Cookie, X, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has already accepted cookies
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Small delay to avoid layout shift on page load
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      acceptedAt: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      acceptedAt: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  if (!mounted || !showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] animate-fadeIn" />
      
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-slideUp">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#13C1AC] to-emerald-500 rounded-xl flex items-center justify-center">
                <Cookie className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  🍪 Folosim cookie-uri
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Utilizăm cookie-uri pentru a îmbunătăți experiența ta pe site, a analiza traficul și a personaliza conținutul. 
                  Poți accepta toate cookie-urile sau doar pe cele necesare.
                </p>
              </div>
            </div>

            {/* Details Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-4 flex items-center gap-2 text-sm text-[#13C1AC] hover:text-[#0fa89a] font-medium transition-colors"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetails ? 'Ascunde detalii' : 'Află mai multe despre cookie-uri'}
            </button>

            {/* Cookie Details */}
            {showDetails && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Cookie-uri necesare</p>
                    <p className="text-xs text-gray-500">Esențiale pentru funcționarea site-ului. Nu pot fi dezactivate.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Cookie-uri analitice</p>
                    <p className="text-xs text-gray-500">Ne ajută să înțelegem cum folosești site-ul pentru a-l îmbunătăți.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Cookie-uri de marketing</p>
                    <p className="text-xs text-gray-500">Utilizate pentru a afișa reclame relevante pentru tine.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={acceptNecessary}
              className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm sm:text-base"
            >
              Doar necesare
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#13C1AC] to-emerald-500 text-white font-semibold rounded-xl hover:from-[#10a593] hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/25 text-sm sm:text-base"
            >
              Acceptă toate
            </button>
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 pb-4 flex items-center justify-center gap-4 text-xs text-gray-400">
            <Link href="/cookies" className="hover:text-[#13C1AC] transition-colors flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Politica de cookie-uri
            </Link>
            <span>•</span>
            <Link href="/confidentialitate" className="hover:text-[#13C1AC] transition-colors">
              Confidențialitate
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}
