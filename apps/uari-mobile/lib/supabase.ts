import { createClient } from '@supabase/supabase-js';

// URL do projeto Supabase (com fallback para desenvolvimento)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dyajgalsbkcpfrxbingn.supabase.co';

// Chave pública de desenvolvimento (com fallback)
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5YWpnYWxzYmtjcGZyeGJpbmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3Mzc3NDQsImV4cCI6MjA5NTMxMzc0NH0.aN0zQh4oZklHDt4rH0viYYr_y7LvCJ_iy7lBBREsxsg';

// Storage em memória de altíssima resiliência para evitar erros de pontes nativas no Expo Go de desenvolvimento
class InMemoryStorage {
  private static store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return InMemoryStorage.store.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    InMemoryStorage.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    InMemoryStorage.store.delete(key);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new InMemoryStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
