import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
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
  video: string; // loop de fundo (Mixkit, licença livre comercial, sem marca d'água)
  fg: string; // cor do texto/ícone (sobre o escurecimento)
  sub: string; // cor do subtítulo
}

const BANNER_SLIDES: BannerSlide[] = [
  {
    title: 'Direto da terra potiguar',
    subtitle: 'Produtos artesanais com Selo Feito Potiguar — entrega em todo RN.',
    icon: 'leaf',
    video: 'https://assets.mixkit.co/videos/985/985-360.mp4',
    fg: colors.ink.inverse,
    sub: 'rgba(251,248,241,0.88)',
  },
  {
    title: 'Selo Feito Potiguar',
    subtitle: 'Curadoria oficial: SEBRAE/RN, FAERN, FIERN e FECOMÉRCIO validam cada loja.',
    icon: 'ribbon',
    video: 'https://assets.mixkit.co/videos/46488/46488-360.mp4',
    fg: colors.ink.inverse,
    sub: 'rgba(251,248,241,0.88)',
  },
  {
    title: 'Comprou, chegou.',
    subtitle: 'Entrega na Grande Natal e RN inteiro · pagamento por Pix sem taxa.',
    icon: 'bicycle',
    video: 'https://assets.mixkit.co/videos/13090/13090-360.mp4',
    fg: colors.ink.inverse,
    sub: 'rgba(251,248,241,0.88)',
  },
];

// Escurecimento (scrim) por cima do vídeo pra manter o texto branco legível.
const BANNER_SCRIM: [string, string] = ['rgba(18,28,18,0.28)', 'rgba(12,18,12,0.80)'];

const SLIDE_MS = 4500; // tempo de cada slide antes de avançar sozinho

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
  // Animações do banner: entrada do conteúdo, barra de progresso e flutuação do ícone.
  const contentAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Um player de vídeo por slide (loop, mudo, autoplay) — fundo animado do banner.
  const initPlayer = (p: { loop: boolean; muted: boolean; play: () => void }) => {
    p.loop = true;
    p.muted = true;
    p.play();
  };
  const player0 = useVideoPlayer(BANNER_SLIDES[0].video, initPlayer);
  const player1 = useVideoPlayer(BANNER_SLIDES[1].video, initPlayer);
  const player2 = useVideoPlayer(BANNER_SLIDES[2].video, initPlayer);
  const bannerPlayers = [player0, player1, player2];

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

  // Flutuação contínua do ícone (sobe/desce de leve), roda enquanto a tela vive.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  // A cada troca de slide: anima a entrada do conteúdo (fade + sobe) e enche a
  // barrinha de progresso; quando ela completa, avança sozinho pro próximo.
  useEffect(() => {
    contentAnim.setValue(0);
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    progressAnim.setValue(0);
    const progress = Animated.timing(progressAnim, {
      toValue: 1,
      duration: SLIDE_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    progress.start(({ finished }) => {
      if (!finished) return;
      const next = (bannerIndex + 1) % BANNER_SLIDES.length;
      bannerRef.current?.scrollTo({ x: next * bannerWidth, animated: true });
      setBannerIndex(next);
    });
    return () => progress.stop();
  }, [bannerIndex, bannerWidth, contentAnim, progressAnim]);

  function goToBanner(i: number) {
    bannerRef.current?.scrollTo({ x: i * bannerWidth, animated: true });
    setBannerIndex(i);
  }

  function handleBannerScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / bannerWidth);
    if (idx !== bannerIndex) setBannerIndex(idx);
  }

  const bannerFloatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

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
            {BANNER_SLIDES.map((slide, i) => {
              const active = i === bannerIndex;
              const entrance = active
                ? {
                    opacity: contentAnim,
                    transform: [
                      {
                        translateY: contentAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [16, 0],
                        }),
                      },
                    ],
                  }
                : undefined;
              return (
                <View key={i} style={[styles.bannerSlide, { width: bannerWidth }]}>
                  <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <VideoView
                      player={bannerPlayers[i]}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      nativeControls={false}
                    />
                  </View>
                  <LinearGradient
                    colors={BANNER_SCRIM}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Animated.View style={entrance}>
                    <Animated.View
                      style={[
                        styles.bannerIconWrap,
                        { transform: [{ translateY: bannerFloatY }] },
                      ]}
                    >
                      <Ionicons name={slide.icon} size={28} color={slide.fg} />
                    </Animated.View>
                    <Text style={[styles.bannerTitle, { color: slide.fg }]}>{slide.title}</Text>
                    <Text style={[styles.bannerSubtitle, { color: slide.sub }]}>
                      {slide.subtitle}
                    </Text>
                  </Animated.View>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.dots}>
            {BANNER_SLIDES.map((_, i) => (
              <Pressable key={i} onPress={() => goToBanner(i)} hitSlop={8}>
                <View style={[styles.dotTrack, i === bannerIndex && styles.dotTrackActive]}>
                  {i === bannerIndex && (
                    <Animated.View
                      style={[
                        styles.dotFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  )}
                </View>
              </Pressable>
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
    overflow: 'hidden',
  },
  bannerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.30)',
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
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 16,
  },
  dotTrack: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.sand[300],
    overflow: 'hidden',
  },
  dotTrackActive: {
    width: 26,
    backgroundColor: colors.sand[200],
  },
  dotFill: {
    height: '100%',
    borderRadius: 4,
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
