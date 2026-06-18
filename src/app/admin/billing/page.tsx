'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getCurrentSession, 
  isRestaurantSubscriptionValid,
  updateMVPRestaurantSubscription, 
  getMVPRestaurantById,
  Restaurant
} from '@/lib/mvp-db';
import { 
  CreditCard, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Smartphone, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BillingPage() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'orange' | 'mtn' | 'wave' | 'card'>('wave');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadRestaurantData = async () => {
    const session = getCurrentSession();
    if (!session) {
      router.push('/login?redirect=/admin/billing');
      return;
    }
    try {
      const data = await getMVPRestaurantById(session.restaurant.id);
      if (data) {
        setRestaurant(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurantData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getDaysRemaining = (dateStr?: string) => {
    if (!dateStr) return 0;
    const diffTime = new Date(dateStr).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    if (paymentMethod !== 'card' && !phoneNumber.trim()) {
      showToast("Veuillez saisir votre numéro de téléphone Mobile Money.", "error");
      return;
    }

    if (paymentMethod === 'card' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
      showToast("Veuillez remplir toutes les informations de votre carte.", "error");
      return;
    }

    setSubmittingPayment(true);

    // Simulate Payment processing delay
    setTimeout(async () => {
      try {
        let baseDate = Date.now();
        if (restaurant.subscription_status === 'active' && restaurant.subscription_ends_at) {
          const currentEnd = new Date(restaurant.subscription_ends_at).getTime();
          if (currentEnd > Date.now()) {
            baseDate = currentEnd;
          }
        }
        
        const newEndsAt = new Date(baseDate + 30 * 24 * 60 * 60 * 1000).toISOString();
        const success = await updateMVPRestaurantSubscription(restaurant.id, 'active', newEndsAt);

        if (success) {
          setPaymentSuccess(true);
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
          
          showToast("Abonnement activé avec succès !");
          
          setTimeout(() => {
            setIsPayModalOpen(false);
            setPaymentSuccess(false);
            setPhoneNumber('');
            setCardNumber('');
            setCardExpiry('');
            setCardCvv('');
            loadRestaurantData();
          }, 2000);
        } else {
          showToast("Échec de la validation de l'abonnement.", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Erreur réseau lors du paiement.", "error");
      } finally {
        setSubmittingPayment(false);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
        <span>Chargement des détails de facturation...</span>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="py-20 text-center text-red-400">
        <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
        <span>Erreur : Impossible de charger votre établissement.</span>
      </div>
    );
  }

  const isSubValid = isRestaurantSubscriptionValid(restaurant);
  const isTrial = restaurant.subscription_status === 'trialing';
  const isSuspended = restaurant.subscription_status === 'suspended';
  const daysRemaining = getDaysRemaining(restaurant.trial_ends_at);

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
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-2">
          <CreditCard size={10} />
          <span>Gestion financière</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">Abonnement & Facturation</h1>
        <p className="text-slate-400 text-xs mt-1">Gérez votre formule d'utilisation de la plateforme et vos paiements</p>
      </div>

      {/* Subscription Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Summary Card */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-slate-900/40 border border-slate-900 glass-morphism flex flex-col justify-between gap-6 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col gap-4">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block font-sans">Statut Actuel</span>
            
            {isSuspended ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 text-red-400">
                  <AlertTriangle size={24} />
                  <h3 className="text-lg font-black uppercase">Accès Suspendu</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md font-sans">
                  Votre accès aux dashboards a été désactivé par l'administration. Veuillez régulariser votre situation ou contacter le support.
                </p>
              </div>
            ) : !isSubValid ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 text-red-400">
                  <AlertTriangle size={24} />
                  <h3 className="text-lg font-black uppercase font-sans">Abonnement Expiré</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md font-sans">
                  Votre période d'essai ou d'abonnement est arrivée à son terme. Activez un abonnement mensuel pour débloquer l'accès client et cuisine.
                </p>
              </div>
            ) : isTrial ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 text-amber-500">
                  <Clock size={24} className="animate-pulse" />
                  <h3 className="text-lg font-black uppercase font-sans">Période d'Essai Actif</h3>
                </div>
                <p className="text-xs text-slate-350 leading-relaxed max-w-md font-sans">
                  Il vous reste <strong className="text-amber-500 text-sm font-black font-mono"> {daysRemaining} jours </strong> d'essai gratuit. Vous pouvez vous abonner à tout moment pour assurer la continuité de vos services.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <CheckCircle2 size={24} />
                  <h3 className="text-lg font-black uppercase font-sans">Abonnement Actif</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md font-sans">
                  Votre formule Premium mensuelle est active et valide. Merci pour votre confiance !
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-6 border-t border-slate-950/60 pt-4 mt-2 font-sans">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Fin de l'essai</span>
              <span className="text-xs font-mono text-slate-300 mt-1 block">
                {restaurant.trial_ends_at ? new Date(restaurant.trial_ends_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
              </span>
            </div>

            {restaurant.subscription_ends_at && (
              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Échéance de facturation</span>
                <span className="text-xs font-mono text-slate-300 mt-1 block">
                  {new Date(restaurant.subscription_ends_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Pricing / Payment CTA */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-900 glass-morphism flex flex-col justify-between gap-6 relative overflow-hidden shadow-lg">
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col gap-4 font-sans">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Tarif unique</span>
            <div>
              <span className="text-3xl font-black text-white font-mono tracking-tight">20 000 FCFA</span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mt-1">Par mois / par restaurant</span>
            </div>
            <ul className="text-[10px] text-slate-400 flex flex-col gap-1.5 list-disc pl-4 mt-2 font-sans">
              <li>Commandes par QR Code illimitées</li>
              <li>Console cuisine temps réel</li>
              <li>CRUD complet du menu & photos</li>
              <li>Génération de QR codes haute définition</li>
              <li>Support technique 7j/7</li>
            </ul>
          </div>

          {!isSuspended && (
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="w-full py-4 mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-2xl shadow-lg shadow-amber-500/10 transition-all duration-200 active:scale-[0.98] cursor-pointer font-sans"
            >
              <span>{isSubValid && !isTrial ? "Prolonger l'abonnement" : "S'abonner maintenant"}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

      </div>

      {/* Pay Modal Overlay */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-850 flex justify-between items-center bg-slate-950/20 backdrop-blur-md">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-500" />
                <span>Paiement de l'abonnement</span>
              </h2>
              <button
                onClick={() => {
                  if (!submittingPayment) setIsPayModalOpen(false);
                }}
                className="w-9 h-9 rounded-2xl bg-slate-850 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                disabled={submittingPayment}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body / Form */}
            {paymentSuccess ? (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-4 animate-fade-in font-sans">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-2 mx-auto">
                  <Check size={36} strokeWidth={3} className="animate-bounce" />
                </div>
                <h3 className="text-lg font-black text-white uppercase">Paiement Réussi !</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-sans">
                  Votre transaction de 20 000 FCFA a été validée. Votre abonnement Resto-menu a été mis à jour pour 30 jours.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="p-6 overflow-y-auto flex flex-col gap-5 font-sans">
                <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-950 border border-slate-850 font-sans">
                  <span className="text-xs text-slate-400 font-bold">Total à régler :</span>
                  <span className="text-lg font-black text-white font-mono">20 000 FCFA</span>
                </div>

                {/* Choose Payment Method */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sélectionner un moyen de paiement</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Wave */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wave')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-extrabold uppercase transition-all cursor-pointer ${
                        paymentMethod === 'wave'
                          ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                          : 'bg-slate-950 border-slate-850 text-slate-450 hover:text-slate-200'
                      }`}
                      disabled={submittingPayment}
                    >
                      <span>Wave</span>
                    </button>

                    {/* Orange Money */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('orange')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-extrabold uppercase transition-all cursor-pointer ${
                        paymentMethod === 'orange'
                          ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                          : 'bg-slate-950 border-slate-850 text-slate-450 hover:text-slate-200'
                      }`}
                      disabled={submittingPayment}
                    >
                      <span>Orange Money</span>
                    </button>

                    {/* MTN Money */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mtn')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-extrabold uppercase transition-all cursor-pointer ${
                        paymentMethod === 'mtn'
                          ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
                          : 'bg-slate-950 border-slate-850 text-slate-450 hover:text-slate-200'
                      }`}
                      disabled={submittingPayment}
                    >
                      <span>MTN Money</span>
                    </button>

                    {/* Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-extrabold uppercase transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                          : 'bg-slate-950 border-slate-850 text-slate-450 hover:text-slate-200'
                      }`}
                      disabled={submittingPayment}
                    >
                      <span>Carte Bancaire</span>
                    </button>
                  </div>
                </div>

                {/* Form fields based on payment method */}
                {paymentMethod === 'card' ? (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    {/* Card number */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Numéro de Carte</label>
                      <input
                        type="text"
                        required
                        placeholder="4000 1234 5678 9010"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                        maxLength={19}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-xs transition-colors font-mono"
                        disabled={submittingPayment}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Expiry */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date d'expiration</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, '').replace(/(.{2})/g, '$1/').replace(/\/$/, '').trim())}
                          maxLength={5}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-amber-500 text-xs transition-colors font-mono text-center"
                          disabled={submittingPayment}
                        />
                      </div>

                      {/* CVV */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Code CVV</label>
                        <input
                          type="password"
                          required
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          maxLength={3}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-amber-500 text-xs transition-colors font-mono text-center"
                          disabled={submittingPayment}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 animate-fade-in">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Numéro de téléphone de facturation</label>
                    <div className="relative">
                      <Smartphone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="tel"
                        required
                        placeholder="Ex: +225 0707 0707"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-amber-500 text-xs transition-colors font-mono"
                        disabled={submittingPayment}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 leading-normal mt-1 block">
                      Saisissez le numéro sur lequel la demande de débit Mobile Money de 20 000 FCFA sera envoyée.
                    </span>
                  </div>
                )}

                {/* Submit Area */}
                <div className="mt-4 flex gap-3 pt-4 border-t border-slate-900/60 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="w-1/2 py-3.5 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    disabled={submittingPayment}
                  >
                    Annuler
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="w-1/2 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
                  >
                    {submittingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <span>Payer 20 000 FCFA</span>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
