import { urlPublicaMaterial, type Material } from "@/lib/biblioteca/queries";
import { BotaoApagarMaterial } from "./ClientForms";
import { Filtravel } from "./Busca";
import { IconeArquivo, tipoVisual } from "./IconesBiblioteca";
import { TituloMaterial, type ConfigMover } from "./TituloMaterial";

// Um material como “capa de livro na prateleira”: capa colorida pelo tipo do
// arquivo (símbolo + extensão), lombada com a cor da prateleira, título e ações.
export function CartaoMaterial({
  material,
  corLombada,
  detalhe,
  editavel,
  mover,
}: {
  material: Material;
  corLombada: string;
  detalhe?: string;
  editavel: boolean;
  mover?: ConfigMover;
}) {
  const v = tipoVisual(material.tipo_arquivo);
  const href = urlPublicaMaterial(material.caminho_arquivo);
  return (
    <Filtravel titulo={material.titulo}>
      <article className="group relative flex overflow-hidden rounded-lg border border-[#D9CDB8] bg-white shadow-[0_2px_0_rgba(90,60,30,0.12)] transition hover:-translate-y-1 hover:shadow-lg">
        <div className="w-2 shrink-0" style={{ background: corLombada }} aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col">
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Abrir ${material.titulo}`}
            className="relative flex h-24 items-center justify-center"
            style={{ background: v.fundo, color: v.cor }}
          >
            <IconeArquivo tipo={material.tipo_arquivo} tamanho={44} />
            <span
              className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white"
              style={{ background: v.cor }}
            >
              {v.rotulo}
            </span>
          </a>
          <div className="flex flex-1 flex-col p-3">
            <TituloMaterial
              variante="cartao"
              materialId={material.id}
              titulo={material.titulo}
              href={href}
              icone={null}
              detalhe={detalhe}
              editavel={editavel}
              mover={mover}
              atual={{ categoria: material.categoria, turmaId: material.turma_id, papel: material.papel }}
            />
            {editavel && (
              <div className="mt-2 border-t border-border-light pt-2 text-right">
                <BotaoApagarMaterial materialId={material.id} />
              </div>
            )}
          </div>
        </div>
      </article>
    </Filtravel>
  );
}
