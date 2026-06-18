/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  getRestaurantBySlug, 
  getCategoriesAndMenuItems, 
  createOrder, 
  createWaiterCall, 
  Restaurant, 
  Category, 
  MenuItem 
} from '@/lib/db';
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
  AlertTriangle 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function ClientMenuPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const slug = params.slug as string;
  const tableId = searchParams.get('table');

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Toast notifications State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    async function loadMenuData() {
      try {
        const resto = await getRestaurantBySlug(slug);
        if (!resto) {
          setError("Le restaurant demandé est introuvable.");
          setLoading(false);
          return;
        }
        setRestaurant(resto);

        const { categories: cats, menuItems: items } = await getCategoriesAndMenuItems(resto.id);
        setCategories(cats);
        setMenuItems(items);
        if (cats.length > 0) {
          setSelectedCategory(cats[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Erreur de chargement du menu.");
      } finally {
        setLoading(false);
      }
    }

    loadMenuData();
  }, [slug]);

  // Show auto-dismissing toast
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Cart Handlers
  const addToCart = (item: MenuItem) => {
    if (item.status === 'out_of_stock') {
      showToast("Cet article est en rupture de stock", "error");
      return;
    }
    setCart(prevCart => {
      const existing = prevCart.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prevCart.map(i => 
          i.menuItem.id === item.id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      return [...prevCart, { menuItem: item, quantity: 1 }];
    });
    showToast(`${item.name} ajouté au panier !`);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(i => {
        if (i.menuItem.id === itemId) {
          const newQty = i.quantity + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      }).filter(Boolean) as CartItem[];
    });
  };

  const getCartTotal = () => {
    return cart.reduce((acc, curr) => acc + (curr.menuItem.price * curr.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((acc, curr) => acc + curr.quantity, 0);
  };

  // Call Waiter Handler
  const handleCallWaiter = async (type: 'call' | 'bill') => {
    if (!restaurant) return;
    if (!tableId) {
      showToast("Veuillez scanner le QR Code à votre table pour appeler le serveur", "error");
      return;
    }

    try {
      const res = await createWaiterCall(restaurant.id, tableId, type);
      if (res) {
        showToast(`${type === 'bill' ? "Addition demandée" : "Serveur appelé"} ! Un serveur arrive.`, 'info');
      } else {
        showToast("Impossible d'envoyer l'alerte serveur.", 'error');
      }
    } catch (err) {
      console.error(err);
      showToast("Une erreur est survenue.", 'error');
    }
  };

  // Submit Order Handler
  const handleValidateOrder = async () => {
    if (cart.length === 0 || !restaurant) return;
    if (!tableId) {
      showToast("Veuillez scanner le QR Code de votre table pour finaliser la commande.", "error");
      return;
    }

    setSubmittingOrder(true);
    try {
      const orderData = {
        restaurant_id: restaurant.id,
        table_id: tableId,
        total_amount: getCartTotal(),
        notes: orderNotes,
        items: cart.map(i => ({
          menu_item_id: i.menuItem.id,
          quantity: i.quantity,
          unit_price: i.menuItem.price,
          name: i.menuItem.name
        }))
      };

      const result = await createOrder(orderData);
      if (result) {
        // Confetti effect
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D97706', '#F59E0B', '#FBBF24', '#ffffff']
        });

        showToast("Commande validée avec succès !", "success");
        setCart([]);
        setOrderNotes('');
        setIsCartOpen(false);
        
        // Rediriger vers l'écran de statut en temps réel
        setTimeout(() => {
          router.push(`/order/${result.id}`);
        }, 1500);
      } else {
        showToast("Erreur lors de la validation de la commande.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Une erreur est survenue.", "error");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Filtre et recherche
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <ChefHat className="w-10 h-10 text-amber-500 animate-pulse" />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-950/50 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
          <AlertTriangle size={30} />
        </div>
        <h1 className="text-xl font-bold text-slate-100">{error || "Erreur de configuration"}</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-sm">Le lien cliqué est incorrect ou expiré. Veuillez rescanner le QR Code.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm border font-medium ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
              : toastMessage.type === 'error'
              ? 'bg-red-950/90 text-red-300 border-red-500/30'
              : 'bg-blue-950/90 text-blue-300 border-blue-500/30'
          }`}>
            {toastMessage.type === 'success' && <Check size={16} />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
        {restaurant.banner_url ? (
          <img 
            src={restaurant.banner_url} 
            alt={restaurant.name} 
            className="w-full h-full object-cover opacity-65"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-amber-950 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      {/* Header Info */}
      <div className="px-4 -mt-10 relative z-10 flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <div className="flex gap-3 items-end">
            {restaurant.logo_url && (
              <img 
                src={restaurant.logo_url} 
                alt="Logo" 
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-900 shadow-xl"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-50 tracking-tight">{restaurant.name}</h1>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <span>📍</span> {restaurant.address.split(',')[0]}
              </p>
            </div>
          </div>

          {/* Table Indicator */}
          {tableId ? (
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-wider">
              Table Connectée
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium">
              Mode Consultation
            </div>
          )}
        </div>

        {/* Quick Actions (Call Waiter / Bill) */}
        {tableId && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => handleCallWaiter('call')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-300 text-sm font-medium transition-all hover:border-slate-750 active:scale-95"
            >
              <Bell size={16} className="text-amber-500" />
              <span>Appeler Serveur</span>
            </button>
            <button
              onClick={() => handleCallWaiter('bill')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-300 text-sm font-medium transition-all hover:border-slate-750 active:scale-95"
            >
              <span>💳 Demander l&apos;Addition</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-4 mt-6">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Rechercher une entrée, un plat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
          />
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="mt-6 px-4 overflow-x-auto whitespace-nowrap flex gap-2 no-scrollbar">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              selectedCategory === category.id
                ? 'bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-600/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="mt-6 px-4 flex flex-col gap-4">
        {filteredMenuItems.length > 0 ? (
          filteredMenuItems.map((item) => (
            <div 
              key={item.id}
              className="p-3.5 rounded-2xl glass-morphism flex gap-4 items-center hover:border-slate-700 transition-all duration-300 animate-slide-up"
            >
              {item.image_url && (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                  {item.status === 'out_of_stock' && (
                    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-center p-1">
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-tight">Rupture</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start gap-1">
                  <h3 className="font-semibold text-slate-100 text-base truncate">{item.name}</h3>
                  <span className="text-amber-500 font-bold text-base whitespace-nowrap">{item.price.toFixed(2)} €</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                
                {item.allergens.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.allergens.map((all, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-850 text-slate-400">
                        {all}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add button */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => addToCart(item)}
                  disabled={item.status === 'out_of_stock'}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    item.status === 'out_of_stock'
                      ? 'bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-md shadow-amber-600/10 active:scale-90'
                  }`}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <Utensils size={36} className="opacity-40" />
            <p className="text-sm">Aucun plat disponible dans cette catégorie</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button (At the bottom) */}
      {getCartCount() > 0 && (
        <div className="fixed bottom-6 inset-x-4 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold flex justify-between items-center shadow-2xl shadow-amber-600/30 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} />
              <span className="bg-slate-950 text-amber-500 text-xs px-2 py-0.5 rounded-full font-bold">
                {getCartCount()}
              </span>
              <span>Mon Panier</span>
            </div>
            <span className="text-lg">{getCartTotal().toFixed(2)} €</span>
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-end justify-center">
          <div 
            className="w-full max-w-md bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up"
            style={{ bottom: 0 }}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-850 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-amber-500" size={20} />
                <h2 className="text-lg font-bold">Votre Panier</h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body (Items List) */}
            <div className="p-4 flex-grow overflow-y-auto flex flex-col gap-4 max-h-[40vh]">
              {cart.map((item) => (
                <div key={item.menuItem.id} className="flex justify-between items-center gap-4">
                  <div className="min-w-0 flex-grow">
                    <h4 className="font-medium text-slate-200 text-sm truncate">{item.menuItem.name}</h4>
                    <span className="text-xs text-slate-400">{item.menuItem.price.toFixed(2)} €</span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 bg-slate-950 border border-slate-850 rounded-xl px-2 py-1">
                    <button 
                      onClick={() => updateQuantity(item.menuItem.id, -1)}
                      className="p-1 hover:text-amber-500 text-slate-400 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.menuItem.id, 1)}
                      className="p-1 hover:text-amber-500 text-slate-400 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <span className="text-sm font-bold text-slate-100 w-16 text-right">
                    {(item.menuItem.price * item.quantity).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>

            {/* Notes Section */}
            <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Instructions spéciales pour la cuisine</label>
              <textarea
                placeholder="Ex: sans sel, sauce à part, etc."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full p-3 bg-slate-950 rounded-xl border border-slate-850 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-amber-500 text-sm h-16 resize-none"
              />
            </div>

            {/* Drawer Footer (Checkout) */}
            <div className="p-4 border-t border-slate-850 flex flex-col gap-4 bg-slate-900">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total de la commande</span>
                <span className="text-2xl font-bold text-amber-500">{getCartTotal().toFixed(2)} €</span>
              </div>

              {tableId ? (
                <button
                  onClick={handleValidateOrder}
                  disabled={submittingOrder || cart.length === 0}
                  className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold transition-all shadow-xl shadow-amber-600/10 flex items-center justify-center gap-2 active:scale-95"
                >
                  {submittingOrder ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Validation en cours...</span>
                    </>
                  ) : (
                    <>
                      <ChefHat size={18} />
                      <span>Envoyer en Cuisine</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="flex-shrink-0" size={16} />
                  <span>Vous êtes en mode consultation de menu. Pour commander, veuillez scanner le QR code situé sur votre table.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
