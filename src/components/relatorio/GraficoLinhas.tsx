// Gráfico de linhas em SVG puro (renderiza no servidor, imprime bem).
// Eixo X em escala de tempo: cada domingo fica na posição real, então uma
// semana sem aula aparece como intervalo. Uma cor por série (turma).
import { fmtDataCurta } from "@/lib/relatorio/motor";

export interface SerieLinha {
  nome: string;
  cor: string;
  pontos: { data: string; valor: number }[];
}

const dia = (iso: string) => Date.parse(iso + "T00:00:00Z") / 86_400_000;

export function GraficoLinhas({
  series,
  descricao,
  altura = 260,
}: {
  series: SerieLinha[];
  descricao: string;
  altura?: number;
}) {
  const datas = [...new Set(series.flatMap((s) => s.pontos.map((p) => p.data)))].sort();
  if (datas.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
        Ainda não há chamadas lançadas para montar o gráfico.
      </p>
    );
  }

  const largura = 760;
  const mEsq = 36;
  const mDir = 24;
  const topo = 20;
  const rodape = 34;
  const plotH = altura - topo - rodape;
  const plotW = largura - mEsq - mDir;

  const maximo = Math.max(...series.flatMap((s) => s.pontos.map((p) => p.valor)), 1);
  const teto = maximo <= 5 ? 5 : Math.ceil(maximo / 5) * 5;
  const d0 = dia(datas[0]);
  const d1 = dia(datas[datas.length - 1]);
  const x = (iso: string) => (d1 === d0 ? mEsq + plotW / 2 : mEsq + ((dia(iso) - d0) / (d1 - d0)) * plotW);
  const y = (v: number) => topo + plotH - (v / teto) * plotH;
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(teto * f));

  return (
    <figure className="rounded-xl border border-border bg-surface p-5 print:break-inside-avoid">
      <svg role="img" aria-label={descricao} viewBox={`0 0 ${largura} ${altura}`} className="h-auto w-full">
        <title>{descricao}</title>
        {marcas.map((m) => (
          <g key={m}>
            <line x1={mEsq} x2={largura - mDir} y1={y(m)} y2={y(m)} stroke="#E8EEF0" strokeWidth={1} />
            <text x={mEsq - 8} y={y(m) + 4} textAnchor="end" fontSize={11} fill="#5B6B76">
              {m}
            </text>
          </g>
        ))}
        {datas.map((d) => (
          <text key={d} x={x(d)} y={topo + plotH + 20} textAnchor="middle" fontSize={11} fill="#5B6B76">
            {fmtDataCurta(d)}
          </text>
        ))}
        {series.map((s) => {
          const pts = [...s.pontos].sort((a, b) => a.data.localeCompare(b.data));
          return (
            <g key={s.nome}>
              <polyline
                fill="none"
                stroke={s.cor}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={pts.map((p) => `${x(p.data)},${y(p.valor)}`).join(" ")}
              />
              {pts.map((p) => (
                <g key={p.data}>
                  <circle cx={x(p.data)} cy={y(p.valor)} r={4.5} fill="#fff" stroke={s.cor} strokeWidth={2.5}>
                    <title>{`${s.nome} · ${fmtDataCurta(p.data)}: ${p.valor}`}</title>
                  </circle>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-5 text-xs text-text-secondary">
        {series.map((s) => (
          <span key={s.nome} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-1 w-5 rounded" style={{ background: s.cor }} />
            {s.nome}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
