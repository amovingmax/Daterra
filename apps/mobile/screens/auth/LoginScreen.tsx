import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { loginSchema } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenContainer } from '../../components/ScreenContainer';
import { supabase } from '../../lib/supabase';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);

    if (signInError) {
      setError('Email ou senha inválidos');
      return;
    }
    // AuthProvider escuta a mudança de sessão e redireciona pra Home automaticamente.
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Entrar</Text>
      <Text style={styles.subtitle}>Bem-vindo de volta ao Da Terra. 🌱</Text>

      <View style={styles.form}>
        <Input
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="seuemail@exemplo.com"
        />
        <Input
          label="Senha"
          autoCapitalize="none"
          autoComplete="password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          rightAdornment={
            <Pressable
              onPress={() => setShowPassword((s) => !s)}
              hitSlop={8}
              style={styles.eyeBtn}
              accessibilityLabel={showPassword ? 'Esconder senha' : 'Mostrar senha'}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </Pressable>
          }
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.spacer} />
        <Button label="Entrar" loading={loading} onPress={handleSubmit} />

        <Pressable
          style={styles.forgot}
          hitSlop={8}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Esqueci minha senha</Text>
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
  error: {
    color: colors.status.danger,
    fontSize: 14,
    marginBottom: 8,
  },
  spacer: {
    height: 8,
  },
  forgot: {
    marginTop: 18,
    alignSelf: 'center',
  },
  forgotText: {
    color: colors.ink.secondary,
    fontSize: 14,
  },
});
