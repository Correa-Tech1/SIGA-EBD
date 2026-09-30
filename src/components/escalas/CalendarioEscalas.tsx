import Link from "next/link";
import type { EscalaComNome } from "@/lib/escalas/queries";
import type { Turma } from "@/lib/estrutura/queries";
import { CALENDARIO, type TipoDia } from "@/lib/calendario/plano2s2026";
import { corDaTurma } from "@/lib/relatorio/cores";
import { BotaoRemoverEscala } from "./ClientForms";

interface Dia {
  data: string;
  tipo: TipoDia;
  numero: number | null;
  titulo?: string;
  rotulo?: string;
}

const MESES = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const MES_CURTO = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const partes = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return { ano: a, mes: m - 1, dia: d, semana: new Date(Date.UTC(a, m - 1, d)).getUTCDay() };
};

// Monta os dias do calendário da turma: Homens/Mulheres seguem o Plano de
// Ensino (inclui os domingos SEM AULA); as demais turmas usam os domingos do
// semestre, respeitando os mesmos domingos sem aula. Escalas fora dessas datas
// entram também (nada escalado some da tela).
function montarDias(turma: Turma, escalas: EscalaComNome[], semestreInicio: string | null, semestreFim: string | null): Dia[] {
  const nome = turma.nome.toLowerCase();
  const chave = nome.includes("homens") ? "homens" : nome.includes("mulheres") ? "mulheres" : null;
  const semAula = new Map(CALENDARIO.filter((c) => c.tipo === "sem_aula").map((c) => [c.data, c.rotulo]));
  const mapa = new Map<string, Dia>();

  if (chave) {
    for (const c of CALENDARIO) {
      mapa.set(c.data, {
        data: c.data,
        tipo: c.tipo,
        numero: c.numero,
        titulo: chave === "homens" ? c.homens : c.mulheres,
        rotulo: c.rotulo,
      });
    }
  } else {
    const ini = semestreInicio ?? CALENDARIO[0].data;
    const fim = semestreFim ?? CALENDARIO[CALENDARIO.length - 1].data;
    const d = new Date(ini + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7));
    while (d.toISOString().slice(0, 10) <= fim) {
      const iso = d.toISOString().slice(0, 10);
      mapa.set(iso, {
        data: iso,
        tipo: semAula.has(iso) ? "sem_aula" : "normal",
        numero: null,
        rotulo: semAula.get(iso),
      });
      d.setUTCDate(d.getUTCDate() + 7);
    }
  }
  for (const e of escalas) if (!mapa.has(e.data)) mapa.set(e.data, { data: e.data, tipo: "normal", numero: null });
  return [...mapa.values()].sort((a, b) => a.data.localeCompare(b.data));
}

export function CalendarioEscalas({
  turma,
  escalas,
  hoje,
  semestreInicio,
  semestreFim,
  podeGerenciar,
  minhaPessoaId,
  hrefEscalar,
  hrefMes,
  mesSelecionado,
}: {
  turma: Turma;
  escalas: EscalaComNome[];
  hoje: string;
  semestreInicio: string | null;
  semestreFim: string | null;
  podeGerenciar: boolean;
  minhaPessoaId?: string | null;
  hrefEscalar: (data: string) => string;
  hrefMes: (mes: string) => string; // mes = "YYYY-MM"
  mesSelecionado?: string; // "YYYY-MM" (padrão: mês atual)
}) {
  const cor = corDaTurma(turma.nome);
  const dias = montarDias(turma, escalas, semestreInicio, semestreFim);
  const porData = new Map(escalas.map((e) => [e.data, e]));

  const meses: { chave: string; curto: string; ano: number; dias: Dia[] }[] = [];
  for (const d of dias) {
    const p = partes(d.data);
    const chave = d.data.slice(0, 7);
    let m = meses.find((x) => x.chave === chave);
    if (!m) meses.push((m = { chave, curto: MES_CURTO[p.mes], ano: p.ano, dias: [] }));
    m.dias.push(d);
  }

  // mês mostrado: o escolhido; senão o atual; senão o próximo com aula; senão o último
  const mesAtual = hoje.slice(0, 7);
  const chaveAtiva =
    (mesSelecionado && meses.some((m) => m.chave === mesSelecionado) && mesSelecionado) ||
    (meses.some((m) => m.chave === mesAtual) && mesAtual) ||
    meses.find((m) => m.chave > mesAtual)?.chave ||
    meses[meses.length - 1]?.chave;
  const ativo = meses.find((m) => m.chave === chaveAtiva);
  const indice = meses.findIndex((m) => m.chave === chaveAtiva);

  const aulasDe = (lista: Dia[]) => lista.filter((d) => d.tipo !== "sem_aula");
  const faltamDe = (lista: Dia[]) => aulasDe(lista).filter((d) => d.data >= hoje && !porData.has(d.data)).length;
  const proxima = dias.filter((d) => d.tipo !== "sem_aula").find((d) => d.data >= hoje)?.data ?? null;

  if (!ativo) return <p className="text-sm text-text-secondary">Sem datas para mostrar.</p>;
  const diasAula = aulasDe(ativo.dias);
  const comProf = diasAula.filter((d) => porData.has(d.data)).length;
  const aEscalar = faltamDe(ativo.dias);
  const semAulaMes = ativo.dias.filter((d) => d.tipo === "sem_aula").length;

  return (
    <div id="calendario" className="scroll-mt-4 space-y-5">
      {/* seletor de mês */}
      <div className="flex items-center gap-2">
        {indice > 0 ? (
          <Link href={`${hrefMes(meses[indice - 1].chave)}#calendario`} aria-label="Mês anterior" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-lg text-primary">
            ‹
          </Link>
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-light text-lg text-border">‹</span>
        )}
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Mês">
          {meses.map((m) => {
            const ehAtivo = m.chave === ativo.chave;
            const falta = faltamDe(m.dias);
            const passado = m.chave < mesAtual;
            return (
              <Link
                key={m.chave}
                href={`${hrefMes(m.chave)}#calendario`}
                role="tab"
                aria-selected={ehAtivo}
                style={ehAtivo ? { background: cor, borderColor: cor, color: "#fff" } : undefined}
                className={`relative shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold tracking-wide ${
                  ehAtivo ? "" : `border-border bg-surface ${passado ? "text-text-secondary/60" : "text-text-secondary hover:border-primary"}`
                }`}
              >
                {m.curto}
                {m.chave === mesAtual && !ehAtivo && <span className="ml-1 text-[10px] text-primary">●</span>}
                {falta > 0 && (
                  <span className="absolute -right-1 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D9930D] px-1 text-[10px] font-bold text-white" title={`${falta} aula(s) sem professor`}>
                    {falta}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        {indice < meses.length - 1 ? (
          <Link href={`${hrefMes(meses[indice + 1].chave)}#calendario`} aria-label="Próximo mês" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-lg text-primary">
            ›
          </Link>
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-light text-lg text-border">›</span>
        )}
      </div>

      <h3 className="font-display text-2xl font-semibold text-text-primary">
        {MESES[partes(ativo.dias[0].data).mes].charAt(0) + MESES[partes(ativo.dias[0].data).mes].slice(1).toLowerCase()}{" "}
        <span className="text-text-secondary">{ativo.ano}</span>
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Resumo valor={diasAula.length} rotulo={diasAula.length === 1 ? "domingo de aula" : "domingos de aula"} cor={cor} />
        <Resumo valor={comProf} rotulo="com professor" cor="#1B6B3A" />
        <Resumo valor={aEscalar} rotulo="a escalar" cor={aEscalar > 0 ? "#B26A00" : "#5B6B76"} destaque={aEscalar > 0} />
        <Resumo valor={semAulaMes} rotulo={semAulaMes === 1 ? "domingo sem aula" : "domingos sem aula"} cor="#5B6B76" />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
        <Legenda classe="border-2 border-dashed border-[#E0A030] bg-[#FFF8E8]">Sem professor</Legenda>
        <Legenda classe="sem-aula-listras border border-[#CFD8DC]">Sem aula</Legenda>
        <Legenda classe="border border-border bg-surface" estilo={{ boxShadow: `inset 4px 0 0 ${cor}` }}>
          Escalado
        </Legenda>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ativo.dias.map((d) => (
          <CartaoDia
            key={d.data}
            dia={d}
            escala={porData.get(d.data) ?? null}
            cor={cor}
            hoje={hoje}
            eProxima={d.data === proxima}
            podeGerenciar={podeGerenciar}
            minhaPessoaId={minhaPessoaId ?? null}
            hrefEscalar={hrefEscalar(d.data)}
          />
        ))}
      </div>
    </div>
  );
}

function Resumo({ valor, rotulo, cor, destaque }: { valor: number; rotulo: string; cor: string; destaque?: boolean }) {
  return (
    <div className={`rounded-xl border bg-surface px-4 py-3 ${destaque ? "border-[#E0A030] bg-[#FFF8E8]" : "border-border"}`}>
      <div className="font-display text-3xl font-semibold leading-none" style={{ color: cor }}>
        {valor}
      </div>
      <div className="mt-1 text-xs text-text-secondary">{rotulo}</div>
    </div>
  );
}

function Legenda({ classe, estilo, children }: { classe: string; estilo?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3.5 w-5 rounded ${classe}`} style={estilo} />
      {children}
    </span>
  );
}

function CartaoDia({
  dia,
  escala,
  cor,
  hoje,
  eProxima,
  podeGerenciar,
  minhaPessoaId,
  hrefEscalar,
}: {
  dia: Dia;
  escala: EscalaComNome | null;
  cor: string;
  hoje: string;
  eProxima: boolean;
  podeGerenciar: boolean;
  minhaPessoaId: string | null;
  hrefEscalar: string;
}) {
  const p = partes(dia.data);
  const passado = dia.data < hoje;
  const eHoje = dia.data === hoje;
  const semAula = dia.tipo === "sem_aula";
  const minha = !!escala && escala.pessoa_id === minhaPessoaId;

  const bloco = (
    <div
      className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-lg py-2 text-center ${
        semAula ? "bg-[#ECEFF1] text-[#78909C]" : "text-white"
      }`}
      style={semAula ? undefined : { background: escala ? cor : "#D9930D" }}
    >
      <span className="text-[10px] font-semibold tracking-widest opacity-90">{SEMANA[p.semana]}</span>
      <span className="font-display text-3xl font-semibold leading-none">{String(p.dia).padStart(2, "0")}</span>
      <span className="text-[10px] font-semibold tracking-widest opacity-90">{MES_CURTO[p.mes]}</span>
    </div>
  );

  if (semAula) {
    return (
      <div
        className={`sem-aula-listras flex items-center gap-3 rounded-xl border border-[#CFD8DC] p-3 ${passado ? "opacity-60" : ""}`}
      >
        {bloco}
        <div>
          <div className="text-sm font-semibold tracking-wide text-[#607D8B]">SEM AULA</div>
          <div className="text-xs text-[#78909C]">{dia.rotulo ? capitalizar(dia.rotulo) : "Domingo de respiro"}</div>
        </div>
      </div>
    );
  }

  const faltaProfessor = !escala;
  return (
    <div
      className={`relative flex items-stretch gap-3 rounded-xl p-3 ${
        faltaProfessor
          ? "border-2 border-dashed border-[#E0A030] bg-[#FFF8E8]"
          : "border border-border bg-surface"
      } ${passado ? "opacity-70" : ""} ${eProxima || eHoje ? "ring-2 ring-offset-1" : ""}`}
      style={{
        ...(escala ? { boxShadow: `inset 4px 0 0 ${cor}` } : {}),
        ...(eProxima || eHoje ? ({ "--tw-ring-color": cor } as React.CSSProperties) : {}),
      }}
    >
      {(eProxima || eHoje) && (
        <span
          className="absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white"
          style={{ background: cor }}
        >
          {eHoje ? "HOJE" : "PRÓXIMA AULA"}
        </span>
      )}
      {bloco}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {dia.numero && <span className="text-[11px] font-semibold tracking-wide text-text-secondary">LIÇÃO {dia.numero}</span>}
          {dia.tipo === "unificada" && (
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-white">UNIFICADA</span>
          )}
          {dia.tipo === "circulo" && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-text-primary">CÍRCULO</span>
          )}
        </div>
        {dia.titulo && <div className="text-sm font-semibold leading-snug text-text-primary">{dia.titulo}</div>}

        {escala ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: cor }}
              aria-hidden
            >
              {escala.pessoa_nome.trim().charAt(0).toUpperCase()}
            </span>
            <span className="text-sm">
              {escala.pessoa_nome}
              {minha && <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">VOCÊ</span>}
            </span>
            {escala.tipo !== "regular" && (
              <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#8A5A00]">
                {escala.tipo === "substituicao" ? "SUBSTITUIÇÃO" : "CONVIDADO"}
              </span>
            )}
            {podeGerenciar && (
              <span className="ml-auto">
                <BotaoRemoverEscala escalaId={escala.id} />
              </span>
            )}
          </div>
        ) : (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#8A5A00]">{passado ? "Sem registro de professor" : "Sem professor"}</span>
            {podeGerenciar && (
              <Link href={hrefEscalar} className="rounded-lg bg-[#D9930D] px-2.5 py-1 text-xs font-semibold text-white">
                Escalar →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
