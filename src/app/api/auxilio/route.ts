// Endpoint do Auxílio ao Professor — o único lugar do sistema que chama a
// API da Anthropic. Segue o padrão do Correa Cash (api/chat.js), citado
// como o CERTO no Laudo Técnico da Correa Tech, ponto a ponto:
//   1. Sessão exigida ANTES de gastar qualquer chamada de IA (linha abaixo).
//   2. Modelo, max_tokens (e a ausência de "tools") fixos aqui no servidor —
//      nunca aceitos do corpo da requisição do navegador.
//   3. O que VEM do cliente é só `rascunhoId` e `mensagem`, e mesmo assim
//      validado (tamanho, presença) antes de tocar a Anthropic ou o banco.
// Isso é o oposto exato dos 7 endpoints do COSMO/JACKBOY/Shema.AI que o
// laudo encontrou sem checagem nenhuma, queimando a chave paga à toa.
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { exigirProfessorOuCoordenacao } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { METODO_SISTEMA } from "@/lib/auxilio/metodologia";
import { montarContextoConteudo } from "@/lib/auxilio/contexto";
import type { Mensagem } from "@/lib/auxilio/queries";

const MODELO_FIXO = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
const MAX_TOKENS_FIXO = 1500;
const TAMANHO_MAX_MENSAGEM = 4000;

export async function POST(request: NextRequest) {
  try {
    await exigirProfessorOuCoordenacao();
  } catch {
    return NextResponse.json({ erro: "Ação restrita a professores e coordenação." }, { status: 403 });
  }

  let corpo: { rascunhoId?: unknown; mensagem?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const rascunhoId = typeof corpo.rascunhoId === "string" ? corpo.rascunhoId : "";
  const mensagem = typeof corpo.mensagem === "string" ? corpo.mensagem.trim() : "";

  if (!rascunhoId || !mensagem) {
    return NextResponse.json({ erro: "Informe o rascunho e a mensagem." }, { status: 400 });
  }
  if (mensagem.length > TAMANHO_MAX_MENSAGEM) {
    return NextResponse.json(
      { erro: `Mensagem muito longa (máximo ${TAMANHO_MAX_MENSAGEM} caracteres).` },
      { status: 400 }
    );
  }

  const chaveApi = process.env.ANTHROPIC_API_KEY;
  if (!chaveApi) {
    return NextResponse.json(
      { erro: "ANTHROPIC_API_KEY não configurada no servidor." },
      { status: 500 }
    );
  }

  const supabase = createClient();

  // Este SELECT É a checagem de posse: a policy `rascunhos_dono_all`
  // (0002_rls.sql) só devolve linha se `pessoa_id = current_pessoa_id()` —
  // vazio aqui significa "não existe" OU "não é seu", sem distinguir os
  // dois de propósito (não vazamos existência de rascunho alheio).
  const { data: rascunho } = await supabase
    .from("rascunhos")
    .select("id, modulo_id, aula_id, titulo, conteudo")
    .eq("id", rascunhoId)
    .maybeSingle();

  if (!rascunho) {
    return NextResponse.json({ erro: "Rascunho não encontrado." }, { status: 404 });
  }

  const historicoAnterior = ((rascunho.conteudo as { historico?: Mensagem[] } | null)?.historico ?? []);
  const contexto = await montarContextoConteudo(rascunho.aula_id, rascunho.modulo_id);

  const anthropic = new Anthropic({ apiKey: chaveApi });

  let resposta;
  try {
    resposta = await anthropic.messages.create({
      model: MODELO_FIXO,
      max_tokens: MAX_TOKENS_FIXO,
      system: `${METODO_SISTEMA}\n\n---\nCONTEÚDO DO SEMESTRE (esta aula/rascunho específico):\n${contexto}`,
      messages: [
        ...historicoAnterior.map((m) => ({ role: m.role, content: m.texto })),
        { role: "user" as const, content: mensagem },
      ],
    });
  } catch (erroIA) {
    const detalhe = erroIA instanceof Error ? erroIA.message : "erro desconhecido";
    return NextResponse.json({ erro: `Falha ao consultar a IA: ${detalhe}` }, { status: 502 });
  }

  const textoResposta = resposta.content
    .map((bloco) => (bloco.type === "text" ? bloco.text : ""))
    .join("\n")
    .trim();

  const novoHistorico: Mensagem[] = [
    ...historicoAnterior,
    { role: "user", texto: mensagem },
    { role: "assistant", texto: textoResposta },
  ];

  // Título automático só na primeira troca (rascunho recém-criado, ainda
  // com o nome genérico) — depois disso o professor pode ter renomeado, ou
  // simplesmente já faz sentido manter o que tem.
  const tituloNovo =
    rascunho.titulo === "Novo rascunho" && historicoAnterior.length === 0
      ? mensagem.slice(0, 60)
      : rascunho.titulo;

  await supabase
    .from("rascunhos")
    .update({ conteudo: { historico: novoHistorico }, titulo: tituloNovo })
    .eq("id", rascunhoId);

  return NextResponse.json({ resposta: textoResposta });
}
