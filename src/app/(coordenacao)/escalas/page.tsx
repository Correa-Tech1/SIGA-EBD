import { listarTurmas } from "@/lib/estrutura/queries";
import { PainelEscalas } from "@/components/escalas/PainelEscalas";
import { getSessaoAtual, somenteLeitura } from "@/lib/auth/session";

// Coordenação gerencia escala e avisos de qualquer turma (RLS: só
// coordenação tem policy de escrita em `escalas`; avisos ela também apaga
// livremente).
export default async function EscalasPage({
  searchParams,
}: {
  searchParams: { turma?: string; data?: string; mes?: string };
}) {
  const turmas = await listarTurmas();
  const leitura = somenteLeitura(await getSessaoAtual());

  if (turmas.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Escalas &amp; Avisos</h1>
        <p className="mt-4 max-w-xl text-sm text-text-secondary">
          Nenhuma turma cadastrada ainda — crie a estrutura do semestre na tela de Frequência
          primeiro.
        </p>
      </div>
    );
  }

  const turmaAtual = turmas.find((t) => t.id === searchParams.turma) ?? turmas[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Escalas &amp; Avisos</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Quem dá aula em cada domingo, e o mural de avisos.
        </p>
      </div>

      {turmas.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {turmas.map((t) => (
            <a
              key={t.id}
              href={`/escalas?turma=${t.id}`}
              className={`rounded-full px-4 py-1.5 text-sm ${
                t.id === turmaAtual.id
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-text-secondary"
              }`}
            >
              {t.nome}
            </a>
          ))}
        </div>
      )}

      <PainelEscalas basePath="/escalas" dataInicial={searchParams.data} mes={searchParams.mes} turma={turmaAtual} todasAsTurmas={turmas} podeGerenciar={!leitura} />
    </div>
  );
}
