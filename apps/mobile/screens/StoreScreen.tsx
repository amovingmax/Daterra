import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatBRL } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { getSupplier, listSupplierProducts } from '../lib/queries';
import type { DBProduct, DBSupplier } from '../lib/supabase';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Store'>;

export function StoreScreen({ route, navigation }: Props) {
  const { supplierId } = route.params;
  const [supplier, setSupplier] = useState<DBSupplier | null>(null);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSupplier(supplierId), listSupplierProducts(supplierId)]).then(
      ([s, p]) => {
        setSupplier(s);
        setProducts(p);
        setLoading(false);
      },
    );
  }, [supplierId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={colors.brand[500]} />
      </SafeAreaView>
    );
  }

  if (!supplier) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.errorTitle}>Loja não encontrada</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <View style={styles.cover}>
              {supplier.cover_url ? (
                <Image source={{ uri: supplier.cover_url }} style={styles.coverImage} />
              ) : (
                <Text style={styles.coverPlaceholder}>🌱</Text>
              )}
              <Pressable style={styles.backFab} onPress={() => navigation.goBack()}>
                <Text style={styles.backFabIcon}>←</Text>
              </Pressable>
            </View>
            <View style={styles.summary}>
              <View style={styles.seloBadgeStandalone}>
                <Text style={styles.seloBadgeText}>🏅 Selo Feito Potiguar</Text>
              </View>
              <Text style={styles.supplierName}>{supplier.name}</Text>
              <Text style={styles.supplierMeta}>
                {supplier.city}, {supplier.state}
              </Text>
              {supplier.description && (
                <Text style={styles.supplierDescription} numberOfLines={4}>
                  {supplier.description}
                </Text>
              )}
            </View>
            <Text style={styles.sectionTitle}>Produtos</Text>
          </View>
        }
        renderItem={({ item }) => {
          const photo = item.photos?.[0];
          const priceCents = item.promo_price_cents ?? item.price_cents;
          return (
            <Pressable
              style={styles.productRow}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.description && (
                  <Text style={styles.productDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <Text style={styles.productPrice}>
                  {priceCents !== null ? formatBRL(priceCents) : '—'}
                </Text>
              </View>
              <View style={styles.productImageBox}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.productImage} />
                ) : (
                  <Text style={styles.productImagePlaceholder}>🥫</Text>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🥫</Text>
            <Text style={styles.emptyText}>
              Esta loja ainda não tem produtos disponíveis. Volta em breve!
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  center: {
    flex: 1,
    backgroundColor: colors.sand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingBottom: 40 },
  cover: {
    height: 200,
    backgroundColor: colors.sand[100],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { fontSize: 64 },
  backFab: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backFabIcon: {
    fontSize: 20,
    color: colors.ink.primary,
  },
  summary: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand[200],
  },
  seloBadgeStandalone: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold[100],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginBottom: 8,
  },
  seloBadgeText: {
    color: colors.gold[500],
    fontSize: 12,
    fontWeight: typography.fontWeight.semibold,
  },
  supplierName: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },
  supplierMeta: {
    fontSize: 14,
    color: colors.ink.secondary,
    marginTop: 4,
  },
  supplierDescription: {
    fontSize: 14,
    color: colors.ink.secondary,
    lineHeight: 20,
    marginTop: 12,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    fontSize: 18,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
  },
  productRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand[200],
  },
  productInfo: { flex: 1, paddingRight: 12 },
  productName: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
    marginBottom: 4,
  },
  productDesc: { fontSize: 13, color: colors.ink.secondary, marginBottom: 8 },
  productPrice: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },
  productImageBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.sand[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: { fontSize: 32 },
  empty: { paddingHorizontal: 40, paddingVertical: 60, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.ink.secondary, textAlign: 'center' },
  errorTitle: {
    fontSize: 18,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: colors.brand[500],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  backBtnText: {
    color: colors.ink.inverse,
    fontWeight: typography.fontWeight.semibold,
  },
});
