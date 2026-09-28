// Leitura de semestres / turmas / módulos — a "espinha dorsal" que Frequência,
// Biblioteca e Escalas & Avisos compartilham. Fica num lib próprio (em vez de
// duplicado dentro de cada pilar) porque os três pilares picam a mesma árvore
// semestre → turma → módulo.
import { createClient } from "@/lib/supabase/server";

export interface Semestre {
  id: string;
  ano: number;
  periodo: 1 | 2;
  data_inicio: string | null;
  data_fim: string | null;
  ativo: boolean;
}

export interface Turma {
  id: string;
  semestre_id: string;
  nome: string;
  titulo: string | null;
}

export interface Modulo {
  id: string;
  turma_id: string;
  numero: 1 | 2;
  tema: string | null;
  livro_base: string | null;
  data_inicio: string | null;
  data_fim: string | null;
}

export async function listarSemestres(): Promise<Semestre[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("semestres")
    .select("id, ano, periodo, data_inicio, data_fim, ativo")
    .order("ano", { ascending: false })
    .order("periodo", { ascending: false });
  return (data ?? []) as Semestre[];
}

export async function semestreAtivo(): Promise<Semestre | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("semestres")
    .select("id, ano, periodo, data_inicio, data_fim, ativo")
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();
  return (data as Semestre | null) ?? null;
}

export async function listarTurmas(): Promise<Turma[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("turmas")
    .select("id, semestre_id, nome, titulo")
    .order("nome");
  return (data ?? []) as Turma[];
}

export async function buscarTurma(turmaId: string): Promise<Turma | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("turmas")
    .select("id, semestre_id, nome, titulo")
    .eq("id", turmaId)
    .maybeSingle();
  return (data as Turma | null) ?? null;
}

export async function listarModulos(turmaId: string): Promise<Modulo[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("modulos")
    .select("id, turma_id, numero, tema, livro_base, data_inicio, data_fim")
    .eq("turma_id", turmaId)
    .order("numero");
  return (data ?? []) as Modulo[];
}
