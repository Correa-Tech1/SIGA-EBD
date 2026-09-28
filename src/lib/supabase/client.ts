// Cliente Supabase para o NAVEGADOR (Client Components). Usa só a anon key
// — pública por natureza, protegida pelas policies de RLS (ver
// supabase/migrations/0002_rls.sql), nunca a service_role.
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
