-- 0012 — senha do professor guardada CIFRADA (AES-256-GCM, chave só no servidor),
-- para a coordenação poder consultá-la depois. Quem lê o banco vê só texto cifrado.
alter table pessoas add column if not exists senha_cifrada text;
