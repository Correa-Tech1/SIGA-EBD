// Métricas de frequência para o Início (geral e por turma). Tudo é calculado
// a partir de `presencas` com status 'presente'. Só entram domingos que já
// têm chamada lançada (ao menos uma linha em `presencas`) — data futura ou
// aula aberta sem chamada não pode virar barra "zerada" no gráfico.
import { createClient } from "@/lib/supabase/server";
import { listarTurmas, type Turma } from "@/lib/estrutura/queries";

export interface PontoFrequencia {
  data: string; // YYYY-MM-DD
  presentes: number;
}

export interface SerieTurma {
  turma: Turma;
  pontos: PontoFrequencia[]; // ordem cronológica
}

export interface ResumoSerie {
  domingos: number;
  media: number;
  ultimo: PontoFrequencia | null;
  melhor: PontoFrequencia | null;
}

const TAMANHO_PAGINA = 1000;

// O PostgREST devolve no máximo 1000 linhas por consulta; presenças passam
// disso em poucos semestres, então pagina em vez de confiar no limite.
async function lerTudo<T>(
  buscar: (de: number, ate: number) => PromiseLike<{ data: T[] | null }>
): Promise<T[]> {
  const todas: T[] = [];
  for (let de = 0; ; de += TAMANHO_PAGINA) {
    const { data } = await buscar(de, de + TAMANHO_PAGINA - 1);
    const linhas = data ?? [];
    todas.push(...linhas);
    if (linhas.length < TAMANHO_PAGINA) break;
  }
  return todas;
}

export async function seriesPorTurma(): Promise<SerieTurma[]> {
  const supabase = createClient();
  const turmas = await listarTurmas();

  const [modulos, aulas, presencas] = await Promise.all([
    lerTudo((de, ate) =>
      supabase.from("modulos").select("id, turma_id").order("id").range(de, ate)
    ),
    lerTudo((de, ate) =>
      supabase.from("aulas").select("id, modulo_id, data").order("id").range(de, ate)
    ),
    lerTudo((de, ate) =>
      supabase.from("presencas").select("id, aula_id, status").order("id").range(de, ate)
    ),
  ]);

  const turmaPorModulo = new Map(modulos.map((m) => [m.id, m.turma_id]));

  // por aula: quantas linhas de chamada existem e quantas são "presente"
  const porAula = new Map<string, { registros: number; presentes: number }>();
  for (const p of presencas) {
    const atual = porAula.get(p.aula_id) ?? { registros: 0, presentes: 0 };
    atual.registros += 1;
    if (p.status === "presente") atual.presentes += 1;
    porAula.set(p.aula_id, atual);
  }

  return turmas.map((turma) => {
    const pontos: PontoFrequencia[] = [];
    for (const aula of aulas) {
      if (turmaPorModulo.get(aula.modulo_id) !== turma.id) continue;
      const contagem = porAula.get(aula.id);
      if (!contagem || contagem.registros === 0) continue;
      pontos.push({ data: aula.data, presentes: contagem.presentes });
    }
    pontos.sort((a, b) => a.data.localeCompare(b.data));
    return { turma, pontos };
  });
}

// Soma as turmas por data: "quantas pessoas estiveram na EBD naquele domingo".
export function serieGeral(series: SerieTurma[]): PontoFrequencia[] {
  const somaPorData = new Map<string, number>();
  for (const s of series) {
    for (const p of s.pontos) {
      somaPorData.set(p.data, (somaPorData.get(p.data) ?? 0) + p.presentes);
    }
  }
  return [...somaPorData.entries()]
    .map(([data, presentes]) => ({ data, presentes }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export function resumir(pontos: PontoFrequencia[]): ResumoSerie {
  if (pontos.length === 0) {
    return { domingos: 0, media: 0, ultimo: null, melhor: null };
  }
  const total = pontos.reduce((soma, p) => soma + p.presentes, 0);
  const melhor = pontos.reduce((m, p) => (p.presentes > m.presentes ? p : m), pontos[0]);
  return {
    domingos: pontos.length,
    media: total / pontos.length,
    ultimo: pontos[pontos.length - 1],
    melhor,
  };
}

export function corDaTurma(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes("homens")) return "#0E7C86";
  if (n.includes("mulheres")) return "#F2542D";
  if (n.includes("panorama")) return "#F5A623";
  return "#5B6B76";
}
