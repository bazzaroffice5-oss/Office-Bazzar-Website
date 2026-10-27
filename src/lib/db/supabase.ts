import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder')
);

export const hasServiceRole = Boolean(
  supabaseServiceRoleKey &&
  !supabaseServiceRoleKey.includes('your-service-role') &&
  !supabaseServiceRoleKey.includes('placeholder')
);

/**
 * Validate Supabase environment variables and return diagnostic details
 */
export function getSupabaseConfigDiagnostics(): {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  hasServiceRole: boolean;
  projectUrl: string;
} {
  return {
    isConfigured: isSupabaseConfigured,
    hasUrl: Boolean(supabaseUrl),
    hasKey: Boolean(supabasePublishableKey),
    hasServiceRole,
    projectUrl: supabaseUrl ? supabaseUrl.replace(/^(https?:\/\/)/, '') : '',
  };
}

// Standard client for public or client-side queries (enforces Row Level Security)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createSupabaseClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
      },
    })
  : null;

// Privileged client for server-side order fulfillment, webhooks, and background jobs
export const supabaseAdmin: SupabaseClient | null = isSupabaseConfigured
  ? createSupabaseClient(
      supabaseUrl,
      hasServiceRole ? supabaseServiceRoleKey : supabasePublishableKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;
