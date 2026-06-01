import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatBRL } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { getSupplier, listSupplierProducts } from '../lib/queries';
import { CartBar } from '../components/CartBar';
import type { DBProduct, DBSupplier } from '../lib/supabase';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Store'>;

const CATEGORY_FALLBACK: Record<DBSupplier['type'], string> = {
  producer: 'Produtor',
  restaurant: 'Restaurante',
  hospitality: 'Hospedagem',
};

function onlyDigits(value: string) {
  return value.replace(/\D+/g, '');
}

function buildWhatsappUrl(raw: string) {
  let digits = onlyDigits(raw);
  if (digits.length === 0) return null;
  if (!digits.startsWith('55')) digits = `55${digits}`;
  return `https://wa.me/${digits}`;
}

function buildInstagramUrl(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, '');
  return `https://instagram.com/${handle}`;
}

function formatBRPhone(raw: string) {
  const digits = onlyDigits(raw).replace(/^55/, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

export function StoreScreen({ route, navigation }: Props) {
  const { supplierId } = route.params;
  const insets = useSafeAreaInsets();
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

  const fullAddress = [
    [supplier.street, supplier.number].filter(Boolean).join(', '),
    supplier.complement,
    supplier.district,
    [supplier.city, supplier.state].filter(Boolean).join(' - '),
    supplier.zip_code,
  ]
    .filter((part) => part && part.trim().length > 0)
    .join(', ');

  const categoryLabel = supplier.primary_category ?? CATEGORY_FALLBACK[supplier.type];

  const whatsappUrl = supplier.whatsapp ? buildWhatsappUrl(supplier.whatsapp) : null;
  const instagramUrl = supplier.instagram ? buildInstagramUrl(supplier.instagram) : null;
  const phoneDisplay = supplier.whatsapp ? formatBRPhone(supplier.whatsapp) : null;

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <View style={[styles.cover, { paddingTop: insets.top + 12, height: 260 + insets.top }]}>
              {supplier.cover_url ? (
                <Image
                  source={{ uri: supplier.cover_url }}
                  style={styles.coverImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.coverPlaceholder}>🌱</Text>
              )}
              <Pressable
                style={[styles.backFab, { top: insets.top + 8 }]}
                onPress={() => navigation.goBack()}
                hitSlop={8}
              >
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
                <Text style={styles.supplierDescription}>{supplier.description}</Text>
              )}

              <View style={styles.infoList}>
                {categoryLabel && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>🏭</Text>
                    <Text style={styles.infoText}>{categoryLabel}</Text>
                  </View>
                )}
                {fullAddress.length > 0 && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📍</Text>
                    <Text style={styles.infoText}>{fullAddress}</Text>
                  </View>
                )}
                {supplier.city && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>🗺️</Text>
                    <Text style={styles.infoText}>{supplier.city}</Text>
                  </View>
                )}
                {phoneDisplay && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📞</Text>
                    <Text style={styles.infoText}>{phoneDisplay}</Text>
                  </View>
                )}
              </View>

              {(whatsappUrl || instagramUrl) && (
                <View style={styles.contactSection}>
                  <Text style={styles.contactTitle}>Contato</Text>
                  <View style={styles.contactRow}>
                    {whatsappUrl && (
                      <Pressable
                        style={styles.contactButton}
                        onPress={() => Linking.openURL(whatsappUrl)}
                        hitSlop={6}
                      >
                        <FontAwesome name="whatsapp" size={22} color={colors.ink.inverse} />
                      </Pressable>
                    )}
                    {instagramUrl && (
                      <Pressable
                        style={styles.contactButton}
                        onPress={() => Linking.openURL(instagramUrl)}
                        hitSlop={6}
                      >
                        <FontAwesome name="instagram" size={22} color={colors.ink.inverse} />
                      </Pressable>
                    )}
                  </View>
                </View>
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
      <CartBar onPress={() => navigation.navigate('Cart')} />
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
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  infoList: {
    marginTop: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoIcon: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.ink.secondary,
    lineHeight: 20,
  },
  contactSection: {
    marginTop: 20,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.ink.primary,
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
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
