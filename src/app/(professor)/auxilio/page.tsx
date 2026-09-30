import Link from "next/link";
import { listarRascunhos, buscarRascunho, listarAulasParaEscolher } from "@/lib/auxilio/queries";
import { getSessaoAtual } from "@/lib/auth/session";
import { NovoRascunhoForm, BotaoApagarRascunho } from "@/components/auxilio/ClientForms";
import { ChatAuxilio } from "@/components/auxilio/ChatAuxilio";
import { MesaPreparo } from "@/components/auxilio/MesaPreparo";
import { listarTurmas } from "@/lib/estrutura/queries";
import { listarMinhasTurmasIds } from "@/lib/frequencia/queries";
import { createClient } from "@/lib/supabase/server";
import { NovoPreparoForm } from "@/components/auxilio/NovoPreparoForm";
import { infoDaAula } from "@/lib/calendario/plano2s2026";
import { ETAPAS, fmtDomingo, proximosDomingos, type EstadoEtapas } from "@/lib/auxilio/mesa";
import { hojeIso } from "@/lib/relatorio/dados";
import { corDaTurma } from "@/lib/relatorio/cores";

// Auxílio ao Professor = Mesa de Preparo. Cada aula (turma + domingo) tem o
// seu roteiro em etapas e o seu assistente. O rascunho por trás é 100%
// privado (RLS `rascunhos_dono_all`); a coordenação só enxerga o andamento
// (tabela `preparos`). Conversas livres antigas continuam acessíveis.
export default async function AuxilioProfessorPage({
  searchParams,
}: {
  searchParams: { preparo?: string; rascunho?: string; erro?: string };
}) {
  const sessao = await getSessaoAtual();
  const souCoordenacao = sessao.role === "coordenacao";
  const supabase = createClient();

  const todasTurmas = await listarTurmas();
  // coordenação que também dá aula vê as próprias turmas; sem vínculo, vê todas
  const meusIds = await listarMinhasTurmasIds();
  const minhas = souCoordenacao && meusIds.length === 0 ? null : meusIds;
  const turmas = todasTurmas.filter((t) => minhas === null || minhas.includes(t.id));

  // ---- Conversa livre (rascunhos sem aula) -------------------------------
  if (searchParams.rascunho) {
    const rascunho = await buscarRascunho(searchParams.rascunho);
    const aulas = await listarAulasParaEscolher(souCoordenacao);
    const rascunhos = await listarRascunhos();
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Link href="/auxilio" className="text-sm font-medium text-primary hover:underline">
            ← Voltar à Mesa de Preparo
          </Link>
          <NovoRascunhoForm aulas={aulas} />
          <div className="rounded-xl border border-border bg-surface">
            {rascunhos.map((r, i) => (
              <div
                key={r.id}
                className={`flex items-center justify-between gap-2 px-4 py-3 ${i > 0 ? "border-t border-border-light" : ""}`}
              >
                <a
                  href={`/auxilio?rascunho=${r.id}`}
                  className={`truncate text-sm ${r.id === rascunho?.id ? "font-semibold text-primary" : "text-text-primary"}`}
                >
                  {r.titulo}
                </a>
                <BotaoApagarRascunho rascunhoId={r.id} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h1 className="mb-4 font-display text-2xl font-semibold text-primary">Conversa livre</h1>
          {rascunho ? (
            <ChatAuxilio
              key={rascunho.id}
              rascunhoId={rascunho.id}
              pessoaId={sessao.pessoaId ?? ""}
              turmas={turmas.map((t) => ({ id: t.id, nome: t.nome }))}
              historicoInicial={rascunho.conteudo?.historico ?? []}
            />
          ) : (
            <p className="text-sm text-text-secondary">Conversa não encontrada.</p>
          )}
        </div>
      </div>
    );
  }

  // ---- Preparo aberto ------------------------------------------------------
  const { data: preparos, error: erroPreparos } = await supabase
    .from("preparos")
    .select("id, turma_id, data, titulo, rascunho_id, etapas_prontas, etapas_total")
    .eq("pessoa_id", sessao.pessoaId ?? "")
    .order("data", { ascending: false });

  if (erroPreparos) {
    return (
      <div className="max-w-xl rounded-xl border border-border bg-surface p-6">
        <h1 className="font-display text-2xl font-semibold text-primary">Auxílio ao Professor</h1>
        <p className="mt-2 text-sm text-text-secondary">
          A Mesa de Preparo ainda não foi ativada no banco (falta rodar o SQL 0010).
        </p>
        <Link href="/auxilio?rascunho=nova" className="mt-3 inline-block text-sm text-primary hover:underline">
          Enquanto isso, abrir uma conversa livre
        </Link>
      </div>
    );
  }

  const lista = preparos ?? [];
  const aberto = lista.find((p) => p.id === searchParams.preparo) ?? null;
  const hoje = hojeIso();
  const nomeTurma = (id: string) => todasTurmas.find((t) => t.id === id)?.nome ?? "Turma";

  const domingos = proximosDomingos(hoje, 4);

  let corpo: React.ReactNode = null;
  if (aberto?.rascunho_id) {
    const r = await buscarRascunho(aberto.rascunho_id);
    const turma = todasTurmas.find((t) => t.id === aberto.turma_id);
    const { data: modulo } = r?.modulo_id
      ? await supabase.from("modulos").select("numero, tema").eq("id", r.modulo_id).maybeSingle()
      : { data: null };
    if (r && turma) {
      const conteudo = r.conteudo as { historico?: never[]; etapas?: EstadoEtapas };
      corpo = (
        <MesaPreparo
          key={aberto.id}
          preparoId={aberto.id}
          rascunhoId={r.id}
          pessoaId={sessao.pessoaId ?? ""}
          turma={{ id: turma.id, nome: turma.nome }}
          cabecalho={`${turma.nome}${turma.titulo ? ` · ${turma.titulo}` : ""}${modulo ? ` · Módulo ${modulo.numero}${modulo.tema ? ` — ${modulo.tema}` : ""}` : ""}`}
          dataTexto={new Date(aberto.data + "T00:00:00").toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
          })}
          tituloInicial={aberto.titulo}
          plano={infoDaAula(turma.nome, aberto.data)}
          etapasIniciais={conteudo.etapas ?? {}}
          historicoInicial={conteudo.historico ?? []}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {searchParams.erro && (
        <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
          {searchParams.erro}
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[268px_1fr]">
        <aside className="space-y-3">
          <h1 className="font-display text-lg font-semibold text-primary">Suas aulas</h1>
          {lista.length === 0 && (
            <p className="text-sm text-text-secondary">Escolha abaixo a turma e a data da aula que você vai preparar.</p>
          )}
          {lista.map((p) => {
            const pct = Math.round((p.etapas_prontas / (p.etapas_total || ETAPAS.length)) * 100);
            const ativo = p.id === aberto?.id;
            return (
              <Link
                key={p.id}
                href={`/auxilio?preparo=${p.id}`}
                className={`block rounded-xl bg-surface p-4 ${ativo ? "border-2 border-primary" : "border border-border"}`}
              >
                <div className="flex justify-between text-xs">
                  <span className="font-semibold tracking-wide" style={{ color: corDaTurma(nomeTurma(p.turma_id)) }}>
                    {nomeTurma(p.turma_id).toUpperCase()}
                  </span>
                  <span className="text-text-secondary">{fmtDomingo(p.data)}</span>
                </div>
                <div className="mt-1 text-sm font-semibold">{p.titulo}</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-light">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1 text-xs text-text-secondary">
                  {p.etapas_prontas === 0 ? "Não iniciada" : `${p.etapas_prontas} de ${p.etapas_total} etapas`}
                </div>
              </Link>
            );
          })}

          <NovoPreparoForm turmas={turmas.map((t) => ({ id: t.id, nome: t.nome }))} domingos={domingos} />

          <Link href="/auxilio?rascunho=livre" className="block text-xs text-text-secondary hover:underline">
            Conversas livres (sem aula)
          </Link>
          <p className="text-xs leading-relaxed text-text-secondary">
            Suas conversas ficam salvas em cada aula. Só você as vê; a coordenação vê apenas o andamento.
          </p>
        </aside>

        <section className="min-w-0">
          {corpo ?? (
            <div className="rounded-xl border border-border bg-surface p-8 text-sm text-text-secondary">
              <h2 className="font-display text-xl font-semibold text-primary">Mesa de Preparo</h2>
              <p className="mt-2 max-w-xl leading-relaxed">
                Escolha uma aula ao lado. Cada aula tem seis etapas — pergunta de abertura, texto bíblico, tese,
                desenvolvimento, aplicação e a pergunta que fica — e um assistente que já lê o que você escreveu.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
