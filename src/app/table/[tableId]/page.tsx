'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getMenuItems, 
  createMVPOrder, 
  createServiceRequest, 
  MenuItem,
  formatFCFA
} from '@/lib/mvp-db';
import { 
  Search, 
  ShoppingBag, 
  Bell, 
  Plus, 
  Minus, 
  X, 
  Utensils, 
  ChefHat, 
  Check, 
  AlertTriangle,
  Receipt,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function ClientMenuPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [cartBump, setCartBump] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    async function loadMenu() {
      try {
        const items = await getMenuItems();
        setMenuItems(items);
        
        // Extraire les catégories uniques
        const cats = Array.from(new Set(items.map(item => item.category)));
        setCategories(cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0]);
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de charger le menu.");
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Cart operations
  const addToCart = (item: MenuItem) => {
    if (!item.is_active) {
      showToast(`${item.name} est actuellement en rupture de stock !`, 'error');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.menuItem.id === item.id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    showToast(`${item.name} ajouté au panier !`);
    
    // Déclencher le rebond
    setCartBump(true);
    setTimeout(() => setCartBump(false), 300);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => 
      prev.map(i => {
        if (i.menuItem.id === itemId) {
          const newQty = i.quantity + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      }).filter(Boolean) as CartItem[]
    );
  };

  const getCartTotal = () => {
    return cart.reduce((acc, curr) => acc + (curr.menuItem.price * curr.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((acc, curr) => acc + curr.quantity, 0);
  };

  // Call Server/Waiter Handler
  const handleServiceRequest = async (type: 'waiter' | 'bill') => {
    try {
      const res = await createServiceRequest(tableId, type);
      if (res) {
        showToast(
          type === 'bill' 
            ? "Demande d'addition envoyée ! Un serveur arrive." 
            : "Appel serveur envoyé ! Un serveur arrive.", 
          'info'
        );
      } else {
        showToast("Échec de l'envoi de la demande.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Une erreur est survenue.", "error");
    }
  };

  // Checkout/Submit Order Handler
  const handleValidateOrder = async () => {
    if (cart.length === 0) return;
    setSubmittingOrder(true);
    try {
      const itemsInput = cart.map(i => ({
        menu_item_id: i.menuItem.id,
        quantity: i.quantity
      }));
      
      const result = await createMVPOrder(tableId, itemsInput);
      if (result) {
        // Confettis de succès
        confetti({
          particleCount: 120,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#F59E0B', '#10B981', '#3B82F6', '#ffffff']
        });

        showToast("Commande envoyée en cuisine !", "success");
        setCart([]);
        setIsCartOpen(false);

        // Rediriger vers la page de statut de la commande
        setTimeout(() => {
          router.push(`/order/${result.id}`);
        }, 1500);
      } else {
        showToast("Erreur lors de la création de la commande.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur de connexion.", "error");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Search and Category filtering
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <ChefHat className="w-12 h-12 text-amber-500 animate-spin" />
        <span className="text-sm text-slate-400 mt-4 font-medium">Chargement du menu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-6 text-center text-slate-100">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold">{error}</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-xs">Une erreur s'est produite lors de l'accès au menu. Veuillez scanner de nouveau le QR code.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-32 font-sans antialiased max-w-md mx-auto shadow-2xl border-x border-slate-900/50 relative">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-slide-up">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold border ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/20'
              : toast.type === 'error'
              ? 'bg-red-950/90 text-red-300 border-red-500/20'
              : 'bg-indigo-950/90 text-indigo-300 border-indigo-500/20'
          }`}>
            {toast.type === 'success' && <Check size={18} className="text-emerald-400 shrink-0" />}
            {toast.type === 'info' && <Sparkles size={18} className="text-indigo-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle size={18} className="text-red-400 shrink-0" />}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Modern Gradient Header */}
      <header className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 px-6 pt-8 pb-6 border-b border-slate-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-indigo-500/5 opacity-40" />
        
        <div className="relative flex justify-between items-center z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles size={10} />
              <span>Commande en ligne</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Le Bistro Premium</h1>
            <p className="text-slate-400 text-xs mt-1">Prise de commande rapide & autonome</p>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">Table</span>
            <span className="text-2xl font-black text-amber-500 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 rounded-2xl shadow-inner font-mono">
              {tableId}
            </span>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="px-4 mt-6">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Rechercher une entrée, un plat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all text-sm shadow-inner"
          />
        </div>
      </div>

      {/* Categories slider */}
      <div className="mt-5 px-4 overflow-x-auto whitespace-nowrap flex gap-2 no-scrollbar">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              selectedCategory === category
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 border border-amber-400'
                : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border border-slate-850'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Menu items list */}
      <div className="mt-6 px-4 flex flex-col gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, idx) => (
            <div 
              key={`${item.id}-${selectedCategory}`}
              className={`p-4 rounded-2xl bg-slate-900/30 border border-slate-900/80 flex items-center gap-4 glass-morphism shadow-sm menu-item-card animate-cascade ${
                !item.is_active ? 'opacity-60' : ''
              }`}
              style={{ animationDelay: `${idx * 50}ms`, opacity: 0 }}
            >
              {item.image_url && (
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 shadow-inner relative border border-slate-800 zoom-image-container">
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className={`w-full h-full object-cover ${!item.is_active ? 'opacity-40 grayscale' : ''}`}
                  />
                  {!item.is_active && (
                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-center p-1">
                      <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest leading-tight">Rupture</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-100 text-sm truncate">{item.name}</h3>
                  <span className="text-amber-500 font-extrabold text-sm whitespace-nowrap">{formatFCFA(item.price)}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{item.description}</p>
              </div>

              {/* Quick Add Button */}
              <button
                onClick={() => addToCart(item)}
                disabled={!item.is_active}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all ${
                  !item.is_active
                    ? 'bg-slate-900 border border-slate-850 text-slate-600 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/10 tap-feedback'
                }`}
              >
                <Plus size={18} />
              </button>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
            <Utensils size={40} className="opacity-30 animate-pulse text-amber-500" />
            <p className="text-sm font-medium">Aucun plat disponible pour le moment</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar (Service Requests & Cart button) */}
      <div className="fixed bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-xl border-t border-slate-900 p-4 max-w-md mx-auto z-40 flex flex-col gap-3">
        
        {/* Floating Cart Button (shows only when items are added) */}
        {getCartCount() > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            className={`w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex justify-between items-center shadow-lg shadow-amber-500/20 tap-feedback transition-all duration-200 ${
              cartBump ? 'animate-pop-scale' : ''
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingBag size={20} />
                <span className="absolute -top-2 -right-2 bg-slate-950 text-amber-400 text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-amber-500 font-black animate-pulse">
                  {getCartCount()}
                </span>
              </div>
              <span>Voir le panier</span>
            </div>
            <span className="text-lg font-black">{formatFCFA(getCartTotal())}</span>
          </button>
        )}

        {/* Call Waiter & Ask Note buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleServiceRequest('waiter')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-350 text-xs font-bold uppercase tracking-wider hover:bg-slate-850 tap-feedback transition-all"
          >
            <Bell size={15} className="text-amber-500 animate-pulse" />
            <span>Appeler un Serveur</span>
          </button>
          
          <button
            onClick={() => handleServiceRequest('bill')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-350 text-xs font-bold uppercase tracking-wider hover:bg-slate-850 tap-feedback transition-all"
          >
            <Receipt size={15} className="text-indigo-400" />
            <span>Demander la Note</span>
          </button>
        </div>

      </div>

      {/* Cart Slider Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-end justify-center">
          <div className="w-full max-w-md bg-slate-900 border-t border-slate-800 rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-slide-up max-h-[85vh]">
            
            {/* Drawer Drag bar / Header */}
            <div className="pt-3 pb-4 px-6 border-b border-slate-850 flex justify-between items-center bg-slate-900/60 backdrop-blur-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <ShoppingBag size={16} />
                </div>
                <h2 className="text-lg font-extrabold text-white">Votre Commande</h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-750 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4 max-h-[45vh] bg-slate-900/40">
              {cart.map((item) => (
                <div key={item.menuItem.id} className="flex justify-between items-center gap-4 py-1.5">
                  <div className="min-w-0 flex-grow">
                    <h4 className="font-bold text-slate-200 text-sm truncate">{item.menuItem.name}</h4>
                    <span className="text-xs text-amber-500/80 font-semibold mt-0.5 block">{formatFCFA(item.menuItem.price)}</span>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex items-center gap-3 bg-slate-950 border border-slate-850 rounded-2xl px-3 py-1.5 shadow-inner">
                    <button 
                      onClick={() => updateQuantity(item.menuItem.id, -1)}
                      className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-sm font-extrabold w-4 text-center text-white">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.menuItem.id, 1)}
                      className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <span className="text-sm font-black text-white w-20 text-right">
                    {formatFCFA(item.menuItem.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Checkout Area */}
            <div className="p-6 border-t border-slate-850 bg-slate-900 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400 font-medium">Sous-total</span>
                <span className="text-2xl font-black text-amber-500">{formatFCFA(getCartTotal())}</span>
              </div>

              <button
                onClick={handleValidateOrder}
                disabled={submittingOrder || cart.length === 0}
                className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black tracking-wide transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 active:scale-[0.97]"
              >
                {submittingOrder ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <ChefHat size={18} />
                    <span>Confirmer la commande</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
