import { supabase, isSupabaseConfigured } from './supabase';

// Types de données
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  banner_url: string;
  contact_phone: string;
  address: string;
  ui_config: {
    primaryColor: string;
    theme: 'light' | 'dark';
  };
}

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: string;
  short_code: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  status: 'available' | 'out_of_stock' | 'hidden';
  allergens: string[];
  sort_order: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  // Optionnel pour l'affichage UI
  menu_item?: MenuItem;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'canceled';
  total_amount: number;
  notes: string | null;
  created_at: string;
  accepted_at?: string;
  served_at?: string;
  // Jointures
  table?: Table;
  items?: OrderItem[];
}

export interface WaiterCall {
  id: string;
  restaurant_id: string;
  table_id: string;
  type: 'call' | 'bill';
  status: 'pending' | 'resolved';
  created_at: string;
  resolved_at?: string;
  table?: Table;
}

// Données statiques de démonstration (Seeding initial du Mock)
const MOCK_RESTAURANT: Restaurant = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Le Bistro Premium',
  slug: 'bistro-premium',
  logo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=300&fit=crop&q=80',
  banner_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop&q=80',
  contact_phone: '+33 1 23 45 67 89',
  address: '12 Rue de la Gastronomie, 75001 Paris',
  ui_config: {
    primaryColor: '#D97706', // Ambre chaud
    theme: 'dark'
  }
};

const MOCK_TABLES: Table[] = [
  { id: '33333333-3333-3333-3333-333333333301', restaurant_id: MOCK_RESTAURANT.id, table_number: 'Table 1', short_code: 'tb1', is_active: true },
  { id: '33333333-3333-3333-3333-333333333302', restaurant_id: MOCK_RESTAURANT.id, table_number: 'Table 2', short_code: 'tb2', is_active: true },
  { id: '33333333-3333-3333-3333-333333333303', restaurant_id: MOCK_RESTAURANT.id, table_number: 'Table 3', short_code: 'tb3', is_active: true },
  { id: '33333333-3333-3333-3333-333333333304', restaurant_id: MOCK_RESTAURANT.id, table_number: 'Table 4', short_code: 'tb4', is_active: true }
];

const MOCK_CATEGORIES: Category[] = [
  { id: '44444444-4444-4444-4444-444444444401', restaurant_id: MOCK_RESTAURANT.id, name: 'Entrées', sort_order: 1, is_active: true },
  { id: '44444444-4444-4444-4444-444444444402', restaurant_id: MOCK_RESTAURANT.id, name: 'Plats Signature', sort_order: 2, is_active: true },
  { id: '44444444-4444-4444-4444-444444444403', restaurant_id: MOCK_RESTAURANT.id, name: 'Desserts', sort_order: 3, is_active: true },
  { id: '44444444-4444-4444-4444-444444444404', restaurant_id: MOCK_RESTAURANT.id, name: 'Boissons & Cocktails', sort_order: 4, is_active: true }
];

const MOCK_MENU_ITEMS: MenuItem[] = [
  // Entrées
  {
    id: '55555555-5555-5555-5555-555555555501',
    category_id: '44444444-4444-4444-4444-444444444401',
    name: 'Foie Gras de Canard Maison',
    description: 'Foie gras de canard maison, chutney de figues et brioche toastée.',
    price: 18.50,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80',
    status: 'available',
    allergens: ['Gluten', 'Sulfites'],
    sort_order: 1
  },
  {
    id: '55555555-5555-5555-5555-555555555502',
    category_id: '44444444-4444-4444-4444-444444444401',
    name: 'Velouté de Potimarron aux Châtaignes',
    description: 'Un velouté onctueux de saison, éclats de châtaignes et émulsion truffée.',
    price: 12.00,
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80',
    status: 'available',
    allergens: ['Lactose'],
    sort_order: 2
  },
  // Plats Signature
  {
    id: '55555555-5555-5555-5555-555555555503',
    category_id: '44444444-4444-4444-4444-444444444402',
    name: 'Filet de Bœuf Rossini',
    description: 'Filet de bœuf tendre, escalope de foie gras poêlée, sauce Périgueux aux truffes, écrasé de pommes de terre.',
    price: 36.00,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80',
    status: 'available',
    allergens: ['Lactose', 'Sulfites'],
    sort_order: 1
  },
  {
    id: '55555555-5555-5555-5555-555555555504',
    category_id: '44444444-4444-4444-4444-444444444402',
    name: 'Pavé de Cabillaud en Croûte d\'Herbes',
    description: 'Cabillaud frais, mousseline de panais, légumes glacés et émulsion de coquillages.',
    price: 26.50,
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop&q=80',
    status: 'available',
    allergens: ['Poisson', 'Lactose'],
    sort_order: 2
  },
  {
    id: '55555555-5555-5555-5555-555555555505',
    category_id: '44444444-4444-4444-4444-444444444402',
    name: 'Risotto aux Cèpes & Truffe Fraîche',
    description: 'Risotto crémeux aux cèpes poêlés, parmesan Reggiano 24 mois, lamelles de truffe fraîche.',
    price: 24.00,
    image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop&q=80',
    status: 'available',
    allergens: ['Lactose'],
    sort_order: 3
  },
  // Desserts
  {
    id: '55555555-5555-5555-5555-555555555506',
    category_id: '44444444-4444-4444-4444-444444444403',
    name: 'Mi-Cuit Chocolat Noir Intense',
    description: 'Coeur coulant, glace vanille de Madagascar et tuile croustillante.',
    price: 9.50,
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop&q=80',
    status: 'available',
    allergens: ['Gluten', 'Lactose', 'Œufs'],
    sort_order: 1
  },
  {
    id: '55555555-5555-5555-5555-555555555507',
    category_id: '44444444-4444-4444-4444-444444444403',
    name: 'Tarte Tatin Traditionnelle',
    description: 'Pommes caramélisées, pâte feuilletée croustillante et crème fraîche d\'Isigny.',
    price: 9.00,
    image_url: 'https://images.unsplash.com/photo-1508737804141-4c3b688e25be?w=400&h=300&fit=crop&q=80',
    status: 'available',
    allergens: ['Gluten', 'Lactose'],
    sort_order: 2
  },
  // Boissons
  {
    id: '55555555-5555-5555-5555-555555555508',
    category_id: '44444444-4444-4444-4444-444444444404',
    name: 'Cocktail "Bistro Tonic"',
    description: 'Gin infusé au romarin, tonic artisanal, concombre frais et zeste de citron vert.',
    price: 12.00,
    image_url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop&q=80',
    status: 'available',
    allergens: [],
    sort_order: 1
  },
  {
    id: '55555555-5555-5555-5555-555555555509',
    category_id: '44444444-4444-4444-4444-444444444404',
    name: 'Château Margaux 2015 (Au verre)',
    description: 'Vin rouge d\'exception de la région de Bordeaux.',
    price: 19.00,
    image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop&q=80',
    status: 'available',
    allergens: ['Sulfites'],
    sort_order: 2
  },
  {
    id: '55555555-5555-5555-5555-555555555510',
    category_id: '44444444-4444-4444-4444-444444444404',
    name: 'Eau Gazeuse Micro-filtrée (75cl)',
    description: 'Eau filtrée et gazéifiée sur place.',
    price: 4.50,
    image_url: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=300&fit=crop&q=80',
    status: 'available',
    allergens: [],
    sort_order: 3
  }
];

// Fonctions d'aide pour le Local Storage (Simule la persistance)
const getLocalStorageData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading localStorage key', key, error);
    return defaultValue;
  }
};

const setLocalStorageData = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // Propager un événement global pour simuler la BDD en direct entre les fenêtres/onglets
    window.dispatchEvent(new Event('mock-db-updated'));
  } catch (error) {
    console.error('Error writing localStorage key', key, error);
  }
};

// --- INITIALISATION MOCK STATE ---
const getMockOrders = (): Order[] => getLocalStorageData<Order[]>('mock_orders', []);
const setMockOrders = (orders: Order[]) => setLocalStorageData('mock_orders', orders);

const getMockWaiterCalls = (): WaiterCall[] => getLocalStorageData<WaiterCall[]>('mock_waiter_calls', []);
const setMockWaiterCalls = (calls: WaiterCall[]) => setLocalStorageData('mock_waiter_calls', calls);

const getMockMenuItems = (): MenuItem[] => getLocalStorageData<MenuItem[]>('mock_menu_items', MOCK_MENU_ITEMS);
const setMockMenuItems = (items: MenuItem[]) => setLocalStorageData('mock_menu_items', items);

// =========================================================================
// API UNIFIÉE (SUPABASE SI CONFIGURÉ, SINON RETOUR AUX MOCKS)
// =========================================================================

export const getRestaurantBySlug = async (slug: string): Promise<Restaurant | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) return null;
    return data;
  }

  // Mock
  if (slug === MOCK_RESTAURANT.slug) {
    return MOCK_RESTAURANT;
  }
  return null;
};

export const getTableByShortCode = async (code: string): Promise<Table | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('short_code', code)
      .single();
    if (error) return null;
    return data;
  }

  // Mock
  const table = MOCK_TABLES.find(t => t.short_code === code && t.is_active);
  return table || null;
};

export const getCategoriesAndMenuItems = async (restaurantId: string): Promise<{ categories: Category[]; menuItems: MenuItem[] }> => {
  if (isSupabaseConfigured && supabase) {
    const { data: catData, error: catErr } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    const { data: itemData, error: itemErr } = await supabase
      .from('menu_items')
      .select('*, categories!inner(restaurant_id)')
      .eq('categories.restaurant_id', restaurantId)
      .neq('status', 'hidden')
      .order('sort_order', { ascending: true });

    if (catErr || itemErr) {
      console.error(catErr || itemErr);
      return { categories: [], menuItems: [] };
    }

    return { 
      categories: catData || [], 
      menuItems: itemData || [] 
    };
  }

  // Mock
  const categories = MOCK_CATEGORIES.filter(c => c.restaurant_id === restaurantId && c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const menuItems = getMockMenuItems().filter(item => 
    categories.some(cat => cat.id === item.category_id) && item.status !== 'hidden'
  ).sort((a, b) => a.sort_order - b.sort_order);

  return { categories, menuItems };
};

export const createOrder = async (orderInput: {
  restaurant_id: string;
  table_id: string;
  total_amount: number;
  notes: string;
  items: { menu_item_id: string; quantity: number; unit_price: number; name: string }[];
}): Promise<Order | null> => {
  if (isSupabaseConfigured && supabase) {
    // Insérer la commande principale
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        restaurant_id: orderInput.restaurant_id,
        table_id: orderInput.table_id,
        total_amount: orderInput.total_amount,
        notes: orderInput.notes || null,
        status: 'pending'
      })
      .select()
      .single();

    if (orderErr || !orderData) {
      console.error('Order insert error:', orderErr);
      return null;
    }

    // Insérer les lignes de commande
    const itemsToInsert = orderInput.items.map(item => ({
      order_id: orderData.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      notes: ''
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsErr) {
      console.error('Order items insert error:', itemsErr);
      return null;
    }

    return orderData;
  }

  // Mock
  const orders = getMockOrders();
  const table = MOCK_TABLES.find(t => t.id === orderInput.table_id);
  const newOrder: Order = {
    id: `ord-${Math.random().toString(36).substring(2, 9)}`,
    restaurant_id: orderInput.restaurant_id,
    table_id: orderInput.table_id,
    status: 'pending',
    total_amount: orderInput.total_amount,
    notes: orderInput.notes || null,
    created_at: new Date().toISOString(),
    table: table
  };

  const orderItems: OrderItem[] = orderInput.items.map(it => {
    const mItem = getMockMenuItems().find(mi => mi.id === it.menu_item_id);
    return {
      id: `ordi-${Math.random().toString(36).substring(2, 9)}`,
      order_id: newOrder.id,
      menu_item_id: it.menu_item_id,
      quantity: it.quantity,
      unit_price: it.unit_price,
      menu_item: mItem
    };
  });

  newOrder.items = orderItems;
  orders.push(newOrder);
  setMockOrders(orders);

  // Déclencher un événement de notification locale
  const event = new CustomEvent('mock-order-created', { detail: newOrder });
  window.dispatchEvent(event);

  return newOrder;
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .select('*, table:tables(*)')
      .eq('id', orderId)
      .single();

    if (orderErr) return null;

    const { data: itemsData, error: itemsErr } = await supabase
      .from('order_items')
      .select('*, menu_item:menu_items(*)')
      .eq('order_id', orderId);

    if (itemsErr) return orderData;

    return {
      ...orderData,
      items: itemsData || []
    };
  }

  // Mock
  const orders = getMockOrders();
  const o = orders.find(ord => ord.id === orderId);
  return o || null;
};

export const getOrders = async (restaurantId: string): Promise<Order[]> => {
  const client = supabase;
  if (isSupabaseConfigured && client) {
    const { data: orders, error } = await client
      .from('orders')
      .select('*, table:tables(*)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) return [];

    // Charger les items pour chaque commande
    const enrichedOrders = await Promise.all(
      (orders || []).map(async (o) => {
        const { data: items } = await client
          .from('order_items')
          .select('*, menu_item:menu_items(*)')
          .eq('order_id', o.id);
        return { ...o, items: items || [] };
      })
    );

    return enrichedOrders;
  }

  // Mock
  return getMockOrders()
    .filter(o => o.restaurant_id === restaurantId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<boolean> => {
  const updates: Partial<Order> = { status };
  if (status === 'preparing') {
    updates.accepted_at = new Date().toISOString();
  } else if (status === 'ready') {
    updates.served_at = new Date().toISOString();
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);
    return !error;
  }

  // Mock
  const orders = getMockOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...updates };
    setMockOrders(orders);

    // Déclencher un événement de notification locale
    const event = new CustomEvent(`mock-order-status-changed-${orderId}`, { detail: orders[idx] });
    window.dispatchEvent(event);
    
    const globalEvent = new CustomEvent('mock-order-status-changed', { detail: orders[idx] });
    window.dispatchEvent(globalEvent);

    return true;
  }
  return false;
};

// Gestionnaire des Plats (Directement depuis l'UI Manager si besoin)
export const updateMenuItemStatus = async (itemId: string, status: MenuItem['status']): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('menu_items')
      .update({ status })
      .eq('id', itemId);
    return !error;
  }

  // Mock
  const items = getMockMenuItems();
  const idx = items.findIndex(it => it.id === itemId);
  if (idx !== -1) {
    items[idx].status = status;
    setMockMenuItems(items);
    return true;
  }
  return false;
};

// Appels serveurs
export const createWaiterCall = async (restaurantId: string, tableId: string, type: 'call' | 'bill'): Promise<WaiterCall | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('waiter_calls')
      .insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        type,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return null;
    }
    return data;
  }

  // Mock
  const calls = getMockWaiterCalls();
  const table = MOCK_TABLES.find(t => t.id === tableId);
  const newCall: WaiterCall = {
    id: `call-${Math.random().toString(36).substring(2, 9)}`,
    restaurant_id: restaurantId,
    table_id: tableId,
    type,
    status: 'pending',
    created_at: new Date().toISOString(),
    table: table
  };

  calls.push(newCall);
  setMockWaiterCalls(calls);

  // Déclencher un événement de notification locale
  const event = new CustomEvent('mock-call-created', { detail: newCall });
  window.dispatchEvent(event);

  return newCall;
};

export const getWaiterCalls = async (restaurantId: string): Promise<WaiterCall[]> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('waiter_calls')
      .select('*, table:tables(*)')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) return [];
    return data || [];
  }

  // Mock
  return getMockWaiterCalls()
    .filter(c => c.restaurant_id === restaurantId && c.status === 'pending')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

export const resolveWaiterCall = async (callId: string): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('waiter_calls')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', callId);

    return !error;
  }

  // Mock
  const calls = getMockWaiterCalls();
  const idx = calls.findIndex(c => c.id === callId);
  if (idx !== -1) {
    calls[idx] = {
      ...calls[idx],
      status: 'resolved',
      resolved_at: new Date().toISOString()
    };
    setMockWaiterCalls(calls);

    const event = new CustomEvent('mock-call-resolved', { detail: calls[idx] });
    window.dispatchEvent(event);

    return true;
  }
  return false;
};

// =========================================================================
// REALTIME SUBSCRIPTIONS
// =========================================================================

export const subscribeToOrders = (
  restaurantId: string, 
  callback: (payload: { eventType: string; new: Order }) => void
): (() => void) => {
  const client = supabase;
  if (isSupabaseConfigured && client) {
    const channel = client
      .channel(`orders-changes-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const table = await getTableById(payload.new.table_id);
            const enriched = { ...payload.new, table } as Order;
            callback({ eventType: payload.eventType, new: enriched });
          } else {
            callback({ eventType: payload.eventType, new: payload.new as Order });
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }

  // Mock - Ecouteur d'évènement local CustomEvent
  const handleOrderCreated = (e: Event) => {
    const customEvent = e as CustomEvent<Order>;
    callback({
      eventType: 'INSERT',
      new: customEvent.detail
    });
  };

  const handleOrderStatusChanged = (e: Event) => {
    const customEvent = e as CustomEvent<Order>;
    callback({
      eventType: 'UPDATE',
      new: customEvent.detail
    });
  };

  const handleGlobalUpdate = () => {
    // Événement de mise à jour globale
    callback({ eventType: 'REFRESH', new: {} as Order });
  };

  window.addEventListener('mock-order-created', handleOrderCreated);
  window.addEventListener('mock-order-status-changed', handleOrderStatusChanged);
  window.addEventListener('mock-db-updated', handleGlobalUpdate);

  return () => {
    window.removeEventListener('mock-order-created', handleOrderCreated);
    window.removeEventListener('mock-order-status-changed', handleOrderStatusChanged);
    window.removeEventListener('mock-db-updated', handleGlobalUpdate);
  };
};

export const subscribeToWaiterCalls = (
  restaurantId: string, 
  callback: (payload: { eventType: string; new: WaiterCall }) => void
): (() => void) => {
  const client = supabase;
  if (isSupabaseConfigured && client) {
    const channel = client
      .channel(`waiter-calls-changes-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waiter_calls',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const table = await getTableById(payload.new.table_id);
            const enriched = { ...payload.new, table } as WaiterCall;
            callback({ eventType: payload.eventType, new: enriched });
          } else {
            callback({ eventType: payload.eventType, new: payload.new as WaiterCall });
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }

  // Mock
  const handleCallCreated = (e: Event) => {
    const customEvent = e as CustomEvent<WaiterCall>;
    callback({
      eventType: 'INSERT',
      new: customEvent.detail
    });
  };

  const handleCallResolved = (e: Event) => {
    const customEvent = e as CustomEvent<WaiterCall>;
    callback({
      eventType: 'UPDATE',
      new: customEvent.detail
    });
  };

  const handleGlobalUpdate = () => {
    callback({ eventType: 'REFRESH', new: {} as WaiterCall });
  };

  window.addEventListener('mock-call-created', handleCallCreated);
  window.addEventListener('mock-call-resolved', handleCallResolved);
  window.addEventListener('mock-db-updated', handleGlobalUpdate);

  return () => {
    window.removeEventListener('mock-call-created', handleCallCreated);
    window.removeEventListener('mock-call-resolved', handleCallResolved);
    window.removeEventListener('mock-db-updated', handleGlobalUpdate);
  };
};

export const subscribeToOrderStatus = (orderId: string, callback: (order: Order) => void): (() => void) => {
  const client = supabase;
  if (isSupabaseConfigured && client) {
    const channel = client
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          callback(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }

  // Mock
  const handleStatusChange = (e: Event) => {
    const customEvent = e as CustomEvent<Order>;
    callback(customEvent.detail);
  };

  window.addEventListener(`mock-order-status-changed-${orderId}`, handleStatusChange);

  return () => {
    window.removeEventListener(`mock-order-status-changed-${orderId}`, handleStatusChange);
  };
};

// Récupération ponctuelle d'une table par son ID
const getTableById = async (tableId: string): Promise<Table | null> => {
  const client = supabase;
  if (isSupabaseConfigured && client) {
    const { data } = await client
      .from('tables')
      .select('*')
      .eq('id', tableId)
      .single();
    return data;
  }
  return MOCK_TABLES.find(t => t.id === tableId) || null;
};
