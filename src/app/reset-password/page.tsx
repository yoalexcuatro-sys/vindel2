'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, KeyRound, ShieldCheck } from 'lucide-react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [invalidCode, setInvalidCode] = useState(false);

  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setInvalidCode(true);
        setIsVerifying(false);
        return;
      }

      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setIsVerifying(false);
      } catch (err) {
        console.error('Invalid or expired code:', err);
        setInvalidCode(true);
        setIsVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Parola trebuie să aibă minim 6 caractere.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Parolele nu coincid.');
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode!, password);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/expired-action-code') {
        setError('Linkul a expirat. Solicită un nou link de resetare.');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('Linkul nu este valid sau a fost deja folosit.');
      } else if (err.code === 'auth/weak-password') {
        setError('Parola este prea slabă. Folosește o parolă mai puternică.');
      } else {
        setError('A apărut o eroare. Încearcă din nou.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-500'];
  const strengthLabels = ['Foarte slabă', 'Slabă', 'Medie', 'Bună', 'Puternică'];

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
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-white/10 rounded-full animate-[float_5s_ease-in-out_infinite]"></div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-[slideUp_0.6s_ease-out]">
        {/* Logo */}
        <div className="text-center mb-6 animate-[fadeInDown_0.8s_ease-out]">
          <Link href="/" className="inline-block text-3xl font-bold text-white drop-shadow-lg">
            Vindu<span className="font-light opacity-80">.ro</span>
          </Link>
        </div>

        {/* Glass Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-8 border border-white/20">
          {isVerifying ? (
            /* Loading State */
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-[#13C1AC] mx-auto mb-4" />
              <p className="text-gray-500">Se verifică linkul...</p>
            </div>
          ) : invalidCode ? (
            /* Invalid Code State */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Link invalid</h1>
              <p className="text-gray-500 mb-6">
                Acest link de resetare a parolei a expirat sau nu este valid.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-[#13C1AC] to-[#0da896] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#13C1AC]/30 hover:shadow-xl hover:shadow-[#13C1AC]/40 hover:-translate-y-0.5"
              >
                Solicită un nou link
              </Link>
            </div>
          ) : success ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#13C1AC]/20 to-[#13C1AC]/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-[scaleIn_0.5s_ease-out]">
                <ShieldCheck className="h-10 w-10 text-[#13C1AC]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Parolă schimbată!</h1>
              <p className="text-gray-500 mb-6">
                Parola ta a fost resetată cu succes. Acum te poți autentifica cu noua parolă.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-[#13C1AC] to-[#0da896] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#13C1AC]/30 hover:shadow-xl hover:shadow-[#13C1AC]/40 hover:-translate-y-0.5"
              >
                Autentifică-te
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#13C1AC]/20 to-[#13C1AC]/5 rounded-2xl flex items-center justify-center">
                  <KeyRound className="h-8 w-8 text-[#13C1AC]" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Creează o parolă nouă</h1>
                <p className="text-gray-500 mt-1 text-sm">
                  pentru <span className="font-medium text-gray-700">{email}</span>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Parolă nouă</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-10 pr-10 py-3 text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13C1AC]/20 focus:border-[#13C1AC] focus:bg-white outline-none transition-all"
                      placeholder="Min. 6 caractere"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Password Strength */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-1 flex-1 rounded-full transition-all ${
                              i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${passwordStrength < 3 ? 'text-orange-500' : 'text-green-600'}`}>
                        Putere: {strengthLabels[passwordStrength - 1] || 'Foarte slabă'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirmă parola</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className={`w-full pl-10 pr-10 py-3 text-sm bg-gray-50/80 border rounded-xl focus:ring-2 focus:ring-[#13C1AC]/20 focus:border-[#13C1AC] focus:bg-white outline-none transition-all ${
                        confirmPassword && confirmPassword !== password 
                          ? 'border-red-300 bg-red-50/50' 
                          : confirmPassword && confirmPassword === password
                          ? 'border-green-300 bg-green-50/50'
                          : 'border-gray-200'
                      }`}
                      placeholder="Repetă parola"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Parolele coincid
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || password.length < 6 || password !== confirmPassword}
                  className="w-full py-3 bg-gradient-to-r from-[#13C1AC] to-[#0da896] hover:from-[#0fb9a3] hover:to-[#0a8f7f] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#13C1AC]/30 hover:shadow-xl hover:shadow-[#13C1AC]/40 hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Se salvează...
                    </>
                  ) : (
                    'Salvează parola nouă'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Copyright */}
        <p className="text-center mt-6 text-xs text-white/50">
          © 2026 Vindu.ro — Marketplace-ul tău de încredere
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#13C1AC] via-[#0fb9a3] to-[#0a8f7f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
