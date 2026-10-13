import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv, getSecretKey } from "@/lib/env";

let adminClient: SupabaseClient | null = null;

/**
 * Cliente con la llave secreta (service role). Omite RLS: úsalo SOLO en el
 * servidor y SIEMPRE después de verificar permisos en src/lib/auth.
 */
export function createAdminClient(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, getSecretKey(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return adminClient;
}
