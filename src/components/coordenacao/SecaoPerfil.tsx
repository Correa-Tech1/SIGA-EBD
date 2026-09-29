import { GraficoLinhas } from "@/components/relatorio/GraficoLinhas";
import { corDaTurma } from "@/lib/relatorio/cores";
import { FAIXAS_ETARIAS, fmtDataCurta, fmtNum, fmtPct, textoPerfilEtario, type RelatorioGeral } from "@/lib/relatorio/motor";

export function SecaoPerfil({ id, r }: { id: string; r: RelatorioGeral }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-6 space-y-5">
      <h2 id={`${id}-t`} className="font-display text-xl font-semibold text-primary">
        Perfil do público ao longo do semestre
      </h2>
      <p className="max-w-3xl text-sm text-text-secondary">
        Idade de quem estava na sala em cada aula (todos os presentes com data de nascimento cadastrada), e o que mudou
        entre a primeira e a segunda metade do semestre.
      </p>

      <GraficoLinhas
        descricao="Idade média dos presentes em cada domingo, por turma."
        minimoY={30}
        casas={1}
        series={r.turmas.map((t) => ({
          nome: t.turma.nome,
          cor: corDaTurma(t.turma.nome),
          pontos: t.perfil.datas.filter((d) => d.idadeMedia !== null).map((d) => ({ data: d.data, valor: d.idadeMedia as number })),
        }))}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {r.turmas.map((t) => {
          const cor = corDaTurma(t.turma.nome);
          const pf = t.perfil;
          const totA = FAIXAS_ETARIAS.reduce((s, f) => s + pf.faixasPrimeira[f], 0);
          const totB = FAIXAS_ETARIAS.reduce((s, f) => s + pf.faixasSegunda[f], 0);
          const semIdade = pf.datas.reduce((s, d) => s + (d.presentes - d.comIdade), 0);
          return (
            <div key={t.turma.id} className="space-y-3 rounded-xl border border-border bg-surface p-4" style={{ borderTop: `4px solid ${cor}` }}>
              <div className="font-display text-base font-semibold">{t.turma.nome}</div>
              <p className="text-sm leading-relaxed">{textoPerfilEtario(t)}</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-text-secondary">
                    <th className="py-1 font-medium">Faixa</th>
                    <th className="py-1 text-right font-medium">1ª metade</th>
                    <th className="py-1 text-right font-medium">2ª metade</th>
                  </tr>
                </thead>
                <tbody>
                  {FAIXAS_ETARIAS.map((f) => {
                    const a = totA ? (pf.faixasPrimeira[f] / totA) * 100 : null;
                    const b = totB ? (pf.faixasSegunda[f] / totB) * 100 : null;
                    if ((a ?? 0) === 0 && (b ?? 0) === 0) return null;
                    return (
                      <tr key={f} className="border-t border-border-light">
                        <td className="py-1">{f}</td>
                        <td className="py-1 text-right">{fmtPct(a)}</td>
                        <td className="py-1 text-right font-medium">{fmtPct(b)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {semIdade > 0 && (
                <p className="text-xs text-text-secondary">
                  {semIdade} presenças sem data de nascimento não entram nesta análise.
                </p>
              )}
              <details>
                <summary className="cursor-pointer text-xs font-medium text-primary">Ver aula por aula</summary>
                <table className="mt-2 w-full text-xs">
                  <thead>
                    <tr className="text-left text-text-secondary">
                      <th className="py-1 font-medium">Data</th>
                      <th className="py-1 text-right font-medium">Presentes</th>
                      <th className="py-1 text-right font-medium">Idade média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pf.datas.map((d) => (
                      <tr key={d.data} className="border-t border-border-light">
                        <td className="py-1">{fmtDataCurta(d.data)}</td>
                        <td className="py-1 text-right">{d.presentes}</td>
                        <td className="py-1 text-right">{d.idadeMedia === null ? "N/D" : fmtNum(d.idadeMedia)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </div>
          );
        })}
      </div>
    </section>
  );
}
