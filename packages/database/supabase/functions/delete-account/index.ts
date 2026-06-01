// delete-account
// ---------------
// Exclusão de conta a pedido do titular — direito de eliminação previsto na
// LGPD (Lei nº 13.709/2018, art. 18, VI). Chamada pelo app com o JWT do próprio
// usuário; remove definitivamente os dados pessoais e o login.
//
// Ordem de remoção (com service_role, ignorando RLS):
//   1. reviews do usuário          (FK p/ profiles sem cascade)
//   2. orders do usuário           (FK p/ profiles sem cascade; cascateia itens,
//                                    histórico, avaliações de pedido, payout_orders)
//   3. auth.users                  (cascateia profiles → addresses, favorites,
//                                    payment_cards, notifications, expo_push_tokens)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

  try {
    // 1) Identifica o titular pelo JWT (só ele mesmo pode excluir a própria conta)
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
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 2) Remove o que referencia profiles sem cascade
    const { error: revErr } = await admin.from('reviews').delete().eq('user_id', uid);
    if (revErr) throw new Error(`reviews: ${revErr.message}`);

    const { error: ordErr } = await admin.from('orders').delete().eq('user_id', uid);
    if (ordErr) throw new Error(`orders: ${ordErr.message}`);

    // 3) Remove o login — cascateia profiles e todo o resto dos dados pessoais
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) throw new Error(`auth: ${delErr.message}`);

    return json({ deleted: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro ao excluir conta' }, 500);
  }
});
