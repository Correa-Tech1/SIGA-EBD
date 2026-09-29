// Gráfico de barras em SVG puro (sem biblioteca): renderiza no servidor,
// não pesa no navegador e não adiciona dependência. Serve para o Início
// (geral = barras empilhadas por turma; turma = uma série só).
export interface SerieGrafico {
  nome: string;
  cor: string;
  valores: number[]; // um por data, mesma ordem de `datas`
}

function rotuloData(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

function tetoEscala(maximo: number): number {
  if (maximo <= 5) return 5;
  return Math.ceil(maximo / 5) * 5;
}

export function GraficoFrequencia({
  datas,
  series,
  media,
  descricao,
}: {
  datas: string[];
  series: SerieGrafico[];
  media: number;
  descricao: string;
}) {
  if (datas.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
        Ainda não há chamadas lançadas para montar o gráfico.
      </p>
    );
  }

  const larguraBarra = 44;
  const passo = 76;
  const margemEsq = 40;
  const margemDir = 16;
  const topo = 28;
  const alturaPlot = 190;
  const rodape = 34;
  const largura = margemEsq + margemDir + passo * datas.length;
  const altura = topo + alturaPlot + rodape;

  const totais = datas.map((_, i) => series.reduce((s, x) => s + (x.valores[i] ?? 0), 0));
  const teto = tetoEscala(Math.max(...totais, media));
  const y = (valor: number) => topo + alturaPlot - (valor / teto) * alturaPlot;

  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(teto * f));

  return (
    <figure className="rounded-xl border border-border bg-surface p-5">
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label={descricao}
          viewBox={`0 0 ${largura} ${altura}`}
          className="h-auto w-full min-w-[420px]"
          style={{ maxWidth: Math.max(largura, 520) * 1.6 }}
        >
          <title>{descricao}</title>

          {marcas.map((m) => (
            <g key={m}>
              <line
                x1={margemEsq}
                x2={largura - margemDir}
                y1={y(m)}
                y2={y(m)}
                stroke="#E8EEF0"
                strokeWidth={1}
              />
              <text x={margemEsq - 8} y={y(m) + 4} textAnchor="end" fontSize={11} fill="#5B6B76">
                {m}
              </text>
            </g>
          ))}

          {datas.map((data, i) => {
            const x = margemEsq + passo * i + (passo - larguraBarra) / 2;
            let acumulado = 0;
            return (
              <g key={data}>
                {series.map((s) => {
                  const valor = s.valores[i] ?? 0;
                  if (valor === 0) return null;
                  const yTopo = y(acumulado + valor);
                  const h = y(acumulado) - yTopo;
                  acumulado += valor;
                  return (
                    <g key={s.nome}>
                      <rect x={x} y={yTopo} width={larguraBarra} height={h} fill={s.cor} rx={2}>
                        <title>{`${s.nome} · ${rotuloData(data)}: ${valor}`}</title>
                      </rect>
                      {h >= 16 && (
                        <text
                          x={x + larguraBarra / 2}
                          y={yTopo + h / 2 + 4}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={600}
                          fill={s.cor === "#F5A623" ? "#101E24" : "#FFFFFF"}
                        >
                          {valor}
                        </text>
                      )}
                    </g>
                  );
                })}
                {series.length > 1 && (
                  <text
                    x={x + larguraBarra / 2}
                    y={y(totais[i]) - 6}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="#101E24"
                  >
                    {totais[i]}
                  </text>
                )}
                <text
                  x={x + larguraBarra / 2}
                  y={topo + alturaPlot + 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#5B6B76"
                >
                  {rotuloData(data)}
                </text>
              </g>
            );
          })}

          <line
            x1={margemEsq}
            x2={largura - margemDir}
            y1={y(media)}
            y2={y(media)}
            stroke="#101E24"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <text
            x={largura - margemDir}
            y={y(media) - 5}
            textAnchor="end"
            fontSize={11}
            fontWeight={600}
            fill="#101E24"
          >
            {`média ${media.toFixed(1).replace(".", ",")}`}
          </text>
        </svg>
      </div>

      {series.length > 1 && (
        <figcaption className="mt-3 flex flex-wrap gap-4 text-xs text-text-secondary">
          {series.map((s) => (
            <span key={s.nome} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: s.cor }}
              />
              {s.nome}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
