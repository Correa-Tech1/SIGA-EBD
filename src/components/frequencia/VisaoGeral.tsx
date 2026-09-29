import type { RelatorioGeral } from "@/lib/relatorio/motor";
import { fmtNum, fmtPct } from "@/lib/relatorio/motor";
import { corDaTurma } from "@/lib/relatorio/cores";
import { BarraEmpilhada, BarraProgresso, Kpi } from "@/components/relatorio/Blocos";

// Dashboard geral no topo da Frequência: números de cada turma, relação da
// turma por membros e participação de membros na EBD.
export function VisaoGeral({ r }: { r: RelatorioGeral }) {
  if (r.turmas.length === 0) return null;
  return (
    <section aria-labelledby="titulo-visao" className="space-y-5">
      <h2 id="titulo-visao" className="font-display text-lg font-semibold text-primary">
        Visão geral do semestre
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {r.turmas.map((t) => {
          const ultimo = t.datas[t.datas.length - 1];
          return (
            <div
              key={t.turma.id}
              className="rounded-xl border border-border bg-surface p-4"
              style={{ borderTop: `4px solid ${corDaTurma(t.turma.nome)}` }}
            >
              <div className="font-display text-base font-semibold text-text-primary">{t.turma.nome}</div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <dt className="text-[11px] text-text-secondary">Média/aula</dt>
                  <dd className="font-display text-xl font-semibold">{fmtNum(t.mediaPorAula)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-text-secondary">Último dom.</dt>
                  <dd className="font-display text-xl font-semibold">{ultimo ? ultimo.presentes : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-text-secondary">Frequentes</dt>
                  <dd className="font-display text-xl font-semibold">{t.frequentes}</dd>
                </div>
              </dl>
              <div className="mt-3 text-xs text-text-secondary">
                {t.datas.length} {t.datas.length === 1 ? "domingo" : "domingos"} com chamada · variação{" "}
                <strong className="text-text-primary">{fmtPct(t.variacaoPct, true)}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-display text-base font-semibold text-primary">Relação da turma por membros</h3>
          <p className="mb-4 mt-1 text-xs text-text-secondary">
            Quem já passou por cada turma no semestre: membros da igreja e visitantes.
          </p>
          <div className="space-y-4">
            {r.turmas.map((t) => (
              <div key={t.turma.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{t.turma.nome}</span>
                  <span className="text-text-secondary">{t.distintas} pessoas</span>
                </div>
                <BarraEmpilhada
                  partes={[
                    { rotulo: "membros", valor: t.membros, cor: corDaTurma(t.turma.nome) },
                    { rotulo: "visitantes", valor: t.visitantes, cor: "#C9D4D8" },
                  ]}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="font-display text-base font-semibold text-primary">Participação de membros na EBD</h3>
          <p className="mb-4 mt-1 text-xs text-text-secondary">
            {r.igreja.membros} membros cadastrados, {r.igreja.adultos} adultos (18+).
          </p>
          <div className="space-y-4">
            <BarraProgresso rotulo="Membros que passaram pela EBD" valor={r.igreja.passaram} total={r.igreja.membros} />
            <BarraProgresso
              rotulo="Adultos que passaram pela EBD"
              valor={r.igreja.passaram}
              total={r.igreja.adultos}
              cor="#F2542D"
            />
            <BarraProgresso
              rotulo="Adultos frequentes (4+ aulas)"
              valor={r.igreja.frequentes}
              total={r.igreja.adultos}
              cor="#D9930D"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi rotulo="Pessoas na EBD" valor={String(r.distintas)} detalhe={`${r.membros} membros · ${r.visitantes} visitantes`} />
        <Kpi rotulo="Só uma vez" valor={String(r.umaVez)} cor="#5B6B76" />
        <Kpi rotulo="Esporádicos (2–3)" valor={String(r.esporadicos)} cor="#D9930D" />
        <Kpi rotulo="Frequentes (4+)" valor={String(r.frequentes)} cor="#F2542D" />
      </div>
    </section>
  );
}
