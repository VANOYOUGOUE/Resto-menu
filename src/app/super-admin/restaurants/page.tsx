'use client';

import React, { useEffect, useState } from 'react';
import { 
  getMVPRestaurants, 
  addMVPRestaurant, 
  updateMVPRestaurantSubscription, 
  Restaurant 
} from '@/lib/mvp-db';
import { 
  Building2, 
  Plus, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  Clock,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  X,
  Search
} from 'lucide-react';

export default function RestaurantsManagementPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadRestaurants = async () => {
    try {
      const data = await getMVPRestaurants();
      // Filter out system platform restaurant
      setRestaurants(data.filter(r => r.slug !== 'resto-menu'));
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du chargement des restaurants.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setFormError("Veuillez remplir tous les champs.");
      return;
    }

    // Basic slug validation
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug.trim())) {
      setFormError("Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets (ex: bistro-premium).");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const newRest = await addMVPRestaurant(name.trim(), slug.trim().toLowerCase());
      if (newRest) {
        setRestaurants(prev => [...prev, newRest]);
        showToast(`Restaurant ${name} créé avec essai gratuit de 7 jours !`);
        setName('');
        setSlug('');
        setIsModalOpen(false);
      } else {
        setFormError("Erreur lors de la création.");
      }
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (restaurantId: string, currentStatus: Restaurant['subscription_status']) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const success = await updateMVPRestaurantSubscription(restaurantId, nextStatus);
      if (success) {
        setRestaurants(prev => 
          prev.map(r => r.id === restaurantId ? { ...r, subscription_status: nextStatus } : r)
        );
        showToast(`Statut mis à jour : ${nextStatus === 'suspended' ? 'Suspendu' : 'Activé'}`);
      } else {
        showToast("Impossible de mettre à jour le statut.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Une erreur est survenue.", "error");
    }
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Restaurant['subscription_status'], trialEndsAt?: string) => {
    const now = Date.now();
    const isTrialExpired = status === 'trialing' && trialEndsAt && new Date(trialEndsAt).getTime() < now;

    if (status === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle size={10} />
          <span>Suspendu</span>
        </span>
      );
    }

    if (isTrialExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
          <AlertTriangle size={10} />
          <span>Essai Expiré</span>
        </span>
      );
    }

    if (status === 'trialing') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Clock size={10} />
          <span>Essai Gratuit</span>
        </span>
      );
    }

    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={10} />
          <span>Actif</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
        <span>{status}</span>
      </span>
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-slide-up">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold border ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/20'
              : 'bg-red-950/90 text-red-300 border-red-500/20'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle size={18} className="text-red-400 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={10} />
            <span>Gestion de la Plateforme</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase font-sans">Restaurants Partenaires</h1>
          <p className="text-slate-400 text-xs mt-1">Créez et configurez les comptes des établissements et contrôlez leurs abonnements</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-3 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 rounded-2xl shadow-lg shadow-amber-500/10 transition-all duration-200 active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Créer un Restaurant</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch">
        <div className="relative flex-grow max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-900/30 border border-slate-900 rounded-2xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs transition-colors"
          />
        </div>
      </div>

      {/* Restaurants List Table */}
      <div className="rounded-3xl bg-slate-900/10 border border-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
            <span>Chargement des établissements...</span>
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Nom & Identifiant</th>
                  <th className="py-4 px-6">Statut</th>
                  <th className="py-4 px-6">Fin Période d'Essai</th>
                  <th className="py-4 px-6">Validité Abonnement</th>
                  <th className="py-4 px-6 text-right">Accès Dashboard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50 text-slate-300 text-xs">
                {filteredRestaurants.map((rest) => {
                  const isSuspended = rest.subscription_status === 'suspended';
                  return (
                    <tr key={rest.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-450 shrink-0">
                            <Building2 size={16} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-200 truncate">{rest.name}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{rest.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(rest.subscription_status, rest.trial_ends_at)}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                        {formatDate(rest.trial_ends_at)}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                        {formatDate(rest.subscription_ends_at)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end items-center">
                          <button
                            onClick={() => handleToggleStatus(rest.id, rest.subscription_status)}
                            className="p-1.5 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                            title={isSuspended ? "Débloquer l'accès" : "Suspendre l'accès"}
                          >
                            {isSuspended ? (
                              <div className="flex items-center gap-1 text-red-500 font-bold text-[10px] uppercase">
                                <span>Bloqué</span>
                                <ToggleLeft size={24} className="text-red-500 animate-pulse" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-emerald-500 font-bold text-[10px] uppercase">
                                <span>Autorisé</span>
                                <ToggleRight size={24} className="text-emerald-500" />
                              </div>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
            <Building2 size={40} className="opacity-30 text-amber-500" />
            <p className="text-xs font-semibold uppercase tracking-wider">Aucun restaurant trouvé</p>
          </div>
        )}
      </div>

      {/* Create Restaurant Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-850 flex justify-between items-center bg-slate-950/20 backdrop-blur-md">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <PlusCircle size={18} className="text-amber-500" />
                <span>Nouveau Restaurant Partenaire</span>
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError(null);
                }}
                className="w-9 h-9 rounded-2xl bg-slate-850 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateRestaurant} className="p-6 overflow-y-auto flex flex-col gap-5">
              
              {formError && (
                <div className="px-4 py-3 rounded-2xl bg-red-950/50 border border-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-2 animate-shake">
                  <AlertTriangle size={15} className="text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nom de l'établissement</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Le Kilimandjaro, Chez Awa..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    const val = e.target.value
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "") // remove accents
                      .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
                      .replace(/\s+/g, "-") // collapse whitespace to dashes
                      .replace(/-+/g, "-"); // collapse multiple dashes
                    setSlug(val);
                  }}
                  className="w-full px-4 py-3.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs transition-colors"
                  disabled={submitting}
                />
              </div>

              {/* Slug input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Identifiant Unique (Slug URL)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: le-kilimandjaro"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  className="w-full px-4 py-3.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs transition-colors font-mono"
                  disabled={submitting}
                />
                <span className="text-[9px] text-slate-500 leading-normal block font-sans">
                  Sera utilisé pour les connexions et URLs (ex : `http://.../r/{slug}`)
                </span>
              </div>

              {/* Submit Area */}
              <div className="mt-4 flex gap-3 pt-4 border-t border-slate-900/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-3.5 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                  disabled={submitting}
                >
                  Annuler
                </button>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <span>Créer le restaurant</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
