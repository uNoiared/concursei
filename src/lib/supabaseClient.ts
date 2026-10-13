// Cliente Supabase com suporte a chaves no .env ou configuradas diretamente pela tela de Configurações
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const CONFIG_KEY = 'concursei_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.url && parsed.anonKey) return parsed;
      } catch {}
    }
  }
  return {
    url: (import.meta.env.VITE_SUPABASE_URL as string) || '',
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
  };
}

export function saveSupabaseConfig(cfg: SupabaseConfig) {
  if (typeof window === 'undefined') return;
  if (!cfg.url && !cfg.anonKey) {
    localStorage.removeItem(CONFIG_KEY);
  } else {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }
  cachedClient = null; // reinicia o cliente
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.warn('[supabase] Não foi possível inicializar:', err);
    return null;
  }
}
