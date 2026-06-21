import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Use inside Client Components.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log("[DEBUG] SUPABASE_URL:", JSON.stringify(url));
  console.log("[DEBUG] SUPABASE_KEY_START:", key?.substring(0, 30));
  return createBrowserClient(url!, key!);
}
