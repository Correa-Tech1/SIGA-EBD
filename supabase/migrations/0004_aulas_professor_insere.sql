-- ============================================================================
-- SIGA EBD — 0004_aulas_professor_insere.sql
--
-- GAP encontrado ao implementar Frequência de verdade: 0002_rls.sql só
-- deixava o professor ATUALIZAR uma aula (aulas_professor_ajusta_propria_turma),
-- nunca CRIAR uma. Na prática isso obrigaria a coordenação a criar, toda
-- semana, a linha de "aula" de cada turma antes de qualquer professor poder
-- lançar presença — o que não é o fluxo real (o professor lança a presença
-- do próprio domingo, sem depender de ninguém). Esta migration fecha isso.
-- ============================================================================

create policy aulas_professor_insere_propria_turma on aulas for insert
  with check (
    is_professor()
    and modulo_id in (select id from modulos where turma_id in (select minhas_turmas()))
  );
