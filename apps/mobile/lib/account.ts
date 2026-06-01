import { supabase } from './supabase';

/**
 * Exclui definitivamente a conta do usuário logado (direito de eliminação —
 * LGPD art. 18, VI). Invoca a Edge Function delete-account, que remove os dados
 * pessoais e o login com a service_role. O sign-out local roda em seguida.
 */
export async function deleteAccount(): Promise<{ error?: string }> {
  const { data, error } = await supabase.functions.invoke<{ deleted?: boolean; error?: string }>(
    'delete-account',
    { body: {} },
  );

  if (error) return { error: error.message ?? 'Não foi possível excluir a conta.' };
  if (!data?.deleted) return { error: data?.error ?? 'Falha ao excluir a conta.' };

  // Conta removida no servidor — limpa a sessão local.
  await supabase.auth.signOut();
  return {};
}
