-- ============================================================================
-- SIGA EBD — 0005_storage_materiais.sql
--
-- Bucket de Storage para os arquivos da Biblioteca. A tabela `materiais`
-- (0001) já guarda o metadado (título, origem, quem enviou); este arquivo
-- cuida de onde o ARQUIVO em si mora e quem pode subir/apagar cada um.
--
-- Convenção de caminho dentro do bucket (usada pelo código em
-- src/lib/biblioteca/actions.ts):
--   oficial/<modulo_id>/<arquivo>   — Espaço da Coordenação
--   de_aula/<aula_id>/<arquivo>     — Espaço do Professor
-- O primeiro segmento do caminho (storage.foldername(name)[1]) é o que as
-- policies abaixo usam pra decidir quem pode escrever onde — mesma lógica
-- de "professor só na própria turma" que já existe em 0002_rls.sql para a
-- tabela `materiais`, agora replicada para os OBJETOS do Storage (são dois
-- sistemas de RLS separados: um pra linha da tabela, outro pro arquivo).
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('materiais', 'materiais', true)
on conflict (id) do nothing;

-- Supabase já habilita RLS em storage.objects por padrão; garantir aqui é
-- inofensivo (idempotente) caso o projeto tenha sido criado de outro jeito.
alter table storage.objects enable row level security;

-- Leitura: pública de verdade (bucket "public" já serve os arquivos direto
-- por URL, sem passar por RLS nenhum — mas a policy de SELECT continua
-- valendo pra quem lista via API/SDK, então mantemos as duas coisas
-- alinhadas: "leitura pública total" como já decidido para `materiais`).
create policy materiais_bucket_leitura_publica on storage.objects
  for select using (bucket_id = 'materiais');

-- Coordenação: acesso total (upload em qualquer módulo/aula, apagar
-- qualquer material — inclusive de_aula de qualquer professor).
create policy materiais_bucket_coordenacao_all on storage.objects
  for all using (bucket_id = 'materiais' and is_coordenacao())
  with check (bucket_id = 'materiais' and is_coordenacao());

-- Professor: só pode ENVIAR dentro de "de_aula/<aula_id>/..." e só se essa
-- aula for de uma turma em que ele está escalado — mesmo subselect que a
-- policy `materiais_professor_insere_de_aula` já usa na tabela.
create policy materiais_bucket_professor_insere_de_aula on storage.objects
  for insert with check (
    bucket_id = 'materiais'
    and is_professor()
    and (storage.foldername(name))[1] = 'de_aula'
    and (storage.foldername(name))[2] is not null
    and (storage.foldername(name))[2]::uuid in (
      select a.id from aulas a join modulos m on m.id = a.modulo_id
      where m.turma_id in (select minhas_turmas())
    )
  );

-- Professor: só apaga/atualiza o que ELE MESMO subiu (owner = quem fez o
-- upload, preenchido automaticamente pelo Storage).
create policy materiais_bucket_professor_gerencia_proprio on storage.objects
  for update using (bucket_id = 'materiais' and is_professor() and owner = auth.uid())
  with check (bucket_id = 'materiais' and is_professor() and owner = auth.uid());

create policy materiais_bucket_professor_apaga_proprio on storage.objects
  for delete using (bucket_id = 'materiais' and is_professor() and owner = auth.uid());
