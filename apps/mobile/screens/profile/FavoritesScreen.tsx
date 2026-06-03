import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { formatBRL } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Bounded } from '../../components/Bounded';
import { useAuth } from '../../lib/auth-context';
import { useFavorites } from '../../lib/favorites-context';
import { listMyFavorites, type MyFavorites } from '../../lib/queries';
import { supplierTypeIcon } from '../../lib/icons';
import type { ProfileStackParamList, RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Favorites'>;

const EMPTY: MyFavorites = { suppliers: [], products: [] };

export function FavoritesScreen({ navigation }: Props) {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { isFavoriteSupplier, isFavoriteProduct, toggleSupplier, toggleProduct } = useFavorites();
  const [data, setData] = useState<MyFavorites>(EMPTY);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) {
        setData(EMPTY);
        setLoading(false);
        return;
      }
      setLoading(true);
      listMyFavorites(user.id).then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  function openStore(supplierId: string) {
    rootNav.navigate('Main', {
      screen: 'HomeTab',
      params: { screen: 'Store', params: { supplierId } },
    });
  }

  function openProduct(productId: string) {
    rootNav.navigate('Main', {
      screen: 'HomeTab',
      params: { screen: 'ProductDetail', params: { productId } },
    });
  }

  // Filtra pelos Sets vivos do contexto: ao desfavoritar, o item some na hora.
  const suppliers = data.suppliers.filter((s) => isFavoriteSupplier(s.id));
  const products = data.products.filter((p) => isFavoriteProduct(p.id));
  const isEmpty = suppliers.length === 0 && products.length === 0;

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

          <Text style={styles.title}>Favoritos</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.brand[500]} />
            </View>
          ) : isEmpty ? (
            <View style={styles.emptyBox}>
              <Ionicons name="heart-outline" size={44} color={colors.sand[300]} />
              <Text style={styles.emptyTitle}>Nada por aqui ainda</Text>
              <Text style={styles.emptyText}>
                Toque no coração das lojas e produtos que você curtir pra encontrá-los rápido depois.
              </Text>
            </View>
          ) : (
            <>
              {suppliers.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Lojas</Text>
                  <View style={styles.group}>
                    {suppliers.map((s, i) => (
                      <Pressable
                        key={s.id}
                        onPress={() => openStore(s.id)}
                        style={[styles.row, i < suppliers.length - 1 && styles.rowBorder]}
                      >
                        <View style={styles.thumb}>
                          {s.cover_url ? (
                            <Image source={{ uri: s.cover_url }} style={styles.thumbImg} />
                          ) : (
                            <Ionicons
                              name={supplierTypeIcon(s.type)}
                              size={22}
                              color={colors.sand[400]}
                            />
                          )}
                        </View>
                        <View style={styles.rowInfo}>
                          <Text style={styles.rowName} numberOfLines={1}>
                            {s.name}
                          </Text>
                          {(s.city || s.state) && (
                            <Text style={styles.rowMeta} numberOfLines={1}>
                              {[s.city, s.state].filter(Boolean).join(', ')}
                            </Text>
                          )}
                        </View>
                        <Pressable onPress={() => toggleSupplier(s.id)} hitSlop={10}>
                          <Ionicons name="heart" size={22} color={colors.status.danger} />
                        </Pressable>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {products.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Produtos</Text>
                  <View style={styles.group}>
                    {products.map((p, i) => {
                      const photo = p.photos?.[0];
                      const priceCents = p.promo_price_cents ?? p.price_cents;
                      return (
                        <Pressable
                          key={p.id}
                          onPress={() => openProduct(p.id)}
                          style={[styles.row, i < products.length - 1 && styles.rowBorder]}
                        >
                          <View style={styles.thumb}>
                            {photo ? (
                              <Image source={{ uri: photo }} style={styles.thumbImg} />
                            ) : (
                              <Ionicons
                                name="fast-food-outline"
                                size={22}
                                color={colors.sand[400]}
                              />
                            )}
                          </View>
                          <View style={styles.rowInfo}>
                            <Text style={styles.rowName} numberOfLines={1}>
                              {p.name}
                            </Text>
                            <Text style={styles.rowMeta} numberOfLines={1}>
                              {p.supplier_name}
                            </Text>
                            {priceCents !== null && (
                              <Text style={styles.rowPrice}>{formatBRL(priceCents)}</Text>
                            )}
                          </View>
                          <Pressable onPress={() => toggleProduct(p.id)} hitSlop={10}>
                            <Ionicons name="heart" size={22} color={colors.status.danger} />
                          </Pressable>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}
        </Bounded>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { padding: 20, paddingBottom: 32 },
  back: { color: colors.ink.secondary, fontSize: 14, marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
    marginBottom: 16,
  },
  loadingBox: { paddingVertical: 60, alignItems: 'center' },
  emptyBox: { paddingVertical: 48, alignItems: 'center', gap: 10 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.ink.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    color: colors.ink.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  group: {
    backgroundColor: colors.surface.primary,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sand[200],
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.sand[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%' },
  rowInfo: { flex: 1, gap: 2 },
  rowName: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
  rowMeta: { fontSize: 13, color: colors.ink.secondary },
  rowPrice: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
    marginTop: 2,
  },
});
