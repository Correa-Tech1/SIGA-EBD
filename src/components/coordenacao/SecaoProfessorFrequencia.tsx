import { corDaTurma } from "@/lib/relatorio/cores";
import type { LinhaProfFreq } from "@/lib/coordenacao/professor-frequencia";

const fmtData = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);

// Professor × frequência: quantos vieram nas aulas de cada professor, contra a
// média da turma, e quantos voltaram no domingo seguinte.
export function SecaoProfessorFrequencia({ id, linhas }: { id: string; linhas: LinhaProfFreq[] }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-6 space-y-3">
      <h2 id={`${id}-t`} className="font-display text-xl font-semibold text-primary">
        Professor × frequência
      </h2>
      <p className="text-sm text-text-secondary">
        Cruza quem deu a aula (Escalas) com quantos vieram (chamada). Só entram datas com chamada lançada. Com poucas aulas,
        trate como indício, não como conclusão.
      </p>

      {linhas.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-secondary">
          Ainda não há aula com professor escalado e chamada lançada. Registre o professor de cada domingo em Escalas &amp;
          Avisos (inclusive agosto) que a análise aparece aqui.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs text-text-secondary">
                <th className="px-3 py-2 font-medium">Professor</th>
                <th className="px-3 py-2 font-medium">Turma</th>
                <th className="px-3 py-2 text-right font-medium">Aulas</th>
                <th className="px-3 py-2 text-right font-medium">Média de presentes</th>
                <th className="px-3 py-2 text-right font-medium">Média da turma</th>
                <th className="px-3 py-2 text-right font-medium">Diferença</th>
                <th className="px-3 py-2 text-right font-medium">Domingo seguinte</th>
                <th className="px-3 py-2 font-medium">Datas</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.professorId + l.turmaId} className="border-b border-border-light last:border-0">
                  <td className="px-3 py-2 font-medium">{l.nome}</td>
                  <td className="px-3 py-2">
                    <span className="font-semibold" style={{ color: corDaTurma(l.turma) }}>
                      {l.turma}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">{l.aulas.length}</td>
                  <td className="px-3 py-2 text-right font-semibold">{l.media}</td>
                  <td className="px-3 py-2 text-right text-text-secondary">{l.mediaTurma}</td>
                  <td
                    className={`px-3 py-2 text-right font-semibold ${
                      l.diferenca > 0 ? "text-[#1B6B3A]" : l.diferenca < 0 ? "text-danger" : "text-text-secondary"
                    }`}
                  >
                    {l.diferenca > 0 ? "+" : ""}
                    {l.diferenca}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {l.mediaSeguinte === null ? (
                      <span className="text-text-secondary">—</span>
                    ) : (
                      <>
                        {l.mediaSeguinte} <span className="text-xs text-text-secondary">({l.amostraSeguinte})</span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-text-secondary">
                    {l.aulas.map((a) => `${fmtData(a.data)}: ${a.presentes}`).join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
