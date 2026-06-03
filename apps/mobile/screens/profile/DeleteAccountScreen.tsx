import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@daterra/ui/tokens';
import { Bounded } from '../../components/Bounded';
import { CONTENT_MAX_WIDTH } from '../../lib/responsive';
import { Button } from '../../components/Button';
import { deleteAccount } from '../../lib/account';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'DeleteAccount'>;

const REMOVED = [
  'Seus dados pessoais (nome, e-mail, telefone, CPF)',
  'Endereços salvos',
  'Favoritos e notificações',
  'Seu acesso (login) ao Da Terra',
];

export function DeleteAccountScreen({ navigation }: Props) {
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  function confirm() {
    Alert.alert(
      'Excluir conta definitivamente?',
      'Esta ação é permanente. Seus dados pessoais serão removidos e você perderá o acesso. O histórico de pedidos é mantido anonimizado por obrigação legal.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: runDelete },
      ],
    );
  }

  async function runDelete() {
    setLoading(true);
    const { error } = await deleteAccount();
    setLoading(false);
    if (error) {
      Alert.alert('Não foi possível excluir', `${error}\n\nSe persistir, fale com o suporte.`);
      return;
    }
    // Conta apagada + sessão encerrada → o app volta ao modo visitante.
    Alert.alert(
      'Conta excluída',
      'Seus dados foram removidos. Sentiremos sua falta! 🌱',
      [{ text: 'OK', onPress: () => navigation.popToTop() }],
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Bounded>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>← Voltar</Text>
        </Pressable>

        <Text style={styles.title}>Excluir minha conta</Text>

        <View style={styles.lgpdBox}>
          <Text style={styles.lgpdText}>
            Você tem o direito de solicitar a eliminação dos seus dados pessoais, conforme a{' '}
            <Text style={styles.bold}>LGPD — Lei nº 13.709/2018 (art. 18, VI)</Text>. Ao confirmar,
            removemos definitivamente:
          </Text>
        </View>

        <View style={styles.list}>
          {REMOVED.map((item) => (
            <View key={item} style={styles.listRow}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.retentionBox}>
          <Text style={styles.retentionText}>
            📑 O <Text style={styles.bold}>histórico de pedidos</Text> é mantido de forma{' '}
            <Text style={styles.bold}>anonimizada</Text> (sem seus dados pessoais) para cumprir
            obrigações legais e fiscais de guarda, conforme permite a própria LGPD (art. 16, I).
          </Text>
        </View>

        <Text style={styles.warning}>
          ⚠️ Esta ação é <Text style={styles.bold}>permanente</Text> e não pode ser desfeita. Você
          perde o acesso à conta e aos pedidos.
        </Text>

        <Pressable style={styles.agreeRow} onPress={() => setAgree((v) => !v)} hitSlop={6}>
          <View style={[styles.checkbox, agree && styles.checkboxOn]}>
            {agree && <Text style={styles.checkboxTick}>✓</Text>}
          </View>
          <Text style={styles.agreeText}>
            Entendo que a exclusão é permanente e autorizo a remoção dos meus dados.
          </Text>
        </Pressable>
      </Bounded>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          label={loading ? 'Excluindo…' : 'Excluir minha conta'}
          variant="danger"
          loading={loading}
          disabled={!agree}
          onPress={confirm}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { padding: 20, paddingBottom: 24 },
  back: { color: colors.ink.secondary, fontSize: 14, marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.status.danger,
    marginBottom: 16,
  },
  lgpdBox: {
    backgroundColor: colors.surface.primary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: 16,
  },
  lgpdText: { fontSize: 14, color: colors.ink.secondary, lineHeight: 21 },
  bold: { fontWeight: typography.fontWeight.semibold, color: colors.ink.primary },
  retentionBox: {
    backgroundColor: colors.sand[100],
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  retentionText: { fontSize: 13, color: colors.ink.secondary, lineHeight: 20 },
  list: { marginBottom: 16, gap: 8 },
  listRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  listBullet: { color: colors.ink.tertiary, fontSize: 15 },
  listText: { flex: 1, fontSize: 14, color: colors.ink.primary, lineHeight: 20 },
  warning: {
    fontSize: 14,
    color: colors.ink.secondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: colors.status.danger, borderColor: colors.status.danger },
  checkboxTick: { color: colors.ink.inverse, fontSize: 14, fontWeight: typography.fontWeight.bold },
  agreeText: { flex: 1, fontSize: 14, color: colors.ink.primary, lineHeight: 20 },
  bottomBar: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.sand[200],
  },
});
