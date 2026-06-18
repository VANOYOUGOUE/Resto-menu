'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginMVPUser } from '@/lib/mvp-db';
import { 
  ChefHat, 
  Lock, 
  Mail, 
  Sparkles, 
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

function SuperLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send empty string as restaurantSlug to query super admin globally
      const result = await loginMVPUser('', email.trim(), password);

      if (result) {
        if (result.user.role !== 'super_admin') {
          setError("Accès refusé. Ce portail est réservé aux Super Administrateurs.");
          setLoading(false);
          return;
        }

        setSuccess(true);
        
        // Redirect to super admin dashboard
        setTimeout(() => {
          router.push(redirectUrl || '/super-admin');
        }, 1000);
      } else {
        setError("Identifiants incorrects ou vous n'êtes pas Super Administrateur.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 glass-morphism shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Decorative glows */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 shadow-inner animate-pulse">
          <ChefHat size={28} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <span>Super Console</span>
          <Sparkles size={16} className="text-amber-500" />
        </h2>
        <p className="text-slate-400 text-xs mt-1">Accès à la plateforme globale Resto-menu</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-2xl bg-red-950/50 border border-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-2.5 animate-shake">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 px-4 py-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
          <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span>Connexion réussie ! Chargement de la console...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Adresse E-mail</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="email" 
              required
              placeholder="ex: superadmin@restomenu.ci"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-950/80 border border-slate-850 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs transition-colors focus:ring-1 focus:ring-amber-500/30"
              disabled={loading || success}
            />
          </div>
        </div>

        {/* Password input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mot de passe</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type={showPassword ? "text" : "password"} 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-11 py-3.5 bg-slate-950/80 border border-slate-850 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs transition-colors focus:ring-1 focus:ring-amber-500/30"
              disabled={loading || success}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || success}
          className="w-full py-4 mt-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl shadow-lg shadow-amber-500/10 transition-all duration-250 active:scale-[0.98] tap-feedback"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Se Connecter en Admin</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function SuperLoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans antialiased relative overflow-hidden">
      {/* Dynamic light glows in background */}
      <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-amber-500/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-indigo-500/5 to-transparent blur-[120px] pointer-events-none" />
      
      <Suspense fallback={
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 glass-morphism shadow-2xl flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <SuperLoginForm />
      </Suspense>
    </div>
  );
}
