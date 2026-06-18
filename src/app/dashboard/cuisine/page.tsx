'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  getOrders, 
  updateOrderStatus, 
  getWaiterCalls, 
  resolveWaiterCall, 
  subscribeToOrders, 
  subscribeToWaiterCalls,
  Order, 
  WaiterCall 
} from '@/lib/db';
import { 
  ChefHat, 
  Bell, 
  Check, 
  Volume2, 
  VolumeX, 
  Clock, 
  CheckCheck,
  RotateCcw
} from 'lucide-react';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pour éviter les notifications sonores intempestives au chargement initial
  const isInitialized = useRef(false);

  // Synthétiser un son de clochette double-ding premium (Web Audio API)
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

      // Double note harmonieuse (A5 -> C6)
      playDing(0, 880);
      playDing(0.12, 1046.5);
    } catch (e) {
      console.warn("Web Audio failed to play:", e);
    }
  }, [soundEnabled]);

  // Charger les données initiales
  const loadInitialData = useCallback(async () => {
    try {
      const restId = '22222222-2222-2222-2222-222222222222'; // Bistro Premium ID
      const [fetchedOrders, fetchedCalls] = await Promise.all([
        getOrders(restId),
        getWaiterCalls(restId)
      ]);
      setOrders(fetchedOrders);
      setWaiterCalls(fetchedCalls);
      setLoading(false);
      isInitialized.current = true;
    } catch (err) {
      console.error("Error loading kitchen data:", err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    const restId = '22222222-2222-2222-2222-222222222222';

    // S'abonner aux commandes en temps réel
    const unsubOrders = subscribeToOrders(restId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setOrders(prev => [payload.new, ...prev]);
        if (isInitialized.current) {
          playAlertSound();
        }
      } else if (payload.eventType === 'UPDATE') {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
      } else {
        // Refresh complet
        loadInitialData();
      }
    });

    // S'abonner aux appels serveurs en temps réel
    const unsubCalls = subscribeToWaiterCalls(restId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setWaiterCalls(prev => [...prev, payload.new]);
        if (isInitialized.current) {
          playAlertSound();
        }
      } else if (payload.eventType === 'UPDATE') {
        setWaiterCalls(prev => prev.filter(c => c.id !== payload.new.id || payload.new.status === 'pending'));
      } else {
        loadInitialData();
      }
    });

    // Mettre à jour l'écoulement du temps toutes les minutes (force re-render)
    const timeInterval = setInterval(() => {
      setOrders(prev => [...prev]);
    }, 60000);

    return () => {
      unsubOrders();
      unsubCalls();
      clearInterval(timeInterval);
    };
  }, [soundEnabled, playAlertSound, loadInitialData]);

  // Actions Commandes
  const handleUpdateStatus = async (orderId: string, nextStatus: Order['status']) => {
    const success = await updateOrderStatus(orderId, nextStatus);
    if (!success) {
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  // Actions Appels
  const handleResolveCall = async (callId: string) => {
    const success = await resolveWaiterCall(callId);
    if (!success) {
      alert("Erreur lors de la résolution de l'appel.");
    }
  };

  // Calculer le temps écoulé depuis la commande
  const getElapsedTime = (createdAtStr: string) => {
    const now = new Date();
    const created = new Date(createdAtStr);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "À l'instant";
    return `Il y a ${diffMins} min`;
  };

  // Réinitialiser les données de démonstration locales (pour retester facilement)
  const handleResetDemoData = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('mock_orders');
      window.localStorage.removeItem('mock_waiter_calls');
      loadInitialData();
    }
  };

  // Filtrer les commandes par colonne
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-slate-100">
        <ChefHat className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 p-6 flex flex-col gap-6">
      
      {/* Top Banner Dashboard */}
      <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl glass-morphism">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <ChefHat size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Console Cuisine</h1>
            <p className="text-xs text-slate-400">Le Bistro Premium • Mode Temps Réel</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound toggle button */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              // Autoriser l'audio context au premier clic
              if (!soundEnabled) {
                const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (AudioContextClass) new AudioContextClass();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
              soundEnabled
                ? 'bg-amber-600 border-amber-500 text-slate-950 shadow-md shadow-amber-600/10'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 size={16} />
                <span>Son activé</span>
              </>
            ) : (
              <>
                <VolumeX size={16} />
                <span>Son désactivé</span>
              </>
            )}
          </button>

          {/* Reset Demo Data button (only for mockup evaluation) */}
          <button
            onClick={handleResetDemoData}
            title="Réinitialiser les commandes locales"
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Grid Layout: Main Columns & Waiter Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start flex-grow">
        
        {/* Column 1: Waiter Calls (Width 1/4 on desktop) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Bell size={16} className="text-red-400" />
              <span>Appels Table ({waiterCalls.length})</span>
            </h2>
          </div>

          <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
            {waiterCalls.length > 0 ? (
              waiterCalls.map((call) => (
                <div 
                  key={call.id}
                  className={`p-4 rounded-xl border flex flex-col gap-3 relative overflow-hidden transition-all ${
                    call.type === 'bill'
                      ? 'bg-emerald-950/30 border-emerald-500/30 glow-blue'
                      : 'bg-red-950/30 border-red-500/30 animate-bell'
                  }`}
                  style={{ transformOrigin: 'top center' }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base text-slate-200">
                        {call.table?.table_number || "Table"}
                      </h3>
                      <span className={`text-xs font-semibold uppercase mt-1 inline-block ${
                        call.type === 'bill' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {call.type === 'bill' ? '💳 Addition' : '🔔 Besoin Serveur'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleResolveCall(call.id)}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 active:scale-90 transition-transform"
                      title="Marquer comme traité"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Clock size={12} />
                    <span>{getElapsedTime(call.created_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/10 text-slate-500 flex flex-col items-center gap-2">
                <CheckCheck size={28} className="text-slate-600" />
                <p className="text-xs">Aucun appel en attente</p>
              </div>
            )}
          </div>
        </div>

        {/* Board Columns: Orders (Width 3/4 on desktop) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 2.1: Pending Orders */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>En attente ({pendingOrders.length})</span>
              </h3>
            </div>

            <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
              {pendingOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="p-4 rounded-xl border border-blue-500/20 bg-slate-900/30 hover:border-blue-500/40 transition-all flex flex-col gap-4 animate-slide-up"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-slate-100">{order.table?.table_number || "Table"}</h4>
                      <span className="text-[10px] text-slate-400">ID: #{order.id.slice(-5).toUpperCase()}</span>
                    </div>
                    <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md font-semibold">
                      {getElapsedTime(order.created_at)}
                    </span>
                  </div>

                  {/* Order items */}
                  <div className="flex flex-col gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                    {order.items?.map((item) => (
                      <div key={item.id} className="text-xs flex justify-between">
                        <span className="text-slate-300">
                          <strong className="text-amber-500 mr-1.5">x{item.quantity}</strong> 
                          {item.menu_item?.name || "Plat"}
                        </span>
                      </div>
                    ))}
                    {order.notes && (
                      <div className="mt-2 text-[10px] bg-red-950/20 border border-red-500/10 text-red-400/90 p-2 rounded">
                        <strong>Note :</strong> {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'preparing')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-blue-600/10"
                  >
                    <ChefHat size={14} />
                    <span>Préparer</span>
                  </button>
                </div>
              ))}
              {pendingOrders.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-850 rounded-xl">
                  Aucune commande en attente
                </div>
              )}
            </div>
          </div>

          {/* Column 2.2: Preparing Orders */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>En Préparation ({preparingOrders.length})</span>
              </h3>
            </div>

            <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
              {preparingOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="p-4 rounded-xl border border-amber-500/20 bg-slate-900/30 hover:border-amber-500/40 transition-all flex flex-col gap-4 animate-slide-up"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-slate-100">{order.table?.table_number || "Table"}</h4>
                      <span className="text-[10px] text-slate-400">ID: #{order.id.slice(-5).toUpperCase()}</span>
                    </div>
                    <span className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-semibold">
                      {getElapsedTime(order.created_at)}
                    </span>
                  </div>

                  {/* Order items */}
                  <div className="flex flex-col gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                    {order.items?.map((item) => (
                      <div key={item.id} className="text-xs flex justify-between">
                        <span className="text-slate-300">
                          <strong className="text-amber-500 mr-1.5">x{item.quantity}</strong> 
                          {item.menu_item?.name || "Plat"}
                        </span>
                      </div>
                    ))}
                    {order.notes && (
                      <div className="mt-2 text-[10px] bg-red-950/20 border border-red-500/10 text-red-400/90 p-2 rounded">
                        <strong>Note :</strong> {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'ready')}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-amber-600/10"
                  >
                    <Check size={14} />
                    <span>Prêt / Servi</span>
                  </button>
                </div>
              ))}
              {preparingOrders.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-850 rounded-xl">
                  Aucun plat en préparation
                </div>
              )}
            </div>
          </div>

          {/* Column 2.3: Ready / Served Orders */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Prêt & Servi ({readyOrders.length})</span>
              </h3>
            </div>

            <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
              {readyOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/5 hover:border-emerald-500/40 transition-all flex flex-col gap-4 animate-slide-up"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-slate-100">{order.table?.table_number || "Table"}</h4>
                      <span className="text-[10px] text-slate-400">ID: #{order.id.slice(-5).toUpperCase()}</span>
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-semibold">
                      Prêt
                    </span>
                  </div>

                  {/* Order items */}
                  <div className="flex flex-col gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                    {order.items?.map((item) => (
                      <div key={item.id} className="text-xs flex justify-between">
                        <span className="text-slate-450 line-through">
                          x{item.quantity} {item.menu_item?.name || "Plat"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-emerald-600/10"
                  >
                    <CheckCheck size={14} />
                    <span>Facturer</span>
                  </button>
                </div>
              ))}
              {readyOrders.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-850 rounded-xl">
                  Aucun plat servi récent
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
