'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Building2, Mail, Lock, Eye, EyeOff, MapPin, Briefcase, Phone, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { localidades } from '@/data/localidades';

type AccountType = 'personal' | 'business';

export default function RegisterPage() {
  const router = useRouter();
  const { user, signUp, signInWithGoogle, loading } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', businessName: '', cui: '', location: '',
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user && !loading) {
      router.push('/profile');
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password.length < 6) {
      setError('Parola trebuie să aibă minim 6 caractere.');
      setIsLoading(false);
      return;
    }

    try {
      await signUp(formData.email, formData.password, {
        displayName: accountType === 'personal' ? formData.name : formData.businessName,
        phone: formData.phone,
        location: formData.location,
        accountType,
        businessName: accountType === 'business' ? formData.businessName : undefined,
        cui: accountType === 'business' ? formData.cui : undefined,
      });
      
      // Send welcome email
      try {
        await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: formData.email, 
            name: accountType === 'personal' ? formData.name : formData.businessName 
          }),
        });
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr);
        // Don't block registration if email fails
      }
      
      router.push('/profile');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Acest email este deja folosit.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Adresa de email nu este validă.');
      } else if (err.code === 'auth/weak-password') {
        setError('Parola este prea slabă. Folosește minim 6 caractere.');
      } else {
        setError('A apărut o eroare. Încearcă din nou.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
      router.push('/profile');
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      // Don't show error if user closed the popup
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError('Nu s-a putut conecta cu Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#13C1AC]/5 to-[#13C1AC]/10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#13C1AC]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#13C1AC] via-[#0fb9a3] to-[#0a8f7f] flex items-center justify-center p-4 py-8 relative overflow-hidden">
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
          <path 
            className="animate-[wave_10s_ease-in-out_infinite]"
            fill="rgba(255,255,255,0.04)" 
            d="M0,288L48,272C96,256,192,224,288,218.7C384,213,480,235,576,245.3C672,256,768,256,864,240C960,224,1056,192,1152,186.7C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>
      
      {/* Floating circles */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-white/5 rounded-full animate-[float_6s_ease-in-out_infinite] blur-xl"></div>
      <div className="absolute bottom-20 left-5 w-56 h-56 bg-white/5 rounded-full animate-[float_8s_ease-in-out_infinite_reverse] blur-lg"></div>
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-white/10 rounded-full animate-[float_5s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-1/3 right-1/4 w-20 h-20 bg-white/10 rounded-full animate-[float_7s_ease-in-out_infinite_reverse]"></div>
      <div className="absolute top-1/2 right-5 w-16 h-16 bg-white/15 rounded-full animate-[float_9s_ease-in-out_infinite]"></div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-[slideUp_0.6s_ease-out]">
        {/* Logo */}
        <div className="text-center mb-5 animate-[fadeInDown_0.8s_ease-out]">
          <Link href="/" className="inline-block text-3xl font-bold text-white drop-shadow-lg">
            Vindel<span className="font-light opacity-80">.ro</span>
          </Link>
        </div>

        {/* Glass Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-6 sm:p-8 border border-white/20">
          {/* Title */}
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold text-gray-900">Creează un cont</h1>
            <p className="text-gray-500 mt-1">Începe să vinzi în câteva minute</p>
          </div>
          {/* Account Type Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            <button
              type="button"
              onClick={() => setAccountType('personal')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                accountType === 'personal' ? 'bg-[#13C1AC] text-white shadow-sm' : 'text-gray-500'
              }`}
            >
              <User className="h-4 w-4" />
              Persoană fizică
            </button>
            <button
              type="button"
              onClick={() => setAccountType('business')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                accountType === 'business' ? 'bg-[#13C1AC] text-white shadow-sm' : 'text-gray-500'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Firmă
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name / Business Name */}
            {accountType === 'personal' ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Nume complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    name="name" 
                    type="text" 
                    required 
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13C1AC]/20 focus:border-[#13C1AC] focus:bg-white outline-none transition-all" 
                    placeholder="Ion Popescu" 
                    value={formData.name} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Denumire firmă</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      name="businessName" 
                      type="text" 
                      required 
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13C1AC]/20 focus:border-[#13C1AC] focus:bg-white outline-none transition-all" 
                      placeholder="SC Exemplu SRL" 
                      value={formData.businessName} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">CUI / CIF</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      name="cui" 
                      type="text" 
                      required 
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13C1AC]/20 focus:border-[#13C1AC] focus:bg-white outline-none transition-all" 
                      placeholder="RO12345678" 
                      value={formData.cui} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  name="email" 
                  type="email" 
                  required 
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13C1AC]/20 focus:border-[#13C1AC] focus:bg-white outline-none transition-all" 
                  placeholder="exemplu@email.com" 
                  value={formData.email} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Telefon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  name="phone" 
                  type="tel" 
                  required 
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13C1AC]/20 focus:border-[#13C1AC] focus:bg-white outline-none transition-all" 
                  placeholder="0722 123 456" 
                  value={formData.phone} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            {/* Location & Password */}
            <div className="grid grid-cols-2 gap-3">
              <div ref={locationRef} className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Localitate</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    name="location" 
                    type="text" 
                    required 
                    autoComplete="off"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13C1AC]/20 focus:border-[#13C1AC] focus:bg-white outline-none transition-all" 
                    placeholder="București, Cluj..." 
                    value={formData.location} 
                    onChange={handleChange}
                    onFocus={() => setShowLocationSuggestions(true)}
                  />
                </div>
                {showLocationSuggestions && formData.location.length >= 2 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {localidades
                      .filter(loc => 
                        loc.ciudad.toLowerCase().includes(formData.location.toLowerCase()) ||
                        loc.judet.toLowerCase().includes(formData.location.toLowerCase())
                      )
                      .slice(0, 6)
                      .map(loc => (
                        <button
                          key={`${loc.ciudad}-${loc.judet}`}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, location: `${loc.ciudad}, ${loc.judet}` });
                            setShowLocationSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                        >
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-700">{loc.ciudad}</span>
                          <span className="text-xs text-gray-400">{loc.judet}</span>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Parolă</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    name="password" 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13C1AC]/20 focus:border-[#13C1AC] focus:bg-white outline-none transition-all" 
                    placeholder="Min. 6 caractere" 
                    value={formData.password} 
                    onChange={handleChange} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" required className="mt-0.5 w-4 h-4 text-[#13C1AC] rounded border-gray-300" />
                <span className="text-xs text-gray-600">
                  Sunt de acord cu <Link href="/termeni" className="text-[#13C1AC] hover:underline">termenii</Link> și <Link href="/confidentialitate" className="text-[#13C1AC] hover:underline">politica de confidențialitate</Link>
                </span>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-[#13C1AC] to-[#0da896] hover:from-[#0fb9a3] hover:to-[#0a8f7f] text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#13C1AC]/30 hover:shadow-xl hover:shadow-[#13C1AC]/40 hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se creează contul...
                </>
              ) : (
                'Creează cont'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white/95 text-xs text-gray-400 uppercase tracking-wide">sau continuă cu</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md text-sm font-medium transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button 
              type="button"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 bg-[#1877F2] text-white rounded-xl hover:bg-[#166fe5] hover:shadow-md text-sm font-medium transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
          </div>

          {/* Business benefits */}
          {accountType === 'business' && (
            <div className="mt-4 p-3 bg-[#13C1AC]/10 rounded-xl border border-[#13C1AC]/20">
              <p className="text-xs font-medium text-gray-700 mb-2">Beneficii cont firmă:</p>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-600">
                <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-[#13C1AC] rounded-full"></span>Facturare TVA</span>
                <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-[#13C1AC] rounded-full"></span>Profil verificat</span>
                <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-[#13C1AC] rounded-full"></span>Gestiune stoc</span>
                <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-[#13C1AC] rounded-full"></span>Suport prioritar</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-white/90">
          Ai deja cont?{' '}
          <Link href="/login" className="text-white font-semibold hover:underline">
            Autentifică-te
          </Link>
        </p>
        
        {/* Copyright */}
        <p className="text-center mt-4 text-xs text-white/50">
          © 2026 Vindel.ro — Marketplace-ul tău de încredere
        </p>
      </div>
    </div>
  );
}
