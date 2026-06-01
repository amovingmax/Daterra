import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { passwordSchema } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenContainer } from '../../components/ScreenContainer';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';

/**
 * Renderizada pelo RootNavigator quando auth.recovery === true (usuário chegou
 * pelo link de recuperação no email). Define a nova senha e encerra o modo.
 */
export function ResetPasswordScreen() {
  const { endRecovery, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Senha inválida');
      return;
    }
    if (password !== confirm) {
      setError('Senhas não conferem');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError('Não foi possível atualizar a senha. O link pode ter expirado.');
      return;
    }
    // Senha trocada — sai do modo recuperação. A sessão ativa leva direto pra Home.
    endRecovery();
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Criar nova senha</Text>
      <Text style={styles.subtitle}>Escolha uma senha nova pra sua conta Da Terra. 🌱</Text>

      <View style={styles.form}>
        <Input
          label="Nova senha"
          autoCapitalize="none"
          secureTextEntry={!show}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          helper="Ao menos 8 caracteres e 1 número"
          rightAdornment={
            <Pressable
              onPress={() => setShow((s) => !s)}
              hitSlop={8}
              style={styles.eyeBtn}
              accessibilityLabel={show ? 'Esconder senha' : 'Mostrar senha'}
            >
              <Text style={styles.eyeIcon}>{show ? '🙈' : '👁'}</Text>
            </Pressable>
          }
        />
        <Input
          label="Confirmar nova senha"
          autoCapitalize="none"
          secureTextEntry={!show}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="••••••••"
          error={error}
        />

        <View style={styles.spacer} />
        <Button label="Salvar nova senha" loading={loading} onPress={handleSubmit} />

        <Pressable style={styles.cancel} hitSlop={8} onPress={signOut}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.ink.secondary,
    marginTop: 6,
    marginBottom: 24,
  },
  form: {
    marginTop: 8,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyeIcon: {
    fontSize: 18,
  },
  spacer: {
    height: 8,
  },
  cancel: {
    marginTop: 18,
    alignSelf: 'center',
  },
  cancelText: {
    color: colors.ink.secondary,
    fontSize: 14,
  },
});
