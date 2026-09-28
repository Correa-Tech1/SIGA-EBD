-- ============================================================================
-- SIGA EBD — 0002_rls.sql
-- Row Level Security: os 3 níveis de acesso vivem AQUI, no banco — não
-- espalhados pelo código da aplicação. Ver "Passo a passo para começar a
-- construir" na Proposta de Arquitetura para o racional completo.
--
--   1. Leitura (anon)     — sem login: materiais, avisos, estrutura de
--                           turmas/módulos/aulas/escalas. Nada de dado sensível.
--   2. Professor          — conta de verdade, mas só enxerga a(s) turma(s)
--                           que dá aula, e só edita o que é seu.
--   3. Coordenação        — acesso total a tudo.
--
-- ATENÇÃO — DECISÃO EM ABERTO (ver README "Decisões pendentes"): a "Aba do
-- Aluno" mostra o próprio histórico de presença sem exigir login. Como a
-- tabela `presencas` NUNCA é liberada para leitura anônima direta (mesmo
-- a de um único aluno teria o nome de quem mais estava na aula), a saída
-- adotada aqui é uma function pontual (`historico_de_presenca`) que devolve
-- só as linhas de UM pessoa_id por vez, sem expor a lista da turma. Isso é
-- "identificação leve" (o aluno escolhe o próprio nome numa lista), não uma
-- senha de verdade — presença é baixa sensibilidade, mas confirme com o
-- Matheus antes de ir pra produção.
-- ============================================================================

alter table pessoas    enable row level security;
alter table semestres  enable row level security;
alter table turmas     enable row level security;
alter table modulos    enable row level security;
alter table aulas      enable row level security;
alter table presencas  enable row level security;
alter table materiais  enable row level security;
alter table escalas    enable row level security;
alter table avaliacoes enable row level security;
alter table avisos     enable row level security;
alter table rascunhos  enable row level security;

-- ----------------------------------------------------------------------------
-- Helpers: quem está chamando, e com que papel
-- `security definer` + `stable` para poder ser usada dentro de policies sem
-- recursão nem custo de replanejar a cada linha.
-- ----------------------------------------------------------------------------
create or replace function current_pessoa_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select id from pessoas where auth_user_id = auth.uid();
$$;

create or replace function current_pessoa_role()
returns pessoa_role
language sql stable security definer
set search_path = public
as $$
  select role from pessoas where auth_user_id = auth.uid();
$$;

create or replace function is_coordenacao()
returns boolean language sql stable as $$
  select current_pessoa_role() = 'coordenacao';
$$;

create or replace function is_professor()
returns boolean language sql stable as $$
  select current_pessoa_role() = 'professor';
$$;

-- turmas em que o professor logado dá aula (join único, reaproveitado nas
-- policies abaixo em vez de repetir o subselect em cada tabela).
create or replace function minhas_turmas()
returns setof uuid
language sql stable security definer
set search_path = public
as $$
  select distinct turma_id from escalas where pessoa_id = current_pessoa_id();
$$;

-- ----------------------------------------------------------------------------
-- PESSOAS
-- Ninguém de fora vê a tabela inteira (tem telefone). Visão pública mínima
-- (id + nome) vive numa VIEW separada, ver final do arquivo.
-- ----------------------------------------------------------------------------
create policy pessoas_coordenacao_all on pessoas
  for all using (is_coordenacao()) with check (is_coordenacao());

create policy pessoas_self_select on pessoas
  for select using (auth_user_id = auth.uid());

create policy pessoas_professor_ve_turma on pessoas
  for select using (
    is_professor() and exists (
      select 1 from escalas e where e.turma_id in (select minhas_turmas()) and e.pessoa_id = pessoas.id
    )
  );

-- ----------------------------------------------------------------------------
-- SEMESTRES / TURMAS / MÓDULOS / AULAS — estrutura, baixa sensibilidade,
-- leitura liberada geral; escrita só coordenação (aulas também por professor
-- da própria turma, pra poder ajustar título/data da própria aula).
-- ----------------------------------------------------------------------------
create policy semestres_leitura_geral on semestres for select using (true);
create policy semestres_coordenacao_escreve on semestres for all
  using (is_coordenacao()) with check (is_coordenacao());

create policy turmas_leitura_geral on turmas for select using (true);
create policy turmas_coordenacao_escreve on turmas for all
  using (is_coordenacao()) with check (is_coordenacao());

create policy modulos_leitura_geral on modulos for select using (true);
create policy modulos_coordenacao_escreve on modulos for all
  using (is_coordenacao()) with check (is_coordenacao());

create policy aulas_leitura_geral on aulas for select using (true);
create policy aulas_coordenacao_escreve on aulas for all
  using (is_coordenacao()) with check (is_coordenacao());
create policy aulas_professor_ajusta_propria_turma on aulas for update
  using (
    is_professor() and modulo_id in (select id from modulos where turma_id in (select minhas_turmas()))
  );

-- ----------------------------------------------------------------------------
-- PRESENÇAS — nunca pública em bruto. Professor só lê/lança da própria
-- turma; coordenação, tudo.
-- ----------------------------------------------------------------------------
create policy presencas_coordenacao_all on presencas
  for all using (is_coordenacao()) with check (is_coordenacao());

create policy presencas_professor_propria_turma on presencas
  for all using (
    is_professor() and aula_id in (
      select a.id from aulas a join modulos m on m.id = a.modulo_id
      where m.turma_id in (select minhas_turmas())
    )
  )
  with check (
    is_professor() and aula_id in (
      select a.id from aulas a join modulos m on m.id = a.modulo_id
      where m.turma_id in (select minhas_turmas())
    )
  );

-- ----------------------------------------------------------------------------
-- MATERIAIS — leitura pública total (oficial + de_aula, conforme decidido).
-- Escrita: oficial só coordenação; de_aula só o professor da própria turma,
-- e só em nome dele mesmo (enviado_por = current_pessoa_id()).
-- ----------------------------------------------------------------------------
create policy materiais_leitura_geral on materiais for select using (true);

create policy materiais_coordenacao_all on materiais
  for all using (is_coordenacao()) with check (is_coordenacao());

create policy materiais_professor_insere_de_aula on materiais
  for insert with check (
    is_professor()
    and origem = 'de_aula'
    and enviado_por = current_pessoa_id()
    and aula_id in (
      select a.id from aulas a join modulos m on m.id = a.modulo_id
      where m.turma_id in (select minhas_turmas())
    )
  );

create policy materiais_professor_edita_proprio on materiais
  for update using (is_professor() and enviado_por = current_pessoa_id())
  with check (is_professor() and enviado_por = current_pessoa_id());

create policy materiais_professor_apaga_proprio on materiais
  for delete using (is_professor() and enviado_por = current_pessoa_id());

-- ----------------------------------------------------------------------------
-- ESCALAS — leitura pública (é calendário, não dado pessoal sensível);
-- escrita só coordenação.
-- ----------------------------------------------------------------------------
create policy escalas_leitura_geral on escalas for select using (true);
create policy escalas_coordenacao_escreve on escalas for all
  using (is_coordenacao()) with check (is_coordenacao());

-- ----------------------------------------------------------------------------
-- AVALIAÇÕES — internas: coordenação vê e escreve tudo; professor só lê a
-- própria.
-- ----------------------------------------------------------------------------
create policy avaliacoes_coordenacao_all on avaliacoes
  for all using (is_coordenacao()) with check (is_coordenacao());

create policy avaliacoes_professor_ve_propria on avaliacoes
  for select using (is_professor() and professor_id = current_pessoa_id());

-- ----------------------------------------------------------------------------
-- AVISOS — leitura pública (mural); escrita: coordenação em qualquer aviso,
-- professor só nos avisos da própria turma.
-- ----------------------------------------------------------------------------
create policy avisos_leitura_geral on avisos for select using (true);

create policy avisos_coordenacao_all on avisos
  for all using (is_coordenacao()) with check (is_coordenacao());

create policy avisos_professor_insere_propria_turma on avisos
  for insert with check (
    is_professor() and autor_id = current_pessoa_id()
    and (turma_id is null or turma_id in (select minhas_turmas()))
  );

-- ----------------------------------------------------------------------------
-- RASCUNHOS — 100% privado. Nem coordenação lê (é o espaço pessoal do
-- professor com o Auxílio ao Professor — ver decisão registrada na
-- Proposta de Arquitetura).
-- ----------------------------------------------------------------------------
create policy rascunhos_dono_all on rascunhos
  for all using (pessoa_id = current_pessoa_id())
  with check (pessoa_id = current_pessoa_id());

-- ----------------------------------------------------------------------------
-- Visão pública mínima de pessoas, pra rótulos ("Enviado por Fulano") sem
-- expor telefone/role/auth_user_id da tabela inteira.
-- ----------------------------------------------------------------------------
create view pessoas_publicas as
  select id, nome from pessoas;

grant select on pessoas_publicas to anon, authenticated;

-- ----------------------------------------------------------------------------
-- historico_de_presenca — RPC pontual pra Aba do Aluno (ver aviso no topo
-- do arquivo). SECURITY DEFINER pra poder ler `presencas` (que o anon não
-- pode ler diretamente) mas devolvendo só as linhas do pessoa_id pedido.
-- ----------------------------------------------------------------------------
create or replace function historico_de_presenca(p_pessoa_id uuid)
returns table (aula_id uuid, data date, status presenca_status)
language sql stable security definer
set search_path = public
as $$
  select p.aula_id, a.data, p.status
  from presencas p
  join aulas a on a.id = p.aula_id
  where p.pessoa_id = p_pessoa_id
  order by a.data;
$$;

grant execute on function historico_de_presenca(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Permissões de tabela por trás do RLS (Postgres exige GRANT + policy —
-- a policy sozinha não libera nada se a role não tiver o GRANT de base).
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on turmas, modulos, aulas, escalas, materiais, avisos, semestres to anon, authenticated;
grant select, insert, update, delete on pessoas, presencas, avaliacoes, rascunhos to authenticated;
grant insert, update, delete on materiais, avisos, aulas to authenticated;
grant all on semestres, turmas, modulos, escalas to authenticated;
