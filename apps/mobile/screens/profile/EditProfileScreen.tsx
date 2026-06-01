import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { maskPhoneBR, phoneSchema } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../lib/auth-context';
import { getProfile, updateProfile } from '../../lib/queries';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((p) => {
      if (p) {
        setFullName(p.full_name);
        setPhone(maskPhoneBR(p.phone));
        setEmail(p.email);
      } else {
        setFullName(user.user_metadata?.full_name ?? '');
        setEmail(user.email ?? '');
      }
    });
  }, [user]);

  async function handleSubmit() {
    if (!user) return;
    setErrors({});

    if (fullName.trim().length < 3) {
      setErrors({ full_name: 'Nome muito curto' });
      return;
    }
    const phoneCheck = phoneSchema.safeParse(phone);
    if (!phoneCheck.success) {
      setErrors({ phone: phoneCheck.error.issues[0]?.message ?? 'Telefone inválido' });
      return;
    }

    setSubmitting(true);
    const ok = await updateProfile(user.id, {
      full_name: fullName.trim(),
      phone: phoneCheck.data,
    });
    setSubmitting(false);

    if (!ok) {
      Alert.alert('Erro', 'Não foi possível salvar.');
      return;
    }
    navigation.goBack();
  }

  return (
    <ScreenContainer>
      <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
        <Text style={styles.back}>← Voltar</Text>
      </Pressable>
      <Text style={styles.title}>Dados pessoais</Text>

      <View style={styles.form}>
        <Input
          label="Nome completo"
          value={fullName}
          onChangeText={setFullName}
          error={errors.full_name}
        />
        <Input
          label="Email"
          value={email}
          editable={false}
          helper="Pra trocar o email, fale com a equipe Da Terra"
        />
        <Input
          label="Celular"
          value={phone}
          onChangeText={(v) => setPhone(maskPhoneBR(v))}
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <View style={styles.spacer} />
        <Button
          label={submitting ? 'Salvando...' : 'Salvar alterações'}
          onPress={handleSubmit}
          loading={submitting}
        />

        {/* Opção discreta — não incentivamos a exclusão da conta. */}
        <Pressable
          onPress={() => navigation.navigate('DeleteAccount')}
          hitSlop={8}
          style={styles.deleteLink}
        >
          <Text style={styles.deleteLinkText}>Excluir minha conta</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.ink.secondary, fontSize: 14, marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
    marginBottom: 20,
  },
  form: { marginTop: 4 },
  spacer: { height: 12 },
  deleteLink: { alignSelf: 'center', marginTop: 28, padding: 8 },
  deleteLinkText: {
    color: colors.ink.tertiary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
