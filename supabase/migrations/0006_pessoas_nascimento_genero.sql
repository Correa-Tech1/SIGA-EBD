-- 0006 — data de nascimento e gênero das pessoas.
-- Alimentam o Relatório de Frequência: idade média por turma, faixas etárias
-- e o "público de referência" de cada turma (homens adultos, mulheres
-- adultas, 45+). São dados só da coordenação: a view `pessoas_publicas`
-- continua expondo apenas id e nome, então professor e aluno não os veem.

alter table pessoas add column if not exists data_nascimento date;
alter table pessoas add column if not exists genero text;

alter table pessoas drop constraint if exists pessoas_genero_check;
alter table pessoas add constraint pessoas_genero_check check (genero in ('M', 'F'));
