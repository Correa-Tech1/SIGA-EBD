"use client";

import { useEffect, useState, useTransition } from "react";
import { ChatAuxilio } from "./ChatAuxilio";
import { ArquivosGerados } from "./ArquivosGerados";
import type { InfoAula } from "@/lib/calendario/plano2s2026";
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
  plano,
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
  plano: InfoAula | null;
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

        {plano && (
          <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold tracking-wide text-primary">
                PLANO DE ENSINO · LIÇÃO {plano.numero}
              </span>
              {plano.tipo === "unificada" && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-white">UNIFICADA</span>
              )}
              {plano.tipo === "circulo" && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-text-primary">CÍRCULO</span>
              )}
            </div>
            {plano.tese ? (
              <>
                <p className="mt-2 font-display text-base leading-snug text-text-primary">{plano.tese}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={etapas.tese?.texto?.trim() === plano.tese}
                    onClick={() => {
                      salvar("tese", plano.tese!, false);
                      document.getElementById("etapa-tese")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {etapas.tese?.texto?.trim() === plano.tese ? "Tese já está na etapa" : "Usar como tese"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      enviarPedido(
                        "Parta da tese oficial do Plano de Ensino para esta lição e me ajude a montar o roteiro: sugira a pergunta de abertura e os 2 ou 3 movimentos do desenvolvimento. Pergunte só o que faltar."
                      )
                    }
                    className="rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    Montar a partir da tese
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-snug text-text-primary">
                  <span className="font-semibold">Capítulos-base:</span> {plano.base}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  O Plano não traz tese para o Módulo 2 — a tese sai do capítulo, pelas suas mãos.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() =>
                      enviarPedido(
                        "Consulte o livro-base na Biblioteca, leia os capítulos indicados no Plano de Ensino para esta lição e me proponha 3 opções de tese (uma frase cada, que a turma possa discordar), dizendo qual eu deveria usar."
                      )
                    }
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white"
                  >
                    Propor teses a partir do capítulo
                  </button>
                </div>
              </>
            )}
          </section>
        )}

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
