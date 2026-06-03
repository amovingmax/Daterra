import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { FEITO_POTIGUAR_CATEGORIES } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Ionicons } from '@expo/vector-icons';
import {
  categoryIcon,
  categoryImage,
  supplierTypeIcon,
  type IoniconName,
} from '../lib/icons';
import { useAuth } from '../lib/auth-context';
import {
  listActiveSuppliers,
  listPopularSuppliers,
  unreadNotificationsCount,
} from '../lib/queries';
import { CartBar } from '../components/CartBar';
import { Bounded } from '../components/Bounded';
import { CONTENT_MAX_WIDTH, useResponsive } from '../lib/responsive';
import type { DBSupplier } from '../lib/supabase';
import type {
  HomeStackParamList,
  MainTabParamList,
  RootStackParamList,
} from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

interface BannerSlide {
  title: string;
  subtitle: string;
  icon: IoniconName;
  bg: string;
  fg: string;
  accent: string;
}

const BANNER_SLIDES: BannerSlide[] = [
  {
    title: 'Direto da terra potiguar',
    subtitle: 'Produtos artesanais com Selo Feito Potiguar — entrega em todo RN.',
    icon: 'leaf',
    bg: colors.brand[500],
    fg: colors.ink.inverse,
    accent: colors.brand[100],
  },
  {
    title: 'Selo Feito Potiguar',
    subtitle: 'Curadoria oficial: SEBRAE/RN, FAERN, FIERN e FECOMÉRCIO validam cada loja.',
    icon: 'ribbon',
    bg: colors.gold[300],
    fg: colors.ink.primary,
    accent: colors.gold[500],
  },
  {
    title: 'Comprou, chegou.',
    subtitle: 'Entrega na Grande Natal e RN inteiro · pagamento por Pix sem taxa.',
    icon: 'bicycle',
    bg: colors.accent[400],
    fg: colors.ink.inverse,
    accent: colors.accent[100],
  },
];

interface Section {
  title: string;
  subtitle: string;
  type: DBSupplier['type'];
}

const SECTIONS: Section[] = [
  {
    title: 'Produtores e agroindústrias',
    subtitle: 'Direto da roça pra sua mesa',
    type: 'producer',
  },
  {
    title: 'Bares e restaurantes',
    subtitle: 'Pra comer no local ou pedir em casa',
    type: 'restaurant',
  },
  {
    title: 'Hotelaria',
    subtitle: 'Hospedagem com DNA potiguar',
    type: 'hospitality',
  },
];

export function HomeScreen({ navigation }: Props) {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0];

  function openCategory(slug: string) {
    tabNav.navigate('SearchTab', {
      screen: 'Search',
      params: { category: slug },
    });
  }

  const { width } = useWindowDimensions();
  const { isTablet } = useResponsive();
  // No iPad limita a largura do conteúdo (não estica); o banner acompanha.
  const bannerWidth = Math.min(width, CONTENT_MAX_WIDTH) - 32; // 16 de margin de cada lado

  const [suppliers, setSuppliers] = useState<DBSupplier[]>([]);
  const [popular, setPopular] = useState<DBSupplier[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef<ScrollView>(null);

  async function load() {
    const promises: [Promise<DBSupplier[]>, Promise<DBSupplier[]>, Promise<number>] = [
      listActiveSuppliers(),
      listPopularSuppliers(10),
      user ? unreadNotificationsCount(user.id) : Promise.resolve(0),
    ];
    const [list, top, unread] = await Promise.all(promises);
    setSuppliers(list);
    setPopular(top);
    setUnreadCount(unread);
    setLoading(false);
    setRefreshing(false);
  }

  // Reatualiza o badge de não-lidas ao voltar do NotificationsScreen
  useFocusEffect(
    useCallback(() => {
      if (user) {
        unreadNotificationsCount(user.id).then(setUnreadCount);
      }
    }, [user]),
  );

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<DBSupplier['type'], DBSupplier[]> = {
      producer: [],
      restaurant: [],
      hospitality: [],
    };
    for (const s of suppliers) {
      if (s.type in map) map[s.type].push(s);
    }
    return map;
  }, [suppliers]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  // Auto-rotate dos banners a cada 5s (PRD §8.11)
  useEffect(() => {
    const id = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % BANNER_SLIDES.length;
        bannerRef.current?.scrollTo({ x: next * bannerWidth, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [bannerWidth]);

  function handleBannerScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / bannerWidth);
    setBannerIndex(idx);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Bounded maxWidth={CONTENT_MAX_WIDTH}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <Ionicons name="leaf" size={22} color={colors.brand[500]} />
              <Text style={styles.brand}>Da Terra</Text>
            </View>
            {user ? (
              <Pressable
                onPress={() => navigation.navigate('Notifications')}
                style={styles.bellBtn}
                hitSlop={6}
                accessibilityLabel="Notificações"
              >
                <Ionicons name="notifications-outline" size={20} color={colors.ink.primary} />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            ) : (
              <Pressable
                onPress={() => rootNav.navigate('Auth', { screen: 'AuthHub' })}
                style={styles.loginBtn}
                hitSlop={6}
              >
                <Text style={styles.loginBtnText}>Entrar</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.greeting}>
            {firstName ? `Olá, ${firstName}` : 'Bem-vindo ao Da Terra'}
          </Text>
          {user ? (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={colors.ink.secondary} />
              <Text style={styles.address}>Rio Grande do Norte</Text>
            </View>
          ) : (
            <Pressable onPress={() => rootNav.navigate('Auth', { screen: 'AuthHub' })} hitSlop={4}>
              <Text style={styles.loginHint}>
                Entre ou crie sua conta para pedir →
              </Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionTitle}>Categorias</Text>
        <View style={styles.categories}>
          {FEITO_POTIGUAR_CATEGORIES.slice(0, 3).map((cat) => {
            const img = categoryImage(cat.slug);
            return (
              <Pressable
                key={cat.slug}
                style={styles.categoryItem}
                onPress={() => openCategory(cat.slug)}
              >
                <View style={styles.categoryPhoto}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.categoryPhotoImg} />
                  ) : (
                    <Ionicons name={categoryIcon(cat.slug)} size={26} color={colors.brand[600]} />
                  )}
                </View>
                <Text style={styles.categoryLabel} numberOfLines={2}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            style={styles.categoryItem}
            onPress={() => navigation.navigate('CategoriesModal')}
          >
            <View style={[styles.categoryPhoto, styles.categoryMore]}>
              <Ionicons name="grid" size={26} color={colors.brand[600]} />
            </View>
            <Text style={styles.categoryLabel} numberOfLines={2}>
              Ver mais
            </Text>
          </Pressable>
        </View>

        <View style={styles.bannerWrap}>
          <ScrollView
            ref={bannerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleBannerScroll}
          >
            {BANNER_SLIDES.map((slide, i) => (
              <View
                key={i}
                style={[
                  styles.bannerSlide,
                  { width: bannerWidth, backgroundColor: slide.bg },
                ]}
              >
                <Ionicons
                  name={slide.icon}
                  size={42}
                  color={slide.fg}
                  style={styles.bannerEmoji}
                />
                <Text style={[styles.bannerTitle, { color: slide.fg }]}>{slide.title}</Text>
                <Text style={[styles.bannerSubtitle, { color: slide.accent }]}>
                  {slide.subtitle}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {BANNER_SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === bannerIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {!loading && popular.length > 0 && (
          <View style={styles.popularBlock}>
            <View style={styles.popularHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.iconTitleRow}>
                  <Ionicons name="flame" size={16} color={colors.accent[400]} />
                  <Text style={styles.popularTitle}>Mais pedidos no Da Terra</Text>
                </View>
                <Text style={styles.popularSubtitle}>Os favoritos da galera potiguar</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularScroll}
            >
              {popular.map((item, idx) => (
                <Pressable
                  key={item.id}
                  style={styles.popularItem}
                  onPress={() =>
                    navigation.navigate('Store', { supplierId: item.id })
                  }
                >
                  <View style={styles.popularAvatar}>
                    {item.cover_url ? (
                      <Image
                        source={{ uri: item.cover_url }}
                        style={styles.popularAvatarImg}
                      />
                    ) : (
                      <Ionicons
                        name={supplierTypeIcon(item.type)}
                        size={30}
                        color={colors.sand[300]}
                      />
                    )}
                    {idx < 3 && (
                      <View style={styles.popularRank}>
                        <Text style={styles.popularRankText}>#{idx + 1}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.popularName} numberOfLines={2}>
                    {item.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionTitleMain}>Destaques Potiguares</Text>

        {loading ? (
          <ActivityIndicator color={colors.brand[500]} style={{ marginTop: 24 }} />
        ) : suppliers.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={52} color={colors.brand[300]} style={styles.emptyEmoji} />
            <Text style={styles.emptyTitle}>Ainda não temos parceiros ativos aqui</Text>
            <Text style={styles.emptySubtitle}>
              Os fornecedores estão sendo validados pela equipe Da Terra. Em breve vão aparecer
              nessa lista.
            </Text>
          </View>
        ) : (
          SECTIONS.map((section) => {
            const list = grouped[section.type];
            if (list.length === 0) return null;
            return (
              <View key={section.type} style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.iconTitleRow}>
                      <Ionicons
                        name={supplierTypeIcon(section.type)}
                        size={17}
                        color={colors.brand[600]}
                      />
                      <Text style={styles.subsectionTitle}>{section.title}</Text>
                    </View>
                    <Text style={styles.subsectionSubtitle}>{section.subtitle}</Text>
                  </View>
                  <Text style={styles.sectionCount}>{list.length}</Text>
                </View>
                <View style={[styles.rowList, isTablet && styles.rowListTablet]}>
                  {list.map((item) => (
                    <Pressable
                      key={item.id}
                      style={[styles.row, isTablet && styles.rowTablet]}
                      onPress={() =>
                        navigation.navigate('Store', { supplierId: item.id })
                      }
                    >
                      <View style={styles.rowImage}>
                        {item.cover_url ? (
                          <Image source={{ uri: item.cover_url }} style={styles.rowImageInner} />
                        ) : (
                          <Ionicons
                            name={supplierTypeIcon(section.type)}
                            size={26}
                            color={colors.sand[300]}
                          />
                        )}
                      </View>
                      <View style={styles.rowBody}>
                        <View style={styles.seloPill}>
                          <Ionicons name="ribbon" size={11} color={colors.gold[500]} />
                          <Text style={styles.seloPillText}>Feito Potiguar</Text>
                        </View>
                        <Text style={styles.rowName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.rowMetaRow}>
                          <Ionicons name="location-outline" size={12} color={colors.ink.secondary} />
                          <Text style={styles.rowMeta} numberOfLines={1}>
                            {item.city ?? '—'}
                            {item.primary_category
                              ? ` · ${labelForCategory(item.primary_category)}`
                              : ''}
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.ink.tertiary} />
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })
        )}
        </Bounded>
      </ScrollView>
      <CartBar onPress={() => navigation.navigate('Cart')} />
    </SafeAreaView>
  );
}

function labelForCategory(slug: string | null): string {
  if (!slug) return '';
  const found = FEITO_POTIGUAR_CATEGORIES.find((c) => c.slug === slug);
  return found?.label ?? '';
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  iconTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  root: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { paddingBottom: 24 },
  header: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 16 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brand: {
    fontSize: 22,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[500],
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: { fontSize: 18 },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.status.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.sand[50],
  },
  bellBadgeText: {
    color: colors.ink.inverse,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 14,
  },
  greeting: { fontSize: 16, color: colors.ink.primary },
  address: { marginTop: 4, fontSize: 14, color: colors.ink.secondary },
  loginBtn: {
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: colors.ink.inverse,
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
  },
  loginHint: {
    marginTop: 4,
    fontSize: 14,
    color: colors.brand[600],
    fontWeight: typography.fontWeight.medium,
  },

  sectionTitle: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
  },
  sectionTitleMain: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
  },

  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
  },
  categoryPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: colors.sand[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  categoryPhotoImg: { width: '100%', height: '100%' },
  categoryMore: {
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  categoryLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: colors.ink.primary,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 15,
  },

  bannerWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 24,
    overflow: 'hidden',
  },
  bannerSlide: {
    minHeight: 220,
    paddingHorizontal: 28,
    paddingVertical: 28,
    justifyContent: 'center',
    borderRadius: 24,
  },
  bannerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 8,
    lineHeight: 32,
  },
  bannerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: '85%',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sand[300],
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.brand[500],
  },

  popularBlock: { marginTop: 8, marginBottom: 8 },
  popularHeader: { paddingHorizontal: 20, marginBottom: 10 },
  popularTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
  popularSubtitle: {
    fontSize: 12,
    color: colors.ink.secondary,
    marginTop: 2,
  },
  popularScroll: { paddingHorizontal: 16, gap: 14 },
  popularItem: { width: 84, alignItems: 'center', marginRight: 4 },
  popularAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.sand[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gold[100],
    position: 'relative',
  },
  popularAvatarImg: { width: '100%', height: '100%' },
  popularAvatarPlaceholder: { fontSize: 32 },
  popularRank: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold[300],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  popularRankText: {
    color: colors.ink.inverse,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  popularName: {
    fontSize: 12,
    color: colors.ink.primary,
    textAlign: 'center',
    marginTop: 8,
  },

  sectionBlock: { marginTop: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
  subsectionSubtitle: {
    fontSize: 12,
    color: colors.ink.secondary,
    marginTop: 2,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.ink.tertiary,
    backgroundColor: colors.sand[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },

  rowList: {
    backgroundColor: colors.surface.primary,
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sand[200],
    gap: 12,
  },
  // iPad: a lista vira grade de 2 colunas (cards) pra aproveitar a largura.
  rowListTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'transparent',
    overflow: 'visible',
    gap: 12,
  },
  rowTablet: {
    width: '48%',
    backgroundColor: colors.surface.primary,
    borderRadius: 14,
    borderBottomWidth: 0,
  },
  rowImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.sand[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowImageInner: { width: '100%', height: '100%' },
  rowImagePlaceholder: { fontSize: 28 },
  rowBody: { flex: 1 },
  seloPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: colors.gold[100],
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    marginBottom: 4,
  },
  seloPillText: {
    color: colors.gold[500],
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  rowName: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
    marginBottom: 2,
  },
  rowMeta: {
    fontSize: 12,
    color: colors.ink.secondary,
  },
  rowChevron: {
    fontSize: 22,
    color: colors.ink.tertiary,
    marginLeft: 4,
  },

  empty: {
    paddingHorizontal: 40,
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.ink.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
