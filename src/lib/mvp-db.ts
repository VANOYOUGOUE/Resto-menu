import { supabase, isSupabaseConfigured } from './supabase';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  subscription_status?: 'trialing' | 'active' | 'past_due' | 'suspended';
  trial_ends_at?: string;
  subscription_ends_at?: string | null;
  created_at?: string;
}

export interface RestaurantUser {
  id: string;
  restaurant_id: string;
  name: string;
  email: string;
  role: 'admin' | 'cook' | 'waiter' | 'super_admin';
  password?: string;
  created_at?: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url?: string | null;
  is_active: boolean;
}

export interface Order {
  id: string;
  restaurant_id: string;
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
  restaurant_id: string;
  table_number: string;
  type: 'waiter' | 'bill';
  status: 'pending' | 'resolved';
  created_at: string;
}

export interface AdminTable {
  id: string;
  restaurant_id: string;
  table_number: string;
  created_at: string;
}

// Mock Restaurants
const MOCK_RESTAURANTS: Restaurant[] = [
  { 
    id: '11111111-1111-1111-1111-111111111110', 
    name: 'Resto-menu Platform', 
    slug: 'resto-menu', 
    subscription_status: 'active',
    trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    subscription_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  { 
    id: '22222222-2222-2222-2222-222222222222', 
    name: 'Bistro Premium', 
    slug: 'bistro-premium',
    subscription_status: 'active',
    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    subscription_ends_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  { 
    id: '33333333-3333-3333-3333-333333333333', 
    name: 'Maquis Cacao', 
    slug: 'maquis-cacao',
    subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    subscription_ends_at: null
  }
];

// Mock Users
const MOCK_RESTAURANT_USERS: RestaurantUser[] = [
  // Platform Super Admin
  { id: '00000000-0000-0000-0000-000000000000', restaurant_id: '11111111-1111-1111-1111-111111111110', name: 'Super Administrateur', email: 'superadmin@restomenu.ci', role: 'super_admin', password: 'super123' },
  // Bistro Premium
  { id: '11111111-1111-1111-1111-111111111111', restaurant_id: '22222222-2222-2222-2222-222222222222', name: 'Gérant Bistro', email: 'gerant@bistropremium.ci', role: 'admin', password: 'admin123' },
  { id: '11111111-1111-1111-1111-111111111112', restaurant_id: '22222222-2222-2222-2222-222222222222', name: 'Chef Amadou', email: 'chef@bistropremium.ci', role: 'cook', password: 'chef123' },
  { id: '11111111-1111-1111-1111-111111111113', restaurant_id: '22222222-2222-2222-2222-222222222222', name: 'Serveur Koffi', email: 'serveur@bistropremium.ci', role: 'waiter', password: 'serveur123' },
  // Maquis Cacao
  { id: '11111111-1111-1111-1111-222222222221', restaurant_id: '33333333-3333-3333-3333-333333333333', name: 'Gérant Cacao', email: 'gerant@maquiscacao.ci', role: 'admin', password: 'admin123' },
  { id: '11111111-1111-1111-1111-222222222222', restaurant_id: '33333333-3333-3333-3333-333333333333', name: 'Chef Awa', email: 'chef@maquiscacao.ci', role: 'cook', password: 'chef123' }
];

// Mock Tables
const DEFAULT_MOCK_TABLES: AdminTable[] = [
  // Bistro Premium (Tables 1 à 4)
  { id: '55555555-5555-5555-5555-555555555501', restaurant_id: '22222222-2222-2222-2222-222222222222', table_number: '1', created_at: new Date().toISOString() },
  { id: '55555555-5555-5555-5555-555555555502', restaurant_id: '22222222-2222-2222-2222-222222222222', table_number: '2', created_at: new Date().toISOString() },
  { id: '55555555-5555-5555-5555-555555555503', restaurant_id: '22222222-2222-2222-2222-222222222222', table_number: '3', created_at: new Date().toISOString() },
  { id: '55555555-5555-5555-5555-555555555504', restaurant_id: '22222222-2222-2222-2222-222222222222', table_number: '4', created_at: new Date().toISOString() },
  // Maquis Cacao (Tables A et B)
  { id: '55555555-5555-5555-5555-666666666601', restaurant_id: '33333333-3333-3333-3333-333333333333', table_number: 'A', created_at: new Date().toISOString() },
  { id: '55555555-5555-5555-5555-666666666602', restaurant_id: '33333333-3333-3333-3333-333333333333', table_number: 'B', created_at: new Date().toISOString() }
];

// Mock Menu Items
const MOCK_MENU_ITEMS: MenuItem[] = [
  // Bistro Premium
  {
    id: '44444444-4444-4444-4444-444444444401',
    restaurant_id: '22222222-2222-2222-2222-222222222222',
    name: 'Foie Gras de Canard Maison',
    description: 'Foie gras de canard maison, chutney de figues et brioche toastée.',
    price: 12000,
    category: 'Entrées',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444402',
    restaurant_id: '22222222-2222-2222-2222-222222222222',
    name: 'Velouté de Potimarron',
    description: 'Un velouté onctueux de saison, éclats de châtaignes et émulsion truffée.',
    price: 5000,
    category: 'Entrées',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444403',
    restaurant_id: '22222222-2222-2222-2222-222222222222',
    name: 'Filet de Bœuf Rossini',
    description: 'Filet de bœuf tendre, foie gras poêlé, sauce Périgueux, écrasé de pommes de terre.',
    price: 22000,
    category: 'Plats',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444404',
    restaurant_id: '22222222-2222-2222-2222-222222222222',
    name: 'Risotto aux Cèpes',
    description: 'Risotto crémeux aux cèpes poêlés et parmesan Reggiano 24 mois.',
    price: 15000,
    category: 'Plats',
    image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444405',
    restaurant_id: '22222222-2222-2222-2222-222222222222',
    name: 'Mi-Cuit Chocolat Noir',
    description: 'Cœur coulant, glace vanille de Madagascar.',
    price: 6000,
    category: 'Desserts',
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-444444444406',
    restaurant_id: '22222222-2222-2222-2222-222222222222',
    name: 'Cocktail Bistro Tonic',
    description: 'Gin infusé au romarin, tonic artisanal, concombre frais.',
    price: 7000,
    category: 'Boissons',
    image_url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  // Maquis Cacao
  {
    id: '44444444-4444-4444-4444-888888888801',
    restaurant_id: '33333333-3333-3333-3333-333333333333',
    name: 'Alloco & Brochettes',
    description: 'Alloco croustillant de Côte d\'Ivoire, brochettes de bœuf épicées.',
    price: 6500,
    category: 'Plats',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-888888888802',
    restaurant_id: '33333333-3333-3333-3333-333333333333',
    name: 'Kedjenou de Poulet',
    description: 'Poulet mijoté à l\'étouffée avec légumes, servi avec de l\'attiéké.',
    price: 8000,
    category: 'Plats',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80',
    is_active: true
  },
  {
    id: '44444444-4444-4444-4444-888888888803',
    restaurant_id: '33333333-3333-3333-3333-333333333333',
    name: 'Bissap Glacé Maison',
    description: 'Jus de fleurs d\'hibiscus infusées, menthe et arôme vanille.',
    price: 2000,
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
// RESTAURANT RESOLUTION
// =========================================================================

export const getMVPRestaurantById = async (id: string): Promise<Restaurant | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) return data;
    console.error('Error fetching restaurant by ID:', error);
    return null;
  }
  const restaurants = getLocalData<Restaurant[]>('mvp_restaurants', MOCK_RESTAURANTS);
  return restaurants.find(r => r.id === id) || null;
};

// =========================================================================
// SESSION MANAGEMENT (AUTH)
// =========================================================================

export const loginMVPUser = async (
  restaurantSlug: string,
  email: string,
  password: string
): Promise<{ user: RestaurantUser; restaurant: Restaurant } | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data: restaurant, error: restErr } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', restaurantSlug)
      .single();

    if (restErr || !restaurant) {
      console.error('Restaurant not found:', restErr);
      return null;
    }

    const { data: user, error: userErr } = await supabase
      .from('restaurant_users')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('email', email)
      .eq('password', password)
      .single();

    if (userErr || !user) {
      console.error('User not found or password incorrect:', userErr);
      return null;
    }

    const sessionObj = { user, restaurant };
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('resto_session', JSON.stringify(sessionObj));
    }
    return sessionObj;
  }

  const restaurants = getLocalData<Restaurant[]>('mvp_restaurants', MOCK_RESTAURANTS);
  const restaurant = restaurants.find(r => r.slug === restaurantSlug);
  if (!restaurant) return null;

  const users = getLocalData<RestaurantUser[]>('mvp_restaurant_users', MOCK_RESTAURANT_USERS);
  const user = users.find(
    u => u.restaurant_id === restaurant.id && 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.password === password
  );
  if (!user) return null;

  const sessionObj = { user, restaurant };
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('resto_session', JSON.stringify(sessionObj));
  }
  return sessionObj;
};

export const getCurrentSession = (): { user: RestaurantUser; restaurant: Restaurant } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const session = window.sessionStorage.getItem('resto_session');
    return session ? JSON.parse(session) : null;
  } catch (e) {
    console.error('Error reading session from sessionStorage:', e);
    return null;
  }
};

export const logoutMVPUser = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem('resto_session');
  } catch (e) {
    console.error('Error clearing session:', e);
  }
};

// =========================================================================
// EMPLOYEE MANAGEMENT
// =========================================================================

export const getMVPEmployees = async (restaurantId: string): Promise<RestaurantUser[]> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('restaurant_users')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .in('role', ['cook', 'waiter'])
      .order('name');
    if (!error && data) return data;
    console.error('Error fetching employees:', error);
    return [];
  }
  const users = getLocalData<RestaurantUser[]>('mvp_restaurant_users', MOCK_RESTAURANT_USERS);
  return users.filter(u => u.restaurant_id === restaurantId && (u.role === 'cook' || u.role === 'waiter'));
};

export const addMVPEmployee = async (
  restaurantId: string,
  employee: Omit<RestaurantUser, 'id' | 'restaurant_id'>
): Promise<RestaurantUser | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('restaurant_users')
      .insert({
        restaurant_id: restaurantId,
        name: employee.name,
        email: employee.email,
        password: employee.password,
        role: employee.role
      })
      .select()
      .single();
    if (error) {
      console.error('Error adding employee:', error);
      return null;
    }
    return data;
  }
  const users = getLocalData<RestaurantUser[]>('mvp_restaurant_users', MOCK_RESTAURANT_USERS);
  if (users.some(u => u.restaurant_id === restaurantId && u.email.toLowerCase() === employee.email.toLowerCase())) {
    throw new Error("Cet e-mail est déjà utilisé pour ce restaurant.");
  }
  const newUser: RestaurantUser = {
    ...employee,
    id: `emp-${Math.random().toString(36).substring(2, 9)}`,
    restaurant_id: restaurantId
  };
  users.push(newUser);
  setLocalData('mvp_restaurant_users', users);
  return newUser;
};

export const deleteMVPEmployee = async (employeeId: string): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('restaurant_users')
      .delete()
      .eq('id', employeeId);
    return !error;
  }
  const users = getLocalData<RestaurantUser[]>('mvp_restaurant_users', MOCK_RESTAURANT_USERS);
  const filtered = users.filter(u => u.id !== employeeId);
  setLocalData('mvp_restaurant_users', filtered);
  return true;
};

// =========================================================================
// API SERVICES
// =========================================================================

// 1. Menu Items
export const getMenuItems = async (restaurantId?: string): Promise<MenuItem[]> => {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('menu_items').select('*');
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }
    const { data, error } = await query.order('name');
    if (!error && data) return data;
    console.error('Error fetching menu items from Supabase:', error);
  }
  const items = getLocalData<MenuItem[]>('mvp_menu_items', MOCK_MENU_ITEMS);
  if (restaurantId) {
    return items.filter(it => it.restaurant_id === restaurantId);
  }
  return items;
};

// 1.1 Add Menu Item
export const addMenuItem = async (item: Omit<MenuItem, 'id'>): Promise<MenuItem | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        restaurant_id: item.restaurant_id,
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

// 1.4 Upload Menu Image
export const uploadMenuImage = async (file: File): Promise<string> => {
  if (isSupabaseConfigured && supabase) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `menu-items/${fileName}`;

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
  tableId: string,
  items: { menu_item_id: string; quantity: number }[],
  restaurantId?: string
): Promise<Order | null> => {
  let finalRestaurantId = restaurantId;
  let finalTableNumber = tableId;

  if (!finalRestaurantId || tableId.includes('-')) {
    const tableObj = await getMVPTableById(tableId);
    if (tableObj) {
      finalRestaurantId = tableObj.restaurant_id;
      finalTableNumber = tableObj.table_number;
    }
  }

  if (!finalRestaurantId) {
    finalRestaurantId = '22222222-2222-2222-2222-222222222222';
  }

  if (isSupabaseConfigured && supabase) {
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        restaurant_id: finalRestaurantId,
        table_number: finalTableNumber,
        status: 'pending'
      })
      .select()
      .single();

    if (orderErr || !orderData) {
      console.error('Error inserting order in Supabase:', orderErr);
      return null;
    }

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
      await supabase.from('orders').delete().eq('id', orderData.id);
      return null;
    }

    return orderData;
  }

  const orders = getLocalData<Order[]>('mvp_orders', []);
  const newOrder: Order = {
    id: `mvp-ord-${Math.random().toString(36).substring(2, 9)}`,
    restaurant_id: finalRestaurantId,
    table_number: finalTableNumber,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  const menuItems = getLocalData<MenuItem[]>('mvp_menu_items', MOCK_MENU_ITEMS);
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

  window.dispatchEvent(new CustomEvent('mvp-order-created', { detail: newOrder }));
  return newOrder;
};

// 3. Service Requests Creation
export const createServiceRequest = async (
  tableId: string,
  type: 'waiter' | 'bill',
  restaurantId?: string
): Promise<ServiceRequest | null> => {
  let finalRestaurantId = restaurantId;
  let finalTableNumber = tableId;

  if (!finalRestaurantId || tableId.includes('-')) {
    const tableObj = await getMVPTableById(tableId);
    if (tableObj) {
      finalRestaurantId = tableObj.restaurant_id;
      finalTableNumber = tableObj.table_number;
    }
  }

  if (!finalRestaurantId) {
    finalRestaurantId = '22222222-2222-2222-2222-222222222222';
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        restaurant_id: finalRestaurantId,
        table_number: finalTableNumber,
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

  const requests = getLocalData<ServiceRequest[]>('mvp_service_requests', []);
  const newRequest: ServiceRequest = {
    id: `mvp-req-${Math.random().toString(36).substring(2, 9)}`,
    restaurant_id: finalRestaurantId,
    table_number: finalTableNumber,
    type,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  requests.push(newRequest);
  setLocalData('mvp_service_requests', requests);

  window.dispatchEvent(new CustomEvent('mvp-request-created', { detail: newRequest }));
  return newRequest;
};

// 4. Get all orders
export const getMVPOrders = async (restaurantId?: string): Promise<Order[]> => {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('orders').select('*');
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }
    const { data: ordersData, error: ordersErr } = await query.order('created_at', { ascending: false });

    if (ordersErr || !ordersData) {
      console.error('Error fetching orders from Supabase:', ordersErr);
      return [];
    }

    const enrichedOrders = await Promise.all(
      ordersData.map(async (order) => {
        const { data: itemsData, error: itemsErr } = await supabase!
          .from('order_items')
          .select('*, menu_item:menu_items(*)')
          .eq('order_id', order.id);

        if (itemsErr) {
          console.error(`Error fetching items for order ${order.id}:`, itemsErr);
          return { ...order, items: [] };
        }

        const items = (itemsData || []).map(item => ({
          ...item,
          menu_item: item.menu_item
        }));

        return { ...order, items };
      })
    );

    return enrichedOrders;
  }

  let orders = getLocalData<Order[]>('mvp_orders', []);
  if (restaurantId) {
    orders = orders.filter(o => o.restaurant_id === restaurantId);
  }
  return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
export const getMVPServiceRequests = async (restaurantId?: string): Promise<ServiceRequest[]> => {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('service_requests').select('*').eq('status', 'pending');
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }
    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching service requests:', error);
      return [];
    }
    return data || [];
  }

  let requests = getLocalData<ServiceRequest[]>('mvp_service_requests', []);
  if (restaurantId) {
    requests = requests.filter(r => r.restaurant_id === restaurantId);
  }
  return requests
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
  callback: (payload: { eventType: string; new: Order }) => void,
  restaurantId?: string
): (() => void) => {
  if (isSupabaseConfigured && supabase) {
    const channel = supabase
      .channel('mvp-orders-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          ...(restaurantId ? { filter: `restaurant_id=eq.${restaurantId}` } : {})
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: itemsData } = await supabase!
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
      supabase!.removeChannel(channel);
    };
  }

  const handleCreated = (e: Event) => {
    const customEvent = e as CustomEvent<Order>;
    if (!restaurantId || customEvent.detail.restaurant_id === restaurantId) {
      callback({ eventType: 'INSERT', new: customEvent.detail });
    }
  };

  const handleUpdated = (e: Event) => {
    const customEvent = e as CustomEvent<Order>;
    if (!restaurantId || customEvent.detail.restaurant_id === restaurantId) {
      callback({ eventType: 'UPDATE', new: customEvent.detail });
    }
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
  callback: (payload: { eventType: string; new: ServiceRequest }) => void,
  restaurantId?: string
): (() => void) => {
  if (isSupabaseConfigured && supabase) {
    const channel = supabase
      .channel('mvp-requests-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'service_requests',
          ...(restaurantId ? { filter: `restaurant_id=eq.${restaurantId}` } : {})
        },
        (payload) => {
          callback({ eventType: payload.eventType, new: payload.new as ServiceRequest });
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }

  const handleCreated = (e: Event) => {
    const customEvent = e as CustomEvent<ServiceRequest>;
    if (!restaurantId || customEvent.detail.restaurant_id === restaurantId) {
      callback({ eventType: 'INSERT', new: customEvent.detail });
    }
  };

  const handleResolved = (e: Event) => {
    const customEvent = e as CustomEvent<ServiceRequest>;
    if (!restaurantId || customEvent.detail.restaurant_id === restaurantId) {
      callback({ eventType: 'UPDATE', new: customEvent.detail });
    }
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
      supabase!.removeChannel(channel);
    };
  }

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

export const getMVPTables = async (restaurantId?: string): Promise<AdminTable[]> => {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('tables').select('*');
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }
    const { data, error } = await query.order('table_number');
    
    if (!error && data) {
      return data.map(item => ({
        id: item.id,
        restaurant_id: item.restaurant_id,
        table_number: item.table_number,
        created_at: item.created_at
      }));
    }
  }

  const tables = getLocalData<AdminTable[]>('mvp_tables', DEFAULT_MOCK_TABLES);
  if (restaurantId) {
    return tables.filter(t => t.restaurant_id === restaurantId);
  }
  return tables;
};

export const getMVPTableById = async (tableId: string): Promise<AdminTable | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('id', tableId)
      .single();
    if (!error && data) {
      return data;
    }
    // Try by table_number fallback (for tables created as just table number)
    const { data: dataByNum, error: errorByNum } = await supabase
      .from('tables')
      .select('*')
      .eq('table_number', tableId)
      .limit(1);
    if (!errorByNum && dataByNum && dataByNum.length > 0) {
      return dataByNum[0];
    }
    console.error('Error fetching table by ID/Number:', error || errorByNum);
    return null;
  }

  const tables = getLocalData<AdminTable[]>('mvp_tables', DEFAULT_MOCK_TABLES);
  const found = tables.find(t => t.id === tableId || t.table_number === tableId);
  return found || null;
};

export const addMVPTable = async (tableNumber: string, restaurantId: string): Promise<AdminTable | null> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('tables')
      .insert({
        table_number: tableNumber,
        restaurant_id: restaurantId
      })
      .select()
      .single();

    if (!error && data) {
      return {
        id: data.id,
        restaurant_id: data.restaurant_id,
        table_number: data.table_number,
        created_at: data.created_at
      };
    }
    console.error('Error inserting table:', error);
    throw new Error(error?.message || "Erreur de création de la table.");
  }

  const tables = getLocalData<AdminTable[]>('mvp_tables', DEFAULT_MOCK_TABLES);
  
  if (tables.some(t => t.restaurant_id === restaurantId && t.table_number.toLowerCase() === tableNumber.toLowerCase())) {
    throw new Error("Cette table existe déjà pour votre restaurant.");
  }

  const newTable: AdminTable = {
    id: `tbl-${Math.random().toString(36).substring(2, 9)}`,
    restaurant_id: restaurantId,
    table_number: tableNumber,
    created_at: new Date().toISOString()
  };
  tables.push(newTable);
  
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

  const tables = getLocalData<AdminTable[]>('mvp_tables', DEFAULT_MOCK_TABLES);
  const filtered = tables.filter(t => t.id !== id);
  setLocalData('mvp_tables', filtered);
  return true;
};

// =========================================================================
// SUBSCRIPTION & PLATFORM MANAGEMENT (PHASE 4)
// =========================================================================

export const isRestaurantSubscriptionValid = (restaurant: Restaurant): boolean => {
  if (!restaurant) return false;
  
  if (restaurant.subscription_status === 'suspended') {
    return false;
  }
  
  if (restaurant.subscription_status === 'active') {
    return true;
  }
  
  if (restaurant.subscription_status === 'trialing' && restaurant.trial_ends_at) {
    const trialEnd = new Date(restaurant.trial_ends_at).getTime();
    return Date.now() < trialEnd;
  }
  
  if (restaurant.subscription_status === 'past_due' && restaurant.subscription_ends_at) {
    const end = new Date(restaurant.subscription_ends_at).getTime();
    return Date.now() < end;
  }

  return false;
};

export const getMVPRestaurants = async (): Promise<Restaurant[]> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('name');
    if (!error && data) return data;
    console.error('Error fetching restaurants from Supabase:', error);
    return [];
  }
  return getLocalData<Restaurant[]>('mvp_restaurants', MOCK_RESTAURANTS);
};

export const addMVPRestaurant = async (name: string, slug: string): Promise<Restaurant | null> => {
  const trialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        name,
        slug: slug.trim().toLowerCase(),
        subscription_status: 'trialing',
        trial_ends_at: trialEnds
      })
      .select()
      .single();
    if (!error && data) return data;
    console.error('Error adding restaurant to Supabase:', error);
    throw new Error(error?.message || "Erreur de création du restaurant.");
  }
  
  const restaurants = getLocalData<Restaurant[]>('mvp_restaurants', MOCK_RESTAURANTS);
  if (restaurants.some(r => r.slug === slug.trim().toLowerCase())) {
    throw new Error("Un restaurant avec cet identifiant (slug) existe déjà.");
  }
  
  const newRestaurant: Restaurant = {
    id: `rest-${Math.random().toString(36).substring(2, 9)}`,
    name,
    slug: slug.trim().toLowerCase(),
    subscription_status: 'trialing',
    trial_ends_at: trialEnds,
    subscription_ends_at: null,
    created_at: new Date().toISOString()
  };
  restaurants.push(newRestaurant);
  setLocalData('mvp_restaurants', restaurants);
  return newRestaurant;
};

export const updateMVPRestaurantSubscription = async (
  restaurantId: string,
  status: Restaurant['subscription_status'],
  subscriptionEndsAt?: string | null
): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    const updates: Partial<Restaurant> = { subscription_status: status };
    if (subscriptionEndsAt !== undefined) {
      updates.subscription_ends_at = subscriptionEndsAt;
    }
    const { error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', restaurantId);
    return !error;
  }
  
  const restaurants = getLocalData<Restaurant[]>('mvp_restaurants', MOCK_RESTAURANTS);
  const idx = restaurants.findIndex(r => r.id === restaurantId);
  if (idx !== -1) {
    restaurants[idx].subscription_status = status;
    if (subscriptionEndsAt !== undefined) {
      restaurants[idx].subscription_ends_at = subscriptionEndsAt;
    }
    setLocalData('mvp_restaurants', restaurants);
    
    if (typeof window !== 'undefined') {
      const sessionStr = window.sessionStorage.getItem('resto_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.restaurant.id === restaurantId) {
          session.restaurant.subscription_status = status;
          if (subscriptionEndsAt !== undefined) {
            session.restaurant.subscription_ends_at = subscriptionEndsAt;
          }
          window.sessionStorage.setItem('resto_session', JSON.stringify(session));
        }
      }
    }
    
    return true;
  }
  return false;
};
