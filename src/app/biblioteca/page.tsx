import { listarTurmas } from "@/lib/estrutura/queries";
import { listarPrateleira, nomesDePessoas } from "@/lib/biblioteca/queries";
import { ListaMateriais } from "@/components/biblioteca/ListaMateriais";
import { UploadBiblioteca } from "@/components/biblioteca/UploadBiblioteca";
import { getSessaoAtual } from "@/lib/auth/session";
import { listarMinhasTurmasIds } from "@/lib/frequencia/queries";
import { corDaTurma } from "@/lib/relatorio/cores";

// Biblioteca da EBD em três prateleiras. Leitura para todos (inclusive quem
// não fez login); publicar/remover depende do papel:
//   Livros e Institucionais -> coordenação
//   Aulas                   -> professor (o que ele enviou) e coordenação (tudo)
export default async function BibliotecaPage({ searchParams }: { searchParams: { turma?: string } }) {
  const [sessao, turmas] = await Promise.all([getSessaoAtual(), listarTurmas()]);
  const ehCoord = sessao.role === "coordenacao";
  const ehProf = sessao.role === "professor";
  const turmaFiltro = turmas.find((t) => t.id === searchParams.turma);

  const [livros, institucionais, aulas] = await Promise.all([
    listarPrateleira("livro"),
    listarPrateleira("institucional"),
    listarPrateleira("aula", turmaFiltro?.id),
  ]);
  const autores = await nomesDePessoas(aulas.map((m) => m.enviado_por).filter((x): x is string => !!x));
  const turmaPorId = new Map(turmas.map((t) => [t.id, t.nome]));
  const minhas = ehProf ? await listarMinhasTurmasIds() : [];
  // professor publica só nas turmas dele; coordenação, em qualquer uma
  const turmasSimples = turmas.filter((t) => ehCoord || minhas.includes(t.id)).map((t) => ({ id: t.id, nome: t.nome }));
  const detalheAula = (m: (typeof aulas)[number]) =>
    [
      m.enviado_por ? `por ${autores.get(m.enviado_por) ?? "professor"}` : null,
      new Date(m.criado_em).toLocaleDateString("pt-BR"),
    ]
      .filter(Boolean)
      .join(" · ");
  const podeApagarAula = (m: (typeof aulas)[number]) => ehCoord || (ehProf && m.enviado_por === sessao.pessoaId);
  const gruposAula = [
    ...turmas.filter((t) => !turmaFiltro || t.id === turmaFiltro.id).map((t) => ({ id: t.id as string | null, nome: t.nome })),
    { id: null as string | null, nome: "Aulas unificadas (Homens + Mulheres)" },
  ]
    .map((g) => ({ ...g, itens: aulas.filter((m) => (m.turma_id ?? null) === g.id) }))
    .filter((g) => g.id !== null || g.itens.length > 0);

  const prateleiras = [
    { id: "livros", titulo: "Livros", descricao: "Os livros-base de cada módulo e obras de apoio.", itens: livros },
    { id: "institucionais", titulo: "Materiais institucionais", descricao: "Plano pedagógico, estatuto, metodologia e documentos da EBD.", itens: institucionais },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Biblioteca</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Livros, materiais institucionais e aulas da EBD — aberta para coordenação, professores e alunos.
        </p>
        <nav className="mt-3 flex gap-4 text-sm text-primary">
          <a href="#livros" className="hover:underline">Livros</a>
          <a href="#institucionais" className="hover:underline">Institucionais</a>
          <a href="#aulas" className="hover:underline">Aulas</a>
        </nav>
      </div>

      {prateleiras.map((p) => (
        <section key={p.id} id={p.id} className="scroll-mt-6 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-semibold text-primary">{p.titulo}</h2>
          <p className="mb-3 text-xs text-text-secondary">{p.descricao}</p>
          <ListaMateriais
            materiais={p.itens}
            podeApagar={ehCoord}
            detalhe={(m) => new Date(m.criado_em).toLocaleDateString("pt-BR")}
          />
          {ehCoord && <UploadBiblioteca categoria={p.id === "livros" ? "livro" : "institucional"} pessoaId={sessao.pessoaId} />}
        </section>
      ))}

      <section id="aulas" className="scroll-mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-primary">Aulas</h2>
        <p className="mb-3 text-xs text-text-secondary">
          Slides, estudos e roteiros das aulas. Cada professor publica as suas; a coordenação pode publicar e remover qualquer uma.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          <a
            href="/biblioteca#aulas"
            className={`rounded-full px-3 py-1 text-sm ${!turmaFiltro ? "bg-primary text-white" : "border border-border text-text-secondary"}`}
          >
            Todas
          </a>
          {turmas.map((t) => (
            <a
              key={t.id}
              href={`/biblioteca?turma=${t.id}#aulas`}
              style={turmaFiltro?.id === t.id ? { background: corDaTurma(t.nome), color: "#fff" } : undefined}
              className={`rounded-full px-3 py-1 text-sm ${turmaFiltro?.id === t.id ? "" : "border border-border text-text-secondary"}`}
            >
              {t.nome}
            </a>
          ))}
        </div>
        <div className="space-y-5">
          {gruposAula.map((g) => (
            <div key={g.id ?? "unificada"} className="rounded-lg border border-border-light p-4" style={{ borderLeft: `4px solid ${g.id ? corDaTurma(g.nome) : "#101E24"}` }}>
              <h3 className="mb-3 font-display text-base font-semibold" style={{ color: g.id ? corDaTurma(g.nome) : "#101E24" }}>
                {g.nome}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-medium text-text-secondary">SLIDES DA AULA</div>
                  <ListaMateriais materiais={g.itens.filter((m) => m.papel === "slides")} podeApagar={podeApagarAula} detalhe={detalheAula} />
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-text-secondary">MATERIAIS DE APOIO</div>
                  <ListaMateriais materiais={g.itens.filter((m) => m.papel !== "slides")} podeApagar={podeApagarAula} detalhe={detalheAula} />
                </div>
              </div>
            </div>
          ))}
        </div>
        {(ehCoord || ehProf) && (
          <UploadBiblioteca categoria="aula" pessoaId={sessao.pessoaId} turmas={turmasSimples} turmaPadrao={turmaFiltro?.id} />
        )}
      </section>
    </div>
  );
}
