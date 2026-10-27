import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder')
);

export function createClient() {
  if (!isSupabaseConfigured) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Supabase Browser Client] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured.'
      );
    }
    return null;
  }
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
