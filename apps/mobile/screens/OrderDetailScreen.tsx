import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatBRL, type OrderStatus } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { supabase, type DBOrder, type DBOrderItem } from '../lib/supabase';
import type { OrdersStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderDetail'>;

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Aguardando pagamento',
  received: 'Pedido recebido',
  accepted: 'Confirmado',
  preparing: 'Em preparo',
  ready: 'Pronto, aguardando entregador',
  out_for_delivery: 'A caminho',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const TIMELINE: OrderStatus[] = [
  'received',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
];

export function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<DBOrder | null>(null);
  const [items, setItems] = useState<DBOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('*').eq('id', orderId).maybeSingle(),
      supabase.from('order_items').select('*').eq('order_id', orderId),
    ]).then(([o, i]) => {
      setOrder(o.data);
      setItems(i.data ?? []);
      setLoading(false);
    });
  }, [orderId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.brand[500]} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Pedido não encontrado.</Text>
      </SafeAreaView>
    );
  }

  const currentIndex = TIMELINE.indexOf(order.status);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={6}>
            <Text style={styles.back}>← Voltar</Text>
          </Pressable>
          <Text style={styles.number}>{order.number}</Text>
          <Text style={styles.statusBig}>{STATUS_LABEL[order.status]}</Text>
        </View>

        {order.status !== 'cancelled' && (
          <View style={styles.timeline}>
            {TIMELINE.map((s, idx) => (
              <View key={s} style={styles.timelineRow}>
                <View
                  style={[
                    styles.timelineDot,
                    idx <= currentIndex && styles.timelineDotActive,
                    idx === currentIndex && styles.timelineDotCurrent,
                  ]}
                >
                  {idx <= currentIndex && <Text style={styles.timelineCheck}>✓</Text>}
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    idx <= currentIndex && styles.timelineLabelActive,
                  ]}
                >
                  {STATUS_LABEL[s]}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.quantity}× {item.name_snapshot}
              </Text>
              <Text style={styles.itemPrice}>
                {formatBRL(item.unit_price_cents * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Total</Text>
          <SummaryRow label="Subtotal" value={formatBRL(order.subtotal_cents)} />
          <SummaryRow label="Entrega" value={formatBRL(order.delivery_cents)} />
          {order.discount_cents > 0 && (
            <SummaryRow label="Desconto" value={`-${formatBRL(order.discount_cents)}`} />
          )}
          <View style={styles.totalDivider} />
          <SummaryRow label="Total" value={formatBRL(order.total_cents)} bold />
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 16 },
  back: { color: colors.ink.secondary, fontSize: 14, marginBottom: 8 },
  number: {
    fontFamily: 'Menlo',
    fontSize: 18,
    color: colors.brand[700],
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
  },
  statusBig: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.ink.primary,
  },
  timeline: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.primary,
  },
  timelineDotActive: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[500],
  },
  timelineDotCurrent: {
    borderColor: colors.brand[500],
    backgroundColor: colors.gold[300],
  },
  timelineCheck: { fontSize: 12, color: colors.ink.inverse },
  timelineLabel: { fontSize: 14, color: colors.ink.tertiary },
  timelineLabelActive: { color: colors.ink.primary, fontWeight: typography.fontWeight.medium },
  section: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  itemName: { fontSize: 15, color: colors.ink.primary, flex: 1 },
  itemPrice: { fontSize: 15, color: colors.ink.primary, fontWeight: typography.fontWeight.medium },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 14, color: colors.ink.secondary },
  summaryValue: { fontSize: 14, color: colors.ink.primary },
  summaryBold: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.ink.primary,
  },
  totalDivider: { height: 1, backgroundColor: colors.sand[200], marginVertical: 8 },
});
