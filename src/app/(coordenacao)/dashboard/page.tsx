import { getSessaoAtual } from "@/lib/auth/session";
import {
  seriesPorTurma,
  serieGeral,
  resumir,
  corDaTurma,
} from "@/lib/frequencia/metricas";
import { GraficoFrequencia } from "@/components/dashboard/GraficoFrequencia";

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarNumero(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

// Painel inicial da coordenação. Sem turma selecionada mostra o geral (todas
// as turmas empilhadas por domingo); com `?turma=<id>` mostra só a turma.
// Referência visual: board "Main.dc.html" nos mockups (Design canvas).
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { turma?: string };
}) {
  const [sessao, series] = await Promise.all([getSessaoAtual(), seriesPorTurma()]);

  const turmaAtual = series.find((s) => s.turma.id === searchParams.turma);
  const pontos = turmaAtual ? turmaAtual.pontos : serieGeral(series);
  const resumo = resumir(pontos);

  const datas = pontos.map((p) => p.data);
  const seriesGrafico = turmaAtual
    ? [
        {
          nome: turmaAtual.turma.nome,
          cor: corDaTurma(turmaAtual.turma.nome),
          valores: pontos.map((p) => p.presentes),
        },
      ]
    : series.map((s) => {
        const porData = new Map(s.pontos.map((p) => [p.data, p.presentes]));
        return {
          nome: s.turma.nome,
          cor: corDaTurma(s.turma.nome),
          valores: datas.map((d) => porData.get(d) ?? 0),
        };
      });

  const titulo = turmaAtual
    ? `${turmaAtual.turma.nome}${turmaAtual.turma.titulo ? ` · ${turmaAtual.turma.titulo}` : ""}`
    : "Geral — todas as turmas";

  const atalhos = [
    { href: "/frequencia", titulo: "Frequência", descricao: "Domingos, lista de presentes e chamada." },
    { href: "/biblioteca", titulo: "Biblioteca", descricao: "Material oficial de cada módulo." },
    { href: "/escalas", titulo: "Escalas & Avisos", descricao: "Quem dá aula quando, e o mural." },
    { href: "/professores", titulo: "Professores", descricao: "Criar e resetar contas." },
  ];

  const kpis = [
    { rotulo: "Média por domingo", valor: formatarNumero(resumo.media) },
    {
      rotulo: "Último domingo",
      valor: resumo.ultimo ? String(resumo.ultimo.presentes) : "—",
      detalhe: resumo.ultimo ? formatarData(resumo.ultimo.data) : undefined,
    },
    {
      rotulo: "Melhor domingo",
      valor: resumo.melhor ? String(resumo.melhor.presentes) : "—",
      detalhe: resumo.melhor ? formatarData(resumo.melhor.data) : undefined,
    },
    { rotulo: "Domingos com chamada", valor: String(resumo.domingos) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Olá, {sessao.nome}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {series.length === 0
            ? "Nenhuma turma cadastrada ainda — comece pela Frequência."
            : "Frequência do semestre"}
        </p>
      </div>

      {series.length > 0 && (
        <section aria-labelledby="titulo-frequencia" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <a
              href="/dashboard"
              aria-current={!turmaAtual ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm ${
                !turmaAtual
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-text-secondary"
              }`}
            >
              Geral
            </a>
            {series.map((s) => (
              <a
                key={s.turma.id}
                href={`/dashboard?turma=${s.turma.id}`}
                aria-current={turmaAtual?.turma.id === s.turma.id ? "page" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm ${
                  turmaAtual?.turma.id === s.turma.id
                    ? "bg-primary text-white"
                    : "border border-border bg-surface text-text-secondary"
                }`}
              >
                {s.turma.nome}
              </a>
            ))}
          </div>

          <h2 id="titulo-frequencia" className="font-display text-lg font-semibold text-primary">
            {titulo}
          </h2>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.rotulo} className="rounded-xl border border-border bg-surface p-4">
                <div className="text-xs text-text-secondary">{k.rotulo}</div>
                <div className="mt-1 font-display text-2xl font-semibold text-primary">
                  {k.valor}
                </div>
                {k.detalhe && <div className="text-xs text-text-secondary">{k.detalhe}</div>}
              </div>
            ))}
          </div>

          <GraficoFrequencia
            datas={datas}
            series={seriesGrafico}
            media={resumo.media}
            descricao={`Presentes por domingo — ${titulo}. Média de ${formatarNumero(resumo.media)}.`}
          />
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {atalhos.map((a) => (
          <a
            key={a.href}
            href={a.href}
            className="rounded-xl border border-border bg-surface p-5 hover:border-primary"
          >
            <div className="font-display text-base font-semibold text-primary">{a.titulo}</div>
            <div className="mt-1 text-sm text-text-secondary">{a.descricao}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
