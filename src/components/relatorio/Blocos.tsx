import { fmtNum, fmtPct } from "@/lib/relatorio/motor";

// Cartão de número (fundo branco, faixa de cor no topo).
export function Kpi({
  rotulo,
  valor,
  detalhe,
  cor = "#0E7C86",
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  cor?: string;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-surface p-4 print:break-inside-avoid"
      style={{ borderTop: `4px solid ${cor}` }}
    >
      <div className="text-xs text-text-secondary">{rotulo}</div>
      <div className="mt-1 font-display text-2xl font-semibold text-text-primary">{valor}</div>
      {detalhe && <div className="mt-0.5 text-xs text-text-secondary">{detalhe}</div>}
    </div>
  );
}

// Cartão de número com fundo sólido colorido (Início).
export function KpiColorido({
  rotulo,
  valor,
  detalhe,
  fundo,
  texto = "#FFFFFF",
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  fundo: string;
  texto?: string;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: fundo, color: texto }}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-80">{rotulo}</div>
      <div className="mt-2 font-display text-4xl font-semibold leading-none">{valor}</div>
      {detalhe && <div className="mt-2 text-sm opacity-90">{detalhe}</div>}
    </div>
  );
}

// Barra de progresso com rótulo: "56 de 313 · 17,9%".
export function BarraProgresso({
  rotulo,
  valor,
  total,
  cor = "#0E7C86",
}: {
  rotulo: string;
  valor: number;
  total: number;
  cor?: string;
}) {
  const pct = total > 0 ? (valor / total) * 100 : 0;
  return (
    <div className="print:break-inside-avoid">
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-text-primary">{rotulo}</span>
        <span className="text-text-secondary">
          <strong className="font-semibold text-text-primary">{valor}</strong> de {total} · {fmtPct(pct)}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-border-light" role="presentation">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: cor }} />
      </div>
    </div>
  );
}

// Barra dividida em partes (ex.: membros × visitantes).
export function BarraEmpilhada({
  partes,
}: {
  partes: { rotulo: string; valor: number; cor: string }[];
}) {
  const total = partes.reduce((s, p) => s + p.valor, 0);
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-border-light" role="presentation">
        {partes
          .filter((p) => p.valor > 0)
          .map((p) => (
            <div key={p.rotulo} style={{ width: `${(p.valor / total) * 100}%`, background: p.cor }} />
          ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-text-secondary">
        {partes.map((p) => (
          <span key={p.rotulo} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-sm" style={{ background: p.cor }} />
            {p.valor} {p.rotulo}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TabelaSimples({
  colunas,
  linhas,
}: {
  colunas: string[];
  linhas: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface print:break-inside-avoid">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg text-left text-xs text-text-secondary">
            {colunas.map((c, i) => (
              <th key={c} className={`px-4 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className="border-t border-border-light">
              {l.map((c, j) => (
                <td key={j} className={`px-4 py-2 ${j > 0 ? "text-right tabular-nums" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { fmtNum, fmtPct };
