-- 0007 — Biblioteca em 3 prateleiras: Livros · Materiais Institucionais · Aulas.
--   livro          -> só a coordenação publica e remove
--   institucional  -> só a coordenação publica e remove
--   aula           -> professor publica (e remove o que enviou); coordenação, tudo
-- Leitura continua pública (coordenação, professores e alunos veem tudo).
-- Material de aula deixa de exigir uma data/aula específica: o professor
-- publica direto, opcionalmente ligando a uma turma.

alter table materiais add column if not exists categoria text not null default 'aula';
alter table materiais add column if not exists turma_id uuid references turmas(id) on delete set null;

alter table materiais drop constraint if exists materiais_categoria_check;
alter table materiais add constraint materiais_categoria_check
  check (categoria in ('livro', 'institucional', 'aula'));

-- o que já era "oficial" vira institucional (a coordenação move para Livros ao republicar, se quiser)
update materiais set categoria = 'institucional' where origem = 'oficial' and categoria = 'aula';

-- material de aula avulso não tem aula_id/modulo_id
alter table materiais drop constraint if exists material_tem_contexto;

create index if not exists materiais_categoria_idx on materiais(categoria);

-- Professor publica AULA na biblioteca em nome próprio (sem precisar de aula_id)
drop policy if exists materiais_professor_insere_aula_biblioteca on materiais;
create policy materiais_professor_insere_aula_biblioteca on materiais
  for insert with check (
    is_professor()
    and categoria = 'aula'
    and enviado_por = current_pessoa_id()
  );

-- Storage: professor envia para aulas/<id da própria pessoa>/...
drop policy if exists materiais_bucket_professor_insere_aulas on storage.objects;
create policy materiais_bucket_professor_insere_aulas on storage.objects
  for insert with check (
    bucket_id = 'materiais'
    and is_professor()
    and (storage.foldername(name))[1] = 'aulas'
    and (storage.foldername(name))[2] = current_pessoa_id()::text
  );
