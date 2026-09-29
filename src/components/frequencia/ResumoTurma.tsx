import type { RelatorioTurma } from "@/lib/relatorio/motor";
import { fmtNum, fmtPct, fmtDataCurta } from "@/lib/relatorio/motor";
import { corDaTurma } from "@/lib/relatorio/cores";
import { GraficoFrequencia } from "@/components/dashboard/GraficoFrequencia";
import { Kpi } from "@/components/relatorio/Blocos";

// Dashboard de resumo da turma selecionada.
export function ResumoTurma({ t }: { t: RelatorioTurma }) {
  const cor = corDaTurma(t.turma.nome);
  const ultimo = t.datas[t.datas.length - 1];
  return (
    <section aria-label={`Resumo — ${t.turma.nome}`} className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Kpi cor={cor} rotulo="Presença média" valor={fmtNum(t.mediaPorAula)} detalhe="por aula" />
        <Kpi
          cor={cor}
          rotulo="Último domingo"
          valor={ultimo ? String(ultimo.presentes) : "—"}
          detalhe={ultimo ? fmtDataCurta(ultimo.data) : undefined}
        />
        <Kpi cor={cor} rotulo="Pessoas" valor={String(t.distintas)} detalhe={`${t.membros} membros · ${t.visitantes} visit.`} />
        <Kpi cor={cor} rotulo="Frequentes (4+)" valor={String(t.frequentes)} detalhe={t.participacaoPct !== null ? `${fmtPct(t.participacaoPct)} do público` : undefined} />
        <Kpi cor={cor} rotulo="Idade média" valor={t.idadeMedia === null ? "N/D" : fmtNum(t.idadeMedia)} detalhe="anos" />
        <Kpi cor={cor} rotulo="1ª → 2ª metade" valor={fmtPct(t.variacaoPct, true)} detalhe={t.saldo === 0 ? "entra/sai: estável" : `saldo ${t.saldo > 0 ? "+" : ""}${t.saldo}`} />
      </div>
      <GraficoFrequencia
        datas={t.datas.map((d) => d.data)}
        series={[{ nome: t.turma.nome, cor, valores: t.datas.map((d) => d.presentes) }]}
        media={t.mediaPorAula}
        descricao={`Presentes por domingo na ${t.turma.nome}. Média de ${fmtNum(t.mediaPorAula)}.`}
      />
    </section>
  );
}
