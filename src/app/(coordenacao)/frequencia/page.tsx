import { listarSemestres, listarTurmas } from "@/lib/estrutura/queries";
import { FormularioSemestre, FormularioTurma, FormularioModulo } from "@/components/estrutura/ClientForms";
import { PainelFrequencia } from "@/components/frequencia/PainelFrequencia";
import { VisaoGeral } from "@/components/frequencia/VisaoGeral";
import { carregarRelatorio } from "@/lib/relatorio/dados";
import { getSessaoAtual, somenteLeitura } from "@/lib/auth/session";

// Coordenação vê e lança presença de QUALQUER turma (RLS: is_coordenacao()
// libera tudo). Esta página também é onde a estrutura do semestre é
// montada — sem uma tela pra isso, cada semestre novo dependeria de alguém
// rodar SQL manualmente, o que quebra a promessa de "sistema operando full"
// sem depender de desenvolvedor.
export default async function FrequenciaPage({
  searchParams,
}: {
  searchParams: { turma?: string; aula?: string };
}) {
  const leitura = somenteLeitura(await getSessaoAtual());
  const [semestres, turmas, { relatorio }] = await Promise.all([
    listarSemestres(),
    listarTurmas(),
    carregarRelatorio(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary">Frequência</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Números do semestre, chamada por domingo e matrícula de cada turma.
          </p>
        </div>
        <a
          href="/frequencia/relatorio"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Relatório do semestre
        </a>
      </div>

      <VisaoGeral r={relatorio} />


      <PainelFrequencia
        turmas={turmas}
        turmaSelecionadaId={searchParams.turma}
        aulaSelecionadaId={searchParams.aula}
        podeGerenciarMatricula={!leitura}
        somenteLeitura={leitura}
        baseUrl="/frequencia"
        relatorio={relatorio}
      />

      {!leitura && (
      <details className="rounded-xl border border-border bg-surface p-5" open={turmas.length === 0}>
        <summary className="cursor-pointer font-display text-base font-semibold text-primary">
          Estrutura do semestre (semestre · turma · módulo)
        </summary>
        <div className="mt-4 space-y-4">
          <FormularioSemestre />
          <FormularioTurma semestres={semestres} />
          <FormularioModulo turmas={turmas} />
        </div>
      </details>
      )}
    </div>
  );
}
