-- ============================================================================
-- SIGA EBD — 0001_schema.sql
-- Modelo de dados central, espelhando o diagrama da Proposta de Arquitetura.
-- Entidades: pessoas, semestres, turmas, modulos, aulas, presencas, materiais,
-- escalas, avaliacoes, avisos, rascunhos.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- PESSOAS
-- Todo mundo que passa pela EBD entra aqui: membros, visitantes, professores
-- e a coordenação. `auth_user_id` só existe pra quem tem CONTA DE VERDADE
-- (professor ou coordenação) — membro/visitante comuns não logam, então
-- ficam com auth_user_id nulo.
-- ----------------------------------------------------------------------------
create type pessoa_role as enum ('coordenacao', 'professor');
create type pessoa_tipo as enum ('membro', 'visitante');

create table pessoas (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  nome text not null,
  tipo pessoa_tipo not null default 'membro',
  role pessoa_role, -- null = pessoa comum (aluno/membro), sem login
  telefone text,
  criado_em timestamptz not null default now()
);

create unique index pessoas_auth_user_id_key on pessoas(auth_user_id) where auth_user_id is not null;
create index pessoas_role_idx on pessoas(role);

comment on table pessoas is 'Toda pessoa conhecida pela EBD. auth_user_id só é preenchido para quem tem conta (professor/coordenação).';
comment on column pessoas.role is 'null = leitura/aluno (sem login). professor ou coordenacao = conta de verdade.';

-- ----------------------------------------------------------------------------
-- SEMESTRES / TURMAS / MÓDULOS / AULAS
-- ----------------------------------------------------------------------------
create table semestres (
  id uuid primary key default gen_random_uuid(),
  ano int not null,
  periodo smallint not null check (periodo in (1, 2)),
  data_inicio date,
  data_fim date,
  ativo boolean not null default false,
  unique (ano, periodo)
);

create table turmas (
  id uuid primary key default gen_random_uuid(),
  semestre_id uuid not null references semestres(id) on delete cascade,
  nome text not null,        -- ex: "Homens", "Mulheres", "Panorama Bíblico", "Adolescentes"
  titulo text,                -- ex: "Sucesso em Crise"
  criado_em timestamptz not null default now()
);

create index turmas_semestre_idx on turmas(semestre_id);

create table modulos (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas(id) on delete cascade,
  numero smallint not null check (numero in (1, 2)),
  tema text,
  livro_base text,
  data_inicio date,
  data_fim date,
  unique (turma_id, numero)
);

create table aulas (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references modulos(id) on delete cascade,
  data date not null,
  titulo text,
  professor_id uuid references pessoas(id) on delete set null,
  criado_em timestamptz not null default now()
);

create index aulas_modulo_idx on aulas(modulo_id);
create index aulas_data_idx on aulas(data);

-- ----------------------------------------------------------------------------
-- PRESENÇA
-- ----------------------------------------------------------------------------
create type presenca_status as enum ('presente', 'ausente');

create table presencas (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references aulas(id) on delete cascade,
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  status presenca_status not null,
  registrado_por uuid references pessoas(id) on delete set null,
  registrado_em timestamptz not null default now(),
  unique (aula_id, pessoa_id)
);

create index presencas_pessoa_idx on presencas(pessoa_id);
create index presencas_aula_idx on presencas(aula_id);

-- ----------------------------------------------------------------------------
-- MATERIAL
-- origem 'oficial'  -> ligado ao módulo, publicado pela coordenação (Espaço da Coordenação)
-- origem 'de_aula'  -> ligado à aula, subido pelo professor depois (Espaço do Professor)
-- ----------------------------------------------------------------------------
create type material_origem as enum ('oficial', 'de_aula');

create table materiais (
  id uuid primary key default gen_random_uuid(),
  origem material_origem not null,
  modulo_id uuid references modulos(id) on delete cascade,
  aula_id uuid references aulas(id) on delete cascade,
  enviado_por uuid references pessoas(id) on delete set null,
  titulo text not null,
  tipo_arquivo text not null,   -- 'pdf' | 'docx' | 'pptx' | 'mp3' | 'link' ...
  caminho_arquivo text not null, -- caminho no Supabase Storage, ou URL externa
  criado_em timestamptz not null default now(),
  constraint material_tem_contexto check (
    (origem = 'oficial' and modulo_id is not null) or
    (origem = 'de_aula' and aula_id is not null)
  )
);

create index materiais_modulo_idx on materiais(modulo_id);
create index materiais_aula_idx on materiais(aula_id);

-- ----------------------------------------------------------------------------
-- ESCALA
-- ----------------------------------------------------------------------------
create type escala_tipo as enum ('regular', 'convidado', 'substituicao');

create table escalas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas(id) on delete cascade,
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  data date not null,
  tipo escala_tipo not null default 'regular',
  criado_em timestamptz not null default now()
);

create index escalas_turma_idx on escalas(turma_id);
create index escalas_pessoa_idx on escalas(pessoa_id);

-- ----------------------------------------------------------------------------
-- AVALIAÇÃO (Ficha de Avaliação do Coordenador)
-- ----------------------------------------------------------------------------
create table avaliacoes (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas(id) on delete cascade,
  professor_id uuid not null references pessoas(id) on delete cascade,
  semestre_id uuid not null references semestres(id) on delete cascade,
  nota smallint,
  comentario text,
  criado_por uuid references pessoas(id) on delete set null,
  criado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AVISO
-- turma_id nulo = aviso geral (mural de todos)
-- ----------------------------------------------------------------------------
create table avisos (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid references turmas(id) on delete cascade,
  autor_id uuid references pessoas(id) on delete set null,
  conteudo text not null,
  criado_em timestamptz not null default now()
);

create index avisos_turma_idx on avisos(turma_id);

-- ----------------------------------------------------------------------------
-- RASCUNHO
-- Espaço pessoal do professor com o Auxílio ao Professor. NUNCA visível a
-- ninguém além de quem escreveu (nem a outros professores, nem à coordenação) —
-- só vira Material se o próprio professor decidir subir manualmente.
-- ----------------------------------------------------------------------------
create table rascunhos (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  modulo_id uuid references modulos(id) on delete set null,
  aula_id uuid references aulas(id) on delete set null,
  titulo text not null,
  conteudo jsonb not null default '{}'::jsonb, -- histórico da conversa com o Auxílio ao Professor
  arquivos_gerados jsonb not null default '[]'::jsonb, -- [{titulo, tipo, caminho}]
  atualizado_em timestamptz not null default now()
);

create index rascunhos_pessoa_idx on rascunhos(pessoa_id);

-- ----------------------------------------------------------------------------
-- Gatilho simples para manter `atualizado_em` de rascunhos em dia
-- ----------------------------------------------------------------------------
create or replace function set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger rascunhos_set_atualizado_em
  before update on rascunhos
  for each row execute function set_atualizado_em();
