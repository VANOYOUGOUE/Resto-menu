import { supabase, isSupabaseConfigured } from './supabase';

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url?: string | null;
  is_active: boolean;
}

export interface Order {
  id: string;
  table_number: string;
  status: 'pending' | 'cooking' | 'ready';
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  menu_item?: MenuItem;
}

export interface ServiceRequest {
  id: string;
  table_number: string;
  type: 'waiter' | 'bill';
  status: 'pending' | 'resolved';
  created_at: string;
}

// Jeu de données de démonstration (Mock) identique au seeding SQL
const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: '44444444-4444-4444-4444-444444444401',
    name: 'Foie Gras de Canard Maison',
    description: 'Foie gras de canard maison, chutney de figues et brioche toastée.',
    price: 12000,
    category: 'Entrées',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444402',
    name: 'Velouté de Potimarron',
    description: 'Un velouté onctueux de saison, éclats de châtaignes et émulsion truffée.',
    price: 5000,
    category: 'Entrées',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444403',
    name: 'Filet de Bœuf Rossini',
    description: 'Filet de bœuf tendre, foie gras poêlé, sauce Périgueux, écrasé de pommes de terre.',
    price: 22000,
    category: 'Plats',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444404',
    name: 'Risotto aux Cèpes',
    description: 'Risotto crémeux aux cèpes poêlés et parmesan Reggiano 24 mois.',
    price: 15000,
    category: 'Plats',
    image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444405',
    name: 'Mi-Cuit Chocolat Noir',
    description: 'Cœur coulant, glace vanille de Madagascar.',
    price: 6000,
    category: 'Desserts',
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444406',
    name: 'Cocktail Bistro Tonic',
    description: 'Gin infusé au romarin, tonic artisanal, concombre frais.',
    price: 7000,
    category: 'Boissons',
    image_url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop&q=80',
    is_active: true
  }
];

export const formatFCFA = (price: number): string => {
  return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA';
};

// Helper functions for localStorage fallback
const getLocalData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    if (item) return JSON.parse(item);
    // Return a deep copy of defaultValue to prevent memory mutation of static reference arrays
    return JSON.parse(JSON.stringify(defaultValue));
  } catch (error) {
    console.error('Error reading localStorage', error);
    return JSON.parse(JSON.stringify(defaultValue));
  }
};

const setLocalData = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('mvp-db-updated'));
  } catch (error) {
    console.error('Error writing localStorage', error);
  }
};

// =========================================================================
// API SERVICES
// =========================================================================

// 1. Menu Items
export const getMenuItems = async (): Promise<MenuItem[]> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('name');
    if (!error && data) return data;
    console.error('Error fetching menu items from Supabase:', error);
  }
  return getLocalData<MenuItem[]>('mvp_menu_items', MOCK_MENU_ITEMS);
};

// 1.1 Add Menu Item
export const addMenuItem = async (item: Omit<MenuItem, 'id'>): Promise<MenuItem | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image_url: item.image_url,
        is_active: item.is_active
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding menu item to Supabase:', error);
      return null;
    }
    return data;
  }

  // Mock
  const items = getLocalData<MenuItem[]>('mvp_menu_items', MOCK_MENU_ITEMS);
  const newItem: MenuItem = {
    ...item,
    id: `item-${Math.random().toString(36).substring(2, 9)}`
  };
  items.push(newItem);
  setLocalData('mvp_menu_items', items);
  return newItem;
};

// 1.2 Update Menu Item
export const updateMenuItem = async (id: string, updates: Partial<MenuItem>): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id);
    if (error) {
      console.error('Error updating menu item in Supabase:', error);
      return false;
    }
    return true;
  }

  // Mock
  const items = getLocalData<MenuItem[]>('mvp_menu_items', MOCK_MENU_ITEMS);
  const index = items.findIndex(it => it.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    setLocalData('mvp_menu_items', items);
    return true;
  }
  return false;
};

// 1.3 Delete Menu Item
export const deleteMenuItem = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting menu item from Supabase:', error);
      return false;
    }
    return true;
  }

  // Mock
  const items = getLocalData<MenuItem[]>('mvp_menu_items', MOCK_MENU_ITEMS);
  const filtered = items.filter(it => it.id !== id);
  setLocalData('mvp_menu_items', filtered);
  return true;
};

// 1.4 Upload Menu Image (to Supabase Storage or Base64 fallback)
export const uploadMenuImage = async (file: File): Promise<string> => {
  if (isSupabaseConfigured && supabase) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `menu-items/${fileName}`;

    // Tenter d'uploader vers le bucket public menu-images
    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file to Supabase:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('menu-images')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  // Mock Base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error("Erreur de lecture de l'image."));
    };
    reader.readAsDataURL(file);
  });
};

// 2. Orders Creation
export const createMVPOrder = async (
  tableNumber: string,
  items: { menu_item_id: string; quantity: number }[]
): Promise<Order | null> => {
  if (isSupabaseConfigured && supabase) {
    // 1. Insérer la commande
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        table_number: tableNumber,
        status: 'pending'
      })
      .select()
      .single();

    if (orderErr || !orderData) {
      console.error('Error inserting order in Supabase:', orderErr);
      return null;
    }

    // 2. Insérer les items de la commande
    const itemsToInsert = items.map(item => ({
      order_id: orderData.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsErr) {
      console.error('Error inserting order items in Supabase:', itemsErr);
      // Nettoyage de la commande orpheline en cas d'échec
      await supabase.from('orders').delete().eq('id', orderData.id);
      return null;
    }

    return orderData;
  }

  // Fallback Mock (localStorage)
  const orders = getLocalData<Order[]>('mvp_orders', []);
  const newOrder: Order = {
    id: `mvp-ord-${Math.random().toString(36).substring(2, 9)}`,
    table_number: tableNumber,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  const menuItems = MOCK_MENU_ITEMS;
  const orderItems: OrderItem[] = items.map(item => {
    const menuItem = menuItems.find(mi => mi.id === item.menu_item_id);
    return {
      id: `mvp-ordi-${Math.random().toString(36).substring(2, 9)}`,
      order_id: newOrder.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      menu_item: menuItem
    };
  });

  newOrder.items = orderItems;
  orders.push(newOrder);
  setLocalData('mvp_orders', orders);

  // Événement personnalisé pour simuler l'écoute temps réel localement
  window.dispatchEvent(new CustomEvent('mvp-order-created', { detail: newOrder }));
  return newOrder;
};

// 3. Service Requests Creation
export const createServiceRequest = async (
  tableNumber: string,
  type: 'waiter' | 'bill'
): Promise<ServiceRequest | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        table_number: tableNumber,
        type,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting service request in Supabase:', error);
      return null;
    }
    return data;
  }

  // Fallback Mock (localStorage)
  const requests = getLocalData<ServiceRequest[]>('mvp_service_requests', []);
  const newRequest: ServiceRequest = {
    id: `mvp-req-${Math.random().toString(36).substring(2, 9)}`,
    table_number: tableNumber,
    type,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  requests.push(newRequest);
  setLocalData('mvp_service_requests', requests);

  window.dispatchEvent(new CustomEvent('mvp-request-created', { detail: newRequest }));
  return newRequest;
};

// 4. Get all orders (including order items and menu details)
export const getMVPOrders = async (): Promise<Order[]> => {
  if (isSupabaseConfigured && supabase) {
    const { data: ordersData, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersErr || !ordersData) {
      console.error('Error fetching orders from Supabase:', ordersErr);
      return [];
    }

    // Récupérer et enrichir les items
    const enrichedOrders = await Promise.all(
      ordersData.map(async (order) => {
        const { data: itemsData, error: itemsErr } = await supabase
          .from('order_items')
          .select('*, menu_item:menu_items(*)')
          .eq('order_id', order.id);

        if (itemsErr) {
          console.error(`Error fetching items for order ${order.id}:`, itemsErr);
          return { ...order, items: [] };
        }

        // Adapter la structure
        const items = (itemsData || []).map(item => ({
          ...item,
          menu_item: item.menu_item
        }));

        return { ...order, items };
      })
    );

    return enrichedOrders;
  }

  // Mock
  return getLocalData<Order[]>('mvp_orders', [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

// 4.5 Get single order by ID
export const getMVPOrderById = async (orderId: string): Promise<Order | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !orderData) {
      console.error('Error fetching order from Supabase:', orderErr);
      return null;
    }

    const { data: itemsData, error: itemsErr } = await supabase
      .from('order_items')
      .select('*, menu_item:menu_items(*)')
      .eq('order_id', orderId);

    if (itemsErr) {
      console.error('Error fetching order items from Supabase:', itemsErr);
      return { ...orderData, items: [] };
    }

    const items = (itemsData || []).map(item => ({
      ...item,
      menu_item: item.menu_item
    }));

    return {
      ...orderData,
      items
    };
  }

  // Fallback Mock
  const orders = getLocalData<Order[]>('mvp_orders', []);
  const order = orders.find(o => o.id === orderId);
  return order || null;
};


// 5. Update order status
export const updateMVPOrderStatus = async (
  orderId: string,
  status: 'pending' | 'cooking' | 'ready'
): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    return !error;
  }

  // Mock
  const orders = getLocalData<Order[]>('mvp_orders', []);
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index].status = status;
    setLocalData('mvp_orders', orders);
    window.dispatchEvent(new CustomEvent(`mvp-order-status-${orderId}`, { detail: orders[index] }));
    window.dispatchEvent(new CustomEvent('mvp-order-updated', { detail: orders[index] }));
    return true;
  }
  return false;
};

// 6. Get service requests
export const getMVPServiceRequests = async (): Promise<ServiceRequest[]> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching service requests:', error);
      return [];
    }
    return data || [];
  }

  // Mock
  return getLocalData<ServiceRequest[]>('mvp_service_requests', [])
    .filter(req => req.status === 'pending')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

// 7. Resolve service request
export const resolveServiceRequest = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('service_requests')
      .update({ status: 'resolved' })
      .eq('id', id);
    return !error;
  }

  // Mock
  const requests = getLocalData<ServiceRequest[]>('mvp_service_requests', []);
  const index = requests.findIndex(r => r.id === id);
  if (index !== -1) {
    requests[index].status = 'resolved';
    setLocalData('mvp_service_requests', requests);
    window.dispatchEvent(new CustomEvent('mvp-request-resolved', { detail: requests[index] }));
    return true;
  }
  return false;
};

// =========================================================================
// REALTIME SUBSCRIPTIONS
// =========================================================================

export const subscribeToMVPOrders = (
  callback: (payload: { eventType: string; new: Order }) => void
): (() => void) => {
  if (isSupabaseConfigured && supabase) {
    const channel = supabase
      .channel('mvp-orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Charger les items de la nouvelle commande pour l'interface cuisine
            const { data: itemsData } = await supabase
              .from('order_items')
              .select('*, menu_item:menu_items(*)')
              .eq('order_id', payload.new.id);

            const enriched = { 
              ...payload.new, 
              items: (itemsData || []).map(item => ({
                ...item,
                menu_item: item.menu_item
              }))
            } as Order;

            callback({ eventType: payload.eventType, new: enriched });
          } else {
            callback({ eventType: payload.eventType, new: payload.new as Order });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Mock Fallback
  const handleCreated = (e: Event) => {
    const customEvent = e as CustomEvent<Order>;
    callback({ eventType: 'INSERT', new: customEvent.detail });
  };

  const handleUpdated = (e: Event) => {
    const customEvent = e as CustomEvent<Order>;
    callback({ eventType: 'UPDATE', new: customEvent.detail });
  };

  const handleGlobal = () => {
    callback({ eventType: 'REFRESH', new: {} as Order });
  };

  window.addEventListener('mvp-order-created', handleCreated);
  window.addEventListener('mvp-order-updated', handleUpdated);
  window.addEventListener('mvp-db-updated', handleGlobal);

  return () => {
    window.removeEventListener('mvp-order-created', handleCreated);
    window.removeEventListener('mvp-order-updated', handleUpdated);
    window.removeEventListener('mvp-db-updated', handleGlobal);
  };
};

export const subscribeToMVPServiceRequests = (
  callback: (payload: { eventType: string; new: ServiceRequest }) => void
): (() => void) => {
  if (isSupabaseConfigured && supabase) {
    const channel = supabase
      .channel('mvp-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests' },
        (payload) => {
          callback({ eventType: payload.eventType, new: payload.new as ServiceRequest });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Mock Fallback
  const handleCreated = (e: Event) => {
    const customEvent = e as CustomEvent<ServiceRequest>;
    callback({ eventType: 'INSERT', new: customEvent.detail });
  };

  const handleResolved = (e: Event) => {
    const customEvent = e as CustomEvent<ServiceRequest>;
    callback({ eventType: 'UPDATE', new: customEvent.detail });
  };

  const handleGlobal = () => {
    callback({ eventType: 'REFRESH', new: {} as ServiceRequest });
  };

  window.addEventListener('mvp-request-created', handleCreated);
  window.addEventListener('mvp-request-resolved', handleResolved);
  window.addEventListener('mvp-db-updated', handleGlobal);

  return () => {
    window.removeEventListener('mvp-request-created', handleCreated);
    window.removeEventListener('mvp-request-resolved', handleResolved);
    window.removeEventListener('mvp-db-updated', handleGlobal);
  };
};

export const subscribeToMVPOrderStatus = (
  orderId: string,
  callback: (order: Order) => void
): (() => void) => {
  if (isSupabaseConfigured && supabase) {
    const channel = supabase
      .channel(`mvp-order-status-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          callback(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Mock Fallback
  const handleStatusChange = (e: Event) => {
    const customEvent = e as CustomEvent<Order>;
    callback(customEvent.detail);
  };

  window.addEventListener(`mvp-order-status-${orderId}`, handleStatusChange);

  return () => {
    window.removeEventListener(`mvp-order-status-${orderId}`, handleStatusChange);
  };
};

// =========================================================================
// TABLES MANAGEMENT (ADMIN SIDE)
// =========================================================================

export interface AdminTable {
  id: string;
  table_number: string;
  created_at: string;
}

const DEFAULT_MOCK_TABLES: AdminTable[] = [
  { id: 'tbl-1', table_number: '1', created_at: new Date().toISOString() },
  { id: 'tbl-2', table_number: '2', created_at: new Date().toISOString() },
  { id: 'tbl-3', table_number: '3', created_at: new Date().toISOString() },
  { id: 'tbl-4', table_number: '4', created_at: new Date().toISOString() }
];

export const getMVPTables = async (): Promise<AdminTable[]> => {
  if (isSupabaseConfigured && supabase) {
    // Si la table 'tables' existe dans Supabase (cas où ils utilisent le schéma étendu)
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('table_number');
    
    if (!error && data) {
      return data.map(item => ({
        id: item.id,
        table_number: item.table_number,
        created_at: item.created_at
      }));
    }
  }

  // Fallback Mock (localStorage)
  return getLocalData<AdminTable[]>('mvp_tables', DEFAULT_MOCK_TABLES);
};

export const addMVPTable = async (tableNumber: string): Promise<AdminTable | null> => {
  if (isSupabaseConfigured && supabase) {
    // Tenter d'insérer dans Supabase si la table tables existe
    const { data, error } = await supabase
      .from('tables')
      .insert({
        table_number: tableNumber,
        short_code: `tb-${tableNumber.toLowerCase()}`,
        restaurant_id: '22222222-2222-2222-2222-222222222222' // Bistro Demo ID
      })
      .select()
      .single();

    if (!error && data) {
      return {
        id: data.id,
        table_number: data.table_number,
        created_at: data.created_at
      };
    }
  }

  // Mock Fallback
  const tables = getLocalData<AdminTable[]>('mvp_tables', DEFAULT_MOCK_TABLES);
  
  // Éviter les doublons
  if (tables.some(t => t.table_number.toLowerCase() === tableNumber.toLowerCase())) {
    throw new Error("Cette table existe déjà.");
  }

  const newTable: AdminTable = {
    id: `tbl-${Math.random().toString(36).substring(2, 9)}`,
    table_number: tableNumber,
    created_at: new Date().toISOString()
  };
  tables.push(newTable);
  
  // Trier les tables par numéro
  tables.sort((a, b) => {
    const numA = parseInt(a.table_number);
    const numB = parseInt(b.table_number);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.table_number.localeCompare(b.table_number);
  });

  setLocalData('mvp_tables', tables);
  return newTable;
};

export const deleteMVPTable = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);
    if (!error) return true;
  }

  // Mock Fallback
  const tables = getLocalData<AdminTable[]>('mvp_tables', DEFAULT_MOCK_TABLES);
  const filtered = tables.filter(t => t.id !== id);
  setLocalData('mvp_tables', filtered);
  return true;
};

