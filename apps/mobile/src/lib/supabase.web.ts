import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const memory = new Map<string, string>();
const serverStorage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
};
const authStorage =
  typeof localStorage === 'undefined' ? serverStorage : localStorage;
export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
