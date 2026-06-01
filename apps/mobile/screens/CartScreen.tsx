import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { formatBRL } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Button } from '../components/Button';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart-context';
import type {
  HomeStackParamList,
  MainTabParamList,
  RootStackParamList,
} from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { cart, itemCount, subtotalCents, setQuantity, removeItem, clearCart } = useCart();

  function goToPayment() {
    // Pagamento exige conta — visitante é encaminhado ao login antes do checkout.
    if (!user) {
      rootNav.navigate('Auth', { screen: 'AuthHub' });
      return;
    }
    navigation.navigate('Checkout');
  }

  function handleClear() {
    Alert.alert('Esvaziar sacola?', 'Tem certeza que quer remover todos os itens?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Esvaziar', style: 'destructive', onPress: clearCart },
    ]);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {itemCount === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Sua sacola está vazia</Text>
          <Text style={styles.emptyText}>
            Encontre produtos potiguares no Início e adicione na sacola.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.header}>
              <Text style={styles.title}>Sua sacola</Text>
              <Text style={styles.supplier}>de {cart.supplier_name}</Text>
            </View>

            <View style={styles.warning}>
              <Text style={styles.warningText}>
                ℹ️ Pedidos do Da Terra são feitos por fornecedor — você não pode misturar produtos
                de fornecedores diferentes na mesma sacola.
              </Text>
            </View>

            <View style={styles.itemsCard}>
              {cart.items.map((item) => (
                <View key={item.product_id} style={styles.itemRow}>
                  <View style={styles.itemImageBox}>
                    {item.photo_url ? (
                      <Image source={{ uri: item.photo_url }} style={styles.itemImage} />
                    ) : (
                      <Text style={styles.itemImagePlaceholder}>🥫</Text>
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.note && (
                      <Text style={styles.itemNote} numberOfLines={1}>
                        📝 {item.note}
                      </Text>
                    )}
                    <View style={styles.itemControls}>
                      <View style={styles.qtyControl}>
                        <Pressable
                          onPress={() => setQuantity(item.product_id, item.quantity - 1)}
                          style={styles.qtyBtn}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </Pressable>
                        <Text style={styles.qtyValue}>{item.quantity}</Text>
                        <Pressable
                          onPress={() => setQuantity(item.product_id, item.quantity + 1)}
                          style={styles.qtyBtn}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </Pressable>
                      </View>
                      <Pressable
                        onPress={() => removeItem(item.product_id)}
                        hitSlop={6}
                        style={styles.trashBtn}
                      >
                        <Text style={styles.trashIcon}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text style={styles.itemTotal}>
                    {formatBRL(item.unit_price_cents * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatBRL(subtotalCents)}</Text>
              </View>
              <Text style={styles.summaryNote}>
                Taxa de entrega calculada no próximo passo.
              </Text>
            </View>

            <Pressable onPress={handleClear} style={styles.clearLink} hitSlop={6}>
              <Text style={styles.clearLinkText}>Esvaziar sacola</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.bottomBar}>
            <Button
              label="Continuar comprando"
              variant="secondary"
              onPress={() => {
                if (cart.supplier_id) {
                  tabNav.navigate('HomeTab', {
                    screen: 'Store',
                    params: { supplierId: cart.supplier_id },
                  });
                } else {
                  tabNav.navigate('HomeTab', { screen: 'Home' });
                }
              }}
            />
            <View style={{ height: 10 }} />
            <Button label="Ir para o pagamento" onPress={goToPayment} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { paddingBottom: 24 },
  empty: {
    flex: 1,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.ink.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 16 },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },
  supplier: { marginTop: 4, color: colors.ink.secondary },
  warning: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    backgroundColor: colors.gold[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gold[200],
  },
  warningText: {
    fontSize: 13,
    color: colors.gold[500],
    lineHeight: 18,
  },
  itemsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.surface.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sand[200],
    gap: 12,
  },
  itemImageBox: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.sand[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemImage: { width: '100%', height: '100%' },
  itemImagePlaceholder: { fontSize: 28 },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 15,
    color: colors.ink.primary,
    fontWeight: typography.fontWeight.medium,
  },
  itemNote: { fontSize: 12, color: colors.ink.tertiary, marginTop: 2 },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sand[100],
    borderRadius: 999,
    paddingHorizontal: 2,
  },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[600],
  },
  qtyValue: {
    minWidth: 22,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
  trashBtn: { padding: 4 },
  trashIcon: { fontSize: 16 },
  itemTotal: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
    marginLeft: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  summary: {
    marginHorizontal: 20,
    backgroundColor: colors.surface.primary,
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 14, color: colors.ink.secondary },
  summaryValue: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
  summaryNote: { fontSize: 12, color: colors.ink.tertiary, marginTop: 4 },
  clearLink: { alignItems: 'center', paddingVertical: 16 },
  clearLinkText: { color: colors.status.danger, fontSize: 14 },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.sand[200],
  },
});
