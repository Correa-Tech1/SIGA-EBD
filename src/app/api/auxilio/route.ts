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
import type { Mensagem, AnexoMensagem } from "@/lib/auxilio/queries";
import { blocosDoArquivo, type BlocoArquivo } from "@/lib/auxilio/arquivos";
import { textoRoteiro, type EstadoEtapas } from "@/lib/auxilio/mesa";
import { FERRAMENTAS, executarFerramenta, type ArquivoGerado } from "@/lib/auxilio/ferramentas";

const MODELO_FIXO = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
const MAX_TOKENS_FIXO = 6000;
const MAX_RODADAS_FERRAMENTA = 6;
const MAX_ANEXOS_NA_CONVERSA = 5;

// A leitura de arquivos e a Biblioteca podem levar dezenas de segundos.
export const maxDuration = 60;
const TAMANHO_MAX_MENSAGEM = 4000;

export async function POST(request: NextRequest) {
  try {
    await exigirProfessorOuCoordenacao();
  } catch {
    return NextResponse.json({ erro: "Ação restrita a professores e coordenação." }, { status: 403 });
  }

  let corpo: { rascunhoId?: unknown; mensagem?: unknown; anexos?: unknown };
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
  // anexos: só nome + caminho no bucket privado do próprio usuário
  const anexosNovos: AnexoMensagem[] = Array.isArray(corpo.anexos)
    ? (corpo.anexos as unknown[])
        .filter(
          (a): a is AnexoMensagem =>
            !!a && typeof (a as AnexoMensagem).nome === "string" && typeof (a as AnexoMensagem).caminho === "string"
        )
        .slice(0, MAX_ANEXOS_NA_CONVERSA)
    : [];
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
  const etapasSalvas = ((rascunho.conteudo as { etapas?: EstadoEtapas } | null)?.etapas ?? null) as EstadoEtapas | null;
  const { data: preparo } = await supabase
    .from("preparos")
    .select("id, titulo, data")
    .eq("rascunho_id", rascunhoId)
    .maybeSingle();
  const contextoBase = await montarContextoConteudo(rascunho.aula_id, rascunho.modulo_id);
  const contexto = preparo
    ? `${contextoBase}\nAula em preparo: "${preparo.titulo}" (domingo ${preparo.data})\n\nROTEIRO ATUAL DO PROFESSOR (o que ele já escreveu; trate como a base da conversa e não peça de novo o que já está aqui):\n${textoRoteiro(etapasSalvas ?? {})}`
    : contextoBase;

  const anthropic = new Anthropic({ apiKey: chaveApi });

  // Arquivos (do bucket privado do usuário) -> blocos de conteúdo. A RLS do
  // Storage só entrega o que está na pasta da própria pessoa.
  async function blocosDosAnexos(anexos: AnexoMensagem[]): Promise<BlocoArquivo[]> {
    const blocos: BlocoArquivo[] = [];
    for (const anexo of anexos) {
      const { data: blob, error } = await supabase.storage.from("auxilio").download(anexo.caminho);
      if (error || !blob) {
        blocos.push({ type: "text", text: `(não consegui abrir o anexo "${anexo.nome}")` });
        continue;
      }
      try {
        blocos.push(...(await blocosDoArquivo(anexo.nome, new Uint8Array(await blob.arrayBuffer()))));
      } catch (e) {
        blocos.push({ type: "text", text: `(anexo "${anexo.nome}" ignorado: ${e instanceof Error ? e.message : "erro"})` });
      }
    }
    return blocos;
  }

  // Reenvia os anexos das mensagens anteriores (os mais recentes) para o modelo não "esquecer" o arquivo.
  let restante = MAX_ANEXOS_NA_CONVERSA - anexosNovos.length;
  const mensagensApi: Anthropic.MessageParam[] = [];
  for (let i = historicoAnterior.length - 1; i >= 0; i--) {
    const m = historicoAnterior[i];
    let conteudo: Anthropic.MessageParam["content"] = m.texto;
    if (m.role === "user" && m.anexos?.length && restante > 0) {
      const usar = m.anexos.slice(0, restante);
      restante -= usar.length;
      conteudo = [...(await blocosDosAnexos(usar)), { type: "text", text: m.texto }];
    }
    mensagensApi.unshift({ role: m.role, content: conteudo });
  }
  mensagensApi.push({
    role: "user",
    content: [...(await blocosDosAnexos(anexosNovos)), { type: "text", text: mensagem }],
  });

  const sistema = `${METODO_SISTEMA}

---
CAPACIDADES NESTA CONVERSA:
- O professor pode anexar PDF, DOCX, PPTX e imagens; você os recebe no corpo da mensagem.
- Você tem acesso à Biblioteca da EBD (livros, materiais institucionais e aulas de outros professores) pelas ferramentas listar_biblioteca e ler_material. Consulte-a quando ajudar (ex.: o livro-base do módulo) e cite o título do material que usou. Não invente o que não leu.
- Você GERA slides em PowerPoint editável com a ferramenta gerar_slides. Regras:
  1. Antes de gerar, alinhe com o professor o conteúdo (tese, pergunta de abertura, textos bíblicos). Se ele já deu o conteúdo, gere direto e depois pergunte o que ajustar.
  2. Use o estilo visual da EBD: um pensamento por slide, frases curtas, alternância de tema escuro/claro, cards para comparações, um slide 'imagem' onde o professor colará foto/vídeo, e fechamento com a pergunta que fica.
  3. O PRIMEIRO slide é sempre a 'capa' com o TÍTULO da aula (kicker: 'LIÇÃO N · TÍTULO CURTO'; rodapé: turma · módulo · tema).
  4. Texto bíblico: nunca invente. Use exatamente o texto que o professor mandou ou que está na Biblioteca; se não tiver, deixe um slide de versículo com a referência e avise que ele precisa colar o texto.
  5. Notas do orador (campo 'nota') são bem-vindas: o que dizer e a pergunta que 'cerca'.
- Depois de gerar, responda em texto curto: o que montou, a ordem dos slides e o que o professor precisa completar.

---
CONTEÚDO DO SEMESTRE (esta aula/rascunho específico):
${contexto}`;

  const sessaoAtual = await exigirProfessorOuCoordenacao();
  const ctxFerramentas = { pessoaId: sessaoAtual.pessoaId ?? "", gerados: [] as ArquivoGerado[] };
  let resposta: Anthropic.Message;
  try {
    let rodada = 0;
    for (;;) {
      resposta = await anthropic.messages.create({
        model: MODELO_FIXO,
        max_tokens: MAX_TOKENS_FIXO,
        system: sistema,
        tools: FERRAMENTAS,
        messages: mensagensApi,
      });
      if (resposta.stop_reason !== "tool_use" || rodada >= MAX_RODADAS_FERRAMENTA) break;
      rodada += 1;
      mensagensApi.push({ role: "assistant", content: resposta.content });
      const resultados: Anthropic.ToolResultBlockParam[] = [];
      for (const bloco of resposta.content) {
        if (bloco.type !== "tool_use") continue;
        const saida = await executarFerramenta(bloco.name, (bloco.input ?? {}) as Record<string, unknown>, ctxFerramentas);
        resultados.push({ type: "tool_result", tool_use_id: bloco.id, content: saida });
      }
      mensagensApi.push({ role: "user", content: resultados });
    }
  } catch (erroIA) {
    const detalhe = erroIA instanceof Error ? erroIA.message : "erro desconhecido";
    return NextResponse.json({ erro: `Falha ao consultar a IA: ${detalhe}` }, { status: 502 });
  }

  const textoResposta =
    resposta.content
      .map((bloco) => (bloco.type === "text" ? bloco.text : ""))
      .join("\n")
      .trim() || "Não consegui concluir a resposta (muitas consultas à Biblioteca). Pode reformular ou ser mais específico?";

  const novoHistorico: Mensagem[] = [
    ...historicoAnterior,
    { role: "user", texto: mensagem, ...(anexosNovos.length ? { anexos: anexosNovos } : {}) },
    { role: "assistant", texto: textoResposta, ...(ctxFerramentas.gerados.length ? { arquivos: ctxFerramentas.gerados } : {}) },
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
    .update({ conteudo: { ...((rascunho.conteudo as Record<string, unknown> | null) ?? {}), historico: novoHistorico }, titulo: tituloNovo })
    .eq("id", rascunhoId);

  if (preparo && ctxFerramentas.gerados.length) {
    await supabase.from("preparos").update({ slides_gerados: true }).eq("id", preparo.id);
  }

  return NextResponse.json({ resposta: textoResposta, arquivos: ctxFerramentas.gerados });
}
