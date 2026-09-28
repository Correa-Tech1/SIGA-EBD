-- ============================================================================
-- SIGA EBD — 0003_matriculas.sql
--
-- GAP encontrado ao implementar Frequência: o modelo original (0001) liga
-- pessoa a turma só de dois jeitos indiretos — via `escalas` (quem DÁ aula)
-- ou via `presencas` (depois que a chamada já foi lançada uma vez). Não
-- existia uma lista de "quem está matriculado nesta turma" pra montar a
-- tela de chamada da primeira vez. `matriculas` fecha essa lacuna.
-- ============================================================================

create table matriculas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas(id) on delete cascade,
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (turma_id, pessoa_id)
);

create index matriculas_turma_idx on matriculas(turma_id);
create index matriculas_pessoa_idx on matriculas(pessoa_id);

alter table matriculas enable row level security;

-- Mesmo padrão das outras tabelas de estrutura: coordenação lê/escreve tudo;
-- professor lê a matrícula da(s) própria(s) turma(s) (precisa pra montar a
-- lista de chamada), mas não edita quem está matriculado — isso é decisão
-- da coordenação, não do professor.
create policy matriculas_coordenacao_all on matriculas
  for all using (is_coordenacao()) with check (is_coordenacao());

create policy matriculas_professor_ve_propria_turma on matriculas
  for select using (is_professor() and turma_id in (select minhas_turmas()));

grant select on matriculas to authenticated;
grant all on matriculas to authenticated; -- refinado pelas policies acima
