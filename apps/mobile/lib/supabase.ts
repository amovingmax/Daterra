import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@daterra/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // não derruba o app em dev mode antes do .env existir
  // eslint-disable-next-line no-console
  console.warn('[Da Terra] EXPO_PUBLIC_SUPABASE_URL/ANON_KEY ausentes. Configure .env.local.');
}

export const supabase = createClient<Database>(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type DBSupplier = Database['public']['Tables']['suppliers']['Row'];
export type DBProduct = Database['public']['Tables']['products']['Row'];
export type DBOrder = Database['public']['Tables']['orders']['Row'];
export type DBOrderItem = Database['public']['Tables']['order_items']['Row'];
export type DBAddress = Database['public']['Tables']['addresses']['Row'];
