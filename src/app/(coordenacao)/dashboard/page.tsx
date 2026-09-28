import { getSessaoAtual } from "@/lib/auth/session";
import { listarTurmas } from "@/lib/estrutura/queries";

// Painel inicial da coordenação: um resumo rápido + atalhos pros pilares.
// Referência visual: board "Main.dc.html" nos mockups (Design canvas).
export default async function DashboardPage() {
  const [sessao, turmas] = await Promise.all([getSessaoAtual(), listarTurmas()]);

  const atalhos = [
    { href: "/frequencia", titulo: "Frequência", descricao: "Estrutura do semestre, matrícula e chamada." },
    { href: "/biblioteca", titulo: "Biblioteca", descricao: "Material oficial de cada módulo." },
    { href: "/escalas", titulo: "Escalas & Avisos", descricao: "Quem dá aula quando, e o mural." },
    { href: "/professores", titulo: "Professores", descricao: "Criar e resetar contas." },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-primary">Olá, {sessao.nome}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {turmas.length === 0
          ? "Nenhuma turma cadastrada ainda — comece pela Frequência."
          : `${turmas.length} turma${turmas.length > 1 ? "s" : ""} neste semestre: ${turmas
              .map((t) => t.nome)
              .join(", ")}.`}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {atalhos.map((a) => (
          <a
            key={a.href}
            href={a.href}
            className="rounded-xl border border-border bg-surface p-5 hover:border-primary"
          >
            <div className="font-display text-base font-semibold text-primary">{a.titulo}</div>
            <div className="mt-1 text-sm text-text-secondary">{a.descricao}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
