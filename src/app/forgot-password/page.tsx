'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use our custom API to send beautiful email via Resend
      const response = await fetch('/api/send-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send email');
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.message.includes('not found')) {
        setError('Nu există un cont cu această adresă de email.');
      } else if (err.message.includes('invalid')) {
        setError('Adresa de email nu este validă.');
      } else {
        setError('A apărut o eroare. Încearcă din nou.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          {/* Back Button */}
          <Link 
            href="/login" 
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#13C1AC] transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la autentificare
          </Link>

          {success ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#13C1AC]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-[#13C1AC]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email trimis!</h1>
              <p className="text-gray-500 mb-6">
                Am trimis instrucțiunile de resetare a parolei la adresa <span className="font-medium text-gray-700">{email}</span>
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Verifică și folderul de spam dacă nu găsești emailul.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-[#13C1AC] to-[#0da896] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#13C1AC]/30 hover:shadow-xl hover:shadow-[#13C1AC]/40 hover:-translate-y-0.5"
              >
                Înapoi la autentificare
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              {/* Title */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Ai uitat parola?</h1>
                <p className="text-gray-500 mt-1">Introdu emailul și îți trimitem instrucțiunile</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full pl-10 pr-3 py-3 text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13C1AC]/20 focus:border-[#13C1AC] focus:bg-white outline-none transition-all"
                      placeholder="exemplu@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                    />
                  </div>
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
                  className="w-full py-3 bg-gradient-to-r from-[#13C1AC] to-[#0da896] hover:from-[#0fb9a3] hover:to-[#0a8f7f] text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#13C1AC]/30 hover:shadow-xl hover:shadow-[#13C1AC]/40 hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Se trimite...
                    </>
                  ) : (
                    'Trimite instrucțiunile'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-white/90">
          Nu ai cont?{' '}
          <Link href="/register" className="text-white font-semibold hover:underline">
            Înregistrează-te gratuit
          </Link>
        </p>
        
        {/* Copyright */}
        <p className="text-center mt-4 text-xs text-white/50">
          © 2026 Vindu.ro — Marketplace-ul tău de încredere
        </p>
      </div>
    </div>
  );
}
