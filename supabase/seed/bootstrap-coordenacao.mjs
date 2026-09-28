// ============================================================================
// bootstrap-coordenacao.mjs
//
// Roda UMA VEZ, direto do seu computador (nunca no navegador, nunca em produção
// como rota pública), pra criar a primeira conta do sistema — o seu "perfil
// mestre" de coordenação. Depois disso, você cria todo mundo pela própria
// interface em /professores; este script não precisa rodar de novo.
//
// Por que um script separado e não a tela /professores? Porque criar um
// professor pela tela exige estar LOGADO como coordenação — e a primeira
// conta de coordenação ainda não existe. É o mesmo problema de "quem cria o
// primeiro admin" em qualquer sistema; a solução padrão é este tipo de
// script rodado uma única vez com a service_role key.
//
// Uso:
//   1. Preencha .env.local (ver .env.example) com as chaves do seu projeto
//      Supabase, incluindo SUPABASE_SERVICE_ROLE_KEY.
//   2. node --env-file=.env.local supabase/seed/bootstrap-coordenacao.mjs \
//        "Matheus Corrêa" matheus.correa suasenha123
//
// A service_role key nunca deve ir para o navegador nem para nenhum arquivo
// commitado — só existe aqui, na sua máquina, na hora de rodar este script.
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const [, , nome, usuario, senha] = process.argv;

if (!nome || !usuario || !senha) {
  console.error(
    'Uso: node supabase/seed/bootstrap-coordenacao.mjs "Seu Nome" usuario senha'
  );
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no ambiente."
  );
  process.exit(1);
}

// E-mail interno, nunca enviado, nunca visto — o login real do sistema é por
// usuário/senha (ver src/app/login), mas o Supabase Auth exige um e-mail
// único por conta. Convertemos o "usuário" num e-mail sintético estável.
const emailSintetico = `${usuario}@login.interno.siga-ebd`;

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email: emailSintetico,
    password: senha,
    email_confirm: true, // não há fluxo de verificação por e-mail — coordenação provisiona direto
  });

  if (userError) {
    throw new Error(`Falha ao criar usuário no Supabase Auth: ${userError.message}`);
  }

  const { error: pessoaError } = await admin.from("pessoas").insert({
    auth_user_id: userData.user.id,
    nome,
    tipo: "membro",
    role: "coordenacao",
  });

  if (pessoaError) {
    throw new Error(`Usuário criado, mas falhou ao registrar em 'pessoas': ${pessoaError.message}`);
  }

  console.log("Conta de coordenação criada com sucesso.");
  console.log(`  usuário: ${usuario}`);
  console.log(`  (a senha é a que você digitou no comando — guarde num lugar seguro)`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
