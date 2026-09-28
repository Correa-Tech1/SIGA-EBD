"use server";

// CRUD de semestre/turma/módulo. Só a coordenação monta a estrutura de cada
// semestre — por isso todo action aqui abre com exigirCoordenacao() e usa o
// cliente de SESSÃO (createClient), nunca o admin: a policy
// "*_coordenacao_escreve" do RLS (0002_rls.sql) já libera escrita total pra
// quem é coordenação, então não há nenhuma razão pra tocar a service_role
// key aqui — outra aplicação direta da lição do Laudo Técnico.
import { revalidatePath } from "next/cache";
import { exigirCoordenacao } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export interface EstadoForm {
  erro?: string;
  sucesso?: string;
}

export async function criarSemestre(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const ano = Number(formData.get("ano"));
  const periodo = Number(formData.get("periodo"));
  const ativo = formData.get("ativo") === "on";

  if (!ano || (periodo !== 1 && periodo !== 2)) {
    return { erro: "Informe um ano e um período (1 ou 2) válidos." };
  }

  const supabase = createClient();

  // Só um semestre ativo por vez — evita telas de professor/aluno mostrando
  // dois semestres "correntes" ao mesmo tempo.
  if (ativo) {
    await supabase.from("semestres").update({ ativo: false }).eq("ativo", true);
  }

  const { error } = await supabase.from("semestres").insert({ ano, periodo, ativo });

  if (error) {
    const duplicado = error.message.toLowerCase().includes("duplicate");
    return {
      erro: duplicado
        ? `Já existe o semestre ${ano}/${periodo}.`
        : `Falha ao criar semestre: ${error.message}`,
    };
  }

  revalidatePath("/frequencia");
  revalidatePath("/escalas");
  return { sucesso: `Semestre ${ano}/${periodo} criado.` };
}

export async function criarTurma(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const semestreId = String(formData.get("semestreId") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();

  if (!semestreId || !nome) {
    return { erro: "Escolha o semestre e informe o nome da turma." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("turmas").insert({
    semestre_id: semestreId,
    nome,
    titulo: titulo || null,
  });

  if (error) {
    return { erro: `Falha ao criar turma: ${error.message}` };
  }

  revalidatePath("/frequencia");
  revalidatePath("/escalas");
  return { sucesso: `Turma "${nome}" criada.` };
}

export async function criarModulo(
  _estadoAnterior: EstadoForm,
  formData: FormData
): Promise<EstadoForm> {
  try {
    await exigirCoordenacao();
  } catch {
    return { erro: "Ação restrita à coordenação." };
  }

  const turmaId = String(formData.get("turmaId") ?? "");
  const numero = Number(formData.get("numero"));
  const tema = String(formData.get("tema") ?? "").trim();
  const livroBase = String(formData.get("livroBase") ?? "").trim();
  const dataInicio = String(formData.get("dataInicio") ?? "").trim();
  const dataFim = String(formData.get("dataFim") ?? "").trim();

  if (!turmaId || (numero !== 1 && numero !== 2)) {
    return { erro: "Escolha a turma e o número do módulo (1 ou 2)." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("modulos").insert({
    turma_id: turmaId,
    numero,
    tema: tema || null,
    livro_base: livroBase || null,
    data_inicio: dataInicio || null,
    data_fim: dataFim || null,
  });

  if (error) {
    const duplicado = error.message.toLowerCase().includes("duplicate");
    return {
      erro: duplicado
        ? `Esta turma já tem um módulo ${numero}.`
        : `Falha ao criar módulo: ${error.message}`,
    };
  }

  revalidatePath("/frequencia");
  revalidatePath("/biblioteca");
  return { sucesso: `Módulo ${numero} criado.` };
}
