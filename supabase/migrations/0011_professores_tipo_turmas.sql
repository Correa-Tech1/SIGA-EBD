-- 0011 — Professor: tipo (regular/convidado) e vínculo com turma separado da escala.
--
-- Antes, "a turma do professor" era uma linha em `escalas` com a data do dia do
-- cadastro; isso fazia o professor aparecer escalado numa aula que ninguém marcou
-- e sujava a contagem de aulas dadas. Agora o vínculo mora em `professor_turmas`
-- e `escalas` guarda só quem deu (ou vai dar) aula em cada data.

alter table pessoas add column if not exists professor_tipo text
  check (professor_tipo in ('regular', 'convidado'));
update pessoas set professor_tipo = 'regular' where role = 'professor' and professor_tipo is null;

create table if not exists professor_turmas (
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  turma_id uuid not null references turmas(id) on delete cascade,
  primary key (pessoa_id, turma_id)
);

alter table professor_turmas enable row level security;

drop policy if exists professor_turmas_coordenacao_all on professor_turmas;
create policy professor_turmas_coordenacao_all on professor_turmas
  for all using (is_coordenacao()) with check (is_coordenacao());

drop policy if exists professor_turmas_le_proprio on professor_turmas;
create policy professor_turmas_le_proprio on professor_turmas
  for select using (pessoa_id = current_pessoa_id());

grant select, insert, update, delete on professor_turmas to authenticated;

-- 1) o que já existia como "turma do professor" vira vínculo
insert into professor_turmas (pessoa_id, turma_id)
select distinct e.pessoa_id, e.turma_id
from escalas e join pessoas p on p.id = e.pessoa_id
where p.role = 'professor'
on conflict do nothing;

-- 2) apaga as escalas-fantasma: as criadas no MESMO dia da própria data
--    (era o vínculo de turma gravado como se fosse uma aula marcada)
delete from escalas e
using pessoas p
where p.id = e.pessoa_id
  and p.role = 'professor'
  and e.data = (e.criado_em at time zone 'America/Sao_Paulo')::date;

-- 3) minhas_turmas(): vínculo fixo + escalas (convidado/substituto escalado também enxerga a turma)
create or replace function minhas_turmas()
returns setof uuid
language sql stable security definer
set search_path = public
as $$
  select turma_id from professor_turmas where pessoa_id = current_pessoa_id()
  union
  select turma_id from escalas where pessoa_id = current_pessoa_id();
$$;
