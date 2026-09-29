-- ============================================================================
-- SIGA EBD — 0006_carga_inicial.sql (versão 3)
-- Carga inicial: cadastro de membros (Gestão de Membresia, 23/09/2026) e as
-- chamadas já feitas de 02/08 a 20/09/2026 (planilha FREQUENCIA EBD POR
-- CLASSES E DATAS).
--
-- Rode (é seguro rodar de novo; corrige a versão anterior) no SQL Editor do Supabase (cole tudo e clique em Run).
-- Toda a carga é UM ÚNICO bloco (do $carga$ ... $carga$): ou grava tudo, ou
-- não grava nada. É repetível: rodar de novo não duplica pessoa, aula,
-- matrícula nem presença.
-- Se algum nome da chamada não achar pessoa, ou achar duas, o bloco PARA com
-- a lista dos nomes — corrija e rode de novo.
--
-- Da planilha de membros vêm só nome, telefone, data de nascimento e gênero;
-- CPF, endereço e demais dados pessoais NÃO são carregados.
-- PRÉ-REQUISITO: rodar antes a migração 0006_pessoas_nascimento_genero.sql.
-- ============================================================================

do $carga$
declare
  sem_pessoa text;
  duplicados text;
  r record;
  id_novo uuid;
  id_velho uuid;
begin

  -- 1) Turma Panorama Bíblico (terceira turma) + módulo 1, se ainda não existir
  insert into turmas (semestre_id, nome, titulo)
  select s.id, 'Panorama Bíblico', null
  from semestres s
  where s.ano = 2026 and s.periodo = 2
    and not exists (
      select 1 from turmas t where t.semestre_id = s.id and t.nome = 'Panorama Bíblico'
    );

  insert into modulos (turma_id, numero, tema)
  select t.id, 1, null
  from turmas t
  join semestres s on s.id = t.semestre_id
  where s.ano = 2026 and s.periodo = 2 and t.nome = 'Panorama Bíblico'
    and not exists (select 1 from modulos m where m.turma_id = t.id and m.numero = 1);

  -- 2) Membros (313, todos do cadastro).
  --    Quem já existe (mesmo nome, sem diferenciar maiúscula) é mantido como
  --    está — por exemplo a sua conta de coordenação, que na planilha aparece
  --    como "Matheus Fellipe…".
  create temp table _membros (nome text, telefone text, nasc text, genero text) on commit drop;
  insert into _membros (nome, telefone, nasc, genero) values
  ('Adriano da Silva Rodrigues', '+5562994782597', '1983-07-13', 'M'),
  ('Adryan Henrique Gomes Da Silva', null, '2015-01-04', 'M'),
  ('Ágatha Vitória da Silva Oliveira', null, '2021-08-16', 'F'),
  ('Alana Corrêa Oliveira', '62992864328', '1989-04-11', 'F'),
  ('Alessandro Felis Vieira', '62996807461', '1982-12-24', 'M'),
  ('Alessia Nascimento', '+5562982679740', '1996-05-16', 'F'),
  ('Alexandre da Silva Sá', null, '2009-04-18', 'M'),
  ('Alice de Souza Moura', null, '2020-01-07', 'F'),
  ('Alice sombra de faria dia', null, '2021-03-14', 'F'),
  ('Aline Da Cunha Pereira Damaceno', '+556291966231', '1984-06-13', 'F'),
  ('Aline Maria de Jesus Miranda Souza', '+556282611475', '1991-08-19', 'F'),
  ('Amanda Vitoria Melo Santana Fleury', '62982069631', '2008-08-02', 'F'),
  ('Ana Beatriz Aiden Freitas', '+5562995155744', '2007-03-14', 'F'),
  ('Ana Beatriz Corrêa Oliveira', null, '2021-07-12', 'M'),
  ('Ana Julia Alves da Silva', null, '2011-02-01', 'F'),
  ('Ana Julia Cunha Damaceno', null, '2014-12-26', 'F'),
  ('Ana karla Ferreira Dutra Moura', '62993639512', '1998-12-29', 'F'),
  ('Ana Maria Ferreira Garcia Vilela', '62993180749', '1963-09-10', 'F'),
  ('Ana  Paula Rodrigues dos Santos Paes', '+5562991698266', '1974-08-10', 'F'),
  ('Ana Vitória Batista do Nascimento', '+5562995593552', '2011-01-09', 'F'),
  ('Ana Vitória Luciano', '+5562994606324', '2002-03-18', 'F'),
  ('Andreza Maria da Silva', '81984372981', '1995-06-14', 'F'),
  ('Anna Caroline Mendes de Sousa Tolentino', '62993834109', '1998-07-06', 'F'),
  ('Anna Laura Elias Pereira de Paula', '+5562994194903', '2010-11-08', 'F'),
  ('Anthony Henrique Camargo Lima', null, '2016-09-06', 'M'),
  ('Antonio Carlos Pereira Lima', '+556291285569', '1994-01-18', 'M'),
  ('Antônio Lucas Barbosa Ferreira', null, '2020-05-12', 'M'),
  ('Aparecida das Dores Cotrim Vieira', '+556291372076', '1969-04-10', 'F'),
  ('Arthur Arcanjo Silva', null, '2015-06-22', 'M'),
  ('Arthur Fleury Araújo', '62994205134', '2011-02-03', 'M'),
  ('Arthur Viera Vasconcelos Aguiar', null, '2020-10-25', 'M'),
  ('Asafe Aguiar Correa', null, '2017-10-23', 'M'),
  ('Aylla Vitória Rodrigues Souza', '+5562991550693', '2011-09-30', 'F'),
  ('Baltazar Aparecido Flor', null, '1961-06-29', 'M'),
  ('Benedito José Vieira', '62981437226', '1968-01-15', 'M'),
  ('Benjamin Arcanjo Silva', null, '2019-03-06', 'M'),
  ('Bethânia Cavalcante Rocha Fernandes Cintra', '62991890220', '1997-11-07', 'F'),
  ('Breno Barros Costa', '62994455325', '1997-12-14', 'M'),
  ('Bruna Marques da Silva', '62992215730', '1997-05-16', 'F'),
  ('Bruno Emanuel de Brito Coelho', '+5562991271168', '2010-02-25', 'M'),
  ('Bruno Moreira Borges', '62994734099', '2012-04-03', 'M'),
  ('Caio Henrique Sousa da Silva', '62993216907', '2005-11-19', 'M'),
  ('Caio Silva Palhares', '61982211651', '1996-11-18', 'M'),
  ('Cárita Jennifer da Silva Coelho', '+5562991017454', '1996-04-01', 'F'),
  ('Carla Adriane Caetano Ferreira Dutra', '+5562993701463', '1971-10-19', 'F'),
  ('Carlitos Francisco Coelho', '62992577078', '1971-07-15', 'M'),
  ('Carlos Eduardo Sousa Teles', null, '2013-08-04', 'M'),
  ('Carlos Roberto Oliveira', '62993217317', '1968-03-16', 'M'),
  ('Carolina de Torres Nicolau', '62993063167', '2000-04-28', 'F'),
  ('Celio Quintino de Moura Neto', '+5562993489557', '1997-04-10', 'M'),
  ('Celma Maria de oliveira', '62994511183', '1961-12-31', 'F'),
  ('Cindy Cristiny dos Santos Sousa', '+5562993797936', '2010-07-26', 'F'),
  ('Cizani Quintino de Abreu', '+5562992681218', '1959-03-31', 'F'),
  ('Cláudia Vieira da Silva', '62982740495', '1973-11-14', 'F'),
  ('Clea Eulina Feitosa Oliveira Dorado', '62993378559', '1983-07-03', 'F'),
  ('Corina severina de moura', '+556292913879', '1974-01-03', 'F'),
  ('Cristina Francisca De Lima', '62993704660', '1974-05-25', 'F'),
  ('Cristopher Arruda de Almeida', '+55', '2007-07-04', 'M'),
  ('Dafiny Vitoria Barbosa Ferreira', '+5562996506380', '2008-07-26', 'F'),
  ('Daniela Regina De Resende', '62991137940', '1973-09-01', 'F'),
  ('Daniel César da Silva Ribeiro', null, '2024-03-04', 'M'),
  ('Daniel Luís de Melo Lopes', '+5562993466705', '2006-03-07', 'M'),
  ('Daniel Sales Amaral', '+5562995268711', '2008-12-01', 'M'),
  ('David Gabriel Dutra Martins', '+5562992729388', '1997-04-21', 'M'),
  ('David Lopes de Souza', '62981785103', '1997-05-11', 'M'),
  ('David Souza Aguiar', '62993575364', '2005-04-21', 'M'),
  ('Davi Moura Siqueira', null, '2017-07-12', 'M'),
  ('Divina Rodrigues Cimenton', '62992296605', '1956-02-17', 'F'),
  ('Eberson Diniz Correa', '+5562991722704', '1989-01-09', 'M'),
  ('Éder de Souza Ramos', '+5562982732567', '1982-07-03', 'M'),
  ('Edilainne Barros Costa', '62992821780', '1995-10-05', 'F'),
  ('Edimayra Santos de Sousa', null, '2012-06-22', 'F'),
  ('Ednei da Silva Dorado', '62993353146', '1980-02-04', 'M'),
  ('Edson santos soares', '62992371502', '1987-08-10', 'M'),
  ('Eduardo Moreira Borges', '62992925535', '2010-04-21', 'M'),
  ('Elias Tomazo Soares', null, '2024-03-03', 'M'),
  ('Elisa Victoria Cunha Damasceno', '+5562993373527', '2007-12-22', 'F'),
  ('Elizabeth Sombra Faustino', '+5562996897611', '1996-06-03', 'F'),
  ('Eloá da Silva Rodrigues', null, '2018-04-06', 'F'),
  ('Eloah Ester Souza Silva', '+5562991550693', '2019-06-19', 'F'),
  ('Eloá Sophie Rabelo Reiss', null, '2017-06-29', 'F'),
  ('Elsa Aparecida da Silva', '62992973988', '1962-04-03', 'F'),
  ('Emanuela Fernandes Fleury', '+5562994205134', '2012-06-04', 'M'),
  ('Emanuelly Vitória Pereira de Almeida', '62992433544', '2011-04-01', 'F'),
  ('Emilly Fiúza Brito Reis', null, '2010-10-20', 'F'),
  ('Emilly Vitória Oliveira Evangelista', '62986490797', '2008-10-10', 'F'),
  ('Emily Kamimura Moura', '+5562992759012', '2012-10-17', 'F'),
  ('Enzo tomazo soares', null, '2017-04-15', 'M'),
  ('Erick Rafael Ribeiro do Nascimento', '+5582999576585', '2011-11-17', 'M'),
  ('Erivan Fernandes de Brito', '+5562994281715', '1998-09-13', 'M'),
  ('Erlane Rodrigues Carneiro Siqueira', '62992213189', '1969-09-29', 'F'),
  ('Evellyn Thais Pereira de Carvalho', '62984261278', '1999-07-03', 'F'),
  ('Ezequiel Aiden Freitas', '62994411373', '2009-03-09', 'M'),
  ('Fábio Damaceno De Souza', null, '1985-04-30', 'M'),
  ('Fabio Henrique Nasuno de Paulo', '94991897421', '2004-05-19', 'M'),
  ('Fabio Mendes Teles', '62993183888', '1977-11-20', 'M'),
  ('Fábio Neri De Souza', '+556282610535', '1995-08-12', 'M'),
  ('Fabrina Rosa Batista de Carvalho Souza', '62993765962', '2000-02-29', 'F'),
  ('Felipe Rodrigues dos Santos Reis', '62993286976', '2014-11-15', 'M'),
  ('Felisberto Sebastião De Andrade', '6233884140', '1947-08-21', 'M'),
  ('Filipe Poli Coutinho de Oliveira', '62995658900', '1994-04-20', 'M'),
  ('Francisca Teixeira Diniz da Costa', '62992464420', '1967-10-04', 'F'),
  ('Francisco das Chagas Passos', '62982926324', '1979-12-21', 'M'),
  ('Gabriel Fernandes Brito', '62995441138', '2008-12-28', 'M'),
  ('Gabriella Ferreira Souza Moura', '+556291120071', '2000-09-30', 'F'),
  ('Gabrielle Alves Vieira', '+5562992895943', '2008-04-25', 'F'),
  ('Gabriel Lucas Alves do Santos', '+5562991296714', '2011-05-09', 'M'),
  ('Geovana Brito Ferreira', '+5562993552965', '2007-05-17', 'F'),
  ('Gessyca Bianca Tavares Ciqueira', '62992390107', '1993-01-01', 'F'),
  ('Getúlio Netto dos Santos Sousa', '62993009354', '1991-02-17', 'M'),
  ('Gildete Gomes Da Cruz', '62991314440', '1961-09-30', 'F'),
  ('Guilherme Fernandes Brito', '62994128894', '2008-12-28', 'M'),
  ('Guilherme Rodrigues Ramos', '62991091161', '2013-01-06', 'M'),
  ('Heitor Felipe Sanches Sombra', null, '2022-06-17', 'M'),
  ('Heli Marques da Silva', '62984970795', '1966-08-17', 'M'),
  ('Heloísa Helena Silva Alves', '+5562991723052', '2011-05-26', 'F'),
  ('Hermindo Elizeu da Silva', '+5562991076217', '1991-06-21', 'M'),
  ('Iasmim Wiligta dos Santos', '62981725177', '2008-03-19', 'F'),
  ('Isaac Pereira da Silva', '+5562993347547', '2008-02-09', 'M'),
  ('Isabela Carvalho', '+5562993209466', '2008-11-09', 'F'),
  ('Isabella Alves Fonseca', '+5562994135287', '2011-08-23', 'F'),
  ('Isabella Morais de Melo', '+5562995574983', '2011-08-05', 'F'),
  ('Isabella Moreira Silva Carneiro Siqueira', '62991737816', '1998-10-19', 'F'),
  ('Isac Rodrigues Vidal', '+5562984023585', '1979-07-19', 'M'),
  ('Isadora Victoria Gonçalves Mendes', '+5562994733339', '2013-07-07', 'F'),
  ('Isaías Pereira Silva', null, '2013-01-10', 'M'),
  ('Ismael Felipe de Almeida', '+5562991122804', '2008-11-04', 'M'),
  ('Izani Cecília Pereira', '+556299938386', '1962-06-20', 'F'),
  ('Jaciara Pereira de Jesus Santos', '62992458139', '1978-12-31', 'F'),
  ('Jacira Paula Rodrigues dos Santos', '62993286976', '1974-07-05', 'F'),
  ('Jackeline Gomes da Silva Nunes', '62994471734', '1981-03-27', 'F'),
  ('Jackeline Pereira de Siqueira', '62982023392', '1991-11-30', 'F'),
  ('Jackson Moisés da Silva Oliveira', '62993574444', '1993-08-14', 'M'),
  ('Jandira aparecida de Moura', '+556299513042', '1968-12-20', 'F'),
  ('Jéssica Cotrim Cieira', '+5562981437226', '1993-01-07', 'F'),
  ('Jéssica Naiara Sousa Sombra Sanches', '62996333341', '1995-06-18', 'F'),
  ('Jessica Rodrigues Chaveiro', '62994220342', '1992-11-13', 'F'),
  ('Joab Henrique Vieira da Silva', null, '2017-04-01', 'M'),
  ('João Amaro Cotrim Oliveira', null, '2022-04-11', 'M'),
  ('João Gabriel tomazo soares', null, '2022-02-10', 'M'),
  ('João Lucas Souza Gondim', '62992972246', '2004-09-18', 'M'),
  ('João Marcus Guimarães Cunha', null, '2022-03-07', 'M'),
  ('João Pedro Ramos Brito', '+5562995377057', '2010-08-15', 'M'),
  ('João Ricardo Barbosa Ferreira', null, '2023-02-17', 'M'),
  ('João Victor Silva Araujo', '+5562999588392', '2009-05-29', 'M'),
  ('Jonatas Elias Rodrigues Paes', '62991698266', '2011-04-26', 'M'),
  ('José Dutra Ciqueira', null, '2025-05-09', 'M'),
  ('Josefa da Silva Melo', null, '1947-08-23', 'F'),
  ('Josefa Maria Lina da Conceição', null, '1940-08-21', 'F'),
  ('José Miguel Cotrim Oliveira', null, '2024-01-28', 'M'),
  ('José Paulo Camargo Vargas', '62991255588', '2005-04-29', 'M'),
  ('Joyce Cotrim Vieira', '62993889964', '1991-03-14', 'F'),
  ('Julia Damaceno Oliveira', '62992966991', '1967-07-04', 'F'),
  ('Juliana Gomes Arcanjo Silva', '+5562991364504', '1987-07-04', 'F'),
  ('Jullya Maria Correia Cassimiro', '+5562991308819', '2011-10-28', 'F'),
  ('Junio Rodrigues dos Santos', '+5562995705382', '2010-07-30', 'M'),
  ('Kaio Cesar Albuquerque Cintra', '+5562992723986', '1990-11-27', 'M'),
  ('Kaio Henrique Fernandes Nascimento', '+5562991976572', '2008-06-23', 'M'),
  ('Kaio Rafael Corrêa Oliveira', null, '2014-06-02', 'M'),
  ('Kaio Renato da Silva Oliveira', '62998115926', '1997-05-17', 'M'),
  ('Kaio Vinicius Tavares', '+5562993574890', '2011-07-08', 'M'),
  ('Kamylle Vitória dos Santos Costa', '+5562994425823', '2010-10-25', 'F'),
  ('Karina Teixeira da Silva', '+5562996845570', '2009-12-09', 'F'),
  ('Kassyane Ribeiro de Souza', '+5562983449326', '2005-01-16', 'M'),
  ('Kathlyn Lauanny Ferreira', '+5562994168264', '2013-01-30', 'F'),
  ('Kauã Dias de Souza', '+5562994785476', '2009-06-03', 'M'),
  ('Kauã Gustavo Santos Silva', '+5562993786278', '2007-10-30', 'M'),
  ('Kauã Mychael Coelho Fernandes', '+5562991296714', '2010-05-18', 'M'),
  ('Kauã Rodrigues Marcilio', '+5562995709972', '2009-01-04', 'M'),
  ('Kayllane Freitas Carvalho', '+5562994143041', '2008-11-14', 'F'),
  ('Kevin Bryan Costa Evangelista', '+5562993945123', '2013-09-03', 'F'),
  ('Kleber Lucas Costa Evangelista', '+5562993478088', '2009-06-01', 'M'),
  ('Lara Eduarda Ferreira Coelho', '62993514881', '2012-10-15', 'F'),
  ('Lara Sabrinny vieira da silva ferreira', '+556286013638', '2008-08-05', 'F'),
  ('Lara Soares Abreu', '+5562994449079', '2012-08-19', 'F'),
  ('Larissa Guimarães Duarte', '+5562993064201', '1996-07-02', 'F'),
  ('Larisson Souza Marques', '62996028104', '2000-05-31', 'M'),
  ('Layla Heloísa Alves de Abreu', '+5562994431680', '2011-01-05', 'F'),
  ('Lays Mell Xavier Cruz', null, '2011-10-02', 'F'),
  ('Lázara Divina de Lima Flor', '62994390143', '1965-09-20', 'F'),
  ('Letícia Lacerda da Silva Dutra', '62991940848', '1995-09-24', 'F'),
  ('Letícia Regina de Resende Borges', '+5562994357184', '2002-10-09', 'F'),
  ('Lia Moura Siqueira', null, '2020-06-23', 'F'),
  ('Lídia Paixão Ferreira Silva', '62999869629', '1991-06-04', 'F'),
  ('Liz Paixão Silva', null, '2020-01-03', 'F'),
  ('Lucas Ferreira Dutra', '+5562993259811', '1995-11-22', 'M'),
  ('Lucas Gabriel Ramos da Silva', '+5577998746942', '2007-02-24', 'M'),
  ('Luciana Valentina Roa Vargas', '+5562998034352', '2010-12-20', 'F'),
  ('Luiza Beatriz Magalhães dos Santos', '+5562998034352', '2010-08-28', 'F'),
  ('Luiza Maria de Araújo', '62992173510', '1936-04-24', 'F'),
  ('Luiz Henrique da Silva', '+5562993992757', '1978-05-10', 'M'),
  ('Luiz Henrique Fernandes Oliveira', '+5562993109109', '2010-03-09', 'M'),
  ('Lurdes Marques da Silva', '62984148574', '1968-11-02', 'F'),
  ('Lyshana de Lima Silva', '+5562984364711', '2009-03-08', 'F'),
  ('Maiany tamires Silva Santos', '62982287065', '2014-02-04', 'F'),
  ('Manoel da Silva Neto', null, '2025-06-16', 'M'),
  ('Manuela Arcanjo Silva', null, '2021-03-31', 'F'),
  ('Manuela Barros Costa', null, '2024-06-27', 'F'),
  ('Márcia Siqueira Sousa', '62991214513', '1981-07-22', 'F'),
  ('Márcio Melo Villarreal Bueno', '62991618465', '1979-05-28', 'M'),
  ('Márcio Pereira Chaveiro', '62993067370', '1994-10-27', 'M'),
  ('Marcos Wendel da Silva Souza', '+5562995637667', '2007-12-11', 'M'),
  ('Marcus Vinícius Machado da Cunha', '+5562991849151', '1992-12-06', 'M'),
  ('Maria Cecilia Lacerda Dutra', null, '2022-07-10', 'F'),
  ('Maria de Lurdes Faria', '62992038951', '1955-01-22', 'F'),
  ('Maria Eduarda Antunes Paiva', '+5562993855655', '2011-05-31', 'F'),
  ('Maria Eduarda Fernandes Martins', '+5562994472634', '2012-01-22', 'F'),
  ('Maria Eduarda Freitas Araújo', '+5562991223560', '2009-09-26', 'F'),
  ('Maria Luísa Lacerda Dutra', null, '2018-01-24', 'F'),
  ('Maria Marques da Silva', null, '1960-02-12', 'F'),
  ('Maria Odete Sousa da Silva', '62991911124', '1961-09-22', 'F'),
  ('Maria regina santos da silva', '+5596999112096', '1986-09-04', 'F'),
  ('Maria Vitória Santana da Silva', '+5562993181816', '2011-04-04', 'F'),
  ('Marina Pereira Torres', null, '2023-12-31', 'F'),
  ('Mariney Maria da Silva Coelho', '62992118342', '1976-11-03', 'F'),
  ('Mario Filho Araujo Gomes', '+5562981997839', '2011-07-27', 'M'),
  ('Maristela Dutra de Morais', '+556298445804', '1979-12-27', 'F'),
  ('Marksuel Carlos de Moura Reis', '+5562991436400', '1989-04-06', 'M'),
  ('Marlene Lina da Silva Cunha', '62992051294', '1973-06-26', 'F'),
  ('Marta Rodrigues Ramos', '62981512641', '1982-06-13', 'F'),
  ('Mateus Rodrigues Nery', '62995388348', '2010-03-07', 'M'),
  ('Matheus de Sousa Moura', null, '1994-09-20', 'M'),
  ('Matheus Corrêa', '12991481871', '1999-12-07', 'M'),
  ('Maurício Augusto Silva Dias', '+5562992764560', '2009-11-03', 'M'),
  ('Maurício Henrique Gomes Rocha', '+5562993002337', '2010-11-03', 'M'),
  ('Mayara Beatriz Ribeiro do Nascimento', '+5582999576585', '2011-11-17', 'F'),
  ('Maycon Nogueira da Silva', '+5562994102836', '2009-05-22', 'M'),
  ('Melissa Evelyn sombra faria', null, '2015-06-15', 'F'),
  ('Melyssa de Oliveira Alves', '+5562995118021', '2011-06-14', 'F'),
  ('Micaias Vieira da Silva', '62994614559', '2009-10-27', 'M'),
  ('Miguel Geovanne Mendes', '+5562994057195', '2010-01-19', 'M'),
  ('Miguel Henrique de Sousa', null, '2017-06-26', 'M'),
  ('Mikaelly Maria Correia Cassimiro', '+5562994027568', '2007-07-04', 'F'),
  ('Millena da Silva Souza', '+5562991249502', '2011-02-16', 'F'),
  ('Moisés Rodrigues Siqueira', '62982062337', '1992-12-12', 'M'),
  ('Muriah Yelena Rabelo Reis', null, '2022-03-18', 'F'),
  ('Myllena Vitória Gomes da Silva', '+5562992051837', '2010-07-02', 'F'),
  ('Naikson Felipe de Souza Fernandes', '62984886531', '1998-03-13', 'M'),
  ('Nalva Reis Andrade Moribayshi', '62992733923', '1976-10-27', 'F'),
  ('Natanael Pereira da Silva', '62981733119', '1985-04-03', 'M'),
  ('Nicolas Ribeiro Silva', '+5562981187668', '1992-09-08', 'M'),
  ('Nicolle Victoria Oliveira Lopes', '62994897467', '2013-02-08', 'F'),
  ('Nilmar Brito Ferreira', '+5562995410178', '2009-01-31', 'M'),
  ('Noah Gabriel de Morais Mello Villarreal Bueno', null, '2024-05-08', 'M'),
  ('Pablina Torres Nicolau', '+5562992819105', '1992-03-03', 'F'),
  ('Pablo Peterson Rodrigues de Freitas', '62993089169', '2001-10-30', 'M'),
  ('Pamela Torres Nicolau', '62994430980', '1992-03-03', 'F'),
  ('Paulo do Santos Pinheiro', '62986503229', '1960-04-01', 'M'),
  ('Paulo Sérgio Sanches Magalhães', '62991776316', '1996-02-02', 'M'),
  ('Pedro Lucas Rodrigues', '+5562993188224', '1999-10-26', 'M'),
  ('Pedro P. Vasconcelos Aguiar', '62991754257', '1989-02-23', 'M'),
  ('Polliane tomazo de assis', '62991804895', '1996-07-16', 'F'),
  ('Pollyana Cunha Soares', '+5562993743725', '2009-02-09', 'F'),
  ('Pollyanne Moreira Araujo da Conceição', '62992660959', '1985-05-17', 'F'),
  ('Raabe Vitória Mendes Silva', null, '2019-11-14', 'F'),
  ('Rafaela Silva Marques', '+5562995563684', '2013-09-24', 'F'),
  ('Rafael da Costa', '+556281309976', '2009-09-19', 'M'),
  ('Rafael Ferreira da Silva Andrade', '+5562994528334', '2009-11-04', 'M'),
  ('Raphael dos anjos Araújo', '62993767955', '2009-03-10', 'M'),
  ('Rayane Mendes da Silva', '+556293437797', '1991-06-08', 'F'),
  ('Rayner Augusto de Moura', '62982630059', '1995-01-18', 'M'),
  ('Raysila da Silva Viera Aguiar', '62993710254', '1995-08-20', 'F'),
  ('Rayssa Rauanny Pereira Mesquita', '+5562982065388', '2011-10-01', 'F'),
  ('Rebeca Aguiar Correa', null, '2015-06-01', 'F'),
  ('Reginaldo Silva', null, '1976-07-23', 'M'),
  ('Ricardo Sampaio Marcolino', '62992051472', '1993-01-28', 'M'),
  ('Rickelmy Gomes Da Silva', null, '2012-05-07', 'M'),
  ('Rosinete Monteiro da Silva', '62981347794', '1961-12-23', 'F'),
  ('Samara Vitória Mendes Tavares de Souza', '+55', '2009-12-01', 'F'),
  ('Santana Diniz Vidal', '+5562992942687', '1968-12-08', 'F'),
  ('Sara Aguiar Correa', '+5562992525660', '1987-11-03', 'F'),
  ('Sarah Crystina Mendes de Sousa', '62991313948', '2001-06-01', 'F'),
  ('Sarah Ferreira Moura', null, '2024-09-02', 'F'),
  ('Sarah Victoria Feitosa Dourado', '62995226615', '2009-08-10', 'F'),
  ('Sara Jennifer de Sousa', null, '2021-10-21', 'F'),
  ('Shigueo Moribayshi Neto', '62999452320', '2008-11-21', 'M'),
  ('Silviane Pereira dos Santos', '62993438681', '1968-01-16', 'F'),
  ('Sophia Ellen Cunha Damaceno', null, '2013-07-16', 'F'),
  ('Sophia Vitória Barbosa da Cruz', null, '2012-07-19', 'F'),
  ('Suely Gomes Ferreira', '+5562993639099', '1955-10-13', 'F'),
  ('Sulamita Pereira da Silva Rodrigues', '62993891020', '1987-06-22', 'F'),
  ('Talassa Patriota da Rocha', '61981935775', '1998-05-08', 'F'),
  ('Talita Vitória Pereira Ribeiro', '+5562995111836', '1999-04-19', 'F'),
  ('Thalita Cristina Ferreira de Souza Moura', '+556292226364', '1999-04-28', 'F'),
  ('Thaynara Barbosa Alves Ferreira', '62991644777', '1995-12-15', 'F'),
  ('Thays Borges da Silva', null, '2009-08-07', 'F'),
  ('Thiago Bernardo de Freitas', '+5562993246467', '2004-02-27', 'M'),
  ('Thiago Ferreira Dutra', '+5562992364885', '1992-06-30', 'M'),
  ('Thiago Vieira da Silva', null, '2013-02-19', 'M'),
  ('Tiago do Santos Brito', null, '2009-05-13', 'M'),
  ('Valdeilde Ferreira da Silva Junior', '+5562994999661', '1987-01-28', 'M'),
  ('Valdete Pereira', '+5562993254348', '1953-12-16', 'M'),
  ('Vanessa de Jesus Pereira', '75999102773', '1997-02-06', 'F'),
  ('Vanusa Santos de Camargo Lima', null, '1981-07-11', 'F'),
  ('Vanusa Vieira', '62993802663', '1981-07-18', 'F'),
  ('Victor Gabriel Corrêa Oliveira', null, '2013-05-07', 'M'),
  ('Victor Hugo Sousa Santos', '+5562992645260', '2008-11-21', 'M'),
  ('Victor Pedro Mendes Mendanha', '+5562995466635', '2011-12-28', 'M'),
  ('Violeta Rabelo da Conceição', '6233885119', '1936-04-06', 'F'),
  ('Vitor Viera Vasconcelos Aguiar', null, '2023-03-23', 'M'),
  ('Viviane Leite de Oliveira', '62984552295', '1976-04-12', 'F'),
  ('Wagner Moribayashi', '62992532092', '1976-06-06', 'M'),
  ('Wanderson Borges da Conceição', '62992489114', '1984-01-14', 'M'),
  ('Warion Franco de Sousa', '+5562993700394', '2010-05-16', 'M'),
  ('Wellington Carvalho de Oliveira', '62992014282', '1979-02-08', 'M'),
  ('Wellington Felisbino Dutra', '+5562993195991', '1968-08-04', 'M'),
  ('Wellington Vilela', '62994718510', '1968-10-28', 'M'),
  ('Wemerson dos Santos Oliveira', '62993033351', '1991-08-21', 'M'),
  ('Weniton Roberto da Costa', '62992417256', '1975-01-03', 'M'),
  ('Wilton Pereira dos Santos', '+5562994359738', '1970-09-26', 'M'),
  ('Yasmin Vitória Gonçalves Mendes', '+5562994733339', '2011-06-04', 'F'),
  ('Yasmin Vitória Mendes da Silva', '+5562993286186', '2011-07-18', 'F'),
  ('Yohann Pietro Nunes Soares Xavier', '+5562993072890', '2009-04-26', 'M');

  insert into pessoas (nome, tipo, telefone, data_nascimento, genero)
  select m.nome, 'membro'::pessoa_tipo, m.telefone, m.nasc::date, m.genero
  from _membros m
  where not exists (select 1 from pessoas p where lower(p.nome) = lower(m.nome));

  -- Quem já existia ganha data de nascimento e gênero (sem sobrescrever o que já tem).
  update pessoas p
     set data_nascimento = coalesce(p.data_nascimento, m.nasc::date),
         genero = coalesce(p.genero, m.genero)
    from _membros m
   where lower(p.nome) = lower(m.nome)
     and (p.data_nascimento is null or p.genero is null);

  drop table _membros;

  -- 2b) Limpeza: nomes criados por engano na primeira versão desta carga
  --     (Vanusa Alves Santos, Wemerson Correa, Wermerson Correa) viram os
  --     membros do cadastro: presenças e matrículas são movidas e o extra sai.
  for r in
    select * from (values
      ('Vanusa Alves Santos', 'Vanusa Santos de Camargo Lima'),
      ('Wemerson Correa', 'Wemerson dos Santos Oliveira'),
      ('Wermerson Correa', 'Wemerson dos Santos Oliveira')
    ) as t(velho, novo)
  loop
    select id into id_novo from pessoas where lower(nome) = lower(r.novo) limit 1;
    if id_novo is null then continue; end if;
    for id_velho in select id from pessoas where lower(nome) = lower(r.velho) and id <> id_novo loop
      delete from presencas x
       where x.pessoa_id = id_velho
         and exists (select 1 from presencas y where y.aula_id = x.aula_id and y.pessoa_id = id_novo);
      update presencas set pessoa_id = id_novo where pessoa_id = id_velho;
      delete from matriculas x
       where x.pessoa_id = id_velho
         and exists (select 1 from matriculas y where y.turma_id = x.turma_id and y.pessoa_id = id_novo);
      update matriculas set pessoa_id = id_novo where pessoa_id = id_velho;
      delete from pessoas where id = id_velho;
    end loop;
  end loop;
  -- 3) Nomes das chamadas que não são membros: entram como 'visitante'.
  insert into pessoas (nome, tipo, telefone)
  select v.nome, 'visitante'::pessoa_tipo, v.telefone
  from (values
  ('Jéssica Alves', null),
  ('Junior Pereira', null),
  ('Nínive Santos', null),
  ('Thais Vitória', null)
  ) as v(nome, telefone)
  where not exists (select 1 from pessoas p where lower(p.nome) = lower(v.nome));

  -- 4) Chamadas: uma linha por presente (162 presenças em 21 chamadas)
  create temp table _carga (classe text not null, data date not null, nome text not null) on commit drop;

  insert into _carga (classe, data, nome) values
    ('Mulheres', '2026-08-02', 'Marta Rodrigues Ramos'),
    ('Mulheres', '2026-08-02', 'Alessia Nascimento'),
    ('Mulheres', '2026-08-02', 'Sara Aguiar Correa'),
    ('Mulheres', '2026-08-02', 'Gabrielle Alves Vieira'),
    ('Mulheres', '2026-08-02', 'Vanusa Santos de Camargo Lima'),
    ('Mulheres', '2026-08-02', 'Jéssica Cotrim Cieira'),
    ('Mulheres', '2026-08-02', 'Jéssica Alves'),
    ('Mulheres', '2026-08-02', 'Nínive Santos'),
    ('Homens', '2026-08-02', 'Éder de Souza Ramos'),
    ('Homens', '2026-08-02', 'Fabio Henrique Nasuno de Paulo'),
    ('Homens', '2026-08-02', 'Kaio Cesar Albuquerque Cintra'),
    ('Homens', '2026-08-02', 'Eberson Diniz Correa'),
    ('Homens', '2026-08-02', 'David Souza Aguiar'),
    ('Homens', '2026-08-02', 'João Lucas Souza Gondim'),
    ('Homens', '2026-08-02', 'Alessandro Felis Vieira'),
    ('Panorama Bíblico', '2026-08-02', 'Carlos Roberto Oliveira'),
    ('Panorama Bíblico', '2026-08-02', 'Natanael Pereira da Silva'),
    ('Panorama Bíblico', '2026-08-02', 'Maria de Lurdes Faria'),
    ('Panorama Bíblico', '2026-08-02', 'Paulo do Santos Pinheiro'),
    ('Panorama Bíblico', '2026-08-02', 'Caio Silva Palhares'),
    ('Panorama Bíblico', '2026-08-02', 'Wilton Pereira dos Santos'),
    ('Panorama Bíblico', '2026-08-02', 'Benedito José Vieira'),
    ('Panorama Bíblico', '2026-08-02', 'Lucas Ferreira Dutra'),
    ('Panorama Bíblico', '2026-08-02', 'Juliana Gomes Arcanjo Silva'),
    ('Mulheres', '2026-08-09', 'Jéssica Naiara Sousa Sombra Sanches'),
    ('Mulheres', '2026-08-09', 'Joyce Cotrim Vieira'),
    ('Mulheres', '2026-08-09', 'Cláudia Vieira da Silva'),
    ('Mulheres', '2026-08-09', 'Sara Aguiar Correa'),
    ('Mulheres', '2026-08-09', 'Gabrielle Alves Vieira'),
    ('Mulheres', '2026-08-09', 'Vanusa Santos de Camargo Lima'),
    ('Mulheres', '2026-08-09', 'Polliane tomazo de assis'),
    ('Mulheres', '2026-08-09', 'Aline Maria de Jesus Miranda Souza'),
    ('Mulheres', '2026-08-09', 'Maria Odete Sousa da Silva'),
    ('Homens', '2026-08-09', 'Fabio Henrique Nasuno de Paulo'),
    ('Homens', '2026-08-09', 'Eberson Diniz Correa'),
    ('Homens', '2026-08-09', 'João Lucas Souza Gondim'),
    ('Homens', '2026-08-09', 'Filipe Poli Coutinho de Oliveira'),
    ('Homens', '2026-08-09', 'Pablo Peterson Rodrigues de Freitas'),
    ('Homens', '2026-08-09', 'Fábio Neri De Souza'),
    ('Homens', '2026-08-09', 'Paulo Sérgio Sanches Magalhães'),
    ('Panorama Bíblico', '2026-08-09', 'Natanael Pereira da Silva'),
    ('Panorama Bíblico', '2026-08-09', 'Paulo do Santos Pinheiro'),
    ('Panorama Bíblico', '2026-08-09', 'Wanderson Borges da Conceição'),
    ('Mulheres', '2026-08-16', 'Jéssica Naiara Sousa Sombra Sanches'),
    ('Mulheres', '2026-08-16', 'Marta Rodrigues Ramos'),
    ('Mulheres', '2026-08-16', 'Marlene Lina da Silva Cunha'),
    ('Mulheres', '2026-08-16', 'Ana karla Ferreira Dutra Moura'),
    ('Mulheres', '2026-08-16', 'Santana Diniz Vidal'),
    ('Mulheres', '2026-08-16', 'Cláudia Vieira da Silva'),
    ('Mulheres', '2026-08-16', 'Sara Aguiar Correa'),
    ('Mulheres', '2026-08-16', 'Gabrielle Alves Vieira'),
    ('Mulheres', '2026-08-16', 'Sarah Crystina Mendes de Sousa'),
    ('Mulheres', '2026-08-16', 'Jéssica Cotrim Cieira'),
    ('Mulheres', '2026-08-16', 'Aline Maria de Jesus Miranda Souza'),
    ('Mulheres', '2026-08-16', 'Gessyca Bianca Tavares Ciqueira'),
    ('Homens', '2026-08-16', 'Éder de Souza Ramos'),
    ('Homens', '2026-08-16', 'David Gabriel Dutra Martins'),
    ('Homens', '2026-08-16', 'Kaio Cesar Albuquerque Cintra'),
    ('Homens', '2026-08-16', 'Eberson Diniz Correa'),
    ('Homens', '2026-08-16', 'João Lucas Souza Gondim'),
    ('Homens', '2026-08-16', 'Thiago Bernardo de Freitas'),
    ('Homens', '2026-08-16', 'Pedro Lucas Rodrigues'),
    ('Homens', '2026-08-16', 'Rayner Augusto de Moura'),
    ('Panorama Bíblico', '2026-08-16', 'Carlos Roberto Oliveira'),
    ('Panorama Bíblico', '2026-08-16', 'Natanael Pereira da Silva'),
    ('Panorama Bíblico', '2026-08-16', 'Paulo do Santos Pinheiro'),
    ('Panorama Bíblico', '2026-08-16', 'Weniton Roberto da Costa'),
    ('Panorama Bíblico', '2026-08-16', 'Julia Damaceno Oliveira'),
    ('Mulheres', '2026-08-23', 'Marta Rodrigues Ramos'),
    ('Mulheres', '2026-08-23', 'Alessia Nascimento'),
    ('Mulheres', '2026-08-23', 'Santana Diniz Vidal'),
    ('Mulheres', '2026-08-23', 'Sara Aguiar Correa'),
    ('Mulheres', '2026-08-23', 'Gabrielle Alves Vieira'),
    ('Mulheres', '2026-08-23', 'Juliana Gomes Arcanjo Silva'),
    ('Mulheres', '2026-08-23', 'Sarah Crystina Mendes de Sousa'),
    ('Mulheres', '2026-08-23', 'Vanusa Santos de Camargo Lima'),
    ('Mulheres', '2026-08-23', 'Gessyca Bianca Tavares Ciqueira'),
    ('Mulheres', '2026-08-23', 'Thais Vitória'),
    ('Homens', '2026-08-23', 'Éder de Souza Ramos'),
    ('Homens', '2026-08-23', 'David Gabriel Dutra Martins'),
    ('Homens', '2026-08-23', 'Fabio Henrique Nasuno de Paulo'),
    ('Homens', '2026-08-23', 'Kaio Cesar Albuquerque Cintra'),
    ('Homens', '2026-08-23', 'Eberson Diniz Correa'),
    ('Homens', '2026-08-23', 'David Souza Aguiar'),
    ('Homens', '2026-08-23', 'João Lucas Souza Gondim'),
    ('Homens', '2026-08-23', 'Matheus Corrêa'),
    ('Homens', '2026-08-23', 'Pedro Lucas Rodrigues'),
    ('Homens', '2026-08-23', 'Moisés Rodrigues Siqueira'),
    ('Homens', '2026-08-23', 'Junior Pereira'),
    ('Panorama Bíblico', '2026-08-23', 'Carlos Roberto Oliveira'),
    ('Panorama Bíblico', '2026-08-23', 'Maria de Lurdes Faria'),
    ('Panorama Bíblico', '2026-08-23', 'Weniton Roberto da Costa'),
    ('Panorama Bíblico', '2026-08-23', 'Edson santos soares'),
    ('Panorama Bíblico', '2026-08-23', 'Isac Rodrigues Vidal'),
    ('Panorama Bíblico', '2026-08-23', 'Lucas Ferreira Dutra'),
    ('Panorama Bíblico', '2026-08-23', 'Talassa Patriota da Rocha'),
    ('Mulheres', '2026-09-06', 'Daniela Regina De Resende'),
    ('Mulheres', '2026-09-06', 'Ana Maria Ferreira Garcia Vilela'),
    ('Mulheres', '2026-09-06', 'Marta Rodrigues Ramos'),
    ('Mulheres', '2026-09-06', 'Alessia Nascimento'),
    ('Mulheres', '2026-09-06', 'Alana Corrêa Oliveira'),
    ('Mulheres', '2026-09-06', 'Sara Aguiar Correa'),
    ('Mulheres', '2026-09-06', 'Sarah Crystina Mendes de Sousa'),
    ('Mulheres', '2026-09-06', 'Jéssica Cotrim Cieira'),
    ('Homens', '2026-09-06', 'Éder de Souza Ramos'),
    ('Homens', '2026-09-06', 'Fabio Henrique Nasuno de Paulo'),
    ('Homens', '2026-09-06', 'Eberson Diniz Correa'),
    ('Homens', '2026-09-06', 'David Souza Aguiar'),
    ('Homens', '2026-09-06', 'Thiago Bernardo de Freitas'),
    ('Homens', '2026-09-06', 'Pedro Lucas Rodrigues'),
    ('Homens', '2026-09-06', 'Moisés Rodrigues Siqueira'),
    ('Homens', '2026-09-06', 'Breno Barros Costa'),
    ('Homens', '2026-09-06', 'Jackson Moisés da Silva Oliveira'),
    ('Panorama Bíblico', '2026-09-06', 'Carlos Roberto Oliveira'),
    ('Panorama Bíblico', '2026-09-06', 'Natanael Pereira da Silva'),
    ('Panorama Bíblico', '2026-09-06', 'Paulo do Santos Pinheiro'),
    ('Mulheres', '2026-09-13', 'Ana Maria Ferreira Garcia Vilela'),
    ('Mulheres', '2026-09-13', 'Marta Rodrigues Ramos'),
    ('Mulheres', '2026-09-13', 'Alessia Nascimento'),
    ('Mulheres', '2026-09-13', 'Alana Corrêa Oliveira'),
    ('Mulheres', '2026-09-13', 'Sara Aguiar Correa'),
    ('Mulheres', '2026-09-13', 'Juliana Gomes Arcanjo Silva'),
    ('Mulheres', '2026-09-13', 'Sarah Crystina Mendes de Sousa'),
    ('Mulheres', '2026-09-13', 'Jéssica Cotrim Cieira'),
    ('Homens', '2026-09-13', 'Éder de Souza Ramos'),
    ('Homens', '2026-09-13', 'Eberson Diniz Correa'),
    ('Homens', '2026-09-13', 'Wemerson dos Santos Oliveira'),
    ('Homens', '2026-09-13', 'João Lucas Souza Gondim'),
    ('Homens', '2026-09-13', 'Thiago Bernardo de Freitas'),
    ('Homens', '2026-09-13', 'Matheus Corrêa'),
    ('Homens', '2026-09-13', 'Pedro Lucas Rodrigues'),
    ('Panorama Bíblico', '2026-09-13', 'Maria de Lurdes Faria'),
    ('Panorama Bíblico', '2026-09-13', 'Paulo do Santos Pinheiro'),
    ('Panorama Bíblico', '2026-09-13', 'Isac Rodrigues Vidal'),
    ('Panorama Bíblico', '2026-09-13', 'Benedito José Vieira'),
    ('Mulheres', '2026-09-20', 'Marlene Lina da Silva Cunha'),
    ('Mulheres', '2026-09-20', 'Joyce Cotrim Vieira'),
    ('Mulheres', '2026-09-20', 'Cláudia Vieira da Silva'),
    ('Mulheres', '2026-09-20', 'Sara Aguiar Correa'),
    ('Mulheres', '2026-09-20', 'Jéssica Cotrim Cieira'),
    ('Mulheres', '2026-09-20', 'Polliane tomazo de assis'),
    ('Mulheres', '2026-09-20', 'Aline Maria de Jesus Miranda Souza'),
    ('Homens', '2026-09-20', 'Éder de Souza Ramos'),
    ('Homens', '2026-09-20', 'Eberson Diniz Correa'),
    ('Homens', '2026-09-20', 'Wemerson dos Santos Oliveira'),
    ('Homens', '2026-09-20', 'David Souza Aguiar'),
    ('Homens', '2026-09-20', 'Matheus Corrêa'),
    ('Homens', '2026-09-20', 'Pablo Peterson Rodrigues de Freitas'),
    ('Homens', '2026-09-20', 'Fábio Neri De Souza'),
    ('Homens', '2026-09-20', 'Moisés Rodrigues Siqueira'),
    ('Homens', '2026-09-20', 'Breno Barros Costa'),
    ('Homens', '2026-09-20', 'Jackson Moisés da Silva Oliveira'),
    ('Homens', '2026-09-20', 'Isaac Pereira da Silva'),
    ('Panorama Bíblico', '2026-09-20', 'Carlos Roberto Oliveira'),
    ('Panorama Bíblico', '2026-09-20', 'Natanael Pereira da Silva'),
    ('Panorama Bíblico', '2026-09-20', 'Maria de Lurdes Faria'),
    ('Panorama Bíblico', '2026-09-20', 'Caio Silva Palhares'),
    ('Panorama Bíblico', '2026-09-20', 'Edson santos soares'),
    ('Panorama Bíblico', '2026-09-20', 'Isac Rodrigues Vidal'),
    ('Panorama Bíblico', '2026-09-20', 'Benedito José Vieira'),
    ('Panorama Bíblico', '2026-09-20', 'Wanderson Borges da Conceição'),
    ('Panorama Bíblico', '2026-09-20', 'Julia Damaceno Oliveira');

  -- 5) Conferência: todo nome precisa achar exatamente UMA pessoa
  select string_agg(distinct c.nome, ', ') into sem_pessoa
  from _carga c
  where not exists (select 1 from pessoas p where lower(p.nome) = lower(c.nome));

  select string_agg(nome, ', ') into duplicados
  from (
    select c.nome
    from (select distinct nome from _carga) c
    join pessoas p on lower(p.nome) = lower(c.nome)
    group by c.nome
    having count(*) > 1
  ) d;

  if sem_pessoa is not null then
    raise exception 'Nomes da chamada sem pessoa cadastrada: %', sem_pessoa;
  end if;
  if duplicados is not null then
    raise exception 'Nomes que existem mais de uma vez em pessoas (resolva antes): %', duplicados;
  end if;

  -- 6) Abrir as datas (aulas) que ainda não existem, no módulo 1 da turma
  insert into aulas (modulo_id, data)
  select
    (select m.id
       from modulos m
       join turmas t on t.id = m.turma_id
       join semestres s on s.id = t.semestre_id
      where s.ano = 2026 and s.periodo = 2 and t.nome = c.classe
      order by m.numero
      limit 1),
    c.data
  from (select distinct classe, data from _carga) c
  where not exists (
    select 1
      from aulas a
      join modulos m on m.id = a.modulo_id
      join turmas t on t.id = m.turma_id
      join semestres s on s.id = t.semestre_id
     where s.ano = 2026 and s.periodo = 2 and t.nome = c.classe and a.data = c.data
  );

  -- 7) Matricular na turma quem apareceu nela
  insert into matriculas (turma_id, pessoa_id, ativo)
  select distinct t.id, p.id, true
  from _carga c
  join semestres s on s.ano = 2026 and s.periodo = 2
  join turmas t on t.semestre_id = s.id and t.nome = c.classe
  join pessoas p on lower(p.nome) = lower(c.nome)
  on conflict (turma_id, pessoa_id) do nothing;

  -- 8) Presenças
  insert into presencas (aula_id, pessoa_id, status)
  select distinct a.id, p.id, 'presente'::presenca_status
  from _carga c
  join semestres s on s.ano = 2026 and s.periodo = 2
  join turmas t on t.semestre_id = s.id and t.nome = c.classe
  join modulos m on m.turma_id = t.id
  join aulas a on a.modulo_id = m.id and a.data = c.data
  join pessoas p on lower(p.nome) = lower(c.nome)
  on conflict (aula_id, pessoa_id) do nothing;

  drop table _carga;
end
$carga$;

-- 9) Conferência final: presentes por turma e data. Devem bater com a lista abaixo.
select t.nome as turma, a.data, count(*) filter (where pr.status = 'presente') as presentes
from presencas pr
join aulas a on a.id = pr.aula_id
join modulos m on m.id = a.modulo_id
join turmas t on t.id = m.turma_id
group by t.nome, a.data
order by t.nome, a.data;

-- Esperado (turma · data · presentes):
--   Homens            2026-08-02  7
--   Homens            2026-08-09  7
--   Homens            2026-08-16  8
--   Homens            2026-08-23  11
--   Homens            2026-09-06  9
--   Homens            2026-09-13  7
--   Homens            2026-09-20  11
--   Mulheres          2026-08-02  8
--   Mulheres          2026-08-09  9
--   Mulheres          2026-08-16  12
--   Mulheres          2026-08-23  10
--   Mulheres          2026-09-06  8
--   Mulheres          2026-09-13  8
--   Mulheres          2026-09-20  7
--   Panorama Bíblico  2026-08-02  9
--   Panorama Bíblico  2026-08-09  3
--   Panorama Bíblico  2026-08-16  5
--   Panorama Bíblico  2026-08-23  7
--   Panorama Bíblico  2026-09-06  3
--   Panorama Bíblico  2026-09-13  4
--   Panorama Bíblico  2026-09-20  9
