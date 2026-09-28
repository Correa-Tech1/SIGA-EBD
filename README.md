# SIGA EBD

Sistema Integrado de Gestão e Auxílio da Escola Bíblica Dominical — AD Dom
Pedro II.

Este repositório já é o sistema **inteiro**, dos 6 pilares: fundação técnica
(login, contas de professor, os 3 níveis de acesso), Frequência, Biblioteca,
Escalas & Avisos, Aba do Aluno e Auxílio ao Professor. Depois de configurar
Supabase + as variáveis de ambiente (passo a passo abaixo), é só usar — não
falta nenhuma tela de "em breve".

## Por que assim ("leve, organizado, fácil de ajustar depois")

- **RLS, não `if` espalhado.** Os 3 níveis de acesso (leitura sem login /
  conta de verdade / coordenação) são regras dentro do próprio Postgres
  (`supabase/migrations/0002_rls.sql` em diante). Se amanhã a regra mudar,
  muda num lugar só — o código da aplicação nem precisa saber, e um bug na
  tela nunca vaza dado, porque o banco também checa.
- **Sessão do usuário, nunca `service_role`, no que o navegador aciona.**
  Este é o padrão que o *Laudo Técnico da Correa Tech* aponta como o
  correto (o que o Correa Cash já faz) e o oposto do que deixou 7 dos 14
  endpoints do COSMO/JACKBOY/Shema.AI abertos ao público, gastando chave de
  API paga sem checagem nenhuma. Nesta base de código, a `service_role` key
  (`src/lib/supabase/admin.ts`) só é usada num lugar — criar/resetar conta
  de professor — e sempre atrás de uma confirmação `is_coordenacao()` feita
  com o cliente de sessão primeiro. **Todo o resto do sistema (Frequência,
  Biblioteca, Escalas, Aba do Aluno, o próprio Auxílio ao Professor) roda só
  com o cliente de sessão** — inclusive upload de arquivo no Storage e a
  chamada à Anthropic — porque o RLS já decide quem pode o quê; o código só
  chama.
- **Uma pasta por pilar.** `app/(coordenacao)`, `app/(professor)`,
  `app/(aluno)` — mexer na Biblioteca não arrisca quebrar a Frequência. A
  lógica de cada pilar mora em `src/lib/<pilar>/` (queries + actions
  separadas de UI), reaproveitada entre as telas de coordenação e de
  professor que precisam dela (ex.: `PainelFrequencia` é o mesmo componente
  em `/frequencia` e em `/minha-turma`).
- **Tipos de banco à mão hoje, gerados depois.** `src/types/database.ts` é
  escrito manualmente pra não depender de um projeto Supabase já existir.
  Assim que o projeto for criado, troque pelo gerado automaticamente (ver
  comentário no topo do arquivo) — daí o schema e os tipos nunca mais saem
  de sincronia por esquecimento.

## Como colocar no ar

1. **Crie o projeto no [Supabase](https://supabase.com)** (grátis pra
   começar).
2. **Rode as migrations, na ordem**, no SQL Editor do painel Supabase (ou via
   `supabase db push` se preferir a CLI):
   - `0001_schema.sql` — tabelas
   - `0002_rls.sql` — os 3 níveis de acesso
   - `0003_matriculas.sql` — matrícula (roster) de cada turma
   - `0004_aulas_professor_insere.sql` — professor pode abrir aula da própria
     turma sem depender da coordenação
   - `0005_storage_materiais.sql` — cria o bucket `materiais` do Storage e
     as regras de quem sobe/apaga arquivo ali
3. **Copie `.env.example` para `.env.local`** e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project
     Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (mesma tela — nunca vai pro navegador, leia
     o aviso no próprio arquivo)
   - `ANTHROPIC_API_KEY` ([console.anthropic.com](https://console.anthropic.com))
     — só é usada pelo Auxílio ao Professor; sem ela, o resto do sistema
     funciona normalmente e só essa tela mostra erro ao tentar conversar.
4. **Instale as dependências e rode localmente:**

   ```
   npm install
   npm run dev
   ```

5. **Crie sua própria conta de coordenação** (o "perfil mestre" — só precisa
   rodar uma vez, é o único passo por terminal do processo inteiro):

   ```
   node --env-file=.env.local supabase/seed/bootstrap-coordenacao.mjs "Matheus Corrêa" matheus.correa suasenha123
   ```

   Depois disso, entre em `/login` com esse usuário/senha.
6. **Monte a estrutura do semestre pela própria tela** (`/frequencia`,
   seção "Estrutura do semestre"): crie o semestre, as turmas (ex.: Homens —
   "Sucesso em Crise", Mulheres — "Ansiedade e Performance") e os módulos de
   cada uma. Dali em diante, tudo — professor, matrícula, aula, presença,
   material, escala, aviso — é feito pela própria interface.
7. **Deploy:** conecte o repositório no [Vercel](https://vercel.com) e
   configure lá as mesmas 4 variáveis de ambiente do `.env.local`.

## O que cada pilar faz (e onde fica o código)

| Pilar | Tela(s) | Lógica em |
|---|---|---|
| Fundação | `/login`, `/professores` | `src/lib/auth`, `src/lib/supabase` |
| Frequência | `/frequencia` (coordenação), `/minha-turma` (professor) | `src/lib/estrutura`, `src/lib/frequencia` |
| Biblioteca | `/biblioteca` (oficial), dentro de Frequência (material de aula), `/aba-aluno` (leitura) | `src/lib/biblioteca` |
| Escalas & Avisos | `/escalas` (coordenação), dentro de `/minha-turma` (professor) | `src/lib/escalas` |
| Aba do Aluno | `/aba-aluno` — sem login | `src/lib/aba-aluno` |
| Auxílio ao Professor | `/auxilio` + `src/app/api/auxilio/route.ts` | `src/lib/auxilio` |

Cada pasta `src/lib/<pilar>/queries.ts` só lê; `actions.ts` são as Server
Actions (sempre abrindo com `exigirCoordenacao()` ou
`exigirProfessorOuCoordenacao()`, o ponto único de checagem de papel em
`src/lib/auth/session.ts`).

## Decisões em aberto — leia antes de ir pra produção

- **Aba do Aluno mostra o próprio histórico de presença sem exigir login de
  verdade** — a pessoa escolhe o próprio nome numa lista pública
  (`pessoas_publicas`). Isso é identificação leve, não uma senha. O
  comentário no topo de `supabase/migrations/0002_rls.sql` explica o
  racional (presença é baixa sensibilidade) e como apertar essa regra
  depois, se decidir que quer mais proteção aí.
- **Auxílio ao Professor ainda não gera arquivo de verdade** (.docx/.pptx)
  — a conversa fica em texto, pro professor copiar de onde quiser. O
  system prompt (`src/lib/auxilio/metodologia.ts`) já é o "treinado na
  metodologia" pedido — a geração de arquivo é a extensão natural seguinte,
  quando fizer sentido priorizar.
- **Tamanho máximo de arquivo na Biblioteca: 25MB**, tipos aceitos em
  `src/lib/biblioteca/actions.ts` (`TIPOS_ACEITOS`) — ajuste ali se precisar
  de outro tipo de arquivo.

## Segurança — o que aprendemos com o Laudo Técnico da Correa Tech

Todo endpoint ou Server Action deste repositório segue a mesma ordem, sem
exceção: **1) confirma sessão e papel primeiro, 2) só depois toca o banco
ou uma API externa, com parâmetros fixos no servidor.** É o oposto direto
do padrão encontrado em 7 dos 14 endpoints auditados no COSMO/JACKBOY/
Shema.AI (sem checagem de `Authorization` nenhuma, aceitando `model` e
`max_tokens` do corpo da requisição). O exemplo mais visível disso aqui é
`src/app/api/auxilio/route.ts` — compare com `api/chat.js` do Correa Cash,
que foi o modelo seguido.
