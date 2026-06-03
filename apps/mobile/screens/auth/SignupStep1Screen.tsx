import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signupSchema, maskPhoneBR } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenContainer } from '../../components/ScreenContainer';
import { PRIVACY_POLICY_URL } from '../../lib/legal';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignupStep1'>;

export function SignupStep1Screen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleNext() {
    setErrors({});
    const parsed = signupSchema.safeParse({
      full_name: fullName,
      email,
      phone,
      password,
      password_confirm: passwordConfirm,
      accepted_terms: acceptedTerms,
    });

    if (!parsed.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]?.toString() ?? '_';
        if (!newErrors[path]) newErrors[path] = issue.message;
      }
      setErrors(newErrors);
      return;
    }

    navigation.navigate('SignupStep2', {
      step1: {
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        password: parsed.data.password,
      },
    });
  }

  return (
    <ScreenContainer>
      <Text style={styles.step}>Passo 1 de 2</Text>
      <Text style={styles.title}>Seus dados</Text>
      <Text style={styles.subtitle}>Pra começar, alguns dados básicos.</Text>

      <View style={styles.form}>
        <Input
          label="Nome completo"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          autoComplete="name"
          placeholder="Maria da Silva"
          error={errors.full_name}
        />
        <Input
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          placeholder="seuemail@exemplo.com"
          error={errors.email}
        />
        <Input
          label="Celular"
          keyboardType="phone-pad"
          autoComplete="tel"
          value={phone}
          onChangeText={(v) => setPhone(maskPhoneBR(v))}
          placeholder="(84) 9 8888-7777"
          error={errors.phone}
        />
        <Input
          label="Senha"
          secureTextEntry={!showPassword}
          autoComplete="password-new"
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 8 caracteres com 1 número"
          error={errors.password}
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
        <Input
          label="Confirmar senha"
          secureTextEntry={!showPassword}
          autoComplete="password-new"
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          placeholder="Repita a senha"
          error={errors.password_confirm}
        />

        <Pressable
          style={styles.termsRow}
          onPress={() => setAcceptedTerms((v) => !v)}
          hitSlop={8}
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
            {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            Li e aceito os{' '}
            <Text style={styles.termsLink}>Termos de Uso</Text> e a{' '}
            <Text
              style={styles.termsLink}
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            >
              Política de Privacidade
            </Text>
            .
          </Text>
        </Pressable>
        {errors.accepted_terms ? (
          <Text style={styles.errorBlock}>{errors.accepted_terms}</Text>
        ) : null}

        <View style={styles.spacer} />
        <Button label="Continuar" onPress={handleNext} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  step: {
    fontSize: 12,
    color: colors.ink.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
    marginTop: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.ink.secondary,
    marginTop: 4,
    marginBottom: 24,
  },
  form: {
    marginTop: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    marginRight: 10,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  checkmark: {
    color: colors.ink.inverse,
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: colors.ink.secondary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.brand[500],
    fontWeight: typography.fontWeight.medium,
  },
  errorBlock: {
    marginTop: 4,
    fontSize: 13,
    color: colors.status.danger,
  },
  spacer: {
    height: 16,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyeIcon: {
    fontSize: 18,
  },
});
