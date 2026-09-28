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
    <div className="min-h-screen bg-bg">
      <header className="flex h-[72px] items-center justify-between bg-primary px-10">
        <div className="font-display text-lg font-semibold text-white">SIGA EBD</div>
        <nav className="flex h-full items-center gap-8 text-sm text-white/70">
          <a href="/minha-turma" className="text-white">
            MINHA TURMA
          </a>
          <a href="/auxilio">AUXÍLIO AO PROFESSOR</a>
        </nav>
        <div className="text-sm text-white">
          {sessao.nome} <span className="text-white/60">· Professor</span>
        </div>
      </header>
      <main className="p-10">{children}</main>
    </div>
  );
}
