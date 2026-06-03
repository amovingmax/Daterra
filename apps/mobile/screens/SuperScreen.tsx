import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { formatBRL } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Ionicons } from '@expo/vector-icons';
import { CONTENT_MAX_WIDTH } from '../lib/responsive';
import { listActivePromotions, type PromotionItem } from '../lib/queries';
import type { MainTabParamList } from '../navigation/types';

export function SuperScreen() {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [items, setItems] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    const list = await listActivePromotions();
    setItems(list);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="flash" size={30} color={colors.gold[500]} style={styles.lightning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Super Da Terra</Text>
            <Text style={styles.subtitle}>
              Combos e promoções relâmpago dos potiguares — só por hoje
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand[500]} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const photo = item.photos?.[0];
            const original = item.price_cents ?? 0;
            const promo = item.promo_price_cents ?? original;
            const discount = original > 0 ? Math.round((1 - promo / original) * 100) : 0;
            const endsAt = item.promo_ends_at ? new Date(item.promo_ends_at) : null;
            return (
              <Pressable
                style={styles.card}
                onPress={() =>
                  tabNav.navigate('HomeTab', {
                    screen: 'ProductDetail',
                    params: { productId: item.id },
                  })
                }
              >
                <View style={styles.cardImage}>
                  {photo ? (
                    <Image source={{ uri: photo }} style={styles.cardImageInner} />
                  ) : (
                    <Ionicons name="fast-food-outline" size={32} color={colors.sand[300]} />
                  )}
                  {discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>-{discount}%</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.supplierName} numberOfLines={1}>
                    {item.supplier_name}
                  </Text>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceOld}>{formatBRL(original)}</Text>
                    <Text style={styles.priceNew}>{formatBRL(promo)}</Text>
                  </View>
                  {endsAt && (
                    <View style={styles.endsAtRow}>
                      <Ionicons name="time-outline" size={12} color={colors.accent[500]} />
                      <Text style={styles.endsAt}>
                        Termina em{' '}
                        {endsAt.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="flash-outline" size={52} color={colors.sand[300]} style={styles.emptyEmoji} />
              <Text style={styles.emptyTitle}>Nenhuma promoção rolando agora</Text>
              <Text style={styles.emptyText}>
                Volta em breve! Novas ofertas e combos relâmpago dos fornecedores potiguares
                aparecem aqui.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                reload();
              }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lightning: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },
  subtitle: {
    fontSize: 13,
    color: colors.ink.secondary,
    marginTop: 2,
  },
  listContent: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardImage: {
    width: 110,
    height: 110,
    backgroundColor: colors.sand[100],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardImageInner: { width: '100%', height: '100%' },
  cardImagePlaceholder: { fontSize: 38 },
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.accent[400],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: colors.ink.inverse,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
  },
  cardBody: { flex: 1, padding: 12, justifyContent: 'center' },
  supplierName: {
    fontSize: 12,
    color: colors.ink.tertiary,
    marginBottom: 2,
  },
  productName: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceOld: {
    fontSize: 12,
    color: colors.ink.tertiary,
    textDecorationLine: 'line-through',
  },
  priceNew: {
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },
  endsAt: {
    fontSize: 11,
    color: colors.accent[500],
  },
  endsAtRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  empty: {
    paddingVertical: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: colors.ink.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
