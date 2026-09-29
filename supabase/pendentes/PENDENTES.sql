-- ============================================================================
-- SIGA EBD — SQL PENDENTE (rode UMA vez no SQL Editor do Supabase: cole tudo e Run)
-- Junta as migrações 0007, 0008 e 0009, nesta ordem. Pode rodar de novo sem estragar.
-- ============================================================================

-- ==================== 0007_biblioteca_categorias.sql ====================
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


-- ==================== 0008_auxilio_anexos.sql ====================
-- 0008 — anexos do Auxílio ao Professor.
-- Bucket PRIVADO 'auxilio': cada pessoa (professor ou coordenação) só enxerga,
-- envia e apaga arquivos dentro da própria pasta  <id da pessoa>/...
-- (diferente do bucket 'materiais', que é público de propósito).

insert into storage.buckets (id, name, public)
values ('auxilio', 'auxilio', false)
on conflict (id) do nothing;

drop policy if exists auxilio_bucket_dono_le on storage.objects;
create policy auxilio_bucket_dono_le on storage.objects
  for select using (
    bucket_id = 'auxilio'
    and (storage.foldername(name))[1] = current_pessoa_id()::text
  );

drop policy if exists auxilio_bucket_dono_envia on storage.objects;
create policy auxilio_bucket_dono_envia on storage.objects
  for insert with check (
    bucket_id = 'auxilio'
    and (is_professor() or is_coordenacao())
    and (storage.foldername(name))[1] = current_pessoa_id()::text
  );

drop policy if exists auxilio_bucket_dono_apaga on storage.objects;
create policy auxilio_bucket_dono_apaga on storage.objects
  for delete using (
    bucket_id = 'auxilio'
    and (storage.foldername(name))[1] = current_pessoa_id()::text
  );


-- ==================== 0009_biblioteca_aulas_turma_papel.sql ====================
-- 0009 — Aulas da Biblioteca separadas por TURMA e por PAPEL:
--   slides  = os slides da aula
--   apoio   = material de apoio à aula (estudo, roteiro, texto, áudio…)

alter table materiais add column if not exists papel text;
alter table materiais drop constraint if exists materiais_papel_check;
alter table materiais add constraint materiais_papel_check check (papel in ('slides', 'apoio'));

-- material de aula que já existia: descobre a turma pela aula e o papel pelo tipo do arquivo
update materiais m
   set turma_id = mo.turma_id
  from aulas a
  join modulos mo on mo.id = a.modulo_id
 where m.aula_id = a.id and m.turma_id is null;

update materiais
   set papel = case when tipo_arquivo in ('pptx', 'ppt') then 'slides' else 'apoio' end
 where categoria = 'aula' and papel is null;
