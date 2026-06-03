import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { formatBRL } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { CONTENT_MAX_WIDTH } from '../lib/responsive';
import { Button } from '../components/Button';
import { supabase, type DBOrder } from '../lib/supabase';
import type { HomeStackParamList, MainTabParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'OrderConfirmation'>;

export function OrderConfirmationScreen({ route }: Props) {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<DBOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data);
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

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.checkmark}>🌱</Text>
        <Text style={styles.title}>Pedido confirmado!</Text>
        <Text style={styles.subtitle}>
          O fornecedor já foi avisado e tem até 15 minutos pra aceitar.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Número do pedido</Text>
          <Text style={styles.cardNumber}>{order.number}</Text>
          <View style={styles.divider} />
          <Text style={styles.cardLabel}>Total</Text>
          <Text style={styles.cardTotal}>{formatBRL(order.total_cents)}</Text>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Button
          label="Acompanhar pedido"
          onPress={() => tabNav.navigate('OrdersTab', { screen: 'OrderDetail', params: { orderId } })}
        />
        <View style={{ height: 12 }} />
        <Button
          label="Voltar pro início"
          variant="secondary"
          onPress={() => tabNav.navigate('HomeTab', { screen: 'Home' })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50], justifyContent: 'space-between' },
  center: {
    flex: 1,
    backgroundColor: colors.sand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center', flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  checkmark: { fontSize: 80, marginBottom: 16 },
  title: {
    fontSize: 26,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: colors.ink.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    marginTop: 32,
    backgroundColor: colors.surface.primary,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
    color: colors.ink.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardNumber: {
    fontFamily: 'Menlo',
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
    marginTop: 4,
  },
  divider: { height: 1, backgroundColor: colors.sand[200], marginVertical: 16, alignSelf: 'stretch' },
  cardTotal: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.ink.primary,
    marginTop: 4,
  },
  bottomBar: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center', padding: 20, paddingBottom: 32 },
});
