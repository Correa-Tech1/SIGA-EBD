import { Kpi } from "@/components/relatorio/Blocos";
import { corDaTurma } from "@/lib/relatorio/cores";
import { fmtDomingo } from "@/lib/auxilio/mesa";
import type { carregarProfessores } from "@/lib/coordenacao/dados";

type Dados = Awaited<ReturnType<typeof carregarProfessores>>;

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function quando(iso: string | null, hoje: string): string {
  if (!iso) return "nunca";
  const dia = iso.slice(0, 10);
  const dias = Math.round((Date.parse(hoje + "T00:00:00Z") - Date.parse(dia + "T00:00:00Z")) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  return dia.split("-").reverse().join("/");
}

function Tipo({ tipo }: { tipo: "regular" | "convidado" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        tipo === "convidado" ? "bg-accent/20 text-[#8A5A00]" : "bg-primary/10 text-primary"
      }`}
    >
      {tipo === "convidado" ? "Convidado" : "Regular"}
    </span>
  );
}

export function SecaoProfessores({ id, dados, hoje }: { id: string; dados: Dados; hoje: string }) {
  const { linhas, porTurma, prontidao, ano, turmas } = dados;
  const regulares = linhas.filter((l) => l.tipo === "regular").length;
  const convidados = linhas.length - regulares;
  const totalDadas = linhas.reduce((s, l) => s + l.dadas, 0);
  const totalAgendadas = linhas.reduce((s, l) => s + l.agendadas, 0);
  const mesAtual = Number(hoje.slice(5, 7)) - 1;

  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-6 space-y-5">
      <h2 id={`${id}-t`} className="font-display text-xl font-semibold text-primary">
        Professores
      </h2>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi rotulo="Professores cadastrados" valor={String(linhas.length)} detalhe={`${regulares} regulares · ${convidados} convidados`} />
        <Kpi rotulo={`Aulas dadas em ${ano}`} valor={String(totalDadas)} detalhe="escalas até hoje" cor="#F2542D" />
        <Kpi rotulo="Aulas já escaladas" valor={String(totalAgendadas)} detalhe="datas futuras" cor="#D9930D" />
        <Kpi
          rotulo="Usam o Auxílio"
          valor={String(linhas.filter((l) => l.preparos > 0).length)}
          detalhe={`de ${linhas.length} professores`}
          cor="#101E24"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-text-primary">Aulas por professor em {ano}</h3>
        {linhas.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-secondary">
            Nenhum professor cadastrado. Crie na aba Professores.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-bg text-left text-xs text-text-secondary">
                  <th className="px-3 py-2 font-medium">Professor</th>
                  <th className="px-3 py-2 font-medium">Turma(s)</th>
                  <th className="px-3 py-2 text-right font-medium">Dadas</th>
                  <th className="px-3 py-2 text-right font-medium">A dar</th>
                  {MESES.map((m, i) => (
                    <th key={m} className={`px-1.5 py-2 text-center font-medium ${i === mesAtual ? "text-primary" : ""}`}>
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id} className="border-b border-border-light last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-medium">{l.nome}</div>
                      <Tipo tipo={l.tipo} />
                    </td>
                    <td className="px-3 py-2 text-xs text-text-secondary">{l.turmas.join(", ") || "—"}</td>
                    <td className="px-3 py-2 text-right font-semibold">{l.dadas}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">{l.agendadas}</td>
                    {l.porMes.map((n, i) => (
                      <td key={i} className={`px-1.5 py-2 text-center ${n === 0 ? "text-border" : "font-medium"}`}>
                        {n === 0 ? "·" : n}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-text-secondary">
          Conta as datas em que o professor foi escalado (aba Escalas &amp; Avisos). Meses mostram dadas + futuras.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-text-primary">Quem dá aula em cada turma</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {porTurma.map((t) => {
            const cor = corDaTurma(t.turma);
            const unico = t.professores.length === 1;
            return (
              <div key={t.turmaId} className="rounded-xl border border-border bg-surface p-4" style={{ borderTop: `4px solid ${cor}` }}>
                <div className="font-display text-base font-semibold">{t.turma}</div>
                {t.professores.length === 0 ? (
                  <p className="mt-2 text-sm text-text-secondary">Nenhuma aula escalada até hoje.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {t.professores.map((p) => (
                      <li key={p.id}>
                        <div className="flex justify-between text-sm">
                          <span>{p.nome}</span>
                          <span className="text-text-secondary">
                            {p.aulas} {p.aulas === 1 ? "aula" : "aulas"}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border-light">
                          <div className="h-full" style={{ width: `${(p.aulas / t.totalAulas) * 100}%`, background: cor }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {unico && (
                  <p className="mt-3 text-xs text-[#8A5A00]">Professor único: toda a turma depende de uma pessoa.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-text-primary">Uso da plataforma</h3>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs text-text-secondary">
                <th className="px-3 py-2 font-medium">Professor</th>
                <th className="px-3 py-2 font-medium">Último acesso</th>
                <th className="px-3 py-2 text-right font-medium">Aulas em preparo</th>
                <th className="px-3 py-2 text-right font-medium">Etapas prontas</th>
                <th className="px-3 py-2 text-right font-medium">Com slides</th>
                <th className="px-3 py-2 font-medium">Última atividade</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id} className="border-b border-border-light last:border-0">
                  <td className="px-3 py-2 font-medium">{l.nome}</td>
                  <td className={`px-3 py-2 ${l.ultimoAcesso ? "" : "text-danger"}`}>{quando(l.ultimoAcesso, hoje)}</td>
                  <td className="px-3 py-2 text-right">{l.preparos}</td>
                  <td className="px-3 py-2 text-right">{l.etapasProntas}</td>
                  <td className="px-3 py-2 text-right">{l.slides}</td>
                  <td className="px-3 py-2 text-text-secondary">{quando(l.ultimaAtividade, hoje)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          Só o andamento aparece aqui. O conteúdo das conversas e dos rascunhos é privado de cada professor.
        </p>
      </div>

      {prontidao && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-text-primary">Prontidão de domingo — {fmtDomingo(prontidao.data)}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {turmas.map((t) => {
              const ps = prontidao.itens.filter((x) => x.turmaId === t.id);
              const cor = corDaTurma(t.nome);
              return (
                <div key={t.id} className="rounded-xl border border-border bg-surface p-4" style={{ borderTop: `4px solid ${cor}` }}>
                  <div className="font-display text-base font-semibold">{t.nome}</div>
                  {ps.length === 0 ? (
                    <p className="mt-2 text-sm text-text-secondary">Preparo ainda não iniciado.</p>
                  ) : (
                    ps.map((p) => (
                      <div key={p.pessoa} className="mt-3">
                        <div className="flex justify-between text-sm">
                          <span>{p.pessoa}</span>
                          <span className="text-text-secondary">
                            {p.prontas} de {p.total} etapas
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-border-light">
                          <div className="h-full" style={{ width: `${(p.prontas / (p.total || 6)) * 100}%`, background: cor }} />
                        </div>
                        <p className="mt-1 text-xs text-text-secondary">Slides: {p.slides ? "gerados" : "não gerados"}</p>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
