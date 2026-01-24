'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oobCode = searchParams.get('oobCode');
    
    if (!oobCode) {
      setStatus('error');
      setError('Link invalid. Nu s-a găsit codul de verificare.');
      return;
    }

    const verifyEmail = async () => {
      try {
        await applyActionCode(auth, oobCode);
        setStatus('success');
        
        // Reload the user to update emailVerified status
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }
      } catch (err: any) {
        console.error('Verification error:', err);
        setStatus('error');
        
        if (err.code === 'auth/invalid-action-code') {
          setError('Link-ul de verificare a expirat sau a fost deja folosit.');
        } else if (err.code === 'auth/expired-action-code') {
          setError('Link-ul de verificare a expirat. Solicită un nou email de verificare.');
        } else {
          setError('A apărut o eroare la verificarea email-ului.');
        }
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#13C1AC] via-[#0fb9a3] to-[#0a8f7f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Waves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute bottom-0 left-0 w-full h-64" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path 
            className="animate-[wave_8s_ease-in-out_infinite]"
            fill="rgba(255,255,255,0.1)" 
            d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <path 
            className="animate-[wave_6s_ease-in-out_infinite_reverse]"
            fill="rgba(255,255,255,0.07)" 
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>
      
      {/* Floating circles */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-white/5 rounded-full animate-[float_6s_ease-in-out_infinite] blur-xl"></div>
      <div className="absolute bottom-20 left-5 w-56 h-56 bg-white/5 rounded-full animate-[float_8s_ease-in-out_infinite_reverse] blur-lg"></div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-[slideUp_0.6s_ease-out]">
        {/* Logo */}
        <div className="text-center mb-6 animate-[fadeInDown_0.8s_ease-out]">
          <Link href="/" className="inline-block text-3xl font-bold text-white drop-shadow-lg">
            Vindel<span className="font-light opacity-80">.ro</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          
          {/* Verifying State */}
          {status === 'verifying' && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#13C1AC] to-[#0a8f7f] rounded-full flex items-center justify-center animate-pulse">
                  <Mail className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Se verifică...</h2>
              <p className="text-gray-500 mb-6">Așteptăm confirmarea adresei de email.</p>
              <Loader2 className="w-8 h-8 animate-spin text-[#13C1AC] mx-auto" />
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-[scaleIn_0.5s_ease-out]">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Email verificat! 🎉</h2>
              <p className="text-gray-500 mb-6">
                Adresa ta de email a fost confirmată cu succes. 
                Acum ai acces la toate funcționalitățile Vindel.
              </p>
              
              {/* Benefits */}
              <div className="bg-green-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-medium text-green-800 mb-2">✓ Acum poți:</p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Publica anunțuri pe platformă</li>
                  <li>• Contacta alți utilizatori</li>
                  <li>• Primi notificări importante</li>
                </ul>
              </div>
              
              <Link
                href="/profile"
                className="inline-block w-full py-3 bg-gradient-to-r from-[#13C1AC] to-[#0fb9a3] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
              >
                Mergi la profilul tău
              </Link>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Verificare eșuată</h2>
              <p className="text-gray-500 mb-6">{error}</p>
              
              <div className="space-y-3">
                <Link
                  href="/profile"
                  className="inline-block w-full py-3 bg-gradient-to-r from-[#13C1AC] to-[#0fb9a3] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  Solicită un nou email
                </Link>
                <Link
                  href="/"
                  className="inline-block w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all duration-300"
                >
                  Înapoi la pagina principală
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#13C1AC] to-[#0a8f7f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
