-- ============================================================================
-- SIGA EBD — 0007_ajustes_chamada.sql   (OPCIONAL, rode depois da 0006)
-- Correções manuais da chamada, tiradas do Relatório de Frequência de
-- 23/09/2026 (o relatório que serve de referência para o sistema). São
-- diferenças entre a planilha de frequência (docx) e o relatório:
--   • Matheus Corrêa .... presente na Classe de Homens em 02/08, 09/08 e 16/08
--   • Alessia Nascimento  presente na Classe de Mulheres em 09/08, 16/08 e 20/09;
--                         ausente em 06/09 (casamento)
--   • Jackson Moisés da Silva Oliveira: +1 presença na Classe de Homens em 23/08
--     (deduzido dos totais do relatório: pico de 12 em 23/08 e frequência 3)
-- Com isto o sistema reproduz exatamente os números do relatório.
-- Repetível: não duplica nada. Se rodar a 0006_carga_inicial de novo, rode esta depois.
-- ============================================================================

do $ajustes$
declare
  falta text;
begin
  create temp table _ajuste (classe text, data date, nome text, presente boolean) on commit drop;
  insert into _ajuste values
    ('Homens',   '2026-08-02', 'Matheus Corrêa', true),
    ('Homens',   '2026-08-09', 'Matheus Corrêa', true),
    ('Homens',   '2026-08-16', 'Matheus Corrêa', true),
    ('Mulheres', '2026-08-09', 'Alessia Nascimento', true),
    ('Mulheres', '2026-08-16', 'Alessia Nascimento', true),
    ('Mulheres', '2026-09-20', 'Alessia Nascimento', true),
    ('Mulheres', '2026-09-06', 'Alessia Nascimento', false),
    ('Homens',   '2026-08-23', 'Jackson Moisés da Silva Oliveira', true);

  select string_agg(distinct a.nome, ', ') into falta
    from _ajuste a
   where (select count(*) from pessoas p where lower(p.nome) = lower(a.nome)) <> 1;
  if falta is not null then
    raise exception 'Pessoa não encontrada (ou repetida): %. Rode a carga inicial antes.', falta;
  end if;

  -- garante matrícula de quem entra
  insert into matriculas (turma_id, pessoa_id, ativo)
  select distinct t.id, p.id, true
    from _ajuste a
    join semestres s on s.ano = 2026 and s.periodo = 2
    join turmas t on t.semestre_id = s.id and t.nome = a.classe
    join pessoas p on lower(p.nome) = lower(a.nome)
   where a.presente
  on conflict (turma_id, pessoa_id) do nothing;

  insert into presencas (aula_id, pessoa_id, status)
  select a2.id, p.id, 'presente'::presenca_status
    from _ajuste a
    join semestres s on s.ano = 2026 and s.periodo = 2
    join turmas t on t.semestre_id = s.id and t.nome = a.classe
    join modulos m on m.turma_id = t.id
    join aulas a2 on a2.modulo_id = m.id and a2.data = a.data
    join pessoas p on lower(p.nome) = lower(a.nome)
   where a.presente
  on conflict (aula_id, pessoa_id) do update set status = 'presente';

  delete from presencas pr
   using _ajuste a, semestres s, turmas t, modulos m, aulas a2, pessoas p
   where not a.presente
     and s.ano = 2026 and s.periodo = 2
     and t.semestre_id = s.id and t.nome = a.classe
     and m.turma_id = t.id
     and a2.modulo_id = m.id and a2.data = a.data
     and lower(p.nome) = lower(a.nome)
     and pr.aula_id = a2.id and pr.pessoa_id = p.id;

  drop table _ajuste;
end
$ajustes$;

-- Conferência: presentes por turma e data (Homens: 8,8,9,12,9,7,11 · Mulheres: 8,10,13,10,7,8,8)
select t.nome as turma, a.data, count(*) filter (where pr.status = 'presente') as presentes
from presencas pr
join aulas a on a.id = pr.aula_id
join modulos m on m.id = a.modulo_id
join turmas t on t.id = m.turma_id
where t.nome in ('Homens', 'Mulheres')
group by t.nome, a.data
order by t.nome, a.data;
