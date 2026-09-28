import { listarSemestres, listarTurmas } from "@/lib/estrutura/queries";
import { FormularioSemestre, FormularioTurma, FormularioModulo } from "@/components/estrutura/ClientForms";
import { PainelFrequencia } from "@/components/frequencia/PainelFrequencia";

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
  const [semestres, turmas] = await Promise.all([listarSemestres(), listarTurmas()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Frequência</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Lance a presença de qualquer turma e gerencie matrícula.
        </p>
      </div>

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

      <PainelFrequencia
        turmas={turmas}
        turmaSelecionadaId={searchParams.turma}
        aulaSelecionadaId={searchParams.aula}
        podeGerenciarMatricula
        baseUrl="/frequencia"
      />
    </div>
  );
}
