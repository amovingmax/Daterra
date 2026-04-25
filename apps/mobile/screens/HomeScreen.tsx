import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FEITO_POTIGUAR_CATEGORIES } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { useAuth } from '../lib/auth-context';

export function HomeScreen() {
  const { user, signOut } = useAuth();
  const greetingName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'visitante';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.brand}>🌱 Da Terra</Text>
            <Pressable onPress={signOut} hitSlop={8}>
              <Text style={styles.logout}>Sair</Text>
            </Pressable>
          </View>
          <Text style={styles.greeting}>Olá, {greetingName}</Text>
          <Text style={styles.address}>📍 Natal, RN</Text>
        </View>

        <Text style={styles.sectionTitle}>Categorias</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {FEITO_POTIGUAR_CATEGORIES.map((cat) => (
            <Pressable key={cat.slug} style={styles.categoryItem}>
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Direto da terra potiguar.</Text>
          <Text style={styles.bannerSubtitle}>
            Produtos artesanais com Selo Feito Potiguar — entrega em todo RN.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Destaques Potiguares</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Em breve, fornecedores certificados aparecem aqui. ✨
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { paddingTop: 12, paddingBottom: 40 },
  header: { paddingHorizontal: 20, marginBottom: 24 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brand: {
    fontSize: 22,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[500],
  },
  logout: {
    color: colors.ink.secondary,
    fontSize: 14,
  },
  greeting: { fontSize: 16, color: colors.ink.primary },
  address: { marginTop: 4, fontSize: 14, color: colors.ink.secondary },
  sectionTitle: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
  },
  categories: { paddingHorizontal: 12, marginBottom: 24 },
  categoryItem: { width: 84, alignItems: 'center', marginHorizontal: 8 },
  categoryIcon: { fontSize: 36, marginBottom: 6 },
  categoryLabel: { fontSize: 12, textAlign: 'center', color: colors.ink.primary },
  banner: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 24,
    backgroundColor: colors.brand[500],
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.ink.inverse,
    marginBottom: 8,
  },
  bannerSubtitle: { fontSize: 14, color: colors.brand[100], lineHeight: 20 },
  placeholder: {
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
  },
  placeholderText: { fontSize: 14, color: colors.ink.secondary, textAlign: 'center' },
});
