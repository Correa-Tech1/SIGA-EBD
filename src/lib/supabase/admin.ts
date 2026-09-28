// Cliente Supabase com a SERVICE_ROLE KEY — ignora RLS completamente.
//
// REGRA DE OURO deste arquivo, direto da lição do Laudo Técnico da Correa
// Tech (Parte 9.3: "um padrão de segurança bem feito em um produto não
// migra sozinho para os outros"):
//
//   1. Nunca importar este arquivo em código que roda no navegador —
//      é só usado dentro de Server Actions / Route Handlers.
//   2. Toda função que usa este cliente PRECISA checar `is_coordenacao()`
//      (ou o papel que fizer sentido) usando o cliente de sessão (server.ts)
//      ANTES de fazer qualquer coisa com o admin client. O admin client em
//      si não sabe nem se importa quem está chamando — quem garante isso
//      é o código ao redor dele.
//   3. Se um dia parecer mais fácil "só usar o admin em tudo e economizar
//      RLS" — não. Foi exatamente essa economia de atalho que deixou 7 dos
//      14 endpoints do COSMO/JACKBOY/Shema.AI abertos ao público.
//
// Hoje o único uso legítimo é supabase.auth.admin.createUser() dentro de
// src/app/(coordenacao)/professores/actions.ts, para criar contas de
// professor — que o Supabase não permite fazer com a anon/session key.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
