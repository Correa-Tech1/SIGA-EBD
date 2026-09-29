"use client";

import { useEffect, useState, useTransition } from "react";
import { ChatAuxilio } from "./ChatAuxilio";
import { ArquivosGerados } from "./ArquivosGerados";
import { salvarEtapa, renomearPreparo } from "@/lib/auxilio/mesa-actions";
import {
  ATALHOS,
  ETAPAS,
  PEDIDO_SLIDES,
  contarProntas,
  type ChaveEtapa,
  type EstadoEtapas,
} from "@/lib/auxilio/mesa";

interface Arquivo {
  nome: string;
  caminho: string;
}

interface Msg {
  role: "user" | "assistant";
  texto: string;
  anexos?: Arquivo[];
  arquivos?: Arquivo[];
}

export function MesaPreparo({
  preparoId,
  rascunhoId,
  pessoaId,
  turma,
  cabecalho,
  dataTexto,
  tituloInicial,
  etapasIniciais,
  historicoInicial,
}: {
  preparoId: string;
  rascunhoId: string;
  pessoaId: string;
  turma: { id: string; nome: string };
  cabecalho: string;
  dataTexto: string;
  tituloInicial: string;
  etapasIniciais: EstadoEtapas;
  historicoInicial: Msg[];
}) {
  const [etapas, setEtapas] = useState<EstadoEtapas>(etapasIniciais);
  const [titulo, setTitulo] = useState(tituloInicial);
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const [pedido, setPedido] = useState<{ id: number; texto: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [gerados, setGerados] = useState<Arquivo[]>(
    historicoInicial.flatMap((m) => m.arquivos ?? [])
  );
  const [, iniciar] = useTransition();

  const prontas = contarProntas(etapas);
  const pct = Math.round((prontas / ETAPAS.length) * 100);

  function salvar(chave: ChaveEtapa, texto: string, pronto: boolean) {
    setEtapas((atual) => ({ ...atual, [chave]: { texto, pronto } }));
    iniciar(async () => {
      const r = await salvarEtapa(preparoId, chave, texto, pronto);
      setErro(r.erro ?? null);
    });
  }

  function enviarPedido(texto: string) {
    setAssistenteAberto(true);
    setPedido({ id: Date.now(), texto });
  }

  function usarNaEtapa(chave: string, texto: string) {
    const c = chave as ChaveEtapa;
    const atual = etapas[c]?.texto?.trim();
    salvar(c, atual ? `${atual}\n\n${texto}` : texto, false);
    document.getElementById(`etapa-${c}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
      <div className="min-w-0 space-y-4">
        <div>
          <p className="text-xs text-text-secondary">{cabecalho}</p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
            <input
              aria-label="Título da aula"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onBlur={() => titulo.trim() && iniciar(async () => void (await renomearPreparo(preparoId, titulo)))}
              className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent font-display text-2xl font-semibold text-primary hover:border-border focus:border-primary focus:bg-surface focus:outline-none"
            />
            <span className="text-sm text-text-secondary">{dataTexto}</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-border-light">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="whitespace-nowrap text-sm text-text-secondary">
              {prontas} de {ETAPAS.length} etapas prontas
            </span>
          </div>
        </div>

        {erro && (
          <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger" role="alert">
            {erro}
          </p>
        )}

        <ol className="space-y-3">
          {ETAPAS.map((e, i) => (
            <CartaoEtapa
              key={e.chave}
              n={i + 1}
              chave={e.chave}
              nome={e.nome}
              dica={e.dica}
              valor={etapas[e.chave]?.texto ?? ""}
              pronto={!!etapas[e.chave]?.pronto}
              aoSalvar={(t, p) => salvar(e.chave, t, p)}
              aoPedirAjuda={() =>
                enviarPedido(
                  `Me ajude com a etapa "${e.nome}" desta aula. Olhe o que já tenho no roteiro, faça no máximo 2 perguntas se precisar e proponha uma versão.`
                )
              }
            />
          ))}
        </ol>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="font-display text-lg font-semibold text-primary">Materiais desta aula</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => enviarPedido(PEDIDO_SLIDES)}
              className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-white"
            >
              Gerar slides (PowerPoint)
            </button>
          </div>
          {gerados.length > 0 ? (
            <div className="mt-3">
              <ArquivosGerados arquivos={gerados} turmas={[turma]} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-text-secondary">
              Os slides gerados aparecem aqui. Para usar um PDF, Word ou imagem, anexe no Assistente.
            </p>
          )}
        </section>
      </div>

      <div
        className={`${
          assistenteAberto ? "fixed inset-0 z-40 flex bg-bg p-3" : "hidden"
        } flex-col lg:sticky lg:top-4 lg:z-auto lg:flex lg:h-[calc(100vh-7rem)] lg:bg-transparent lg:p-0`}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-primary">Assistente</h2>
          <button
            type="button"
            onClick={() => setAssistenteAberto(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm lg:hidden"
          >
            Fechar
          </button>
        </div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {ATALHOS.map((a) => (
            <button
              key={a.rotulo}
              type="button"
              onClick={() => enviarPedido(a.pedido)}
              className="rounded-full border border-primary/40 bg-surface px-3 py-1.5 text-xs text-primary hover:bg-primary hover:text-white"
            >
              {a.rotulo}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1">
          <ChatAuxilio
            compacto
            rascunhoId={rascunhoId}
            pessoaId={pessoaId}
            turmas={[turma]}
            historicoInicial={historicoInicial}
            pedido={pedido}
            etapasOpcoes={ETAPAS.map((e) => ({ chave: e.chave, nome: e.nome }))}
            aoUsarNaEtapa={(chave, texto) => {
              usarNaEtapa(chave, texto);
              setAssistenteAberto(false);
            }}
            aoGerarArquivos={(novos) => setGerados((g) => [...g, ...novos])}
          />
        </div>
      </div>

      {!assistenteAberto && (
        <button
          type="button"
          onClick={() => setAssistenteAberto(true)}
          className="fixed bottom-5 right-4 z-30 h-14 rounded-full bg-primary px-6 text-base font-semibold text-white shadow-lg lg:hidden"
        >
          Assistente
        </button>
      )}
    </div>
  );
}

function CartaoEtapa({
  n,
  chave,
  nome,
  dica,
  valor,
  pronto,
  aoSalvar,
  aoPedirAjuda,
}: {
  n: number;
  chave: string;
  nome: string;
  dica: string;
  valor: string;
  pronto: boolean;
  aoSalvar: (texto: string, pronto: boolean) => void;
  aoPedirAjuda: () => void;
}) {
  const [texto, setTexto] = useState(valor);
  // quando o texto muda por fora (botão "Usar na etapa"), acompanha
  useEffect(() => setTexto(valor), [valor]);

  const emAndamento = !pronto && texto.trim().length > 0;
  const chip = pronto
    ? { t: "Pronto", c: "bg-[#E1F3E8] text-[#1B6B3A]" }
    : emAndamento
      ? { t: "Em andamento", c: "bg-[#FFF1D6] text-[#8A5A00]" }
      : { t: "A fazer", c: "bg-[#ECEFF1] text-[#5B6B76]" };

  return (
    <li
      id={`etapa-${chave}`}
      className={`rounded-xl border bg-surface p-4 ${emAndamento ? "border-2 border-accent" : "border-border"}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            pronto ? "bg-primary text-white" : emAndamento ? "bg-accent text-text-primary" : "bg-border-light text-text-secondary"
          }`}
        >
          {pronto ? "✓" : n}
        </span>
        <h3 className="flex-1 font-semibold">{nome}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chip.c}`}>{chip.t}</span>
      </div>
      <textarea
        id={`campo-${chave}`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => texto !== valor && aoSalvar(texto, pronto && texto.trim().length > 0)}
        rows={texto.length > 160 ? 5 : 2}
        placeholder={dica}
        className="mt-3 w-full resize-y rounded-lg border border-border px-3 py-2 text-sm leading-relaxed"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={aoPedirAjuda}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white"
        >
          Pedir ajuda à IA
        </button>
        <button
          type="button"
          disabled={!texto.trim()}
          onClick={() => aoSalvar(texto, !pronto)}
          className="rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-primary disabled:opacity-40"
        >
          {pronto ? "Reabrir" : "Marcar como pronta"}
        </button>
      </div>
    </li>
  );
}
