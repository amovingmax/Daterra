import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type DaTerraClient = SupabaseClient<Database>;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function createBrowserClient(config: SupabaseConfig): DaTerraClient {
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function createServiceClient(url: string, serviceKey: string): DaTerraClient {
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type { Database } from './types';
