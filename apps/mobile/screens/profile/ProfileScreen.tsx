import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { colors, typography } from '@daterra/ui/tokens';
import { Bounded } from '../../components/Bounded';
import { Button } from '../../components/Button';
import { useAuth } from '../../lib/auth-context';
import type { ProfileStackParamList, RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

export function ProfileScreen({ navigation }: Props) {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const isGuest = !user;
  const fullName = user?.user_metadata?.full_name ?? 'Cliente';
  const email = user?.email ?? '';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase() ?? '')
    .join('');

  function confirmSignOut() {
    Alert.alert('Sair?', 'Você precisará entrar de novo na próxima vez.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  const supportSection: { title?: string; items: MenuItem[] } = {
    title: 'Suporte',
    items: [
      {
        icon: 'chatbubble-ellipses-outline',
        label: 'Falar com a Da Terra',
        onPress: () => {
          const phone = '5584999999999'; // placeholder, troca pelo real
          Linking.openURL(
            `https://wa.me/${phone}?text=${encodeURIComponent('Olá, preciso de ajuda no Da Terra')}`,
          );
        },
      },
      {
        icon: 'information-circle-outline',
        label: 'Sobre o Da Terra',
        onPress: () => navigation.navigate('About'),
      },
    ],
  };

  // Visitante: só Suporte/Sobre. Logado: conta completa.
  const sections: { title?: string; items: MenuItem[] }[] = isGuest
    ? [supportSection]
    : [
        {
          items: [
            {
              icon: 'person-outline',
              label: 'Dados pessoais',
              onPress: () => navigation.navigate('EditProfile'),
            },
            {
              icon: 'location-outline',
              label: 'Endereços',
              onPress: () => navigation.navigate('Addresses'),
            },
            {
              icon: 'card-outline',
              label: 'Métodos de pagamento',
              onPress: () =>
                Alert.alert(
                  'Em breve',
                  'Vamos liberar cartão na próxima fase. Por enquanto, só Pix.',
                ),
              badge: 'Em breve',
            },
          ],
        },
        {
          title: 'Atividade',
          items: [
            {
              icon: 'heart-outline',
              label: 'Favoritos',
              onPress: () => navigation.navigate('Favorites'),
            },
            {
              icon: 'pricetag-outline',
              label: 'Cupons',
              onPress: () => Alert.alert('Em breve', 'Programa de cupons na Fase 2.'),
              badge: 'Em breve',
            },
            {
              icon: 'notifications-outline',
              label: 'Notificações',
              onPress: () =>
                Alert.alert(
                  'Em breve',
                  'Preferências de notificação detalhadas chegam na próxima rodada.',
                ),
              badge: 'Em breve',
            },
          ],
        },
        supportSection,
        {
          items: [
            { icon: 'log-out-outline', label: 'Sair', onPress: confirmSignOut, danger: true },
          ],
        },
      ];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Bounded>
        <View style={styles.header}>
          <View style={styles.avatar}>
            {isGuest || !initials ? (
              <Ionicons name="leaf" size={28} color={colors.ink.inverse} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{isGuest ? 'Visitante' : fullName}</Text>
            <Text style={styles.email}>
              {isGuest ? 'Você está navegando sem conta' : email}
            </Text>
          </View>
        </View>

        {isGuest && (
          <View style={styles.guestCard}>
            <Text style={styles.guestTitle}>Entre na sua conta</Text>
            <Text style={styles.guestText}>
              Faça login ou crie uma conta para pedir, acompanhar entregas, salvar endereços e
              favoritos.
            </Text>
            <Button
              label="Entrar ou criar conta"
              onPress={() => rootNav.navigate('Auth', { screen: 'AuthHub' })}
            />
          </View>
        )}

        {sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
            <View style={styles.menuGroup}>
              {section.items.map((item, i) => (
                <Pressable
                  key={item.label}
                  onPress={item.onPress}
                  style={[
                    styles.menuRow,
                    i < section.items.length - 1 && styles.menuRowBorder,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.danger ? colors.status.danger : colors.ink.secondary}
                    style={styles.menuIcon}
                  />
                  <Text
                    style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}
                  >
                    {item.label}
                  </Text>
                  {item.badge ? (
                    <Text style={styles.menuBadge}>{item.badge}</Text>
                  ) : item.danger ? null : (
                    <Ionicons name="chevron-forward" size={18} color={colors.ink.tertiary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>Da Terra · MVP</Text>
      </Bounded>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.ink.inverse,
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
  },
  name: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },
  email: { fontSize: 14, color: colors.ink.secondary, marginTop: 2 },
  guestCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 18,
    backgroundColor: colors.surface.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.brand[100],
    gap: 10,
  },
  guestTitle: {
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },
  guestText: {
    fontSize: 14,
    color: colors.ink.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    color: colors.ink.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  menuGroup: {
    marginHorizontal: 16,
    backgroundColor: colors.surface.primary,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sand[200],
  },
  menuIcon: { fontSize: 18 },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.ink.primary,
  },
  menuLabelDanger: { color: colors.status.danger },
  menuBadge: {
    fontSize: 12,
    color: colors.ink.tertiary,
  },
  menuChevron: {
    fontSize: 18,
    color: colors.ink.tertiary,
  },
  version: {
    textAlign: 'center',
    color: colors.ink.tertiary,
    fontSize: 12,
    marginTop: 24,
  },
});
