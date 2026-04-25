import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FEITO_POTIGUAR_CATEGORIES } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { useAuth } from '../lib/auth-context';
import { listActiveSuppliers } from '../lib/queries';
import type { DBSupplier } from '../lib/supabase';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const greetingName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'visitante';

  const [suppliers, setSuppliers] = useState<DBSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const list = await listActiveSuppliers();
    setSuppliers(list);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    load();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <FlatList
        data={loading ? [] : suppliers}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.brand}>🌱 Da Terra</Text>
              <Text style={styles.greeting}>Olá, {greetingName}</Text>
              <Text style={styles.address}>📍 Rio Grande do Norte</Text>
            </View>

            <Text style={styles.sectionTitle}>Categorias</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categories}
            >
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
            {loading && (
              <ActivityIndicator color={colors.brand[500]} style={{ marginTop: 24 }} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('Store', { supplierId: item.id })}
          >
            <View style={styles.cardImage}>
              {item.cover_url ? (
                <Image source={{ uri: item.cover_url }} style={styles.cardImageInner} />
              ) : (
                <Text style={styles.cardImagePlaceholder}>🌱</Text>
              )}
              <View style={styles.seloBadge}>
                <Text style={styles.seloBadgeText}>🏅 Feito Potiguar</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.city ?? '—'} · {labelForCategory(item.primary_category)}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>Ainda não temos parceiros ativos aqui</Text>
              <Text style={styles.emptySubtitle}>
                Os fornecedores estão sendo validados pela equipe Da Terra. Em breve vão aparecer
                nessa lista.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
}

function labelForCategory(slug: string | null): string {
  if (!slug) return 'Diversos';
  const found = FEITO_POTIGUAR_CATEGORIES.find((c) => c.slug === slug);
  return found?.label ?? 'Diversos';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  listContent: { paddingBottom: 24 },
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 16 },
  brand: {
    fontSize: 22,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[500],
    marginBottom: 12,
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

  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.surface.primary,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImage: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.sand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageInner: { width: '100%', height: '100%' },
  cardImagePlaceholder: { fontSize: 56 },
  seloBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: colors.gold[300],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  seloBadgeText: {
    color: colors.ink.inverse,
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
  },
  cardBody: { padding: 16 },
  cardName: {
    fontSize: 18,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
    marginBottom: 4,
  },
  cardMeta: { fontSize: 13, color: colors.ink.secondary },

  empty: {
    paddingHorizontal: 40,
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.ink.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
