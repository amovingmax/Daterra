import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatBRL } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Button } from '../components/Button';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart-context';
import { createOrder, listMyAddresses } from '../lib/queries';
import type { DBAddress } from '../lib/supabase';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Checkout'>;

const DELIVERY_FEE_CENTS = 1200; // simulado pra MVP

export function CheckoutScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { cart, subtotalCents, clearCart } = useCart();

  const [addresses, setAddresses] = useState<DBAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const reloadAddresses = useCallback(async () => {
    if (!user) return;
    const list = await listMyAddresses(user.id);
    setAddresses((prev) => {
      // Auto-seleciona o endereço novo (que não estava na lista anterior),
      // ou mantém a seleção atual, ou cai pro primary.
      const newOne = list.find((a) => !prev.some((p) => p.id === a.id));
      if (newOne) setSelectedAddressId(newOne.id);
      else if (!selectedAddressId) {
        const primary = list.find((a) => a.is_primary) ?? list[0];
        if (primary) setSelectedAddressId(primary.id);
      }
      return list;
    });
    setLoading(false);
  }, [user, selectedAddressId]);

  useEffect(() => {
    reloadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      reloadAddresses();
    }, [reloadAddresses]),
  );

  const deliveryCents = deliveryMode === 'pickup' ? 0 : DELIVERY_FEE_CENTS;
  const totalCents = subtotalCents + deliveryCents;
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;

  async function handleConfirm() {
    if (!user || !cart.supplier_id) return;
    if (deliveryMode === 'delivery' && !selectedAddress) {
      Alert.alert(
        'Endereço',
        'Selecione um endereço de entrega ou escolha "Retirada no local".',
      );
      return;
    }

    setSubmitting(true);
    const order = await createOrder({
      user_id: user.id,
      supplier_id: cart.supplier_id,
      items: cart.items.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        unit_price_cents: i.unit_price_cents,
        quantity: i.quantity,
        note: i.note,
      })),
      delivery_address: deliveryMode === 'delivery' ? selectedAddress : null,
      delivery_provider: deliveryMode === 'pickup' ? 'pickup' : 'uber_direct',
      payment_method: paymentMethod,
    });
    setSubmitting(false);

    if (!order) {
      Alert.alert('Falha ao criar pedido', 'Tente de novo. Se persistir, entre em contato.');
      return;
    }
    clearCart();
    navigation.replace('OrderConfirmation', { orderId: order.id });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.brand[500]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.back}>← Voltar</Text>
          </Pressable>
          <Text style={styles.title}>Finalizar pedido</Text>
        </View>

        <Section title="Forma de entrega">
          <Option
            selected={deliveryMode === 'delivery'}
            onPress={() => setDeliveryMode('delivery')}
            label="Delivery"
            sub={`R$ ${(DELIVERY_FEE_CENTS / 100).toFixed(2).replace('.', ',')} · entrega estimada hoje`}
          />
          <Option
            selected={deliveryMode === 'pickup'}
            onPress={() => setDeliveryMode('pickup')}
            label="Retirada no local"
            sub="Sem custo de entrega · combine horário com o fornecedor"
          />
        </Section>

        {deliveryMode === 'delivery' && (
          <Section title="Endereço de entrega">
            {addresses.length === 0 ? (
              <Text style={styles.subtle}>
                Nenhum endereço cadastrado. Adicione um abaixo.
              </Text>
            ) : (
              addresses.map((a) => (
                <Option
                  key={a.id}
                  selected={selectedAddressId === a.id}
                  onPress={() => setSelectedAddressId(a.id)}
                  label={a.label}
                  sub={`${a.street}, ${a.number} · ${a.district} · ${a.city}/${a.state}`}
                />
              ))
            )}
            <Pressable
              onPress={() => navigation.navigate('CheckoutAddressForm', {})}
              style={styles.addAddressBtn}
            >
              <Text style={styles.addAddressBtnText}>+ Adicionar novo endereço</Text>
            </Pressable>
          </Section>
        )}

        <Section title="Pagamento">
          <Option
            selected={paymentMethod === 'pix'}
            onPress={() => setPaymentMethod('pix')}
            label="🟢 Pix"
            sub="Sem taxa · simulado no MVP"
          />
          <Option
            selected={paymentMethod === 'credit_card'}
            onPress={() => setPaymentMethod('credit_card')}
            label="💳 Cartão de crédito"
            sub="Em breve"
            disabled
          />
        </Section>

        <Section title="Resumo">
          <SummaryRow label="Subtotal" value={formatBRL(subtotalCents)} />
          <SummaryRow label="Entrega" value={formatBRL(deliveryCents)} />
          <SummaryRow label="Total" value={formatBRL(totalCents)} bold />
        </Section>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          label={submitting ? 'Processando...' : `Finalizar · ${formatBRL(totalCents)}`}
          onPress={handleConfirm}
          loading={submitting}
        />
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Option({
  selected,
  onPress,
  label,
  sub,
  disabled,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  sub: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.option, selected && styles.optionSelected, disabled && styles.optionDisabled]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.summaryBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { paddingBottom: 24 },
  center: {
    flex: 1,
    backgroundColor: colors.sand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 8 },
  back: { color: colors.ink.secondary, fontSize: 14, marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },
  section: { marginTop: 20 },
  sectionTitle: {
    paddingHorizontal: 20,
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  sectionBody: { paddingHorizontal: 20, gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: 12,
  },
  optionSelected: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  optionDisabled: { opacity: 0.5 },
  addAddressBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  addAddressBtnText: {
    color: colors.brand[500],
    fontWeight: typography.fontWeight.medium,
    fontSize: 14,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.brand[500] },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand[500],
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
  optionSub: { fontSize: 13, color: colors.ink.secondary, marginTop: 2 },
  subtle: { color: colors.ink.secondary, fontSize: 14, paddingHorizontal: 4 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 14, color: colors.ink.secondary },
  summaryValue: { fontSize: 14, color: colors.ink.primary },
  summaryBold: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.ink.primary,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.sand[200],
  },
});
