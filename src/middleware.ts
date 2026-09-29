// Middleware: renova a sessão do Supabase a cada request (padrão exigido
// pelo @supabase/ssr) e faz a primeira barreira de acesso por rota. A
// segunda barreira, mais fina (papel exato), fica nos layouts de cada grupo
// — ver src/app/(coordenacao)/layout.tsx e src/app/(professor)/layout.tsx.
// Redundância intencional: middleware barra cedo (rápido, sem tocar banco
// além do necessário), o layout confirma o papel certo antes de renderizar
// qualquer dado.
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROTAS_PUBLICAS = ["/login", "/", "/aba-aluno", "/biblioteca"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const rotaPublica = ROTAS_PUBLICAS.some((r) => path === r || path.startsWith(`${r}/`));

  if (!user && !rotaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // roda em tudo, exceto assets estáticos do Next
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
