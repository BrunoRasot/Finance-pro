import 'expo-sqlite/localStorage/install';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { config } from './config';

export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
AppState.addEventListener('change', (state) =>
  state === 'active'
    ? supabase.auth.startAutoRefresh()
    : supabase.auth.stopAutoRefresh(),
);
