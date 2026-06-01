import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { createSessionFromUrl } from './oauth';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** True quando o usuário abriu o link de recuperação de senha e precisa definir uma nova. */
  recovery: boolean;
  /** Encerra o modo de recuperação (após salvar a nova senha ou cancelar). */
  endRecovery: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Processa deep links recebidos (ex.: link de reset de senha no email, retorno de OAuth
  // aberto fora do fluxo in-app). A troca de código dispara o onAuthStateChange acima.
  useEffect(() => {
    function handleUrl(url: string | null) {
      if (!url) return;
      if (!url.includes('code=') && !url.includes('access_token=')) return;
      createSessionFromUrl(url).catch(() => {
        /* link inválido/expirado — silencioso; a tela de origem trata o erro */
      });
    }

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRecovery(false);
  };

  const endRecovery = () => setRecovery(false);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        recovery,
        endRecovery,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
