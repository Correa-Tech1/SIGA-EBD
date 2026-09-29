-- 0010 — Mesa de Preparo (Auxílio ao Professor por aula).
-- `preparos` guarda SÓ o andamento (status) de cada aula em preparo, para a
-- coordenação enxergar a "prontidão de domingo". O conteúdo (texto das
-- etapas e a conversa) continua em `rascunhos.conteudo`, que segue privado.

create table if not exists preparos (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  turma_id uuid not null references turmas(id) on delete cascade,
  data date not null,
  titulo text not null,
  rascunho_id uuid references rascunhos(id) on delete set null,
  etapas_prontas int not null default 0,
  etapas_total int not null default 6,
  slides_gerados boolean not null default false,
  atualizado_em timestamptz not null default now(),
  unique (pessoa_id, turma_id, data)
);

create index if not exists preparos_data_idx on preparos(data);

drop trigger if exists preparos_set_atualizado_em on preparos;
create trigger preparos_set_atualizado_em
  before update on preparos
  for each row execute function set_atualizado_em();

alter table preparos enable row level security;

drop policy if exists preparos_dono_all on preparos;
create policy preparos_dono_all on preparos
  for all using (pessoa_id = current_pessoa_id())
  with check (pessoa_id = current_pessoa_id());

drop policy if exists preparos_coordenacao_le on preparos;
create policy preparos_coordenacao_le on preparos
  for select using (is_coordenacao());

grant select, insert, update, delete on preparos to authenticated;
