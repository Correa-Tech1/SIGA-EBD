import { listarTurmas, listarModulos } from "@/lib/estrutura/queries";
import { listarMateriaisOficiais } from "@/lib/biblioteca/queries";
import { ListaMateriais } from "@/components/biblioteca/ListaMateriais";
import { UploadMaterialOficialForm } from "@/components/biblioteca/ClientForms";
import { getSessaoAtual } from "@/lib/auth/session";
import { listarMinhasTurmasIds } from "@/lib/frequencia/queries";

// Espaço da Coordenação: publica o material OFICIAL de cada módulo (ligado
// ao módulo, não à aula — por isso vive aqui e não em Frequência/Minha
// Turma, que é onde o professor publica o material DE_AULA de cada aula
// específica). Os dois têm origem diferente na tabela `materiais` (0001) e
// bucket/pasta diferentes no Storage (0005), mas a mesma leitura pública —
// tudo aparece junto pro aluno na Aba do Aluno.
// A página serve aos dois papéis: coordenação publica e apaga; professor só
// consulta e baixa (o material da própria aula ele envia em Minha Turma).
export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: { turma?: string };
}) {
  const [todasTurmas, sessao] = await Promise.all([listarTurmas(), getSessaoAtual()]);
  const podeEditar = sessao.role === "coordenacao";
  // professor: as turmas dele vêm primeiro
  const minhas = podeEditar ? [] : await listarMinhasTurmasIds();
  const turmas = [...todasTurmas].sort(
    (a, b) => Number(minhas.includes(b.id)) - Number(minhas.includes(a.id))
  );

  if (turmas.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">
          Biblioteca de Materiais
        </h1>
        <p className="mt-4 max-w-xl text-sm text-text-secondary">
          Nenhuma turma cadastrada ainda.
        </p>
      </div>
    );
  }

  const turmaAtual = turmas.find((t) => t.id === searchParams.turma) ?? turmas[0];
  const modulos = await listarModulos(turmaAtual.id);
  const materiaisPorModulo = await Promise.all(modulos.map((m) => listarMateriaisOficiais(m.id)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">
          Biblioteca de Materiais
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {podeEditar ? "Espaço da Coordenação — material oficial de cada módulo, público pra todo mundo." : "Material oficial de cada módulo, para consulta e download."}
        </p>
      </div>

      {turmas.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {turmas.map((t) => (
            <a
              key={t.id}
              href={`/biblioteca?turma=${t.id}`}
              className={`rounded-full px-4 py-1.5 text-sm ${
                t.id === turmaAtual.id
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-text-secondary"
              }`}
            >
              {t.nome}
            </a>
          ))}
        </div>
      )}

      {modulos.length === 0 && (
        <p className="rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
          Esta turma ainda não tem módulos — crie em Frequência → Estrutura do semestre.
        </p>
      )}

      {modulos.map((modulo, i) => (
        <div key={modulo.id} className="rounded-xl border border-border bg-surface p-5">
          <div className="font-display text-base font-semibold">
            Módulo {modulo.numero}
            {modulo.tema && <span className="font-normal text-text-secondary"> · {modulo.tema}</span>}
          </div>
          {modulo.livro_base && (
            <div className="text-xs text-text-secondary">Livro base: {modulo.livro_base}</div>
          )}
          <div className="mt-3">
            <ListaMateriais materiais={materiaisPorModulo[i]} podeApagar={podeEditar} />
          </div>
          {podeEditar && <UploadMaterialOficialForm moduloId={modulo.id} />}
        </div>
      ))}
    </div>
  );
}
