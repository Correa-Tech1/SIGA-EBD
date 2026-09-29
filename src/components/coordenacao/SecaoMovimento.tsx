import { fmtDataCurta, type RelatorioGeral } from "@/lib/relatorio/motor";
import { corDaTurma } from "@/lib/relatorio/cores";

export function SecaoMovimento({ id, r }: { id: string; r: RelatorioGeral }) {
  const migraram = r.migracoes.filter((m) => m.tipo === "migrou");
  const duas = r.migracoes.filter((m) => m.tipo === "duas");

  const bloco = (titulo: string, itens: typeof r.migracoes, vazio: string) => (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">{titulo}</h3>
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">{itens.length}</span>
      </div>
      {itens.length === 0 ? (
        <p className="mt-2 text-sm text-text-secondary">{vazio}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {itens.map((m) => (
            <li key={m.id} className="text-sm">
              <div className="font-medium">{m.nome}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                {m.trajeto.map((t, i) => (
                  <span key={t.turma} className="flex items-center gap-1.5">
                    {i > 0 && <span aria-hidden="true">→</span>}
                    <span className="rounded-full px-2 py-0.5 font-medium text-white" style={{ background: corDaTurma(t.turma) }}>
                      {t.turma}
                    </span>
                    <span className="text-text-secondary">
                      {t.aulas} {t.aulas === 1 ? "aula" : "aulas"} · {fmtDataCurta(t.primeira)}
                      {t.primeira !== t.ultima ? ` a ${fmtDataCurta(t.ultima)}` : ""}
                    </span>
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-6 space-y-4">
      <h2 id={`${id}-t`} className="font-display text-xl font-semibold text-primary">
        Movimento entre turmas
      </h2>
      <p className="max-w-3xl text-sm text-text-secondary">
        Quem esteve em mais de uma turma no semestre. “Mudou de turma” = parou de ir a uma e passou a ir a outra;
        “Frequenta mais de uma” = as presenças se misturam no tempo.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {bloco("Mudaram de turma", migraram, "Ninguém mudou de turma neste semestre.")}
        {bloco("Frequentam mais de uma turma", duas, "Ninguém frequenta duas turmas ao mesmo tempo.")}
      </div>
    </section>
  );
}
