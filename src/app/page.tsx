'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, QrCode, Monitor, Sparkles, Layers, LayoutDashboard } from 'lucide-react';
export default function Home() {
  const router = useRouter();

  const handleKitchenRedirect = () => {
    router.push('/login?redirect=/kitchen');
  };

  const handleAdminRedirect = () => {
    router.push('/login?redirect=/admin');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="px-6 py-5 border-b border-slate-900 flex justify-between items-center glass-morphism sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <ChefHat size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
            QuickOrder SaaS
          </span>
        </div>
        <div className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
          MVP Phase 1 & 2
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-12 flex flex-col gap-10 justify-center">
        
        {/* Hero Area */}
        <div className="text-center flex flex-col items-center gap-4 animate-slide-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
            <Sparkles size={12} className="animate-pulse" />
            <span>Démo Interactive d&apos;Évaluation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-slate-100">
            Gérez votre restaurant en <span className="bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">temps réel</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed mt-2">
            Une architecture moderne basée sur Next.js, Tailwind et Supabase avec synchronisation temps réel pour connecter les clients, la cuisine, et le gérant du restaurant.
          </p>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          
          {/* Card: Client QR Simulation */}
          <div className="p-6 rounded-3xl glass-morphism flex flex-col justify-between gap-6 hover:border-slate-800 transition-all group animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/10 border border-amber-600/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform animate-pulse">
                <QrCode size={24} />
              </div>
              <h2 className="text-xl font-bold">1. Espace Client (Scan QR)</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simulez le scan d&apos;un QR code de table. Commandez directement en Franc CFA (FCFA) et envoyez vos requêtes instantanément.
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider block mb-2">Bistro Premium</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push('/table/55555555-5555-5555-5555-555555555501')}
                    className="px-3 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 rounded-xl text-xs font-semibold text-slate-200 transition-colors text-left flex items-center justify-between font-mono"
                  >
                    <span>Table 1</span>
                    <span className="text-[8px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Bistro</span>
                  </button>
                  <button
                    onClick={() => router.push('/table/55555555-5555-5555-5555-555555555502')}
                    className="px-3 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 rounded-xl text-xs font-semibold text-slate-200 transition-colors text-left flex items-center justify-between font-mono"
                  >
                    <span>Table 2</span>
                    <span className="text-[8px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Bistro</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block mb-2">Maquis Cacao</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push('/table/55555555-5555-5555-5555-666666666601')}
                    className="px-3 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 rounded-xl text-xs font-semibold text-slate-200 transition-colors text-left flex items-center justify-between font-mono"
                  >
                    <span>Table A</span>
                    <span className="text-[8px] text-indigo-450 bg-indigo-500/10 px-1.5 py-0.5 rounded">Cacao</span>
                  </button>
                  <button
                    onClick={() => router.push('/table/55555555-5555-5555-5555-666666666602')}
                    className="px-3 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 rounded-xl text-xs font-semibold text-slate-200 transition-colors text-left flex items-center justify-between font-mono"
                  >
                    <span>Table B</span>
                    <span className="text-[8px] text-indigo-450 bg-indigo-500/10 px-1.5 py-0.5 rounded">Cacao</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Kitchen Console */}
          <div className="p-6 rounded-3xl glass-morphism flex flex-col justify-between gap-6 hover:border-slate-800 transition-all group animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Monitor size={24} />
              </div>
              <h2 className="text-xl font-bold">2. Espace Cuisine (Console)</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gérez la préparation des commandes et répondez aux appels de service (serveur ou note) en direct avec alertes sonores.
              </p>
            </div>

            <button
              onClick={handleKitchenRedirect}
              className="w-full mt-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 tap-feedback shadow-lg shadow-blue-600/10 cursor-pointer"
            >
              <Monitor size={16} />
              <span>Ouvrir la Console Cuisine</span>
            </button>
          </div>

          {/* Card: Admin Dashboard */}
          <div className="p-6 rounded-3xl glass-morphism flex flex-col justify-between gap-6 hover:border-slate-800 transition-all group animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <LayoutDashboard size={24} />
              </div>
              <h2 className="text-xl font-bold">3. Espace Gérant (Admin)</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Suivez les indicateurs clés (KPIs), gérez la carte du menu (CRUD + photos) et générez les QR codes uniques de vos tables.
              </p>
            </div>

            <button
              onClick={handleAdminRedirect}
              className="w-full mt-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 tap-feedback shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <LayoutDashboard size={16} />
              <span>Accéder à l&apos;Administration</span>
            </button>
          </div>

        </div>

        {/* Info Block */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-900 text-xs text-slate-400 flex gap-4 items-start max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Layers className="text-amber-500 flex-shrink-0" size={18} />
          <div>
            <span className="font-semibold text-slate-300 block mb-1">Architecture hybride Supabase / LocalStorage</span>
            Cette application fonctionne de façon transparente en mode connecté (via Supabase) ou déconnecté (via stockage local). Ouvrez les trois volets simultanément pour tester les interactions temps réel !
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500 bg-slate-950">
        © 2026 QuickOrder SaaS • Tous droits réservés.
      </footer>
    </div>
  );
}
