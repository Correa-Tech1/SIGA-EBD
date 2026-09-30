import { listarTurmas } from "@/lib/estrutura/queries";
import { listarPrateleira, nomesDePessoas, type Material } from "@/lib/biblioteca/queries";
import { UploadBiblioteca, type Prateleira } from "@/components/biblioteca/UploadBiblioteca";
import { BuscaProvider, CampoBusca, AvisoBusca } from "@/components/biblioteca/Busca";
import { CartaoMaterial } from "@/components/biblioteca/CartaoMaterial";
import { GradeDeCapas, PrateleiraMadeira } from "@/components/biblioteca/PrateleiraMadeira";
import { IconePrateleira, type IdPrateleira } from "@/components/biblioteca/IconesBiblioteca";
import { getSessaoAtual } from "@/lib/auth/session";
import { listarMinhasTurmasIds } from "@/lib/frequencia/queries";
import { corDaTurma } from "@/lib/relatorio/cores";

const COR_LIVRO = "#0E7C86";
const COR_INSTITUCIONAL = "#2F5D8C";
const COR_APOIO = "#D9930D";
const COR_AULA = "#F2542D";

// Biblioteca da EBD em prateleiras. Leitura para todos (inclusive quem
// não fez login); publicar/remover depende do papel:
//   Livros e Institucionais -> coordenação
//   Aulas                   -> professor (o que ele enviou) e coordenação (tudo)
//   Pastor                  -> só leitura
export default async function BibliotecaPage({ searchParams }: { searchParams: { turma?: string } }) {
  const [sessao, turmas] = await Promise.all([getSessaoAtual(), listarTurmas()]);
  const ehCoord = sessao.role === "coordenacao";
  const ehProf = sessao.role === "professor";
  const turmaFiltro = turmas.find((t) => t.id === searchParams.turma);

  // Apoio ao Professor só aparece para quem está logado como professor, coordenação ou pastor
  const veApoio = ehCoord || ehProf || sessao.role === "pastor";
  const [livros, institucionais, aulas, apoio] = await Promise.all([
    listarPrateleira("livro"),
    listarPrateleira("institucional"),
    listarPrateleira("aula", turmaFiltro?.id),
    veApoio ? listarPrateleira("apoio_professor") : Promise.resolve([]),
  ]);
  const autores = await nomesDePessoas(aulas.map((m) => m.enviado_por).filter((x): x is string => !!x));
  const minhas = ehProf ? await listarMinhasTurmasIds() : [];
  // professor publica só nas turmas dele; coordenação, em qualquer uma
  const turmasSimples = turmas.filter((t) => ehCoord || minhas.includes(t.id)).map((t) => ({ id: t.id, nome: t.nome }));
  const dataBr = (m: Material) => new Date(m.criado_em).toLocaleDateString("pt-BR");
  const detalheAula = (m: Material) =>
    [m.enviado_por ? `por ${autores.get(m.enviado_por) ?? "professor"}` : null, dataBr(m)].filter(Boolean).join(" · ");
  const prateleirasPermitidas: Prateleira[] = ehCoord ? ["livro", "institucional", "apoio_professor", "aula"] : ["aula"];
  const configMover = { prateleiras: prateleirasPermitidas, turmas: turmasSimples };
  const podeEditarAula = (m: Material) => ehCoord || (ehProf && m.enviado_por === sessao.pessoaId);
  const gruposAula = [
    ...turmas.filter((t) => !turmaFiltro || t.id === turmaFiltro.id).map((t) => ({ id: t.id as string | null, nome: t.nome })),
    { id: null as string | null, nome: "Aulas unificadas (Homens + Mulheres)" },
  ]
    .map((g) => ({ ...g, itens: aulas.filter((m) => (m.turma_id ?? null) === g.id) }))
    .filter((g) => g.id !== null || g.itens.length > 0);

  const prateleiras: {
    id: string;
    idVisual: IdPrateleira;
    titulo: string;
    descricao: string;
    cor: string;
    itens: Material[];
  }[] = [
    { id: "livros", idVisual: "livro", titulo: "Livros", descricao: "Os livros-base de cada módulo e obras de apoio.", cor: COR_LIVRO, itens: livros },
    {
      id: "institucionais",
      idVisual: "institucional",
      titulo: "Materiais institucionais",
      descricao: "Plano pedagógico, estatuto, metodologia e documentos da EBD.",
      cor: COR_INSTITUCIONAL,
      itens: institucionais,
    },
    ...(veApoio
      ? [
          {
            id: "apoio",
            idVisual: "apoio_professor" as IdPrateleira,
            titulo: "Apoio ao Professor",
            descricao: "Didática, preparo de aula, modelos e orientações. Visível só para professores, coordenação e pastor.",
            cor: COR_APOIO,
            itens: apoio,
          },
        ]
      : []),
  ];

  const navegacao = [
    ...prateleiras.map((p) => ({ id: p.id, idVisual: p.idVisual, rotulo: p.titulo.replace("Materiais institucionais", "Institucionais"), n: p.itens.length })),
    { id: "aulas", idVisual: "aula" as IdPrateleira, rotulo: "Aulas", n: aulas.length },
  ];

  return (
    <BuscaProvider>
      <div className="mx-auto max-w-6xl space-y-7">
        {/* cabeçalho / hero */}
        <header
          className="relative overflow-hidden rounded-2xl p-6 text-white sm:p-8"
          style={{ background: "linear-gradient(135deg,#0A5A62 0%,#0E7C86 55%,#15919C 100%)" }}
        >
          {/* lombadas decorativas */}
          <div className="pointer-events-none absolute -right-2 bottom-0 flex h-full items-end gap-1.5 opacity-20" aria-hidden>
            {[60, 84, 50, 96, 70, 88, 56].map((h, i) => (
              <span key={i} className="block w-5 rounded-t-sm bg-white" style={{ height: `${h}%`, opacity: 0.5 + (i % 3) * 0.2 }} />
            ))}
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] text-white/75">BIBLIOTECA DA EBD · AD DOM PEDRO II</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Biblioteca</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
            Livros, materiais institucionais e as aulas de cada turma — tudo em prateleiras, fácil de achar.
          </p>
          <div className="mt-5">
            <CampoBusca />
          </div>
          <nav className="mt-5 flex flex-wrap gap-2" aria-label="Prateleiras">
            {navegacao.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium backdrop-blur hover:bg-white hover:text-primary"
              >
                <IconePrateleira id={n.idVisual} tamanho={16} />
                {n.rotulo}
                <span className="rounded-full bg-white/25 px-1.5 text-xs">{n.n}</span>
              </a>
            ))}
          </nav>
        </header>

        {(ehCoord || ehProf) && (
          <details className="group rounded-2xl border border-primary/30 bg-surface shadow-sm">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xl leading-none text-white">+</span>
              <span className="flex-1">
                <span className="block font-display text-lg font-semibold text-primary">Adicionar à Biblioteca</span>
                <span className="block text-xs text-text-secondary">
                  {ehCoord
                    ? "Escolha a prateleira e envie. Depois dá para renomear e mover cada arquivo."
                    : "Você publica na prateleira Aulas, na turma em que dá aula."}
                </span>
              </span>
              <span className="text-sm text-primary group-open:hidden">Abrir</span>
              <span className="hidden text-sm text-primary group-open:inline">Fechar</span>
            </summary>
            <div className="border-t border-border-light px-5 pb-5 pt-4">
              <UploadBiblioteca
                prateleiras={prateleirasPermitidas}
                pessoaId={sessao.pessoaId}
                turmas={turmasSimples}
                turmaPadrao={turmaFiltro?.id}
              />
            </div>
          </details>
        )}

        <AvisoBusca />

        {prateleiras.map((p) => (
          <PrateleiraMadeira
            key={p.id}
            id={p.id}
            idVisual={p.idVisual}
            titulo={p.titulo}
            descricao={p.descricao}
            quantidade={p.itens.length}
            cor={p.cor}
            vazio={p.itens.length === 0}
          >
            {p.itens.map((m) => (
              <CartaoMaterial key={m.id} material={m} corLombada={p.cor} detalhe={dataBr(m)} editavel={ehCoord} mover={configMover} />
            ))}
          </PrateleiraMadeira>
        ))}

        <PrateleiraMadeira
          id="aulas"
          idVisual="aula"
          titulo="Aulas"
          descricao="Slides, estudos e roteiros das aulas. Cada professor publica as suas; a coordenação pode publicar e remover qualquer uma."
          quantidade={aulas.length}
          cor={COR_AULA}
          vazio={false}
          semGrade
        >
          <div className="mb-5 flex flex-wrap gap-2">
            <a
              href="/biblioteca#aulas"
              className={`rounded-full px-3.5 py-1 text-sm ${!turmaFiltro ? "bg-text-primary text-white" : "border border-[#D9CDB8] bg-white text-text-secondary"}`}
            >
              Todas
            </a>
            {turmas.map((t) => (
              <a
                key={t.id}
                href={`/biblioteca?turma=${t.id}#aulas`}
                style={turmaFiltro?.id === t.id ? { background: corDaTurma(t.nome), color: "#fff" } : undefined}
                className={`rounded-full px-3.5 py-1 text-sm ${turmaFiltro?.id === t.id ? "" : "border border-[#D9CDB8] bg-white text-text-secondary"}`}
              >
                {t.nome}
              </a>
            ))}
          </div>

          <div className="space-y-8">
            {gruposAula.map((g) => {
              const cor = g.id ? corDaTurma(g.nome) : "#101E24";
              const slides = g.itens.filter((m) => m.papel === "slides");
              const apoioAula = g.itens.filter((m) => m.papel !== "slides");
              return (
                <div key={g.id ?? "unificada"}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-md px-3 py-1 font-display text-sm font-semibold text-white" style={{ background: cor }}>
                      {g.nome}
                    </span>
                    <span className="h-px flex-1" style={{ background: `${cor}40` }} />
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {[
                      { rotulo: "Slides da aula", itens: slides },
                      { rotulo: "Materiais de apoio", itens: apoioAula },
                    ].map((col) => (
                      <div key={col.rotulo}>
                        <div className="mb-1 text-[11px] font-semibold tracking-widest text-[#7A6648]">{col.rotulo.toUpperCase()}</div>
                        <GradeDeCapas compacta vazio={col.itens.length === 0}>
                          {col.itens.map((m) => (
                            <CartaoMaterial
                              key={m.id}
                              material={m}
                              corLombada={cor}
                              detalhe={detalheAula(m)}
                              editavel={podeEditarAula(m)}
                              mover={configMover}
                            />
                          ))}
                        </GradeDeCapas>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </PrateleiraMadeira>
      </div>
    </BuscaProvider>
  );
}
