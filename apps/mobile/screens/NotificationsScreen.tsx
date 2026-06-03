import { useCallback, useEffect, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@daterra/ui/tokens';
import { CONTENT_MAX_WIDTH } from '../lib/responsive';
import { useAuth } from '../lib/auth-context';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../lib/queries';
import type { DBNotification } from '../lib/supabase';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

const KIND_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  welcome: 'happy-outline',
  order_received: 'checkmark-circle-outline',
  order_accepted: 'restaurant-outline',
  order_preparing: 'flame-outline',
  order_ready: 'cube-outline',
  order_out_for_delivery: 'bicycle-outline',
  order_delivered: 'checkmark-done-circle-outline',
  order_cancelled: 'close-circle-outline',
  promotion: 'pricetag-outline',
  news: 'megaphone-outline',
};

export function NotificationsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    const list = await listNotifications(user.id);
    setNotifications(list);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function handleTap(notification: DBNotification) {
    if (!notification.read_at) {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
    }
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    setNotifications((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
    );
  }

  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="chevron-back" size={18} color={colors.ink.secondary} />
              <Text style={styles.back}>Voltar</Text>
            </View>
          </Pressable>
          {hasUnread && (
            <Pressable onPress={handleMarkAllRead} hitSlop={8}>
              <Text style={styles.markAll}>Marcar todas como lidas</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.title}>Notificações</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand[500]} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleTap(item)}
              style={[styles.item, !item.read_at && styles.itemUnread]}
            >
              <Ionicons
                name={KIND_ICON[item.kind] ?? 'notifications-outline'}
                size={22}
                color={colors.brand[600]}
                style={styles.itemEmoji}
              />
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemMessage} numberOfLines={3}>
                  {item.body}
                </Text>
                <Text style={styles.itemTime}>
                  {new Date(item.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {!item.read_at && <View style={styles.itemDot} />}
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-outline" size={48} color={colors.sand[300]} style={styles.emptyEmoji} />
              <Text style={styles.emptyTitle}>Sem notificações por aqui</Text>
              <Text style={styles.emptyText}>
                Você vai receber avisos sobre pedidos, novidades e promoções.
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
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  back: { color: colors.ink.secondary, fontSize: 14 },
  markAll: {
    color: colors.brand[500],
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
  },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },
  listContent: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 24 },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    alignItems: 'center',
  },
  itemUnread: {
    backgroundColor: colors.brand[50],
  },
  itemEmoji: { fontSize: 28 },
  itemBody: { flex: 1 },
  itemTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
    marginBottom: 2,
  },
  itemMessage: {
    fontSize: 13,
    color: colors.ink.secondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 11,
    color: colors.ink.tertiary,
  },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent[400],
  },
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
