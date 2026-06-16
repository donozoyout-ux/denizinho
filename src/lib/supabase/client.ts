import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

export function createClient() {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      "Supabase yapılandırılmamış. .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ayarlayın."
    );
  }

  return createBrowserClient(env.url, env.anonKey);
}
