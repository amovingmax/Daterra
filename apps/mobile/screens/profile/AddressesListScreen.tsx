import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@daterra/ui/tokens';
import { CONTENT_MAX_WIDTH } from '../../lib/responsive';
import { Button } from '../../components/Button';
import { useAuth } from '../../lib/auth-context';
import { deleteAddress, listMyAddresses, setAddressAsPrimary } from '../../lib/queries';
import type { DBAddress } from '../../lib/supabase';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Addresses'>;

export function AddressesListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<DBAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) return;
    const list = await listMyAddresses(user.id);
    setAddresses(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  function handleDelete(addr: DBAddress) {
    Alert.alert(
      'Remover endereço?',
      `${addr.label} — ${addr.street}, ${addr.number}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteAddress(addr.id);
            if (ok) reload();
            else Alert.alert('Erro', 'Não foi possível remover.');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Endereços</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand[500]} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>
                  {item.label}
                  {item.is_primary && <Text style={styles.primaryFlag}>  ★ Principal</Text>}
                </Text>
              </View>
              <Text style={styles.cardLine}>
                {item.street}, {item.number}
                {item.complement ? ` · ${item.complement}` : ''}
              </Text>
              <Text style={styles.cardLine}>
                {item.district} · {item.city}/{item.state}
              </Text>
              <Text style={styles.cardCEP}>CEP {item.zip_code}</Text>
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => navigation.navigate('AddressForm', { address: item })}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>Editar</Text>
                </Pressable>
                {!item.is_primary && (
                  <Pressable
                    onPress={async () => {
                      if (!user) return;
                      const ok = await setAddressAsPrimary(item.id, user.id);
                      if (ok) reload();
                      else Alert.alert('Erro', 'Não foi possível marcar como principal.');
                    }}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>Tornar principal</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => handleDelete(item)}
                  style={[styles.actionBtn, styles.actionBtnDanger]}
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>Remover</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📍</Text>
              <Text style={styles.emptyText}>Você ainda não tem endereços cadastrados.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.bottomBar}>
        <Button
          label="+ Adicionar endereço"
          onPress={() => navigation.navigate('AddressForm', {})}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  back: { color: colors.ink.secondary, fontSize: 14, marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },
  listContent: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { marginBottom: 4 },
  cardLabel: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
  primaryFlag: {
    fontSize: 12,
    color: colors.gold[500],
    fontWeight: typography.fontWeight.regular,
  },
  cardLine: { fontSize: 14, color: colors.ink.primary, marginTop: 2 },
  cardCEP: { fontSize: 13, color: colors.ink.secondary, marginTop: 4 },
  cardActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.brand[50],
  },
  actionBtnDanger: { backgroundColor: 'transparent' },
  actionBtnText: {
    color: colors.brand[600],
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
  },
  actionBtnTextDanger: { color: colors.status.danger },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.ink.secondary, textAlign: 'center' },
  bottomBar: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.sand[200],
  },
});
