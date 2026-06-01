// delete-account
// ---------------
// Exclusão de conta a pedido do titular — direito de eliminação previsto na
// LGPD (Lei nº 13.709/2018, art. 18, VI). A LGPD ressalva, porém, a guarda de
// dados para cumprimento de obrigação legal/fiscal (art. 16, I). Por isso aqui
// fazemos ANONIMIZAÇÃO: removemos os dados pessoais e desativamos o login, mas
// preservamos o registro financeiro dos pedidos (sem PII) pelo período de
// retenção legal.
//
// O que acontece (com service_role, ignorando RLS):
//   1. Apaga dados pessoais periféricos: reviews, favorites, payment_cards,
//      notifications, expo_push_tokens, addresses.
//   2. Anonimiza os pedidos (remove o snapshot de endereço) mantendo os valores.
//   3. Anonimiza o profile (nome/email/telefone/cpf).
//   4. Embaralha o e-mail do auth e limpa metadados — o login pelo e-mail
//      original deixa de existir (não usamos ban).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

  try {
    // Identifica o titular pelo JWT (só ele mesmo pode excluir a própria conta)
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: 'Não autenticado' }, 401);

    const uid = user.id;
    const anonEmail = `deleted+${uid}@anonimizado.daterra.app`;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1) Apaga dados pessoais periféricos (não exigidos por retenção fiscal)
    for (const table of [
      'reviews',
      'favorites',
      'payment_cards',
      'notifications',
      'expo_push_tokens',
      'addresses',
    ]) {
      const { error } = await admin.from(table).delete().eq('user_id', uid);
      if (error) throw new Error(`${table}: ${error.message}`);
    }

    // 2) Anonimiza os pedidos: mantém o registro financeiro, remove o endereço
    const { error: ordErr } = await admin
      .from('orders')
      .update({ delivery_address: null })
      .eq('user_id', uid);
    if (ordErr) throw new Error(`orders: ${ordErr.message}`);

    // 3) Anonimiza o profile (mantém a linha para os pedidos seguirem válidos)
    const { error: profErr } = await admin
      .from('profiles')
      .update({
        full_name: 'Usuário removido',
        email: anonEmail,
        phone: '',
        cpf: null,
        avatar_url: null,
        notification_prefs: {
          order_updates: false,
          promotions: false,
          favorites_news: false,
          newsletter: false,
        },
      })
      .eq('id', uid);
    if (profErr) throw new Error(`profiles: ${profErr.message}`);

    // 4) Embaralha o e-mail do auth e limpa metadados (remove PII de login).
    // Sem ban: o e-mail original some, então não há como reentrar com ele.
    const { error: authErr } = await admin.auth.admin.updateUserById(uid, {
      email: anonEmail,
      email_confirm: true,
      user_metadata: {},
      app_metadata: {},
    });
    if (authErr) throw new Error(`auth: ${authErr.message}`);

    return json({ deleted: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro ao excluir conta' }, 500);
  }
});
