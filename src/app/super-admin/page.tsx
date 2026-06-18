'use client';

import React, { useEffect, useState } from 'react';
import { getMVPRestaurants, Restaurant } from '@/lib/mvp-db';
import { 
  Building2, 
  CreditCard, 
  Users, 
  ShieldAlert, 
  Sparkles,
  Loader2,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getMVPRestaurants();
        // Filtrer le restaurant plateforme systeme pour ne compter que les vrais restaurants
        const realRestaurants = data.filter(r => r.slug !== 'resto-menu');
        setRestaurants(realRestaurants);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate stats
  const totalRestaurants = restaurants.length;
  
  const activeRestaurants = restaurants.filter(
    r => r.subscription_status === 'active' || 
    (r.subscription_status === 'trialing' && r.trial_ends_at && new Date(r.trial_ends_at).getTime() > Date.now())
  ).length;

  const suspendedRestaurants = restaurants.filter(
    r => r.subscription_status === 'suspended' || 
    r.subscription_status === 'past_due' ||
    (r.subscription_status === 'trialing' && r.trial_ends_at && new Date(r.trial_ends_at).getTime() <= Date.now())
  ).length;

  // Global Revenue (20 000 FCFA for each 'active' status restaurant)
  const activePaidRestaurants = restaurants.filter(r => r.subscription_status === 'active').length;
  const globalRevenue = activePaidRestaurants * 20000;

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
        <span>Chargement des indicateurs globaux...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Title Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-2 animate-pulse">
          <Sparkles size={10} />
          <span>Plateforme Resto-menu</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">Tableau de Bord Global</h1>
        <p className="text-slate-400 text-xs mt-1">Aperçu analytique de l'activité commerciale du SaaS</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI: Global Revenue */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-900 glass-morphism relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Revenu Global Mensuel</span>
              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                {globalRevenue.toLocaleString('fr-FR')} FCFA
              </span>
              <span className="text-[10px] text-slate-450 mt-1 block">
                Basé sur {activePaidRestaurants} abonnement(s) payant(s)
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CreditCard size={18} />
            </div>
          </div>
        </div>

        {/* KPI: Active Restaurants */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-900 glass-morphism relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Établissements Actifs</span>
              <span className="text-2xl font-black text-amber-500 font-mono tracking-tight">
                {activeRestaurants} / {totalRestaurants}
              </span>
              <span className="text-[10px] text-slate-450 mt-1 block">
                Essai valide ou abonnement à jour
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Building2 size={18} />
            </div>
          </div>
        </div>

        {/* KPI: Expired / Suspended */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-900 glass-morphism relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Établissements Bloqués</span>
              <span className="text-2xl font-black text-red-400 font-mono tracking-tight">
                {suspendedRestaurants}
              </span>
              <span className="text-[10px] text-slate-450 mt-1 block">
                Abonnement expiré ou accès suspendus
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert size={18} />
            </div>
          </div>
        </div>

      </div>

      {/* Quick Status list */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2">
          Vue d'ensemble rapide des status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Calendar size={13} className="text-amber-500" />
              <span>Abonnement Mensuel</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Le tarif standard de la plateforme est fixé à **20 000 FCFA / mois** par restaurant. Tout nouveau restaurant créé bénéficie d'une période d'essai gratuit de **7 jours**.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-red-400" />
              <span>Vérification RLS / Guards</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dès qu'un établissement dépasse sa date d'essai sans s'abonner, ou si son accès est manuellement suspendu par vos soins, les consoles cuisine et menus clients sont instantanément verrouillés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
