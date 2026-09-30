import { carregarRelatorio, hojeIso } from "@/lib/relatorio/dados";
import { carregarProfessores } from "@/lib/coordenacao/dados";
import { proximosDomingos } from "@/lib/auxilio/mesa";
import { SecaoProfessores } from "@/components/coordenacao/SecaoProfessores";
import { SecaoProfessorFrequencia } from "@/components/coordenacao/SecaoProfessorFrequencia";
import { frequenciaPorProfessor } from "@/lib/coordenacao/professor-frequencia";
import { SecaoFrequencia } from "@/components/coordenacao/SecaoFrequencia";
import { SecaoPerfil } from "@/components/coordenacao/SecaoPerfil";
import { SecaoMovimento } from "@/components/coordenacao/SecaoMovimento";

// Painel da coordenação: quem está dando aula e usando a plataforma, e a
// leitura mais funda da frequência (quem é fiel, quem parou, quem nunca veio,
// como o público mudou e quem trocou de turma). Só coordenação chega aqui
// (layout do grupo (coordenacao)).
export default async function CoordenacaoPage() {
  const hoje = hojeIso();
  const [{ relatorio: r, semestre }, prof] = await Promise.all([
    carregarRelatorio(),
    carregarProfessores(hoje, proximosDomingos(hoje, 1)[0]),
  ]);

  const nomes = new Map(prof.linhas.map((l) => [l.id, l.nome]));
  const profFreq = frequenciaPorProfessor(r, prof.escalasAno, nomes);
  const periodo = semestre ? `${semestre.periodo}º semestre de ${semestre.ano}` : "Semestre atual";
  const secoes = [
    { id: "professores", rotulo: "Professores" },
    { id: "frequencia", rotulo: "Frequência" },
    { id: "professor-frequencia", rotulo: "Professor × frequência" },
    { id: "perfil", rotulo: "Perfil do público" },
    { id: "movimento", rotulo: "Movimento entre turmas" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Coordenação</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Controle de professores e análise mais funda da frequência · {periodo} · {r.aulas}{" "}
          {r.aulas === 1 ? "domingo" : "domingos"} com chamada
        </p>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Seções">
          {secoes.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-text-secondary hover:border-primary hover:text-primary"
            >
              {s.rotulo}
            </a>
          ))}
        </nav>
      </div>

      <SecaoProfessores id="professores" dados={prof} hoje={hoje} />
      <SecaoFrequencia id="frequencia" r={r} />
      <SecaoProfessorFrequencia id="professor-frequencia" linhas={profFreq} />
      <SecaoPerfil id="perfil" r={r} />
      <SecaoMovimento id="movimento" r={r} />
    </div>
  );
}
