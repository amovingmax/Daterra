import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { addressSchema, maskCEP } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenContainer } from '../../components/ScreenContainer';
import { fetchAddressByCEP } from '../../lib/viacep';
import { supabase } from '../../lib/supabase';
import { redirectTo } from '../../lib/oauth';
import { savePendingAddress } from '../../lib/pending-address';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignupStep2'>;

export function SignupStep2Screen({ route, navigation }: Props) {
  const { step1 } = route.params;

  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('RN');
  const [label, setLabel] = useState('Casa');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCEPLookup(input: string) {
    const masked = maskCEP(input);
    setZipCode(masked);
    const digits = masked.replace(/\D/g, '');
    if (digits.length === 8) {
      setLoadingCEP(true);
      const found = await fetchAddressByCEP(digits);
      setLoadingCEP(false);
      if (found) {
        setStreet(found.street);
        setDistrict(found.district);
        setCity(found.city);
        setStateUf(found.state);
      }
    }
  }

  async function handleSubmit() {
    setErrors({});
    const parsed = addressSchema.safeParse({
      label,
      zip_code: zipCode,
      street,
      number,
      complement: complement || null,
      district,
      city,
      state: stateUf,
      reference: null,
      is_primary: true,
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

    setSubmitting(true);
    try {
      // 1. Criar conta no Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: step1.email,
        password: step1.password,
        options: {
          // Link de confirmação volta pro app (deep link tratado no auth-context).
          emailRedirectTo: redirectTo,
          data: {
            full_name: step1.full_name,
            phone: step1.phone,
          },
        },
      });

      if (signUpError) {
        Alert.alert(
          'Erro ao criar conta',
          signUpError.message.includes('registered')
            ? 'Esse email já está cadastrado.'
            : signUpError.message,
        );
        return;
      }

      // 2. Se sessão existe (email confirm desabilitado), insere endereço
      if (data.session) {
        const { error: addressError } = await supabase
          .from('addresses')
          .insert({ ...parsed.data, user_id: data.user!.id });
        if (addressError) {
          Alert.alert(
            'Conta criada, mas erro ao salvar endereço',
            'Você pode adicionar depois em Perfil > Endereços.\n\n' + addressError.message,
          );
        }
        // AuthProvider redireciona pra Home automaticamente
      } else {
        // Email confirmation habilitado: sem sessão agora. Guarda o endereço pra
        // inserir no 1º login (a RLS exige sessão), e manda confirmar o email.
        await savePendingAddress(parsed.data);
        Alert.alert(
          'Confirme seu email 📩',
          `Enviamos um link de confirmação pra ${step1.email}. Confirme pra ativar sua conta e fazer login. Seu endereço é salvo automaticamente na primeira entrada.`,
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.step}>Passo 2 de 2</Text>
      <Text style={styles.title}>Onde você recebe?</Text>
      <Text style={styles.subtitle}>
        Por enquanto atendemos no Rio Grande do Norte. Em breve em outros estados.
      </Text>

      <View style={styles.form}>
        <Input
          label="Apelido"
          value={label}
          onChangeText={setLabel}
          placeholder="Casa, Trabalho, Outro"
          error={errors.label}
        />
        <Input
          label="CEP"
          keyboardType="number-pad"
          value={zipCode}
          onChangeText={handleCEPLookup}
          placeholder="59000-000"
          maxLength={9}
          helper={loadingCEP ? 'Buscando endereço...' : 'Preenchemos automaticamente'}
          error={errors.zip_code}
        />
        <Input
          label="Logradouro"
          value={street}
          onChangeText={setStreet}
          placeholder="Rua, Avenida, etc."
          error={errors.street}
        />
        <View style={styles.row}>
          <View style={styles.flex2}>
            <Input
              label="Número"
              keyboardType="number-pad"
              value={number}
              onChangeText={setNumber}
              placeholder="123"
              error={errors.number}
            />
          </View>
          <View style={styles.flex3}>
            <Input
              label="Complemento"
              value={complement}
              onChangeText={setComplement}
              placeholder="Apto 302"
            />
          </View>
        </View>
        <Input
          label="Bairro"
          value={district}
          onChangeText={setDistrict}
          error={errors.district}
        />
        <View style={styles.row}>
          <View style={styles.flex3}>
            <Input
              label="Cidade"
              value={city}
              onChangeText={setCity}
              error={errors.city}
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="UF"
              value={stateUf}
              onChangeText={(v) => setStateUf(v.toUpperCase().slice(0, 2))}
              maxLength={2}
              autoCapitalize="characters"
              error={errors.state}
            />
          </View>
        </View>

        <View style={styles.spacer} />
        <Button label="Criar minha conta" loading={submitting} onPress={handleSubmit} />
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
    fontSize: 14,
    color: colors.ink.secondary,
    marginTop: 4,
    marginBottom: 24,
    lineHeight: 20,
  },
  form: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  flex3: {
    flex: 3,
  },
  spacer: {
    height: 12,
  },
});
