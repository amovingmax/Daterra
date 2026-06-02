import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const KEY = 'daterra:pending-address-v1';

/**
 * Quando a confirmação de email está ligada, o cadastro não tem sessão na hora,
 * então o endereço não pode ser inserido (a RLS exige auth.uid()). Guardamos o
 * endereço localmente e inserimos no primeiro login confirmado.
 */
export async function savePendingAddress(address: Record<string, unknown>): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(address));
  } catch {
    /* silencioso — endereço pode ser adicionado depois em Perfil */
  }
}

/** Insere o endereço pendente (se houver) para o usuário logado e limpa. */
export async function flushPendingAddress(userId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;
    const address = JSON.parse(raw);
    const { error } = await supabase.from('addresses').insert({ ...address, user_id: userId });
    // Só limpa se inseriu (senão tenta de novo no próximo login).
    if (!error) await AsyncStorage.removeItem(KEY);
  } catch {
    /* silencioso */
  }
}
