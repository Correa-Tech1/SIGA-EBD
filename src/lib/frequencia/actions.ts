"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirCoordenacao, exigirProfessorOuCoordenacao } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface EstadoForm {
  erro?: string;
  sucesso?: string;
}

// Cria uma aula (uma data de encontro) dentro de um módulo. Professor OU
// coordenação podem chamar — depois da migration 0004, o RLS deixa o
// professor inserir aula só dentro da própria turma; se ele tentar em
// módulo de outra turma, o INSERT no banco falha (with check), não só a UI.
export async function criarAula(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  try {
    await exigirProfessorOuCoordenacao();
  } catch {
    return { erro: "Ação restrita a professores e coordenação." };
  }

  const moduloId = String(formData.get("moduloId") ?? "");
  const data = String(formData.get("data") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();

  if (!moduloId || !data) {
    return { erro: "Escolha o módulo e a data da aula." };
  }

  const supabase = createClient();
  const { data: criada, error } = await supabase
    .from("aulas")
    .insert({
      modulo_id: moduloId,
      data,
      titulo: titulo || null,
    })
    .select("id")
    .single();

  if (error || !criada) {
    return { erro: `Falha ao criar aula: ${error?.message ?? "sem retorno"}` };
  }

  revalidatePath("/frequencia");
  revalidatePath("/minha-turma");

  // Formulário "Lançar novo domingo": cai direto na chamada da data criada.
  const voltarPara = String(formData.get("voltarPara") ?? "");
  const turmaId = String(formData.get("turmaId") ?? "");
  if (turmaId && /^\/[a-z0-9-]+$/i.test(voltarPara)) {
    redirect(`${voltarPara}?turma=${encodeURIComponent(turmaId)}&aula=${criada.id}#chamada`);
  }
  return { sucesso: "Aula criada." };
}

// Lança/atualiza a presença de todo mundo na lista de uma vez (upsert em
// lote). `pessoaIds` chega como campo oculto (lista separada por vírgula)
// porque checkbox desmarcado simplesmente não vem no FormData — sem essa
// lista não teríamos como distinguir "ausente" de "nunca existiu no form".
export async function lancarPresencas(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  let sessao;
  try {
    sessao = await exigirProfessorOuCoordenacao();
  } catch {
    return { erro: "Ação restrita a professores e coordenação." };
  }

  const aulaId = String(formData.get("aulaId") ?? "");
  const pessoaIdsRaw = String(formData.get("pessoaIds") ?? "");
  const pessoaIds = pessoaIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);

  if (!aulaId || pessoaIds.length === 0) {
    return { erro: "Nenhuma pessoa na lista de chamada desta turma ainda." };
  }

  const linhas = pessoaIds.map((pessoaId) => ({
    aula_id: aulaId,
    pessoa_id: pessoaId,
    status: (formData.get(`presente_${pessoaId}`) === "on" ? "presente" : "ausente") as
      | "presente"
      | "ausente",
    registrado_por: sessao.pessoaId,
  }));

  const supabase = createClient();
  const { error } = await supabase
    .from("presencas")
    .upsert(linhas, { onConflict: "aula_id,pessoa_id" });

  if (error) {
    return { erro: `Falha ao lançar presença: ${error.message}` };
  }

  revalidatePath("/frequencia");
  revalidatePath("/minha-turma");
  return { sucesso: "Presença lançada." };
}

// A partir daqui: gestão de matrícula (quem está na turma). Só a
// coordenação decide isso — a policy `matriculas_professor_ve_propria_turma`
// no RLS só dá SELECT ao professor, então mesmo que a UI dele chamasse isso
// por engano, o banco recusaria o INSERT/UPDATE.
export async function matricularExistente(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const turmaId = String(formData.get("turmaId") ?? "");
  const pessoaId = String(formData.get("pessoaId") ?? "");

  if (!turmaId || !pessoaId) {
    return { erro: "Escolha a pessoa para matricular." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("matriculas")
    .upsert({ turma_id: turmaId, pessoa_id: pessoaId, ativo: true }, { onConflict: "turma_id,pessoa_id" });

  if (error) {
    return { erro: `Falha ao matricular: ${error.message}` };
  }

  revalidatePath("/frequencia");
  revalidatePath("/minha-turma");
  return { sucesso: "Pessoa matriculada." };
}

export async function matricularNovaPessoa(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const turmaId = String(formData.get("turmaId") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();

  if (!turmaId || !nome) {
    return { erro: "Informe o nome da pessoa." };
  }

  const supabase = createClient();
  const { data: pessoa, error: erroPessoa } = await supabase
    .from("pessoas")
    .insert({ nome, tipo: "membro", telefone: telefone || null })
    .select("id")
    .single();

  if (erroPessoa || !pessoa) {
    return { erro: `Falha ao cadastrar pessoa: ${erroPessoa?.message ?? "erro desconhecido"}` };
  }

  const { error: erroMatricula } = await supabase
    .from("matriculas")
    .insert({ turma_id: turmaId, pessoa_id: pessoa.id, ativo: true });

  if (erroMatricula) {
    return { erro: `Pessoa cadastrada, mas falha ao matricular: ${erroMatricula.message}` };
  }

  revalidatePath("/frequencia");
  revalidatePath("/minha-turma");
  return { sucesso: `${nome} cadastrado(a) e matriculado(a).` };
}

export async function desmatricular(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const matriculaId = String(formData.get("matriculaId") ?? "");
  if (!matriculaId) {
    return { erro: "Matrícula inválida." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("matriculas")
    .update({ ativo: false })
    .eq("id", matriculaId);

  if (error) {
    return { erro: `Falha ao remover matrícula: ${error.message}` };
  }

  revalidatePath("/frequencia");
  revalidatePath("/minha-turma");
  return { sucesso: "Matrícula removida." };
}
