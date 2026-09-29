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
