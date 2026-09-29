import { getSessaoAtual } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { proximosDomingos, fmtDomingo } from "@/lib/auxilio/mesa";
import { carregarRelatorio, hojeIso } from "@/lib/relatorio/dados";
import { corDaTurma } from "@/lib/relatorio/cores";
import { fmtDataCurta, fmtNum, fmtPct } from "@/lib/relatorio/motor";
import { GraficoLinhas } from "@/components/relatorio/GraficoLinhas";
import { KpiColorido } from "@/components/relatorio/Blocos";

// Início: apresentação da EBD + um único painel colorido com os números
// gerais + o gráfico de linhas (uma cor por turma). Os detalhes ficam na
// aba Frequência.
export default async function DashboardPage() {
  const [sessao, { relatorio: r, semestre }] = await Promise.all([getSessaoAtual(), carregarRelatorio()]);

  // presentes por domingo somando as turmas
  const porData = new Map<string, number>();
  for (const t of r.turmas) for (const d of t.datas) porData.set(d.data, (porData.get(d.data) ?? 0) + d.presentes);
  const totais = [...porData.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const mediaGeral = totais.length ? totais.reduce((s, [, v]) => s + v, 0) / totais.length : 0;
  const ultimo = totais[totais.length - 1];
  const pctAdultos = r.igreja.adultos ? (r.igreja.passaram / r.igreja.adultos) * 100 : 0;

  // Prontidão do próximo domingo: só o andamento do preparo (tabela `preparos`),
  // nunca o conteúdo. Se o SQL 0010 ainda não rodou, a seção some.
  const proxDomingo = proximosDomingos(hojeIso(), 1)[0];
  const supabase = createClient();
  const { data: preparosDomingo, error: erroPreparos } = await supabase
    .from("preparos")
    .select("turma_id, pessoa_id, titulo, etapas_prontas, etapas_total, slides_gerados, atualizado_em")
    .eq("data", proxDomingo);
  const { data: pessoasPrep } = preparosDomingo?.length
    ? await supabase.from("pessoas_publicas").select("id, nome").in("id", preparosDomingo.map((p) => p.pessoa_id))
    : { data: [] as { id: string; nome: string }[] };

  const periodo = semestre ? `${semestre.periodo}º semestre de ${semestre.ano}` : "Semestre atual";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-surface p-8 shadow-sm ring-1 ring-border">
        <p className="text-sm text-text-secondary">Olá, {sessao.nome}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-primary">
          Escola Bíblica Dominical
        </h1>
        <p className="mt-1 font-display text-lg text-text-secondary">
          Assembleia de Deus Dom Pedro II · Anápolis-GO · {periodo}
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary">
          A EBD é o lugar onde a igreja se reúne aos domingos para estudar a Palavra por classe e
          por fase de vida. Neste semestre, {r.turmas.length}{" "}
          {r.turmas.length === 1 ? "turma de adultos caminha" : "turmas de adultos caminham"} juntas:
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {r.turmas.map((t) => (
            <li
              key={t.turma.id}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-white"
              style={{ background: corDaTurma(t.turma.nome) }}
            >
              {t.turma.nome}
              {t.turma.titulo ? ` · ${t.turma.titulo}` : ""}
            </li>
          ))}
        </ul>
      </section>

      {!erroPreparos && (
        <section aria-labelledby="titulo-prontidao" className="space-y-3">
          <h2 id="titulo-prontidao" className="font-display text-lg font-semibold text-primary">
            Prontidão de domingo — {fmtDomingo(proxDomingo)}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {r.turmas.map((t) => {
              const ps = (preparosDomingo ?? []).filter((p) => p.turma_id === t.turma.id);
              const cor = corDaTurma(t.turma.nome);
              return (
                <div
                  key={t.turma.id}
                  className="rounded-xl border border-border bg-surface p-5"
                  style={{ borderTop: `5px solid ${cor}` }}
                >
                  <div className="font-display text-lg font-semibold">{t.turma.nome}</div>
                  {ps.length === 0 ? (
                    <p className="mt-2 text-sm text-text-secondary">Preparo ainda não iniciado.</p>
                  ) : (
                    ps.map((p) => {
                      const nome = pessoasPrep?.find((x) => x.id === p.pessoa_id)?.nome ?? "Professor";
                      const pct = Math.round((p.etapas_prontas / (p.etapas_total || 6)) * 100);
                      return (
                        <div key={p.pessoa_id} className="mt-3">
                          <div className="flex justify-between text-sm">
                            <span>{nome}</span>
                            <span className="text-text-secondary">
                              {p.etapas_prontas} de {p.etapas_total} etapas
                            </span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-border-light">
                            <div className="h-full" style={{ width: `${pct}%`, background: cor }} />
                          </div>
                          <p className="mt-1 text-xs text-text-secondary">
                            Slides: {p.slides_gerados ? "gerados" : "não gerados"}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-text-secondary">
            Mostra só o andamento. O conteúdo das conversas e dos rascunhos é de cada professor.
          </p>
        </section>
      )}

      {r.aulas === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
          Nenhuma chamada lançada ainda. Comece pela aba Frequência.
        </p>
      ) : (
        <>
          <section aria-label="Números gerais" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiColorido
              fundo="#0E7C86"
              rotulo="Pessoas na EBD"
              valor={String(r.distintas)}
              detalhe={`${r.membros} membros · ${r.visitantes} visitantes`}
            />
            <KpiColorido
              fundo="#F2542D"
              rotulo="Presentes por domingo"
              valor={fmtNum(mediaGeral)}
              detalhe={ultimo ? `último domingo (${fmtDataCurta(ultimo[0])}): ${ultimo[1]}` : undefined}
            />
            <KpiColorido
              fundo="#D9930D"
              rotulo="Frequentes (4+ aulas)"
              valor={String(r.frequentes)}
              detalhe={`${r.esporadicos} esporádicos · ${r.umaVez} só uma vez`}
            />
            <KpiColorido
              fundo="#101E24"
              rotulo="Membros adultos que passaram pela EBD"
              valor={fmtPct(pctAdultos)}
              detalhe={`${r.igreja.passaram} de ${r.igreja.adultos} adultos · ${r.aulas} domingos`}
            />
          </section>

          <section aria-labelledby="titulo-linha" className="space-y-3">
            <h2 id="titulo-linha" className="font-display text-lg font-semibold text-primary">
              Presença por domingo
            </h2>
            <GraficoLinhas
              descricao="Presentes por domingo em cada turma."
              series={r.turmas.map((t) => ({
                nome: t.turma.nome,
                cor: corDaTurma(t.turma.nome),
                pontos: t.datas.map((d) => ({ data: d.data, valor: d.presentes })),
              }))}
            />
            <a href="/frequencia" className="inline-block text-sm font-medium text-primary hover:underline">
              Ver detalhes na Frequência →
            </a>
          </section>
        </>
      )}
    </div>
  );
}
