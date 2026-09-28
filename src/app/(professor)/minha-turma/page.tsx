import { createClient } from "@/lib/supabase/server";
import { listarMinhasTurmasIds } from "@/lib/frequencia/queries";
import { PainelFrequencia } from "@/components/frequencia/PainelFrequencia";
import { PainelEscalas } from "@/components/escalas/PainelEscalas";
import type { Turma } from "@/lib/estrutura/queries";

// Professor só vê a(s) turma(s) em que está escalado — não por um filtro
// que este código impõe, mas porque `minhas_turmas()` (a mesma function que
// as policies de RLS usam) só devolve isso. Mesmo que este componente
// pedisse outra turma por engano, a policy `turmas_leitura_geral` até
// deixaria ler (turma é estrutura pública), mas nenhuma aula/presença de
// turma alheia apareceria e nenhum lançamento seria aceito.
export default async function MinhaTurmaPage({
  searchParams,
}: {
  searchParams: { turma?: string; aula?: string };
}) {
  const turmaIds = await listarMinhasTurmasIds();

  if (turmaIds.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Minha turma</h1>
        <p className="mt-4 max-w-xl text-sm text-text-secondary">
          Você ainda não está escalado(a) em nenhuma turma. Fale com a coordenação (tela de
          Escalas &amp; Avisos) para ser adicionado(a).
        </p>
      </div>
    );
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("turmas")
    .select("id, semestre_id, nome, titulo")
    .in("id", turmaIds)
    .order("nome");
  const turmas = (data ?? []) as Turma[];
  const turmaAtual = turmas.find((t) => t.id === searchParams.turma) ?? turmas[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Minha turma</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Lance a presença da sua turma e acompanhe os módulos.
        </p>
      </div>

      <PainelFrequencia
        turmas={turmas}
        turmaSelecionadaId={searchParams.turma}
        aulaSelecionadaId={searchParams.aula}
        podeGerenciarMatricula={false}
        baseUrl="/minha-turma"
      />

      <div>
        <h2 className="font-display text-lg font-semibold text-primary">Minha escala &amp; avisos</h2>
      </div>
      <PainelEscalas turma={turmaAtual} todasAsTurmas={turmas} podeGerenciar={false} />
    </div>
  );
}
