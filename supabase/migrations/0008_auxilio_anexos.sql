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
