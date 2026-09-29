import { carregarRelatorio } from "@/lib/relatorio/dados";
import { corDaTurma } from "@/lib/relatorio/cores";
import {
  fmtDataCurta,
  fmtDataLonga,
  fmtNum,
  fmtPct,
  textoConclusaoTurma,
  textoEntradaSaida,
  textoIdade,
  textoPicos,
  listaTexto,
  type RelatorioGeral,
  type RelatorioTurma,
} from "@/lib/relatorio/motor";
import { GraficoLinhas } from "@/components/relatorio/GraficoLinhas";
import { GraficoFrequencia } from "@/components/dashboard/GraficoFrequencia";
import { BarraProgresso, TabelaSimples } from "@/components/relatorio/Blocos";
import { BotaoImprimir } from "@/components/relatorio/BotaoImprimir";

// Relatório de Frequência da EBD — gerado a partir dos dados do sistema, no
// mesmo roteiro do relatório de referência (23/09/2026): resumo geral,
// análise por turma, comparativos, participação e relação com a membresia.
// Vale para o semestre inteiro ou, com ?turma=<id>, para uma turma só.
// A página é feita para imprimir (o cabeçalho e o rodapé somem no papel).
export default async function RelatorioPage({ searchParams }: { searchParams: { turma?: string } }) {
  const { relatorio: completo, semestre } = await carregarRelatorio();
  const turmaFiltro = completo.turmas.find((t) => t.turma.id === searchParams.turma);
  const turmas = turmaFiltro ? [turmaFiltro] : completo.turmas;
  const r: RelatorioGeral = { ...completo, turmas };

  const periodo = semestre ? `${semestre.periodo}º semestre de ${semestre.ano}` : "semestre atual";
  const titulo = turmaFiltro
    ? `Relatório de Frequência — ${turmaFiltro.turma.nome}`
    : "Relatório de Frequência — EBD (Turmas de Adultos)";

  if (completo.aulas === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
        Ainda não há chamadas lançadas para gerar o relatório.
      </p>
    );
  }

  const nomesTurmas = listaTexto(turmas.map((t) => t.turma.nome));
  const p = completo.distintas ? (n: number) => Math.round((n / completo.distintas) * 100) : () => 0;

  return (
    <article className="mx-auto max-w-4xl space-y-8 print:max-w-none print:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <a href="/frequencia" className="text-sm font-medium text-primary hover:underline">
          ← Voltar para a Frequência
        </a>
        <div className="flex flex-wrap items-center gap-2">
          {turmaFiltro && (
            <a href="/frequencia/relatorio" className="rounded-lg border border-border px-4 py-2 text-sm text-primary">
              Relatório do semestre inteiro
            </a>
          )}
          <BotaoImprimir />
        </div>
      </div>

      <header>
        <h1 className="font-display text-3xl font-semibold text-primary">{titulo}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          AD Dom Pedro II · {periodo} · gerado em {fmtDataLonga(completo.hoje)}
        </p>
      </header>

      {/* ---------- resumo geral ---------- */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-primary">Resumo geral</h2>
        {turmaFiltro ? (
          <p className="text-sm leading-relaxed">
            Entre {fmtDataCurta(turmaFiltro.datas[0].data)} e {fmtDataLonga(turmaFiltro.datas[turmaFiltro.datas.length - 1].data)} (
            {turmaFiltro.datas.length} aulas), {turmaFiltro.distintas} pessoas distintas passaram pela{" "}
            {turmaFiltro.turma.nome}: {turmaFiltro.membros} membros e {turmaFiltro.visitantes} visitantes.
          </p>
        ) : (
          <p className="text-sm leading-relaxed">
            Entre {fmtDataCurta(completo.inicio!)} e {fmtDataLonga(completo.fim!)} ({completo.aulas} aulas),{" "}
            {completo.distintas} pessoas distintas passaram pela EBD nas {turmas.length} turmas de adultos —{" "}
            {nomesTurmas}. Dessas, {completo.membros} são membros da igreja e {completo.visitantes} são visitantes.
            Pela frequência: {completo.umaVez} ({p(completo.umaVez)}%) passaram por apenas 1 aula,{" "}
            {completo.esporadicos} ({p(completo.esporadicos)}%) foram esporádicas (2–3 aulas) e{" "}
            {completo.frequentes} ({p(completo.frequentes)}%) são frequentes (4 aulas ou mais).
          </p>
        )}
        <GraficoLinhas
          descricao="Presentes por domingo em cada turma."
          series={turmas.map((t) => ({
            nome: t.turma.nome,
            cor: corDaTurma(t.turma.nome),
            pontos: t.datas.map((d) => ({ data: d.data, valor: d.presentes })),
          }))}
        />
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-semibold text-primary">Metodologia</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          Os dados vêm da lista de chamada da EBD ({completo.aulas} aulas, {turmas.length}{" "}
          {turmas.length === 1 ? "turma" : "turmas"}) cruzada com o cadastro de membresia da igreja (
          {completo.igreja.membros} membros). Cada pessoa é classificada pela quantidade de aulas em que
          apareceu: 1 aula (só uma vez), 2–3 aulas (esporádico) e 4 aulas ou mais (frequente). Também se
          observa o padrão ao longo do semestre: começou e parou (só apareceu na primeira metade das aulas),
          começou depois (só apareceu na segunda metade) e presente nas duas metades. Quem frequentou mais de
          uma turma é analisado na turma em que esteve mais vezes. Idades calculadas pela data de nascimento
          do cadastro, em {fmtDataLonga(completo.hoje)}.
        </p>
      </section>

      {/* ---------- por turma ---------- */}
      <section className="space-y-8">
        <h2 className="font-display text-xl font-semibold text-primary">Análise por turma</h2>
        {turmas.map((t) => (
          <BlocoTurma key={t.turma.id} t={t} />
        ))}
      </section>

      {/* ---------- comparativos ---------- */}
      {turmas.length > 1 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-primary">Comparativos entre turmas</h2>
          <TabelaSimples
            colunas={["Turma", "Pessoas", "Membros", "Visitantes", "Idade média", "Frequentes (4+)", "Presença/aula", "1ª→2ª metade"]}
            linhas={turmas.map((t) => [
              t.turma.nome,
              t.distintas,
              t.membros,
              t.visitantes,
              fmtNum(t.idadeMedia),
              t.frequentes,
              fmtNum(t.mediaPorAula),
              fmtPct(t.variacaoPct, true),
            ])}
          />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-primary">Participação frequente no público de cada turma</h2>
        <p className="text-sm text-text-secondary">
          Frequentes (4+ aulas) em relação ao público de referência: homens membros adultos ({turmas.find((t) => t.referencia?.rotulo.startsWith("homens"))?.referencia?.total ?? "—"}) para a Classe de
          Homens, mulheres membros adultas ({turmas.find((t) => t.referencia?.rotulo.startsWith("mulheres"))?.referencia?.total ?? "—"}) para a Classe de Mulheres e membros de 45 anos ou mais (
          {turmas.find((t) => t.referencia?.rotulo.startsWith("membros de 45"))?.referencia?.total ?? "—"}) para o Panorama Bíblico.
        </p>
        <TabelaSimples
          colunas={["Turma", "Frequentes (4+)", "Público de referência", "Participação"]}
          linhas={turmas.map((t) => [
            t.turma.nome,
            t.frequentes,
            t.referencia ? `${t.referencia.total} ${t.referencia.rotulo}` : "—",
            fmtPct(t.participacaoPct),
          ])}
        />
        {turmas.filter((t) => t.frequentesAbaixoReferencia.length > 0).map((t) => (
          <p key={t.turma.id} className="text-xs text-text-secondary">
            Nota: dos {t.frequentes} frequentes da {t.turma.nome}, {t.frequentesAbaixoReferencia.length} (
            {listaTexto(t.frequentesAbaixoReferencia)}) está(ão) fora do público considerado.
          </p>
        ))}
      </section>

      {/* ---------- membresia ---------- */}
      {!turmaFiltro && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-primary">Relação de participação com membros da igreja</h2>
          <p className="text-sm leading-relaxed">
            A igreja tem {completo.igreja.membros} membros cadastrados, dos quais {completo.igreja.adultos} são adultos (18 anos ou mais). Das{" "}
            {completo.distintas} pessoas que passaram pela EBD, {completo.membros} são membros da igreja —{" "}
            {completo.igreja.passaram} dos {completo.igreja.membros} membros ({fmtPct((completo.igreja.passaram / completo.igreja.membros) * 100)}) e{" "}
            {completo.igreja.passaram} dos {completo.igreja.adultos} membros adultos ({fmtPct((completo.igreja.passaram / completo.igreja.adultos) * 100)}) passaram
            pela EBD ao menos uma vez. Considerando só os frequentes (4 aulas ou mais), {completo.igreja.frequentes} dos {completo.igreja.membros} membros (
            {fmtPct((completo.igreja.frequentes / completo.igreja.membros) * 100)}) e {completo.igreja.frequentes} dos {completo.igreja.adultos} adultos (
            {fmtPct((completo.igreja.frequentes / completo.igreja.adultos) * 100)}) acompanham a EBD de forma constante.
          </p>
          <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
            <BarraProgresso rotulo="Membros que passaram pela EBD" valor={completo.igreja.passaram} total={completo.igreja.membros} />
            <BarraProgresso rotulo="Adultos que passaram pela EBD" valor={completo.igreja.passaram} total={completo.igreja.adultos} cor="#F2542D" />
            <BarraProgresso rotulo="Adultos frequentes (4+)" valor={completo.igreja.frequentes} total={completo.igreja.adultos} cor="#D9930D" />
          </div>
          <TabelaSimples
            colunas={["Faixa etária", "Membros da igreja", "Passaram pela EBD", "Taxa", "Frequentes (4+)"]}
            linhas={completo.faixas.map((f) => [f.faixa, f.membros, f.passaram, fmtPct(f.taxa), f.frequentes])}
          />
          <ConclusaoFaixas r={completo} />
        </section>
      )}

      {/* ---------- panorama final ---------- */}
      {turmas.length > 1 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-primary">Panorama final</h2>
          <TabelaSimples
            colunas={["Turma", "1ª→2ª metade", "Frequentes (4+)", "Idade média"]}
            linhas={turmas.map((t) => [t.turma.nome, fmtPct(t.variacaoPct, true), t.frequentes, `${fmtNum(t.idadeMedia)} anos`])}
          />
          <p className="text-sm leading-relaxed">
            {panoramaFinal(turmas, completo)}
          </p>
        </section>
      )}

      <footer className="border-t border-border pt-3 text-xs text-text-secondary">
        SIGA EBD · Correa Tech — relatório gerado automaticamente a partir das chamadas lançadas no sistema.
      </footer>
    </article>
  );
}

function BlocoTurma({ t }: { t: RelatorioTurma }) {
  const cor = corDaTurma(t.turma.nome);
  const idade = textoIdade(t);
  return (
    <div className="space-y-4 border-l-4 pl-5 print:break-inside-auto" style={{ borderColor: cor }}>
      <h3 className="font-display text-lg font-semibold" style={{ color: cor }}>
        {t.turma.nome}
        {t.turma.titulo ? <span className="ml-2 text-sm font-normal text-text-secondary">· {t.turma.titulo}</span> : null}
      </h3>
      <TabelaSimples
        colunas={["Métrica", "Valor"]}
        linhas={[
          ["Pessoas distintas que passaram pela turma", t.distintas],
          ["Membros", t.membros],
          ["Visitantes", t.visitantes],
          ["Idade média", t.idadeMedia === null ? "N/D" : `${fmtNum(t.idadeMedia)} anos`],
          ["Frequentes (4 aulas ou mais)", t.frequentes],
          ["Presença média por aula", fmtNum(t.mediaPorAula)],
        ]}
      />
      <GraficoFrequencia
        datas={t.datas.map((d) => d.data)}
        series={[{ nome: t.turma.nome, cor, valores: t.datas.map((d) => d.presentes) }]}
        media={t.mediaPorAula}
        descricao={`Presentes por domingo — ${t.turma.nome}.`}
      />
      <p className="text-sm leading-relaxed">
        <strong>Entrada e saída</strong> (de quem passou pela turma): {textoEntradaSaida(t)}
      </p>
      <TabelaSimples
        colunas={["Nome", "Idade", "Membro", "Frequência"]}
        linhas={t.pessoas.map((x) => [x.nome, x.idade === null ? "N/D" : x.idade, x.membro ? "Sim" : "Não", x.frequencia])}
      />
      {idade && <p className="text-sm leading-relaxed">{idade}</p>}
      <p className="text-sm leading-relaxed">{textoPicos(t)}</p>
      <p className="text-sm leading-relaxed">
        <strong>Conclusão:</strong> {textoConclusaoTurma(t)}
      </p>
    </div>
  );
}

function ConclusaoFaixas({ r }: { r: RelatorioGeral }) {
  const com = r.faixas.filter((f) => f.taxa !== null);
  if (com.length === 0) return null;
  const ordenadas = [...com].sort((a, b) => (b.taxa ?? 0) - (a.taxa ?? 0));
  const maior = ordenadas[0];
  const segunda = ordenadas[1];
  const menor = ordenadas[ordenadas.length - 1];
  const maxFreq = Math.max(...r.faixas.map((f) => f.frequentes));
  const topFreq = r.faixas.filter((f) => f.frequentes === maxFreq).map((f) => f.faixa);
  const zerados = r.faixas.filter((f) => f.frequentes === 0);
  return (
    <p className="text-sm leading-relaxed">
      <strong>Conclusão:</strong> a faixa de {maior.faixa} anos tem a maior taxa de passagem pela EBD entre os membros (
      {fmtPct(maior.taxa)}){segunda ? `, seguida por ${segunda.faixa} anos (${fmtPct(segunda.taxa)})` : ""}; a faixa de{" "}
      {menor.faixa} tem a menor ({fmtPct(menor.taxa)}). Entre os frequentes, {topFreq.join(" e ")} concentra
      {topFreq.length > 1 ? "m" : ""} o maior número ({maxFreq}
      {topFreq.length > 1 ? " cada" : ""})
      {zerados.length > 0
        ? `, e ${zerados.length > 1 ? "as faixas" : "a faixa"} de ${listaTexto(zerados.map((f) => f.faixa))} anos não tem${zerados.length > 1 ? "m" : ""} nenhum frequente, apesar de ${zerados.map((f) => f.membros).join(" e ")} membros na igreja`
        : ""}
      .
    </p>
  );
}

function panoramaFinal(turmas: RelatorioTurma[], r: RelatorioGeral): string {
  const cresc = turmas.filter((t) => (t.variacaoPct ?? 0) > 1);
  const queda = [...turmas].filter((t) => (t.variacaoPct ?? 0) < -1).sort((a, b) => (a.variacaoPct ?? 0) - (b.variacaoPct ?? 0));
  const estavel = turmas.filter((t) => Math.abs(t.variacaoPct ?? 0) <= 1 || t.variacaoPct === null);
  const partes: string[] = [];
  if (cresc.length) partes.push(`${listaTexto(cresc.map((t) => t.turma.nome))} ${cresc.length > 1 ? "estão" : "está"} em crescimento`);
  if (queda.length) {
    const pior = queda[0];
    partes.push(`${pior.turma.nome} é a que mais perdeu presença proporcionalmente (${fmtPct(pior.variacaoPct, true)})`);
    for (const t of queda.slice(1)) partes.push(`${t.turma.nome} teve queda de ${fmtPct(t.variacaoPct, true)}`);
  }
  if (estavel.length) partes.push(`${listaTexto(estavel.map((t) => t.turma.nome))} se manteve praticamente estável`);
  const somaFreq = r.igreja.frequentes;
  return `No conjunto do semestre: ${partes.join("; ")}. As ${turmas.length} turmas somam ${somaFreq} membros frequentes sobre os ${r.igreja.passaram} membros que passaram pela EBD (${fmtPct(r.igreja.passaram ? (somaFreq / r.igreja.passaram) * 100 : 0)}) e sobre os ${r.igreja.adultos} membros adultos da igreja (${fmtPct(r.igreja.adultos ? (somaFreq / r.igreja.adultos) * 100 : 0)}).`;
}
