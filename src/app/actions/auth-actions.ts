'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialiser le client admin de Supabase uniquement si la clé de service est configurée
const getSupabaseAdmin = () => {
  if (!supabaseServiceKey || supabaseServiceKey === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function createNativeUser(
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'cook' | 'waiter',
  restaurantId: string
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.warn('Client d\'administration Supabase non configuré. Mode local actif.');
      // Simuler la création pour le mode hors-ligne / de test
      return {
        id: `mock-usr-${Math.random().toString(36).substring(2, 9)}`,
        email: email.trim().toLowerCase(),
        name,
        role,
        restaurant_id: restaurantId,
      };
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        restaurant_id: restaurantId,
      },
    });

    if (error) {
      console.error('Erreur lors de la création dans Supabase Auth:', error);
      throw new Error(error.message);
    }

    return {
      id: data.user.id,
      email: data.user.email || email,
      name,
      role,
      restaurant_id: restaurantId,
    };
  } catch (err: any) {
    console.error('Erreur dans la création de l\'utilisateur natif :', err);
    throw new Error(err.message || 'Erreur lors de la création du compte.');
  }
}

export async function deleteNativeUser(userId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.warn('Client d\'administration Supabase non configuré. Mode local actif.');
      return true;
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error('Erreur lors de la suppression dans Supabase Auth:', error);
      throw new Error(error.message);
    }
    return true;
  } catch (err: any) {
    console.error('Erreur dans la suppression de l\'utilisateur natif :', err);
    throw new Error(err.message || 'Erreur lors de la suppression du compte.');
  }
}
