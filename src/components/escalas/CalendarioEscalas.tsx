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
}: {
  turma: Turma;
  escalas: EscalaComNome[];
  hoje: string;
  semestreInicio: string | null;
  semestreFim: string | null;
  podeGerenciar: boolean;
  minhaPessoaId?: string | null;
  hrefEscalar: (data: string) => string;
}) {
  const cor = corDaTurma(turma.nome);
  const dias = montarDias(turma, escalas, semestreInicio, semestreFim);
  const porData = new Map(escalas.map((e) => [e.data, e]));

  const diasDeAula = dias.filter((d) => d.tipo !== "sem_aula");
  const escalados = diasDeAula.filter((d) => porData.has(d.data)).length;
  const faltam = diasDeAula.filter((d) => d.data >= hoje && !porData.has(d.data)).length;
  const proxima = diasDeAula.find((d) => d.data >= hoje)?.data ?? null;
  const semAulaFuturos = dias.filter((d) => d.tipo === "sem_aula" && d.data >= hoje).length;

  const meses: { chave: string; rotulo: string; dias: Dia[] }[] = [];
  for (const d of dias) {
    const p = partes(d.data);
    const chave = `${p.ano}-${p.mes}`;
    let m = meses.find((x) => x.chave === chave);
    if (!m) meses.push((m = { chave, rotulo: `${MESES[p.mes]} ${p.ano}`, dias: [] }));
    m.dias.push(d);
  }

  return (
    <div className="space-y-5">
      {/* faixa-resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Resumo valor={diasDeAula.length} rotulo="domingos de aula" cor={cor} />
        <Resumo valor={escalados} rotulo="com professor" cor="#1B6B3A" />
        <Resumo valor={faltam} rotulo="a escalar" cor={faltam > 0 ? "#B26A00" : "#5B6B76"} destaque={faltam > 0} />
        <Resumo valor={semAulaFuturos} rotulo="domingos sem aula" cor="#5B6B76" />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
        <Legenda classe="border-2 border-dashed border-[#E0A030] bg-[#FFF8E8]">Sem professor</Legenda>
        <Legenda classe="sem-aula-listras border border-[#CFD8DC]">Sem aula</Legenda>
        <Legenda classe="border border-border bg-surface" estilo={{ boxShadow: `inset 4px 0 0 ${cor}` }}>
          Escalado
        </Legenda>
      </div>

      {meses.map((m) => (
        <section key={m.chave}>
          <h3 className="mb-2 font-display text-sm font-semibold tracking-widest text-text-secondary">{m.rotulo}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {m.dias.map((d) => (
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
        </section>
      ))}
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
