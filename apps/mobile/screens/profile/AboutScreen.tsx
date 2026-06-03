import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@daterra/ui/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Bounded } from '../../components/Bounded';
import { PRIVACY_POLICY_URL } from '../../lib/legal';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'About'>;

export function AboutScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Bounded>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Ionicons name="chevron-back" size={18} color={colors.ink.secondary} />
          <Text style={styles.back}>Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Sobre o Da Terra</Text>

        <Ionicons name="leaf" size={64} color={colors.brand[500]} style={styles.brandLogo} />
        <Text style={styles.brand}>Da Terra</Text>

        <Text style={styles.body}>
          Marketplace mobile-first que conecta consumidores do Rio Grande do Norte aos
          produtores, agroindústrias, bares, restaurantes e hotéis certificados com o{' '}
          <Text style={styles.bold}>Selo Feito Potiguar</Text> — programa oficial do
          SEBRAE/RN, FAERN, FIERN e FECOMÉRCIO.
        </Text>

        <Text style={styles.body}>
          Compre direto de quem produz. Sem atravessador, com curadoria embutida e
          rastreabilidade do produto até o produtor.
        </Text>

        <View style={styles.divider} />

        <Pressable
          onPress={() => Linking.openURL('https://feitopotiguar.com.br')}
          style={styles.link}
        >
          <Ionicons name="ribbon-outline" size={18} color={colors.brand[600]} />
          <Text style={styles.linkText}>Programa Feito Potiguar</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.ink.tertiary} />
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL('mailto:contato@daterra.app')}
          style={styles.link}
        >
          <Ionicons name="mail-outline" size={18} color={colors.brand[600]} />
          <Text style={styles.linkText}>contato@daterra.app</Text>
        </Pressable>

        <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} style={styles.link}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.brand[600]} />
          <Text style={styles.linkText}>Política de Privacidade</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.ink.tertiary} />
        </Pressable>

        <Text style={styles.footer}>MVP v0.0.1 · Abril 2026</Text>
      </Bounded>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  back: { color: colors.ink.secondary, fontSize: 14, marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
    marginBottom: 20,
  },
  brandLogo: { fontSize: 64, textAlign: 'center', marginTop: 12 },
  brand: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
    textAlign: 'center',
    marginBottom: 24,
  },
  body: {
    fontSize: 15,
    color: colors.ink.primary,
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: { fontWeight: typography.fontWeight.bold },
  divider: {
    height: 1,
    backgroundColor: colors.sand[200],
    marginVertical: 20,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sand[200],
  },
  linkText: { flex: 1, fontSize: 15, color: colors.brand[600] },
  footer: {
    fontSize: 12,
    color: colors.ink.tertiary,
    textAlign: 'center',
    marginTop: 32,
  },
});
