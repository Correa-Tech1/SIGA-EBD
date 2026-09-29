import { urlPublicaMaterial, type Material } from "@/lib/biblioteca/queries";
import { BotaoApagarMaterial } from "./ClientForms";
import { TituloMaterial, type ConfigMover } from "./TituloMaterial";

const ICONE_POR_TIPO: Record<string, string> = {
  pdf: "📄",
  docx: "📝",
  doc: "📝",
  pptx: "📊",
  ppt: "📊",
  mp3: "🎧",
  mp4: "🎬",
  jpg: "🖼️",
  jpeg: "🖼️",
  png: "🖼️",
};

// Puramente apresentacional (Server Component) — a única parte interativa
// (apagar) é isolada no BotaoApagarMaterial, então esta lista pode ser
// reaproveitada tanto na visão pública (aba-aluno, sem botão de apagar)
// quanto na de gestão (biblioteca/minha-turma, com botão).
export function ListaMateriais({
  materiais,
  podeApagar,
  detalhe,
  mover,
}: {
  // habilita “mover” de prateleira (só a Biblioteca passa isto)
  mover?: ConfigMover;
  materiais: Material[];
  // Booleano simples (tudo ou nada) ou uma função pra decidir por material —
  // usada quando professor só pode apagar o que ele mesmo enviou, mas
  // coordenação pode apagar qualquer um (mesma regra do RLS, só que também
  // refletida na UI pra não mostrar um botão que o banco recusaria).
  podeApagar: boolean | ((material: Material) => boolean);
  // linha pequena sob o título (ex.: “Homens · por Fulano · 12/09”)
  detalhe?: (material: Material) => string;
}) {
  if (materiais.length === 0) {
    return <p className="text-sm text-text-secondary">Nenhum material aqui ainda.</p>;
  }

  return (
    <div className="rounded-lg border border-border-light">
      {materiais.map((material, i) => {
        const apagavel = typeof podeApagar === "function" ? podeApagar(material) : podeApagar;
        return (
          <div
            key={material.id}
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              i > 0 ? "border-t border-border-light" : ""
            }`}
          >
            <TituloMaterial
              materialId={material.id}
              titulo={material.titulo}
              href={urlPublicaMaterial(material.caminho_arquivo)}
              icone={ICONE_POR_TIPO[material.tipo_arquivo] ?? "📎"}
              detalhe={detalhe?.(material)}
              editavel={apagavel}
              mover={mover}
              atual={{ categoria: material.categoria, turmaId: material.turma_id, papel: material.papel }}
            />
            {apagavel && <BotaoApagarMaterial materialId={material.id} />}
          </div>
        );
      })}
    </div>
  );
}
