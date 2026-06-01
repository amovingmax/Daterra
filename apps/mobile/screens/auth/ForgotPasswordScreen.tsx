import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@daterra/ui/tokens';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenContainer } from '../../components/ScreenContainer';
import { supabase } from '../../lib/supabase';
import { redirectTo } from '../../lib/oauth';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const emailSchema = z.string().email('Email inválido');

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError(null);
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Email inválido');
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo,
    });
    setLoading(false);

    if (resetError) {
      setError('Não conseguimos enviar o email agora. Tente de novo em instantes.');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <ScreenContainer>
        <Text style={styles.emoji}>📩</Text>
        <Text style={styles.title}>Olha seu email</Text>
        <Text style={styles.subtitle}>
          Se houver uma conta com <Text style={styles.bold}>{email.trim()}</Text>, enviamos um link
          pra você criar uma nova senha. O link abre direto aqui no app.
        </Text>
        <View style={styles.spacer} />
        <Button label="Voltar pro login" onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Esqueceu a senha?</Text>
      <Text style={styles.subtitle}>
        Sem problema. Informe seu email e enviamos um link pra você criar uma nova. 🌱
      </Text>

      <View style={styles.form}>
        <Input
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="seuemail@exemplo.com"
          error={error}
        />

        <View style={styles.spacer} />
        <Button label="Enviar link de recuperação" loading={loading} onPress={handleSubmit} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 44,
    marginTop: 12,
  },
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
    lineHeight: 22,
  },
  bold: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
  form: {
    marginTop: 8,
  },
  spacer: {
    height: 8,
  },
});
