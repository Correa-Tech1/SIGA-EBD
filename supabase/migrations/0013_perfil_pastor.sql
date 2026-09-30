-- 0013 — Perfil do Pastor: vê tudo (relatórios, frequência, escalas, Biblioteca,
-- funcionamento), não altera nada. Só policies de LEITURA; nenhuma de escrita.

alter type pessoa_role add value if not exists 'pastor';

create or replace function is_pastor()
returns boolean language sql stable as $$
  select current_pessoa_role()::text = 'pastor';
$$;

drop policy if exists pessoas_pastor_le on pessoas;
create policy pessoas_pastor_le on pessoas for select using (is_pastor());

drop policy if exists presencas_pastor_le on presencas;
create policy presencas_pastor_le on presencas for select using (is_pastor());

drop policy if exists matriculas_pastor_le on matriculas;
create policy matriculas_pastor_le on matriculas for select using (is_pastor());

drop policy if exists avaliacoes_pastor_le on avaliacoes;
create policy avaliacoes_pastor_le on avaliacoes for select using (is_pastor());

drop policy if exists preparos_pastor_le on preparos;
create policy preparos_pastor_le on preparos for select using (is_pastor());

drop policy if exists professor_turmas_pastor_le on professor_turmas;
create policy professor_turmas_pastor_le on professor_turmas for select using (is_pastor());
