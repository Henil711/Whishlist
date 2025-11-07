import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export function getSupabaseClient(authToken?: string) {
  if (authToken) {
    return createClient(config.supabase.url, config.supabase.anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });
  }
  return createClient(config.supabase.url, config.supabase.anonKey);
}
