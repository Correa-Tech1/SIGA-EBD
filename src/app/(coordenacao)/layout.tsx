import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth/session";

// Segunda barreira (a primeira é o middleware): confirma que quem chegou
// aqui é de fato coordenação antes de renderizar qualquer página do grupo.
// Cada página filha ainda pode consultar o banco à vontade — o RLS
// (0002_rls.sql) garante que mesmo um bug aqui não vazaria dado, mas é
// mais rápido e mais claro barrar cedo, na borda da UI.
export default async function CoordenacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getSessaoAtual();

  if (!sessao.autenticado) redirect("/login");
  if (sessao.role !== "coordenacao") redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-[72px] shrink-0 items-center justify-between bg-primary px-10">
        <img src="/logo-siga-ebd.svg" alt="SIGA EBD" className="h-[42px] w-auto" />
        <nav className="flex h-full items-center gap-8 text-sm text-white/70">
          <a href="/dashboard" className="text-white">
            INÍCIO
          </a>
          <a href="/frequencia">FREQUÊNCIA</a>
          <a href="/biblioteca">BIBLIOTECA</a>
          <a href="/escalas">ESCALAS &amp; AVISOS</a>
          <a href="/auxilio">AUXÍLIO AO PROFESSOR</a>
          <a href="/professores">PROFESSORES</a>
        </nav>
        <div className="text-sm text-white">
          {sessao.nome} <span className="text-white/60">· Coordenação</span>
        </div>
      </header>
      <main className="flex-grow p-10">{children}</main>
      <footer className="flex h-16 shrink-0 items-center justify-center gap-3 border-t border-border bg-surface">
        <span className="text-xs text-text-secondary">O Sistema foi desenvolvido pela</span>
        <img src="/logo-correa-tech.svg" alt="Correa Tech" className="h-[36px] w-auto" />
      </footer>
    </div>
  );
}
