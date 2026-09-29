import { listarTurmas } from "@/lib/estrutura/queries";
import { listarMinhasTurmasIds } from "@/lib/frequencia/queries";
import { PainelEscalas } from "@/components/escalas/PainelEscalas";
import { corDaTurma } from "@/lib/relatorio/cores";

// Professor vê a escala e os avisos de TODAS as turmas (é calendário, leitura
// aberta pelo RLS) e publica aviso só nas próprias turmas ou no mural geral.
// Quem gerencia a escala é a coordenação (aba Escalas & Avisos dela).
export default async function EscalasAvisosProfessorPage({
  searchParams,
}: {
  searchParams: { turma?: string };
}) {
  const [turmas, minhasIds] = await Promise.all([listarTurmas(), listarMinhasTurmasIds()]);

  if (turmas.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Escalas &amp; Avisos</h1>
        <p className="mt-4 text-sm text-text-secondary">Nenhuma turma cadastrada ainda.</p>
      </div>
    );
  }

  const turmaAtual =
    turmas.find((t) => t.id === searchParams.turma) ?? turmas.find((t) => minhasIds.includes(t.id)) ?? turmas[0];
  const minhas = turmas.filter((t) => minhasIds.includes(t.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Escalas &amp; Avisos</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Quem dá aula em cada domingo e o mural de avisos. Aulas unificadas aparecem nas duas turmas.
        </p>
      </div>

      {turmas.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {turmas.map((t) => (
            <a
              key={t.id}
              href={`/escalas-avisos?turma=${t.id}`}
              style={t.id === turmaAtual.id ? { background: corDaTurma(t.nome), color: "#fff" } : undefined}
              className={`rounded-full px-4 py-1.5 text-sm ${
                t.id === turmaAtual.id ? "" : "border border-border bg-surface text-text-secondary"
              }`}
            >
              {t.nome}
              {minhasIds.includes(t.id) ? " · minha" : ""}
            </a>
          ))}
        </div>
      )}

      <PainelEscalas turma={turmaAtual} todasAsTurmas={turmas} podeGerenciar={false} turmasParaAviso={minhas} />
    </div>
  );
}
