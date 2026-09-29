import { corDaTurma } from "@/lib/relatorio/cores";
import { fmtNum, type RelatorioGeral } from "@/lib/relatorio/motor";
import { Kpi } from "@/components/relatorio/Blocos";

function Lista({ titulo, nomes, cor, vazio }: { titulo: string; nomes: string[]; cor: string; vazio: string }) {
  return (
    <details className="rounded-lg border border-border-light bg-bg" open={nomes.length > 0 && nomes.length <= 12}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
        <span className="font-medium">{titulo}</span>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: cor }}>
          {nomes.length}
        </span>
      </summary>
      <div className="border-t border-border-light px-3 py-2 text-sm leading-relaxed text-text-secondary">
        {nomes.length === 0 ? vazio : nomes.join(" · ")}
      </div>
    </details>
  );
}

export function SecaoFrequencia({ id, r }: { id: string; r: RelatorioGeral }) {
  const homens = r.nuncaForam.filter((n) => n.genero === "M");
  const mulheres = r.nuncaForam.filter((n) => n.genero === "F");
  const semGenero = r.nuncaForam.filter((n) => n.genero === null);
  const nomeIdade = (n: { nome: string; idade: number | null }) => (n.idade !== null ? `${n.nome} (${n.idade})` : n.nome);

  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-6 space-y-5">
      <h2 id={`${id}-t`} className="font-display text-xl font-semibold text-primary">
        Frequência: quem vem, quem parou, quem nunca veio
      </h2>

      <div className="grid gap-4 md:grid-cols-3">
        {r.turmas.map((t) => {
          const cor = corDaTurma(t.turma.nome);
          const frequentes = t.pessoas
            .filter((p) => p.frequencia >= 4)
            .sort((a, b) => b.frequencia - a.frequencia || a.nome.localeCompare(b.nome, "pt-BR"))
            .map((p) => `${p.nome} (${p.frequencia})`);
          const nAulas = t.datas.length;
          return (
            <div key={t.turma.id} className="space-y-3 rounded-xl border border-border bg-surface p-4" style={{ borderTop: `4px solid ${cor}` }}>
              <div>
                <div className="font-display text-base font-semibold">{t.turma.nome}</div>
                <div className="text-xs text-text-secondary">
                  {nAulas} {nAulas === 1 ? "aula" : "aulas"} com chamada · média de {fmtNum(t.mediaPorAula)} por aula
                </div>
              </div>
              <Lista
                titulo="Frequentes (4+ aulas)"
                nomes={frequentes}
                cor={cor}
                vazio="Ninguém com 4 aulas ou mais ainda."
              />
              <Lista
                titulo="Começaram e pararam"
                nomes={t.padroes.comecouEParou}
                cor="#C0392B"
                vazio="Ninguém parou de vir."
              />
              <Lista
                titulo="Começaram depois"
                nomes={t.padroes.comecouDepois}
                cor="#1B6B3A"
                vazio="Ninguém começou na segunda metade."
              />
              <Lista titulo="Vieram só uma vez" nomes={t.padroes.umaVez} cor="#5B6B76" vazio="Ninguém." />
              <p className="text-xs text-text-secondary">
                Saldo (começaram depois − pararam):{" "}
                <strong>{t.saldo > 0 ? `+${t.saldo}` : t.saldo}</strong>. Cada pessoa aparece só na turma onde mais esteve.
              </p>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi
            rotulo="Nunca foram à EBD"
            valor={String(r.nuncaForam.length)}
            detalhe={`de ${r.igreja.adultos} membros adultos`}
            cor="#C0392B"
          />
          <Kpi rotulo="Homens" valor={String(homens.length)} detalhe="membros adultos" />
          <Kpi rotulo="Mulheres" valor={String(mulheres.length)} detalhe="membras adultas" cor="#F2542D" />
          <Kpi rotulo="Passaram pela EBD" valor={String(r.igreja.passaram)} detalhe="membros adultos" cor="#1B6B3A" />
        </div>
        <Lista titulo="Homens que nunca foram" nomes={homens.map(nomeIdade)} cor="#0E7C86" vazio="Todos já passaram pela EBD." />
        <Lista titulo="Mulheres que nunca foram" nomes={mulheres.map(nomeIdade)} cor="#F2542D" vazio="Todas já passaram pela EBD." />
        {semGenero.length > 0 && (
          <Lista titulo="Sem gênero cadastrado" nomes={semGenero.map(nomeIdade)} cor="#5B6B76" vazio="" />
        )}
        <p className="text-xs text-text-secondary">
          “Nunca foram” = membros adultos (18+) que não aparecem em nenhuma chamada do semestre. Idade entre parênteses.
        </p>
      </div>
    </section>
  );
}
