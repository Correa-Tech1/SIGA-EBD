// Cliente Supabase para Server Components / Server Actions / Route Handlers.
//
// Este é o padrão que o Laudo Técnico da Correa Tech aponta como o CERTO —
// o mesmo que o Correa Cash já usa em api/chat.js: o cliente é criado com a
// SESSÃO de quem está chamando (via cookies), nunca com a service_role key.
// Toda query feita a partir daqui já respeita as policies de RLS de quem
// está logado — não existe "esquecer de checar o dono" porque o banco checa
// por conta própria.
//
// Se algum dia uma função aqui precisar ignorar RLS de propósito (um
// relatório agregado, por exemplo), isso é uma decisão explícita e vai para
// admin.ts, nunca aqui.
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chamado de um Server Component (não pode escrever cookie) —
            // inofensivo quando o middleware já cuida de renovar a sessão.
          }
        },
      },
    }
  );
}
