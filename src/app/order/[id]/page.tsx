'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  getMVPOrderById, 
  subscribeToMVPOrderStatus, 
  createServiceRequest, 
  Order,
  formatFCFA
} from '@/lib/mvp-db';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Bell, 
  ArrowLeft, 
  Loader2, 
  Receipt,
  Check,
  AlertTriangle
} from 'lucide-react';

export default function OrderStatusPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    if (!orderId) return;

    let unsubscribe: (() => void) | null = null;

    async function loadOrder() {
      try {
        const o = await getMVPOrderById(orderId);
        if (o) {
          setOrder(o);

          // S'abonner aux changements de statut en temps réel
          unsubscribe = subscribeToMVPOrderStatus(orderId, (updatedOrder) => {
            setOrder(prev => {
              if (!prev) return updatedOrder;
              return {
                ...prev,
                status: updatedOrder.status
              };
            });
            showToast(`Statut mis à jour : ${getStatusText(updatedOrder.status)}`, 'info');
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orderId]);

  function showToast(text: string, type: 'success' | 'info' | 'error' = 'success') {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }

  const handleCallWaiter = async (type: 'waiter' | 'bill') => {
    if (!order) return;
    try {
      const res = await createServiceRequest(order.table_number, type);
      if (res) {
        showToast(
          type === 'bill' 
            ? "Note demandée ! Un serveur arrive." 
            : "Serveur appelé ! Un serveur arrive.", 
          'info'
        );
      } else {
        showToast("Impossible d'envoyer l'alerte serveur.", 'error');
      }
    } catch (err) {
      console.error(err);
      showToast("Une erreur est survenue.", 'error');
    }
  };

  function getStatusText(status: Order['status']) {
    switch (status) {
      case 'pending': return 'En attente de validation';
      case 'cooking': return 'En préparation';
      case 'ready': return 'Prêt';
      default: return 'Inconnu';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4 text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-xl font-bold text-slate-100">Commande Introuvable</h1>
        <p className="text-sm text-slate-400 mt-2 font-medium">Cette commande n'existe pas ou a été supprimée.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-semibold transition-all"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  // Étapes de préparation
  const statusSteps: Order['status'][] = ['pending', 'cooking', 'ready'];
  const currentStepIdx = statusSteps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 px-4 pt-6 max-w-md mx-auto shadow-2xl border-x border-slate-900/50 relative">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] animate-slide-up">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm border font-semibold ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/20'
              : toastMessage.type === 'error'
              ? 'bg-red-950/90 text-red-300 border-red-500/20'
              : 'bg-indigo-950/90 text-indigo-300 border-indigo-500/20'
          }`}>
            {toastMessage.type === 'success' && <Check size={16} />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push(`/table/${order.table_number}`)}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-450 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-extrabold text-slate-200">Suivi de Commande</h1>
        <div className="w-10 h-10" />
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Main Status Card */}
        <div className="p-6 rounded-[2rem] bg-slate-900/30 border border-slate-900 text-center relative overflow-hidden flex flex-col items-center gap-5 glass-morphism shadow-xl">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-amber-400" />

          {/* Dynamic Status Icon */}
          <div className="relative mt-2">
            {order.status === 'pending' && (
              <>
                <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-20 animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-slate-950 border border-amber-500/30 flex items-center justify-center text-amber-500 relative">
                  <Clock size={28} className="animate-pulse" />
                </div>
              </>
            )}
            {order.status === 'cooking' && (
              <>
                <div className="absolute inset-0 bg-orange-500 rounded-full blur-xl opacity-20 animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-slate-950 border border-orange-500/30 flex items-center justify-center text-orange-400 relative">
                  <ChefHat size={28} className="animate-bounce" style={{ animationDuration: '2.5s' }} />
                </div>
              </>
            )}
            {order.status === 'ready' && (
              <>
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-20 animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-slate-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 relative animate-pulse">
                  <CheckCircle2 size={28} />
                </div>
              </>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">ID: #{order.id.slice(-6).toUpperCase()}</span>
            <h2 className="text-xl font-black text-white mt-1.5">{getStatusText(order.status)}</h2>
            <p className="text-xs text-slate-400 mt-2.5 px-3 leading-relaxed">
              {order.status === 'pending' && "La cuisine prépare la réception de vos plats. Votre commande sera bientôt validée."}
              {order.status === 'cooking' && "Vos plats sont actuellement sur le feu ! Nos cuisiniers s'activent pour vous régaler."}
              {order.status === 'ready' && "Votre commande est prête et servie à table. Régalez-vous !"}
            </p>
          </div>

          {/* Stepper */}
          <div className="w-full flex justify-between items-center px-4 mt-2 relative">
            <div className="absolute top-4 left-10 right-10 h-0.5 bg-slate-800 z-0" />
            <div 
              className="absolute top-4 left-10 h-0.5 bg-amber-500 z-0 transition-all duration-700" 
              style={{ width: `${currentStepIdx === 0 ? '0%' : currentStepIdx === 1 ? '50%' : '100%'}` }}
            />

            {statusSteps.map((step, idx) => (
              <div key={step} className="flex flex-col items-center gap-1.5 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  currentStepIdx >= idx 
                    ? 'bg-amber-500 text-slate-950 border border-amber-400' 
                    : 'bg-slate-850 text-slate-500 border border-slate-800'
                }`}>
                  {idx + 1}
                </div>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                  {step === 'pending' ? 'Reçue' : step === 'cooking' ? 'Cuisine' : 'Prête'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating bottom requests */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleCallWaiter('waiter')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-350 text-xs font-bold uppercase tracking-wider hover:bg-slate-850 active:scale-95 transition-all"
          >
            <Bell size={14} className="text-amber-500" />
            <span>Appeler un Serveur</span>
          </button>
          
          <button
            onClick={() => handleCallWaiter('bill')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-350 text-xs font-bold uppercase tracking-wider hover:bg-slate-850 active:scale-95 transition-all"
          >
            <Receipt size={14} className="text-indigo-400" />
            <span>Demander la Note</span>
          </button>
        </div>

        {/* Order Details Summary */}
        <div className="p-6 rounded-[2rem] bg-slate-900/30 border border-slate-900 flex flex-col gap-4 shadow-xl glass-morphism">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">Détails de la table</h3>
            <span className="text-xs px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold uppercase font-mono">
              Table {order.table_number}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm font-semibold">
                <div className="flex gap-2">
                  <span className="text-amber-500">x{item.quantity}</span>
                  <span className="text-slate-300">{item.menu_item?.name || "Article"}</span>
                </div>
                <span className="text-slate-400">
                  {formatFCFA((item.menu_item?.price || 0) * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center border-t border-slate-850 pt-4 mt-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total</span>
            <span className="text-xl font-black text-amber-500">
              {formatFCFA(order.items?.reduce((total, item) => total + ((item.menu_item?.price || 0) * item.quantity), 0) || 0)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
