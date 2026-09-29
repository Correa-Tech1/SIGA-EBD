-- ============================================================================
-- SIGA EBD — 0006_carga_inicial.sql
-- Carga inicial: cadastro de membros (Gestão de Membresia, 23/09/2026) e as
-- chamadas já feitas de 02/08 a 20/09/2026 (planilha FREQUENCIA EBD POR
-- CLASSES E DATAS).
--
-- Rode UMA vez no SQL Editor do Supabase. É repetível: nada é duplicado se
-- rodar de novo (pessoas, aulas, matrículas e presenças checam antes).
-- Se algum nome da chamada não achar uma pessoa, ou achar duas, o script
-- PARA com a lista dos nomes e não grava nada — corrija e rode de novo.
--
-- Só nome e telefone vêm da planilha de membros; CPF, endereço e demais
-- dados pessoais NÃO são carregados.
-- ============================================================================

begin;

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

-- 2) Membros (313 da planilha). Quem já existe (mesmo nome, sem
--    diferenciar maiúscula) é mantido como está — por exemplo a sua conta de
--    coordenação, que entra na planilha como "Matheus Fellipe…".
insert into pessoas (nome, tipo, telefone)
select v.nome, 'membro'::pessoa_tipo, v.telefone
from (values
  ('Adriano da Silva Rodrigues', '+5562994782597'),
  ('Adryan Henrique Gomes Da Silva', null),
  ('Ágatha Vitória da Silva Oliveira', null),
  ('Alana Corrêa Oliveira', '62992864328'),
  ('Alessandro Felis Vieira', '62996807461'),
  ('Alessia Nascimento', '+5562982679740'),
  ('Alexandre da Silva Sá', null),
  ('Alice de Souza Moura', null),
  ('Alice sombra de faria dia', null),
  ('Aline Da Cunha Pereira Damaceno', '+556291966231'),
  ('Aline Maria de Jesus Miranda Souza', '+556282611475'),
  ('Amanda Vitoria Melo Santana Fleury', '62982069631'),
  ('Ana Beatriz Aiden Freitas', '+5562995155744'),
  ('Ana Beatriz Corrêa Oliveira', null),
  ('Ana Julia Alves da Silva', null),
  ('Ana Julia Cunha Damaceno', null),
  ('Ana karla Ferreira Dutra Moura', '62993639512'),
  ('Ana Maria Ferreira Garcia Vilela', '62993180749'),
  ('Ana  Paula Rodrigues dos Santos Paes', '+5562991698266'),
  ('Ana Vitória Batista do Nascimento', '+5562995593552'),
  ('Ana Vitória Luciano', '+5562994606324'),
  ('Andreza Maria da Silva', '81984372981'),
  ('Anna Caroline Mendes de Sousa Tolentino', '62993834109'),
  ('Anna Laura Elias Pereira de Paula', '+5562994194903'),
  ('Anthony Henrique Camargo Lima', null),
  ('Antonio Carlos Pereira Lima', '+556291285569'),
  ('Antônio Lucas Barbosa Ferreira', null),
  ('Aparecida das Dores Cotrim Vieira', '+556291372076'),
  ('Arthur Arcanjo Silva', null),
  ('Arthur Fleury Araújo', '62994205134'),
  ('Arthur Viera Vasconcelos Aguiar', null),
  ('Asafe Aguiar Correa', null),
  ('Aylla Vitória Rodrigues Souza', '+5562991550693'),
  ('Baltazar Aparecido Flor', null),
  ('Benedito José Vieira', '62981437226'),
  ('Benjamin Arcanjo Silva', null),
  ('Bethânia Cavalcante Rocha Fernandes Cintra', '62991890220'),
  ('Breno Barros Costa', '62994455325'),
  ('Bruna Marques da Silva', '62992215730'),
  ('Bruno Emanuel de Brito Coelho', '+5562991271168'),
  ('Bruno Moreira Borges', '62994734099'),
  ('Caio Henrique Sousa da Silva', '62993216907'),
  ('Caio Silva Palhares', '61982211651'),
  ('Cárita Jennifer da Silva Coelho', '+5562991017454'),
  ('Carla Adriane Caetano Ferreira Dutra', '+5562993701463'),
  ('Carlitos Francisco Coelho', '62992577078'),
  ('Carlos Eduardo Sousa Teles', null),
  ('Carlos Roberto Oliveira', '62993217317'),
  ('Carolina de Torres Nicolau', '62993063167'),
  ('Celio Quintino de Moura Neto', '+5562993489557'),
  ('Celma Maria de oliveira', '62994511183'),
  ('Cindy Cristiny dos Santos Sousa', '+5562993797936'),
  ('Cizani Quintino de Abreu', '+5562992681218'),
  ('Cláudia Vieira da Silva', '62982740495'),
  ('Clea Eulina Feitosa Oliveira Dorado', '62993378559'),
  ('Corina severina de moura', '+556292913879'),
  ('Cristina Francisca De Lima', '62993704660'),
  ('Cristopher Arruda de Almeida', '+55'),
  ('Dafiny Vitoria Barbosa Ferreira', '+5562996506380'),
  ('Daniela Regina De Resende', '62991137940'),
  ('Daniel César da Silva Ribeiro', null),
  ('Daniel Luís de Melo Lopes', '+5562993466705'),
  ('Daniel Sales Amaral', '+5562995268711'),
  ('David Gabriel Dutra Martins', '+5562992729388'),
  ('David Lopes de Souza', '62981785103'),
  ('David Souza Aguiar', '62993575364'),
  ('Davi Moura Siqueira', null),
  ('Divina Rodrigues Cimenton', '62992296605'),
  ('Eberson Diniz Correa', '+5562991722704'),
  ('Éder de Souza Ramos', '+5562982732567'),
  ('Edilainne Barros Costa', '62992821780'),
  ('Edimayra Santos de Sousa', null),
  ('Ednei da Silva Dorado', '62993353146'),
  ('Edson santos soares', '62992371502'),
  ('Eduardo Moreira Borges', '62992925535'),
  ('Elias Tomazo Soares', null),
  ('Elisa Victoria Cunha Damasceno', '+5562993373527'),
  ('Elizabeth Sombra Faustino', '+5562996897611'),
  ('Eloá da Silva Rodrigues', null),
  ('Eloah Ester Souza Silva', '+5562991550693'),
  ('Eloá Sophie Rabelo Reiss', null),
  ('Elsa Aparecida da Silva', '62992973988'),
  ('Emanuela Fernandes Fleury', '+5562994205134'),
  ('Emanuelly Vitória Pereira de Almeida', '62992433544'),
  ('Emilly Fiúza Brito Reis', null),
  ('Emilly Vitória Oliveira Evangelista', '62986490797'),
  ('Emily Kamimura Moura', '+5562992759012'),
  ('Enzo tomazo soares', null),
  ('Erick Rafael Ribeiro do Nascimento', '+5582999576585'),
  ('Erivan Fernandes de Brito', '+5562994281715'),
  ('Erlane Rodrigues Carneiro Siqueira', '62992213189'),
  ('Evellyn Thais Pereira de Carvalho', '62984261278'),
  ('Ezequiel Aiden Freitas', '62994411373'),
  ('Fábio Damaceno De Souza', null),
  ('Fabio Henrique Nasuno de Paulo', '94991897421'),
  ('Fabio Mendes Teles', '62993183888'),
  ('Fábio Neri De Souza', '+556282610535'),
  ('Fabrina Rosa Batista de Carvalho Souza', '62993765962'),
  ('Felipe Rodrigues dos Santos Reis', '62993286976'),
  ('Felisberto Sebastião De Andrade', '6233884140'),
  ('Filipe Poli Coutinho de Oliveira', '62995658900'),
  ('Francisca Teixeira Diniz da Costa', '62992464420'),
  ('Francisco das Chagas Passos', '62982926324'),
  ('Gabriel Fernandes Brito', '62995441138'),
  ('Gabriella Ferreira Souza Moura', '+556291120071'),
  ('Gabrielle Alves Vieira', '+5562992895943'),
  ('Gabriel Lucas Alves do Santos', '+5562991296714'),
  ('Geovana Brito Ferreira', '+5562993552965'),
  ('Gessyca Bianca Tavares Ciqueira', '62992390107'),
  ('Getúlio Netto dos Santos Sousa', '62993009354'),
  ('Gildete Gomes Da Cruz', '62991314440'),
  ('Guilherme Fernandes Brito', '62994128894'),
  ('Guilherme Rodrigues Ramos', '62991091161'),
  ('Heitor Felipe Sanches Sombra', null),
  ('Heli Marques da Silva', '62984970795'),
  ('Heloísa Helena Silva Alves', '+5562991723052'),
  ('Hermindo Elizeu da Silva', '+5562991076217'),
  ('Iasmim Wiligta dos Santos', '62981725177'),
  ('Isaac Pereira da Silva', '+5562993347547'),
  ('Isabela Carvalho', '+5562993209466'),
  ('Isabella Alves Fonseca', '+5562994135287'),
  ('Isabella Morais de Melo', '+5562995574983'),
  ('Isabella Moreira Silva Carneiro Siqueira', '62991737816'),
  ('Isac Rodrigues Vidal', '+5562984023585'),
  ('Isadora Victoria Gonçalves Mendes', '+5562994733339'),
  ('Isaías Pereira Silva', null),
  ('Ismael Felipe de Almeida', '+5562991122804'),
  ('Izani Cecília Pereira', '+556299938386'),
  ('Jaciara Pereira de Jesus Santos', '62992458139'),
  ('Jacira Paula Rodrigues dos Santos', '62993286976'),
  ('Jackeline Gomes da Silva Nunes', '62994471734'),
  ('Jackeline Pereira de Siqueira', '62982023392'),
  ('Jackson Moisés da Silva Oliveira', '62993574444'),
  ('Jandira aparecida de Moura', '+556299513042'),
  ('Jéssica Cotrim Cieira', '+5562981437226'),
  ('Jéssica Naiara Sousa Sombra Sanches', '62996333341'),
  ('Jessica Rodrigues Chaveiro', '62994220342'),
  ('Joab Henrique Vieira da Silva', null),
  ('João Amaro Cotrim Oliveira', null),
  ('João Gabriel tomazo soares', null),
  ('João Lucas Souza Gondim', '62992972246'),
  ('João Marcus Guimarães Cunha', null),
  ('João Pedro Ramos Brito', '+5562995377057'),
  ('João Ricardo Barbosa Ferreira', null),
  ('João Victor Silva Araujo', '+5562999588392'),
  ('Jonatas Elias Rodrigues Paes', '62991698266'),
  ('José Dutra Ciqueira', null),
  ('Josefa da Silva Melo', null),
  ('Josefa Maria Lina da Conceição', null),
  ('José Miguel Cotrim Oliveira', null),
  ('José Paulo Camargo Vargas', '62991255588'),
  ('Joyce Cotrim Vieira', '62993889964'),
  ('Julia Damaceno Oliveira', '62992966991'),
  ('Juliana Gomes Arcanjo Silva', '+5562991364504'),
  ('Jullya Maria Correia Cassimiro', '+5562991308819'),
  ('Junio Rodrigues dos Santos', '+5562995705382'),
  ('Kaio Cesar Albuquerque Cintra', '+5562992723986'),
  ('Kaio Henrique Fernandes Nascimento', '+5562991976572'),
  ('Kaio Rafael Corrêa Oliveira', null),
  ('Kaio Renato da Silva Oliveira', '62998115926'),
  ('Kaio Vinicius Tavares', '+5562993574890'),
  ('Kamylle Vitória dos Santos Costa', '+5562994425823'),
  ('Karina Teixeira da Silva', '+5562996845570'),
  ('Kassyane Ribeiro de Souza', '+5562983449326'),
  ('Kathlyn Lauanny Ferreira', '+5562994168264'),
  ('Kauã Dias de Souza', '+5562994785476'),
  ('Kauã Gustavo Santos Silva', '+5562993786278'),
  ('Kauã Mychael Coelho Fernandes', '+5562991296714'),
  ('Kauã Rodrigues Marcilio', '+5562995709972'),
  ('Kayllane Freitas Carvalho', '+5562994143041'),
  ('Kevin Bryan Costa Evangelista', '+5562993945123'),
  ('Kleber Lucas Costa Evangelista', '+5562993478088'),
  ('Lara Eduarda Ferreira Coelho', '62993514881'),
  ('Lara Sabrinny vieira da silva ferreira', '+556286013638'),
  ('Lara Soares Abreu', '+5562994449079'),
  ('Larissa Guimarães Duarte', '+5562993064201'),
  ('Larisson Souza Marques', '62996028104'),
  ('Layla Heloísa Alves de Abreu', '+5562994431680'),
  ('Lays Mell Xavier Cruz', null),
  ('Lázara Divina de Lima Flor', '62994390143'),
  ('Letícia Lacerda da Silva Dutra', '62991940848'),
  ('Letícia Regina de Resende Borges', '+5562994357184'),
  ('Lia Moura Siqueira', null),
  ('Lídia Paixão Ferreira Silva', '62999869629'),
  ('Liz Paixão Silva', null),
  ('Lucas Ferreira Dutra', '+5562993259811'),
  ('Lucas Gabriel Ramos da Silva', '+5577998746942'),
  ('Luciana Valentina Roa Vargas', '+5562998034352'),
  ('Luiza Beatriz Magalhães dos Santos', '+5562998034352'),
  ('Luiza Maria de Araújo', '62992173510'),
  ('Luiz Henrique da Silva', '+5562993992757'),
  ('Luiz Henrique Fernandes Oliveira', '+5562993109109'),
  ('Lurdes Marques da Silva', '62984148574'),
  ('Lyshana de Lima Silva', '+5562984364711'),
  ('Maiany tamires Silva Santos', '62982287065'),
  ('Manoel da Silva Neto', null),
  ('Manuela Arcanjo Silva', null),
  ('Manuela Barros Costa', null),
  ('Márcia Siqueira Sousa', '62991214513'),
  ('Márcio Melo Villarreal Bueno', '62991618465'),
  ('Márcio Pereira Chaveiro', '62993067370'),
  ('Marcos Wendel da Silva Souza', '+5562995637667'),
  ('Marcus Vinícius Machado da Cunha', '+5562991849151'),
  ('Maria Cecilia Lacerda Dutra', null),
  ('Maria de Lurdes Faria', '62992038951'),
  ('Maria Eduarda Antunes Paiva', '+5562993855655'),
  ('Maria Eduarda Fernandes Martins', '+5562994472634'),
  ('Maria Eduarda Freitas Araújo', '+5562991223560'),
  ('Maria Luísa Lacerda Dutra', null),
  ('Maria Marques da Silva', null),
  ('Maria Odete Sousa da Silva', '62991911124'),
  ('Maria regina santos da silva', '+5596999112096'),
  ('Maria Vitória Santana da Silva', '+5562993181816'),
  ('Marina Pereira Torres', null),
  ('Mariney Maria da Silva Coelho', '62992118342'),
  ('Mario Filho Araujo Gomes', '+5562981997839'),
  ('Maristela Dutra de Morais', '+556298445804'),
  ('Marksuel Carlos de Moura Reis', '+5562991436400'),
  ('Marlene Lina da Silva Cunha', '62992051294'),
  ('Marta Rodrigues Ramos', '62981512641'),
  ('Mateus Rodrigues Nery', '62995388348'),
  ('Matheus de Sousa Moura', null),
  ('Matheus Corrêa', '12991481871'),
  ('Maurício Augusto Silva Dias', '+5562992764560'),
  ('Maurício Henrique Gomes Rocha', '+5562993002337'),
  ('Mayara Beatriz Ribeiro do Nascimento', '+5582999576585'),
  ('Maycon Nogueira da Silva', '+5562994102836'),
  ('Melissa Evelyn sombra faria', null),
  ('Melyssa de Oliveira Alves', '+5562995118021'),
  ('Micaias Vieira da Silva', '62994614559'),
  ('Miguel Geovanne Mendes', '+5562994057195'),
  ('Miguel Henrique de Sousa', null),
  ('Mikaelly Maria Correia Cassimiro', '+5562994027568'),
  ('Millena da Silva Souza', '+5562991249502'),
  ('Moisés Rodrigues Siqueira', '62982062337'),
  ('Muriah Yelena Rabelo Reis', null),
  ('Myllena Vitória Gomes da Silva', '+5562992051837'),
  ('Naikson Felipe de Souza Fernandes', '62984886531'),
  ('Nalva Reis Andrade Moribayshi', '62992733923'),
  ('Natanael Pereira da Silva', '62981733119'),
  ('Nicolas Ribeiro Silva', '+5562981187668'),
  ('Nicolle Victoria Oliveira Lopes', '62994897467'),
  ('Nilmar Brito Ferreira', '+5562995410178'),
  ('Noah Gabriel de Morais Mello Villarreal Bueno', null),
  ('Pablina Torres Nicolau', '+5562992819105'),
  ('Pablo Peterson Rodrigues de Freitas', '62993089169'),
  ('Pamela Torres Nicolau', '62994430980'),
  ('Paulo do Santos Pinheiro', '62986503229'),
  ('Paulo Sérgio Sanches Magalhães', '62991776316'),
  ('Pedro Lucas Rodrigues', '+5562993188224'),
  ('Pedro P. Vasconcelos Aguiar', '62991754257'),
  ('Polliane tomazo de assis', '62991804895'),
  ('Pollyana Cunha Soares', '+5562993743725'),
  ('Pollyanne Moreira Araujo da Conceição', '62992660959'),
  ('Raabe Vitória Mendes Silva', null),
  ('Rafaela Silva Marques', '+5562995563684'),
  ('Rafael da Costa', '+556281309976'),
  ('Rafael Ferreira da Silva Andrade', '+5562994528334'),
  ('Raphael dos anjos Araújo', '62993767955'),
  ('Rayane Mendes da Silva', '+556293437797'),
  ('Rayner Augusto de Moura', '62982630059'),
  ('Raysila da Silva Viera Aguiar', '62993710254'),
  ('Rayssa Rauanny Pereira Mesquita', '+5562982065388'),
  ('Rebeca Aguiar Correa', null),
  ('Reginaldo Silva', null),
  ('Ricardo Sampaio Marcolino', '62992051472'),
  ('Rickelmy Gomes Da Silva', null),
  ('Rosinete Monteiro da Silva', '62981347794'),
  ('Samara Vitória Mendes Tavares de Souza', '+55'),
  ('Santana Diniz Vidal', '+5562992942687'),
  ('Sara Aguiar Correa', '+5562992525660'),
  ('Sarah Crystina Mendes de Sousa', '62991313948'),
  ('Sarah Ferreira Moura', null),
  ('Sarah Victoria Feitosa Dourado', '62995226615'),
  ('Sara Jennifer de Sousa', null),
  ('Shigueo Moribayshi Neto', '62999452320'),
  ('Silviane Pereira dos Santos', '62993438681'),
  ('Sophia Ellen Cunha Damaceno', null),
  ('Sophia Vitória Barbosa da Cruz', null),
  ('Suely Gomes Ferreira', '+5562993639099'),
  ('Sulamita Pereira da Silva Rodrigues', '62993891020'),
  ('Talassa Patriota da Rocha', '61981935775'),
  ('Talita Vitória Pereira Ribeiro', '+5562995111836'),
  ('Thalita Cristina Ferreira de Souza Moura', '+556292226364'),
  ('Thaynara Barbosa Alves Ferreira', '62991644777'),
  ('Thays Borges da Silva', null),
  ('Thiago Bernardo de Freitas', '+5562993246467'),
  ('Thiago Ferreira Dutra', '+5562992364885'),
  ('Thiago Vieira da Silva', null),
  ('Tiago do Santos Brito', null),
  ('Valdeilde Ferreira da Silva Junior', '+5562994999661'),
  ('Valdete Pereira', '+5562993254348'),
  ('Vanessa de Jesus Pereira', '75999102773'),
  ('Vanusa Santos de Camargo Lima', null),
  ('Vanusa Vieira', '62993802663'),
  ('Victor Gabriel Corrêa Oliveira', null),
  ('Victor Hugo Sousa Santos', '+5562992645260'),
  ('Victor Pedro Mendes Mendanha', '+5562995466635'),
  ('Violeta Rabelo da Conceição', '6233885119'),
  ('Vitor Viera Vasconcelos Aguiar', null),
  ('Viviane Leite de Oliveira', '62984552295'),
  ('Wagner Moribayashi', '62992532092'),
  ('Wanderson Borges da Conceição', '62992489114'),
  ('Warion Franco de Sousa', '+5562993700394'),
  ('Wellington Carvalho de Oliveira', '62992014282'),
  ('Wellington Felisbino Dutra', '+5562993195991'),
  ('Wellington Vilela', '62994718510'),
  ('Wemerson dos Santos Oliveira', '62993033351'),
  ('Weniton Roberto da Costa', '62992417256'),
  ('Wilton Pereira dos Santos', '+5562994359738'),
  ('Yasmin Vitória Gonçalves Mendes', '+5562994733339'),
  ('Yasmin Vitória Mendes da Silva', '+5562993286186'),
  ('Yohann Pietro Nunes Soares Xavier', '+5562993072890')
) as v(nome, telefone)
where not exists (select 1 from pessoas p where lower(p.nome) = lower(v.nome));

-- 3) Nomes das chamadas que NÃO estão na planilha de membros. Entram como
--    'visitante' (aparecem na chamada, mas não contam como membro). Se algum
--    for membro com o nome escrito diferente, troque o tipo depois.
insert into pessoas (nome, tipo, telefone)
select v.nome, 'visitante'::pessoa_tipo, v.telefone
from (values
  ('Jéssica Alves', null),
  ('Junior Pereira', null),
  ('Nínive Santos', null),
  ('Thais Vitória', null),
  ('Vanusa Alves Santos', null),
  ('Wermerson Correa', null)
) as v(nome, telefone)
where not exists (select 1 from pessoas p where lower(p.nome) = lower(v.nome));

-- 4) Chamadas: uma linha por presente (162 presenças em 21 chamadas)
create temp table _carga (classe text not null, data date not null, nome text not null) on commit drop;

insert into _carga (classe, data, nome) values
  ('Mulheres', '2026-08-02', 'Marta Rodrigues Ramos'),
  ('Mulheres', '2026-08-02', 'Alessia Nascimento'),
  ('Mulheres', '2026-08-02', 'Sara Aguiar Correa'),
  ('Mulheres', '2026-08-02', 'Gabrielle Alves Vieira'),
  ('Mulheres', '2026-08-02', 'Vanusa Alves Santos'),
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
  ('Mulheres', '2026-08-09', 'Vanusa Alves Santos'),
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
  ('Mulheres', '2026-08-23', 'Vanusa Alves Santos'),
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
  ('Homens', '2026-09-13', 'Wermerson Correa'),
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
  ('Homens', '2026-09-20', 'Wermerson Correa'),
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
do $$
declare
  sem_pessoa text;
  duplicados text;
begin
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
end $$;

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

commit;

-- 9) Conferência final: presentes por turma e data. Devem bater com a tabela abaixo.
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
