import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { formatBRL, type OrderStatus } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { CONTENT_MAX_WIDTH } from '../lib/responsive';
import { Button } from '../components/Button';
import { useAuth } from '../lib/auth-context';
import { listMyOrders } from '../lib/queries';
import type { DBOrder } from '../lib/supabase';
import type { OrdersStackParamList, RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrdersList'>;

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

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: colors.gold[500],
  received: colors.status.info,
  accepted: colors.status.info,
  preparing: colors.gold[500],
  ready: colors.brand[500],
  out_for_delivery: colors.brand[500],
  delivered: colors.status.success,
  cancelled: colors.status.danger,
};

export function OrdersListScreen({ navigation }: Props) {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) {
      setLoading(false);
      return;
    }
    const list = await listMyOrders(user.id);
    setOrders(list);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Visitante: pedidos exigem conta.
  if (!user) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.title}>Seus pedidos</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={styles.emptyTitle}>Entre para ver seus pedidos</Text>
          <Text style={styles.emptySubtitle}>
            Faça login ou crie uma conta para acompanhar seus pedidos e entregas.
          </Text>
          <View style={styles.guestBtn}>
            <Button
              label="Entrar ou criar conta"
              onPress={() => rootNav.navigate('Auth', { screen: 'AuthHub' })}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <FlatList
        data={loading ? [] : orders}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Seus pedidos</Text>
            {loading && (
              <ActivityIndicator color={colors.brand[500]} style={{ marginTop: 16 }} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          >
            <View style={styles.row}>
              <Text style={styles.number}>{item.number}</Text>
              <Text style={[styles.status, { color: STATUS_COLOR[item.status] }]}>
                {STATUS_LABEL[item.status]}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.total}>{formatBRL(item.total_cents)}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>Você ainda não fez nenhum pedido</Text>
              <Text style={styles.emptySubtitle}>
                Que tal começar pela aba Início e descobrir produtos potiguares?
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  listContent: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center', paddingBottom: 24 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.surface.primary,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  number: {
    fontFamily: 'Menlo',
    fontSize: 14,
    color: colors.brand[700],
    fontWeight: typography.fontWeight.semibold,
  },
  status: { fontSize: 13, fontWeight: typography.fontWeight.semibold },
  date: { fontSize: 13, color: colors.ink.secondary },
  total: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
  empty: { paddingHorizontal: 40, paddingVertical: 80, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.ink.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  guestBtn: { marginTop: 20, alignSelf: 'stretch', paddingHorizontal: 20 },
});
