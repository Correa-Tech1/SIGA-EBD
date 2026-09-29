// Carrega do banco tudo que o motor de métricas precisa. Só a coordenação
// consegue ler `pessoas` inteira (nascimento, gênero) — o RLS garante isso;
// quem chamar isto sem ser coordenação recebe listas vazias.
import { createClient } from "@/lib/supabase/server";
import { semestreAtivo, listarTurmas, type Semestre } from "@/lib/estrutura/queries";
import {
  montarRelatorio,
  type EntradaAula,
  type EntradaPessoa,
  type EntradaPresenca,
  type RelatorioGeral,
} from "./motor";

const PAGINA = 1000;

async function lerTudo<T>(
  buscar: (de: number, ate: number) => PromiseLike<{ data: T[] | null }>
): Promise<T[]> {
  const todas: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data } = await buscar(de, de + PAGINA - 1);
    const linhas = data ?? [];
    todas.push(...linhas);
    if (linhas.length < PAGINA) break;
  }
  return todas;
}

export function hojeIso(): string {
  // data de hoje no fuso de Brasília (o servidor roda em UTC)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export async function carregarRelatorio(): Promise<{
  relatorio: RelatorioGeral;
  semestre: Semestre | null;
}> {
  const supabase = createClient();
  const [semestre, todasTurmas] = await Promise.all([semestreAtivo(), listarTurmas()]);
  const turmas = semestre ? todasTurmas.filter((t) => t.semestre_id === semestre.id) : todasTurmas;

  const [modulos, aulasBrutas, presencasBrutas, pessoasBrutas] = await Promise.all([
    lerTudo((de, ate) => supabase.from("modulos").select("id, turma_id").order("id").range(de, ate)),
    lerTudo((de, ate) => supabase.from("aulas").select("id, modulo_id, data").order("id").range(de, ate)),
    lerTudo((de, ate) =>
      supabase.from("presencas").select("id, aula_id, pessoa_id, status").order("id").range(de, ate)
    ),
    lerTudo((de, ate) =>
      supabase
        .from("pessoas")
        .select("id, nome, tipo, genero, data_nascimento")
        .order("id")
        .range(de, ate)
    ),
  ]);

  const turmaIds = new Set(turmas.map((t) => t.id));
  const turmaDoModulo = new Map(modulos.map((m) => [m.id, m.turma_id]));

  // aula "tem chamada" = existe ao menos uma linha em presencas
  const comChamada = new Set(presencasBrutas.map((p) => p.aula_id));
  const aulas: EntradaAula[] = [];
  for (const a of aulasBrutas) {
    const turmaId = turmaDoModulo.get(a.modulo_id);
    if (!turmaId || !turmaIds.has(turmaId) || !comChamada.has(a.id)) continue;
    aulas.push({ id: a.id, turmaId, data: a.data });
  }
  const aulaIds = new Set(aulas.map((a) => a.id));

  const presencas: EntradaPresenca[] = presencasBrutas
    .filter((p) => p.status === "presente" && aulaIds.has(p.aula_id))
    .map((p) => ({ aulaId: p.aula_id, pessoaId: p.pessoa_id }));

  const pessoas: EntradaPessoa[] = pessoasBrutas.map((p) => ({
    id: p.id,
    nome: p.nome,
    tipo: p.tipo,
    genero: p.genero,
    nascimento: p.data_nascimento,
  }));

  return {
    relatorio: montarRelatorio({
      turmas: turmas.map((t) => ({ id: t.id, nome: t.nome, titulo: t.titulo })),
      aulas,
      presencas,
      pessoas,
      hoje: hojeIso(),
    }),
    semestre,
  };
}
