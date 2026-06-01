import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from './supabase';

// Garante que o popup do navegador feche e devolva o controle ao app após o OAuth.
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';

/**
 * URI de redirect usado tanto no login social quanto no reset de senha.
 * - Em Expo Go: gera algo como exp://127.0.0.1:8081/--/auth-callback
 * - Em build standalone: daterra://auth-callback (usa o "scheme" do app.json)
 * Esta URL precisa estar cadastrada em Authentication → URL Configuration → Redirect URLs no Supabase.
 */
export const redirectTo = makeRedirectUri({ path: 'auth-callback' });

/**
 * Troca uma URL de retorno (deep link) por uma sessão Supabase.
 * Suporta o fluxo PKCE (?code=...) e o legado por hash (#access_token=...).
 * Retorna a sessão criada ou null se a URL não tinha credenciais.
 */
export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { code, access_token, refresh_token } = params;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  if (access_token && refresh_token) {
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
    return data.session;
  }

  return null;
}

/**
 * Dispara o login social: abre o provedor no navegador in-app, aguarda o
 * redirect de volta e troca o código pela sessão. O AuthProvider escuta a
 * mudança de sessão e redireciona pra Home automaticamente.
 */
export async function signInWithProvider(
  provider: OAuthProvider,
): Promise<{ error?: string; cancelled?: boolean }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error) return { error: error.message };
    if (!data?.url) return { error: 'Não foi possível iniciar o login.' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { cancelled: true };
    }
    if (result.type !== 'success' || !result.url) {
      return { error: 'Login não concluído.' };
    }

    await createSessionFromUrl(result.url);
    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Falha no login social.';
    return { error: message };
  }
}
