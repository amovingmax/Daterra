/**
 * Cria (ou atualiza) a CONTA DEMO usada pelos revisores da App Store / Google Play.
 *
 * Por que existe: a Guideline 2.1 da Apple exige um login de teste funcionando,
 * informado nas notas de revisão, quando o app tem autenticação. Este script é
 * idempotente — rodar de novo só garante o estado (não duplica nada).
 *
 * Pré-requisitos (NUNCA commitar essas chaves):
 *   export SUPABASE_URL="https://xxxx.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="..."   # service_role (Settings → API), NÃO a anon
 *
 * Uso:
 *   node packages/database/scripts/seed-demo-account.mjs
 *
 * Credenciais geradas (coloque-as no App Store Connect → App Review Information):
 *   e-mail:  revisor.appstore@daterra.app
 *   senha:   DaTerra#Review2026
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '\n[seed-demo-account] Faltam variáveis de ambiente.\n' +
      '  export SUPABASE_URL="https://xxxx.supabase.co"\n' +
      '  export SUPABASE_SERVICE_ROLE_KEY="<service_role key>"\n',
  );
  process.exit(1);
}

const DEMO = {
  email: 'revisor.appstore@daterra.app',
  password: 'DaTerra#Review2026',
  full_name: 'Revisor App Store',
  phone: '84999990000',
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  // listUsers é paginado; pra um projeto pequeno a 1ª página basta.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function main() {
  const existing = await findUserByEmail(DEMO.email);

  if (existing) {
    // Garante senha conhecida + e-mail confirmado, caso já exista de uma rodada anterior.
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: DEMO.password,
      email_confirm: true,
      user_metadata: { full_name: DEMO.full_name, phone: DEMO.phone },
    });
    if (error) throw error;
    console.log(`[seed-demo-account] Conta demo já existia — credenciais reafirmadas (id=${existing.id}).`);
    return;
  }

  // O trigger on_auth_user_created cria o profile a partir do user_metadata.
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO.email,
    password: DEMO.password,
    email_confirm: true,
    user_metadata: { full_name: DEMO.full_name, phone: DEMO.phone },
  });
  if (error) throw error;

  console.log(`[seed-demo-account] Conta demo criada (id=${data.user.id}).`);
  console.log(`  e-mail: ${DEMO.email}`);
  console.log(`  senha:  ${DEMO.password}`);
}

main().catch((e) => {
  console.error('[seed-demo-account] Falhou:', e.message ?? e);
  process.exit(1);
});
