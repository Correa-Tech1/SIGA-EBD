import { createClient } from "@/lib/supabase/server";

export interface Material {
  id: string;
  origem: "oficial" | "de_aula";
  modulo_id: string | null;
  aula_id: string | null;
  enviado_por: string | null;
  titulo: string;
  tipo_arquivo: string;
  caminho_arquivo: string;
  categoria: "livro" | "institucional" | "aula";
  turma_id: string | null;
  criado_em: string;
}

// Bucket é público — a URL é só o caminho concatenado, sem precisar de URL
// assinada nem de round-trip ao banco. Mesma convenção de caminho definida
// em supabase/migrations/0005_storage_materiais.sql.
export function urlPublicaMaterial(caminho: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/materiais/${caminho}`;
}

export async function listarMateriaisOficiais(moduloId: string): Promise<Material[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("materiais")
    .select(
      "id, origem, modulo_id, aula_id, enviado_por, titulo, tipo_arquivo, caminho_arquivo, categoria, turma_id, criado_em"
    )
    .eq("origem", "oficial")
    .eq("modulo_id", moduloId)
    .order("criado_em", { ascending: false });
  return (data ?? []) as Material[];
}

export async function listarMateriaisDeAula(aulaId: string): Promise<Material[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("materiais")
    .select(
      "id, origem, modulo_id, aula_id, enviado_por, titulo, tipo_arquivo, caminho_arquivo, categoria, turma_id, criado_em"
    )
    .eq("origem", "de_aula")
    .eq("aula_id", aulaId)
    .order("criado_em", { ascending: false });
  return (data ?? []) as Material[];
}

export type CategoriaMaterial = Material["categoria"];

// Uma prateleira da Biblioteca (livros, institucionais ou aulas), mais nova primeiro.
export async function listarPrateleira(
  categoria: CategoriaMaterial,
  turmaId?: string
): Promise<Material[]> {
  const supabase = createClient();
  let consulta = supabase
    .from("materiais")
    .select(
      "id, origem, modulo_id, aula_id, enviado_por, titulo, tipo_arquivo, caminho_arquivo, categoria, turma_id, criado_em"
    )
    .eq("categoria", categoria)
    .order("criado_em", { ascending: false });
  if (turmaId) consulta = consulta.eq("turma_id", turmaId);
  const { data } = await consulta;
  return (data ?? []) as Material[];
}

// id -> nome (view pública, sem telefone), para "enviado por".
export async function nomesDePessoas(ids: string[]): Promise<Map<string, string>> {
  const nomes = new Map<string, string>();
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return nomes;
  const supabase = createClient();
  for (let i = 0; i < unicos.length; i += 60) {
    const { data } = await supabase.from("pessoas_publicas").select("id, nome").in("id", unicos.slice(i, i + 60));
    for (const p of data ?? []) nomes.set(p.id as string, p.nome as string);
  }
  return nomes;
}
