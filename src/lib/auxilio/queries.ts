import { createClient } from "@/lib/supabase/server";
import { listarMinhasTurmasIds } from "@/lib/frequencia/queries";
import { listarModulos, listarTurmas } from "@/lib/estrutura/queries";
import { listarAulasDosModulos } from "@/lib/frequencia/queries";

export interface AnexoMensagem {
  nome: string;
  caminho: string; // no bucket privado 'auxilio'
}

export interface Mensagem {
  role: "user" | "assistant";
  texto: string;
  anexos?: AnexoMensagem[];
  // arquivos gerados pela IA nesta resposta (bucket privado 'auxilio')
  arquivos?: AnexoMensagem[];
}

export interface RascunhoResumo {
  id: string;
  titulo: string;
  atualizado_em: string;
  modulo_id: string | null;
  aula_id: string | null;
}

export interface Rascunho extends RascunhoResumo {
  conteudo: { historico?: Mensagem[] };
}

// Sem filtro de pessoa_id explícito de propósito: a policy `rascunhos_dono_all`
// (0002_rls.sql) já garante que ninguém, nem coordenação, vê rascunho de
// outra pessoa — o filtro "só o meu" é o próprio banco, não este código.
export async function listarRascunhos(): Promise<RascunhoResumo[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("rascunhos")
    .select("id, titulo, atualizado_em, modulo_id, aula_id")
    .order("atualizado_em", { ascending: false });
  return (data ?? []) as RascunhoResumo[];
}

export async function buscarRascunho(id: string): Promise<Rascunho | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("rascunhos")
    .select("id, titulo, atualizado_em, modulo_id, aula_id, conteudo")
    .eq("id", id)
    .maybeSingle();
  return (data as Rascunho | null) ?? null;
}

export interface AulaOpcao {
  id: string;
  label: string;
}

// Lista de aulas pra associar a um novo rascunho ("Conteúdo do Semestre").
// Professor só vê as próprias (minhas_turmas()); coordenação, todas — ela
// pode espiar o Auxílio ao Professor pra revisar como está respondendo.
export async function listarAulasParaEscolher(souCoordenacao: boolean): Promise<AulaOpcao[]> {
  const turmaIds = souCoordenacao
    ? (await listarTurmas()).map((t) => t.id)
    : await listarMinhasTurmasIds();

  if (turmaIds.length === 0) return [];

  const modulosPorTurma = await Promise.all(turmaIds.map((id) => listarModulos(id)));
  const moduloIds = modulosPorTurma.flat().map((m) => m.id);
  const aulas = await listarAulasDosModulos(moduloIds);

  return aulas
    .map((a) => ({
      id: a.id,
      label: `${new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR")}${
        a.titulo ? ` · ${a.titulo}` : ""
      }`,
    }))
    .sort((a, b) => (a.label < b.label ? 1 : -1));
}
