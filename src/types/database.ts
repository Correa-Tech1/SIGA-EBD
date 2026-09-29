// Tipos escritos à mão, espelhando supabase/migrations/0001_schema.sql, no
// mesmo formato que `supabase gen types typescript` gera — assim, trocar
// este arquivo pelo gerado automaticamente depois é uma troca direta, sem
// precisar ajustar nenhum import em nenhum outro lugar do código:
//
//   npx supabase gen types typescript --project-id <seu-projeto> > src/types/database.ts

export type PessoaRole = "coordenacao" | "professor";
export type PessoaTipo = "membro" | "visitante";
export type PresencaStatus = "presente" | "ausente";
export type MaterialOrigem = "oficial" | "de_aula";
export type EscalaTipo = "regular" | "convidado" | "substituicao";

type Tabela<Row, InsertExtra extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, InsertExtra>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      pessoas: Tabela<
        {
          id: string;
          auth_user_id: string | null;
          nome: string;
          tipo: PessoaTipo;
          role: PessoaRole | null;
          telefone: string | null;
          data_nascimento: string | null;
          genero: "M" | "F" | null;
          professor_tipo: "regular" | "convidado" | null;
          senha_cifrada: string | null;
          criado_em: string;
        },
        "nome"
      >;
      semestres: Tabela<
        {
          id: string;
          ano: number;
          periodo: 1 | 2;
          data_inicio: string | null;
          data_fim: string | null;
          ativo: boolean;
        },
        "ano" | "periodo"
      >;
      turmas: Tabela<
        {
          id: string;
          semestre_id: string;
          nome: string;
          titulo: string | null;
          criado_em: string;
        },
        "semestre_id" | "nome"
      >;
      modulos: Tabela<
        {
          id: string;
          turma_id: string;
          numero: 1 | 2;
          tema: string | null;
          livro_base: string | null;
          data_inicio: string | null;
          data_fim: string | null;
        },
        "turma_id" | "numero"
      >;
      aulas: Tabela<
        {
          id: string;
          modulo_id: string;
          data: string;
          titulo: string | null;
          professor_id: string | null;
          criado_em: string;
        },
        "modulo_id" | "data"
      >;
      presencas: Tabela<
        {
          id: string;
          aula_id: string;
          pessoa_id: string;
          status: PresencaStatus;
          registrado_por: string | null;
          registrado_em: string;
        },
        "aula_id" | "pessoa_id" | "status"
      >;
      materiais: Tabela<
        {
          id: string;
          origem: MaterialOrigem;
          modulo_id: string | null;
          aula_id: string | null;
          enviado_por: string | null;
          titulo: string;
          tipo_arquivo: string;
          caminho_arquivo: string;
          categoria: "livro" | "institucional" | "aula";
          turma_id: string | null;
          papel: "slides" | "apoio" | null;
          criado_em: string;
        },
        "origem" | "titulo" | "tipo_arquivo" | "caminho_arquivo"
      >;
      escalas: Tabela<
        {
          id: string;
          turma_id: string;
          pessoa_id: string;
          data: string;
          tipo: EscalaTipo;
          criado_em: string;
        },
        "turma_id" | "pessoa_id" | "data"
      >;
      avaliacoes: Tabela<
        {
          id: string;
          turma_id: string;
          professor_id: string;
          semestre_id: string;
          nota: number | null;
          comentario: string | null;
          criado_por: string | null;
          criado_em: string;
        },
        "turma_id" | "professor_id" | "semestre_id"
      >;
      avisos: Tabela<
        {
          id: string;
          turma_id: string | null;
          autor_id: string | null;
          conteudo: string;
          criado_em: string;
        },
        "conteudo"
      >;
      rascunhos: Tabela<
        {
          id: string;
          pessoa_id: string;
          modulo_id: string | null;
          aula_id: string | null;
          titulo: string;
          conteudo: Record<string, unknown>;
          arquivos_gerados: unknown[];
          atualizado_em: string;
        },
        "pessoa_id" | "titulo"
      >;
      professor_turmas: Tabela<
        {
          pessoa_id: string;
          turma_id: string;
        },
        "pessoa_id" | "turma_id"
      >;
      preparos: Tabela<
        {
          id: string;
          pessoa_id: string;
          turma_id: string;
          data: string;
          titulo: string;
          rascunho_id: string | null;
          etapas_prontas: number;
          etapas_total: number;
          slides_gerados: boolean;
          atualizado_em: string;
        },
        "pessoa_id" | "turma_id" | "data" | "titulo"
      >;
      matriculas: Tabela<
        {
          id: string;
          turma_id: string;
          pessoa_id: string;
          ativo: boolean;
          criado_em: string;
        },
        "turma_id" | "pessoa_id"
      >;
    };
    Views: {
      pessoas_publicas: {
        Row: {
          id: string;
          nome: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      historico_de_presenca: {
        Args: { p_pessoa_id: string };
        Returns: { aula_id: string; data: string; status: PresencaStatus }[];
      };
      minhas_turmas: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
    Enums: {
      pessoa_role: PessoaRole;
      pessoa_tipo: PessoaTipo;
      presenca_status: PresencaStatus;
      material_origem: MaterialOrigem;
      escala_tipo: EscalaTipo;
    };
    CompositeTypes: Record<string, never>;
  };
}
