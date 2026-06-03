import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatBRL } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Bounded } from '../components/Bounded';
import { CONTENT_MAX_WIDTH } from '../lib/responsive';
import { Button } from '../components/Button';
import { useCart } from '../lib/cart-context';
import { getProduct, getSupplier } from '../lib/queries';
import type { DBProduct, DBSupplier } from '../lib/supabase';
import type { HomeStackParamList, MainTabParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props) {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const { productId } = route.params;
  const { addItem, forceReplace } = useCart();

  const [product, setProduct] = useState<DBProduct | null>(null);
  const [supplier, setSupplier] = useState<DBSupplier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await getProduct(productId);
      setProduct(p);
      if (p) {
        setSupplier(await getSupplier(p.supplier_id));
      }
      setLoading(false);
    })();
  }, [productId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.brand[500]} />
      </SafeAreaView>
    );
  }

  if (!product || !supplier) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Produto não encontrado</Text>
      </SafeAreaView>
    );
  }

  const priceCents = product.promo_price_cents ?? product.price_cents;
  if (priceCents === null) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Preço indisponível</Text>
      </SafeAreaView>
    );
  }
  const totalCents = priceCents * quantity;
  const photo = product.photos?.[0];

  function handleAdd() {
    if (!product || !supplier || priceCents === null) return;
    const itemBase = {
      product_id: product.id,
      supplier_id: supplier.id,
      name: product.name,
      unit_price_cents: priceCents,
      photo_url: photo ?? null,
      note: note.trim() || null,
    };
    const result = addItem(itemBase, quantity, supplier.name);
    if (!result.ok && result.conflict) {
      Alert.alert(
        'Sua sacola tem itens de outra loja',
        `Você já tem produtos de "${result.conflict.supplierName}" na sacola. Pra adicionar este, precisamos esvaziar a sacola atual.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Esvaziar e adicionar',
            style: 'destructive',
            onPress: () => {
              forceReplace(itemBase, quantity, supplier.name);
              navigation.navigate('Cart');
            },
          },
        ],
      );
      return;
    }
    navigation.navigate('Cart');
  }

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Bounded>
        <View style={styles.gallery}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.galleryImage} />
          ) : (
            <Text style={styles.galleryPlaceholder}>🥫</Text>
          )}
          <Pressable
            style={[styles.backFab, { top: insets.top + 8 }]}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <Text style={styles.backFabIcon}>←</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>
          <Pressable
            style={styles.supplierLink}
            onPress={() => navigation.navigate('Store', { supplierId: supplier.id })}
          >
            <Text style={styles.supplierLinkText}>de {supplier.name} →</Text>
          </Pressable>

          <View style={styles.priceRow}>
            {product.promo_price_cents && product.price_cents && (
              <Text style={styles.priceOriginal}>{formatBRL(product.price_cents)}</Text>
            )}
            <Text style={styles.priceCurrent}>{formatBRL(priceCents)}</Text>
          </View>

          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descrição</Text>
              <Text style={styles.bodyText}>{product.description}</Text>
            </View>
          )}

          {product.ingredients && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredientes</Text>
              <Text style={styles.bodyText}>{product.ingredients}</Text>
            </View>
          )}

          {product.shelf_life_days && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Validade</Text>
              <Text style={styles.bodyText}>{product.shelf_life_days} dias após produção</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observação (opcional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ex: troco para R$ 50, sem sacola, etc."
              placeholderTextColor={colors.ink.tertiary}
              style={styles.noteInput}
              multiline
            />
          </View>
        </View>
      </Bounded>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.qtyControl}>
          <Pressable
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            style={styles.qtyBtn}
            hitSlop={8}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <Pressable
            onPress={() => setQuantity((q) => Math.min(99, q + 1))}
            style={styles.qtyBtn}
            hitSlop={8}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </Pressable>
        </View>
        <View style={styles.cta}>
          <Button label={`Adicionar · ${formatBRL(totalCents)}`} onPress={handleAdd} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { paddingBottom: 32 },
  center: {
    flex: 1,
    backgroundColor: colors.sand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  gallery: {
    aspectRatio: 1,
    backgroundColor: colors.sand[100],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  galleryImage: { width: '100%', height: '100%' },
  galleryPlaceholder: { fontSize: 96 },
  backFab: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backFabIcon: { fontSize: 20, color: colors.ink.primary },
  body: { padding: 20 },
  name: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.ink.primary,
  },
  supplierLink: { marginTop: 6 },
  supplierLinkText: { color: colors.brand[500], fontSize: 14 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  priceCurrent: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },
  priceOriginal: {
    fontSize: 16,
    color: colors.ink.tertiary,
    textDecorationLine: 'line-through',
  },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bodyText: { fontSize: 15, color: colors.ink.primary, lineHeight: 22 },
  noteInput: {
    backgroundColor: colors.surface.primary,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.ink.primary,
    minHeight: 70,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  bottomBar: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.sand[200],
    alignItems: 'center',
    gap: 12,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sand[100],
    borderRadius: 999,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[600],
  },
  qtyValue: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
  cta: { flex: 1 },
  errorTitle: {
    fontSize: 18,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
});
