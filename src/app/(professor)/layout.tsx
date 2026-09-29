import { redirect } from "next/navigation";
import { getSessaoAtual } from "@/lib/auth/session";

// Mesma lógica do layout de coordenação, mas aceitando os dois papéis com
// conta de verdade — a coordenação também pode espiar a Aba do Professor
// (ex.: pra revisar como o Auxílio ao Professor está respondendo).
export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getSessaoAtual();

  if (!sessao.autenticado) redirect("/login");
  if (sessao.role !== "professor" && sessao.role !== "coordenacao") redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-[72px] shrink-0 items-center justify-between bg-primary px-10">
        <img src="/logo-siga-ebd.svg" alt="SIGA EBD" className="h-[42px] w-auto" />
        <nav className="flex h-full items-center gap-8 text-sm text-white/70">
          <a href="/minha-turma" className="text-white">
            MINHA TURMA
          </a>
          <a href="/auxilio">AUXÍLIO AO PROFESSOR</a>
        </nav>
        <div className="text-sm text-white">
          {sessao.nome} <span className="text-white/60">· {sessao.role === "coordenacao" ? "Coordenação" : "Professor"}</span>
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
