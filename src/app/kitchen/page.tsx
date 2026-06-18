'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  getMVPOrders, 
  updateMVPOrderStatus, 
  getMVPServiceRequests, 
  resolveServiceRequest, 
  subscribeToMVPOrders, 
  subscribeToMVPServiceRequests,
  Order, 
  ServiceRequest 
} from '@/lib/mvp-db';
import { 
  ChefHat, 
  Bell, 
  Check, 
  Volume2, 
  VolumeX, 
  Clock, 
  CheckCheck,
  RotateCcw,
  Sparkles,
  Receipt,
  UtensilsCrossed,
  Archive
} from 'lucide-react';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Archiver localement les commandes terminées
  const [archivedOrderIds, setArchivedOrderIds] = useState<string[]>([]);

  // Pour éviter de jouer le son de notification au premier chargement
  const isInitialized = useRef(false);

  // Synthétiseur audio (Web Audio API)
  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      
      const playDing = (delay: number, frequency: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + delay);
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.7);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.8);
      };

      // Double note clochette d'or (A5 -> C6)
      playDing(0, 880);
      playDing(0.12, 1046.5);
    } catch (e) {
      console.warn("Web Audio failed to play:", e);
    }
  }, [soundEnabled]);

  const loadData = useCallback(async () => {
    try {
      const [fetchedOrders, fetchedRequests] = await Promise.all([
        getMVPOrders(),
        getMVPServiceRequests()
      ]);
      setOrders(fetchedOrders);
      setServiceRequests(fetchedRequests);
      setLoading(false);
      isInitialized.current = true;
    } catch (err) {
      console.error("Error loading kitchen data:", err);
    }
  }, []);

  useEffect(() => {
    loadData();

    // S'abonner aux commandes en temps réel
    const unsubOrders = subscribeToMVPOrders((payload) => {
      if (payload.eventType === 'INSERT') {
        setOrders(prev => [payload.new, ...prev]);
        if (isInitialized.current) playAlertSound();
      } else if (payload.eventType === 'UPDATE') {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
      } else {
        loadData();
      }
    });

    // S'abonner aux appels de service en temps réel
    const unsubRequests = subscribeToMVPServiceRequests((payload) => {
      if (payload.eventType === 'INSERT') {
        setServiceRequests(prev => [...prev, payload.new]);
        if (isInitialized.current) playAlertSound();
      } else if (payload.eventType === 'UPDATE') {
        setServiceRequests(prev => prev.filter(r => r.id !== payload.new.id || payload.new.status === 'pending'));
      } else {
        loadData();
      }
    });

    // Actualiser le temps écoulé toutes les minutes
    const interval = setInterval(() => {
      setOrders(prev => [...prev]);
    }, 60000);

    return () => {
      unsubOrders();
      unsubRequests();
      clearInterval(interval);
    };
  }, [soundEnabled, playAlertSound, loadData]);

  // Actions Statut Commande
  const handleUpdateStatus = async (orderId: string, nextStatus: 'pending' | 'cooking' | 'ready') => {
    const success = await updateMVPOrderStatus(orderId, nextStatus);
    if (!success) {
      alert("Impossible de mettre à jour le statut.");
    }
  };

  // Traiter un appel serveur / note
  const handleResolveRequest = async (id: string) => {
    const success = await resolveServiceRequest(id);
    if (!success) {
      alert("Impossible de résoudre cette demande.");
    }
  };

  // Archiver localement une commande prête
  const archiveOrder = (orderId: string) => {
    setArchivedOrderIds(prev => [...prev, orderId]);
  };

  // Calcul du temps écoulé
  const getElapsedTime = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    return `Il y a ${mins} min`;
  };

  // Réinitialiser les mocks (pour démo/test)
  const handleResetMocks = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('mvp_orders');
      window.localStorage.removeItem('mvp_service_requests');
      setArchivedOrderIds([]);
      loadData();
    }
  };

  // Filtrer les commandes par colonne (en excluant les archivées)
  const visibleOrders = orders.filter(o => !archivedOrderIds.includes(o.id));
  const pendingOrders = visibleOrders.filter(o => o.status === 'pending');
  const cookingOrders = visibleOrders.filter(o => o.status === 'cooking');
  const readyOrders = visibleOrders.filter(o => o.status === 'ready');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b13] text-slate-100">
        <ChefHat className="w-12 h-12 text-amber-500 animate-spin" />
        <span className="text-sm text-slate-400 mt-4 font-semibold">Initialisation de la cuisine...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 p-6 flex flex-col gap-6 font-sans">
      
      {/* Top Banner Control */}
      <header className="flex justify-between items-center bg-slate-900/40 border border-slate-900 p-5 rounded-2xl glass-morphism">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <ChefHat size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Console Cuisine</h1>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider">Temps Réel</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Gestion des commandes et des appels clients</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound toggle button */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) {
                // Initialiser l'audio au premier clic
                const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (AudioContextClass) new AudioContextClass();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider tap-feedback border ${
              soundEnabled
                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 size={15} />
                <span>Sonnerie Active</span>
              </>
            ) : (
              <>
                <VolumeX size={15} />
                <span>Sonnerie Coupée</span>
              </>
            )}
          </button>

          {/* Reset button (demo helper) */}
          <button
            onClick={handleResetMocks}
            title="Réinitialiser les données de démo"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/20 tap-feedback transition-colors"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </header>

      {/* Main Section: Alerts & Columns Grid */}
      <div className="flex flex-col gap-6 flex-grow">
        
        {/* Banner Alert for Service Requests */}
        {serviceRequests.length > 0 && (
          <div className="w-full bg-red-500/5 border border-red-500/20 p-5 rounded-2xl flex flex-col gap-4 shadow-lg shadow-red-950/10">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-red-400">
                Appels de Service Actifs ({serviceRequests.length})
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {serviceRequests.map((req) => (
                <div 
                  key={req.id} 
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    req.type === 'bill' 
                      ? 'bg-slate-900/40 border-indigo-500/20' 
                      : 'bg-slate-900/40 border-red-500/20 shadow-lg shadow-red-950/5'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-lg font-black text-white font-mono">Table {req.table_number}</span>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                      req.type === 'bill' ? 'text-indigo-400' : 'text-red-400'
                    }`}>
                      {req.type === 'bill' ? '💳 Note' : '🔔 Serveur'}
                    </p>
                    <span className="text-[9px] text-slate-500 mt-1 block font-medium">
                      {getElapsedTime(req.created_at)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleResolveRequest(req.id)}
                    className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-850 text-emerald-400 hover:text-emerald-350 hover:bg-slate-800 flex items-center justify-center shrink-0 tap-feedback transition-colors"
                    title="Marquer comme traité"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Column stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start flex-grow">
          
          {/* Column 1: Pending Orders */}
          <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Commandes Reçues ({pendingOrders.length})
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
              {pendingOrders.map((order) => (
                <div 
                  key={order.id}
                  className="p-5 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-col gap-4 menu-item-card animate-cascade shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-slate-500 font-bold uppercase font-mono">Nouveau</span>
                      <h4 className="text-xl font-black text-white font-mono mt-0.5">Table {order.table_number}</h4>
                    </div>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-xl font-bold font-mono">
                      {getElapsedTime(order.created_at)}
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="flex flex-col gap-2.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                    {order.items?.map((item) => (
                      <div key={item.id} className="text-xs font-semibold flex justify-between">
                        <span className="text-slate-350">
                          <strong className="text-amber-500 mr-2 text-sm font-black">x{item.quantity}</strong>
                          {item.menu_item?.name || "Plat"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'cooking')}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 tap-feedback shadow-lg shadow-blue-600/10"
                  >
                    <ChefHat size={14} />
                    <span>Lancer la Préparation</span>
                  </button>
                </div>
              ))}

              {pendingOrders.length === 0 && (
                <div className="py-14 text-center rounded-2xl border border-dashed border-slate-900 text-slate-600 flex flex-col items-center justify-center gap-2">
                  <CheckCheck size={28} className="opacity-40" />
                  <p className="text-xs font-bold uppercase tracking-wider">Aucune commande en attente</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Cooking Orders */}
          <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  En Préparation ({cookingOrders.length})
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
              {cookingOrders.map((order) => (
                <div 
                  key={order.id}
                  className="p-5 rounded-2xl bg-slate-900/20 border border-slate-900 flex flex-col gap-4 menu-item-card animate-cascade shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-amber-500 font-bold uppercase font-mono">En cuisine</span>
                      <h4 className="text-xl font-black text-white font-mono mt-0.5">Table {order.table_number}</h4>
                    </div>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl font-bold font-mono">
                      {getElapsedTime(order.created_at)}
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="flex flex-col gap-2.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                    {order.items?.map((item) => (
                      <div key={item.id} className="text-xs font-semibold flex justify-between">
                        <span className="text-slate-350">
                          <strong className="text-amber-500 mr-2 text-sm font-black">x{item.quantity}</strong>
                          {item.menu_item?.name || "Plat"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'ready')}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 tap-feedback shadow-lg shadow-amber-500/10"
                  >
                    <Check size={14} />
                    <span>Prêt à servir</span>
                  </button>
                </div>
              ))}

              {cookingOrders.length === 0 && (
                <div className="py-14 text-center rounded-2xl border border-dashed border-slate-900 text-slate-600 flex flex-col items-center justify-center gap-2">
                  <UtensilsCrossed size={28} className="opacity-40" />
                  <p className="text-xs font-bold uppercase tracking-wider">Aucune préparation en cours</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Ready Orders */}
          <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Prêt / Servi ({readyOrders.length})
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
              {readyOrders.map((order) => (
                <div 
                  key={order.id}
                  className="p-5 rounded-2xl bg-emerald-950/5 border border-emerald-900/30 flex flex-col gap-4 menu-item-card animate-cascade shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-emerald-450 font-bold uppercase font-mono">Prêt</span>
                      <h4 className="text-xl font-black text-white font-mono mt-0.5">Table {order.table_number}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl font-bold font-mono">
                      Prêt
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="flex flex-col gap-2 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                    {order.items?.map((item) => (
                      <div key={item.id} className="text-xs font-semibold flex justify-between">
                        <span className="text-slate-450 line-through">
                          x{item.quantity} {item.menu_item?.name || "Plat"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => archiveOrder(order.id)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 tap-feedback shadow-lg shadow-emerald-600/10"
                  >
                    <Archive size={14} />
                    <span>Archiver de la Cuisine</span>
                  </button>
                </div>
              ))}

              {readyOrders.length === 0 && (
                <div className="py-14 text-center rounded-2xl border border-dashed border-slate-900 text-slate-600 flex flex-col items-center justify-center gap-2">
                  <CheckCheck size={28} className="opacity-40 text-emerald-600" />
                  <p className="text-xs font-bold uppercase tracking-wider">Aucune commande prête</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
