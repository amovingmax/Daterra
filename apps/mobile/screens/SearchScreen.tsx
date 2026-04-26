import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FEITO_POTIGUAR_CATEGORIES } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '../lib/recent-searches';
import { searchSuppliers } from '../lib/queries';
import type { DBSupplier } from '../lib/supabase';
import type { MainTabParamList, SearchStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<SearchStackParamList, 'Search'>;

const TYPE_FILTERS: { label: string; emoji: string; value: DBSupplier['type'] }[] = [
  { label: 'Produtores', emoji: '🌾', value: 'producer' },
  { label: 'Restaurantes', emoji: '🍴', value: 'restaurant' },
  { label: 'Hotelaria', emoji: '🏨', value: 'hospitality' },
];

const TRENDING = ['Mel', 'Queijo coalho', 'Tapioca', 'Cachaça', 'Doce de caju', 'Granola'];

// Na Busca, exibimos apenas categorias de produtos (alimentos/bebidas).
// Tipo de negócio (bares/restaurantes, hotelaria) já tem filtro próprio acima.
const FOOD_CATEGORIES = FEITO_POTIGUAR_CATEGORIES.filter(
  (c) => c.slug !== 'bares-e-restaurantes' && c.slug !== 'hospedagem',
);

export function SearchScreen(_: Props) {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<DBSupplier['type'] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recents, setRecents] = useState<string[]>([]);
  const [results, setResults] = useState<DBSupplier[]>([]);
  const [searching, setSearching] = useState(false);

  const hasFilters = !!query.trim() || !!selectedType || !!selectedCategory;

  // Carrega buscas recentes ao focar
  useFocusEffect(
    useCallback(() => {
      getRecentSearches().then(setRecents);
    }, []),
  );

  // Roda a busca com debounce sempre que filtros mudam
  useEffect(() => {
    if (!hasFilters) {
      setResults([]);
      setSearching(false);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      const list = await searchSuppliers({
        query,
        type: selectedType,
        category: selectedCategory,
      });
      setResults(list);
      setSearching(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, selectedType, selectedCategory, hasFilters]);

  async function handleSubmit() {
    if (query.trim().length >= 2) {
      await addRecentSearch(query.trim());
      const updated = await getRecentSearches();
      setRecents(updated);
    }
  }

  function applyTrending(term: string) {
    setQuery(term);
  }

  function applyRecent(term: string) {
    setQuery(term);
  }

  async function handleRemoveRecent(term: string) {
    await removeRecentSearch(term);
    setRecents((prev) => prev.filter((s) => s !== term));
  }

  async function handleClearRecents() {
    await clearRecentSearches();
    setRecents([]);
  }

  function clearAll() {
    setQuery('');
    setSelectedType(null);
    setSelectedCategory(null);
  }

  const showInitialState = !hasFilters;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* Search bar */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="O que vai pedir hoje?"
          placeholderTextColor={colors.ink.tertiary}
          style={styles.searchInput}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
        />
        {hasFilters && (
          <Pressable onPress={clearAll} hitSlop={8}>
            <Text style={styles.cancelText}>Limpar</Text>
          </Pressable>
        )}
      </View>

      {/* Pills de tipo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipo de negócio</Text>
        <View style={styles.pillsRow}>
          {TYPE_FILTERS.map((t) => {
            const active = selectedType === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => setSelectedType(active ? null : t.value)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={[styles.pillEmoji, active && styles.pillTextActive]}>
                  {t.emoji}
                </Text>
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Pills de categoria */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorias</Text>
        <View style={styles.pillsRowWrap}>
          {FOOD_CATEGORIES.map((c) => {
            const active = selectedCategory === c.slug;
            return (
              <Pressable
                key={c.slug}
                onPress={() => setSelectedCategory(active ? null : c.slug)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={[styles.pillEmoji, active && styles.pillTextActive]}>
                  {c.icon}
                </Text>
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Conteúdo: estado inicial OU resultados */}
      {showInitialState ? (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <InitialState
              recents={recents}
              onTrending={applyTrending}
              onRecent={applyRecent}
              onRemoveRecent={handleRemoveRecent}
              onClearRecents={handleClearRecents}
            />
          }
        />
      ) : (
        <ResultsList
          loading={searching}
          results={results}
          onTapResult={(s) =>
            tabNav.navigate('HomeTab', {
              screen: 'Store',
              params: { supplierId: s.id },
            })
          }
        />
      )}
    </SafeAreaView>
  );
}

function InitialState({
  recents,
  onTrending,
  onRecent,
  onRemoveRecent,
  onClearRecents,
}: {
  recents: string[];
  onTrending: (term: string) => void;
  onRecent: (term: string) => void;
  onRemoveRecent: (term: string) => void;
  onClearRecents: () => void;
}) {
  return (
    <View>
      {/* Em Alta */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Em alta no RN</Text>
        <View style={styles.pillsRowWrap}>
          {TRENDING.map((t) => (
            <Pressable
              key={t}
              onPress={() => onTrending(t)}
              style={[styles.pill, styles.pillTrending]}
            >
              <Text style={styles.pillTextTrending}>🔥 {t}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Buscas Recentes */}
      {recents.length > 0 && (
        <View style={styles.section}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Buscas recentes</Text>
            <Pressable onPress={onClearRecents} hitSlop={6}>
              <Text style={styles.clearLink}>Limpar tudo</Text>
            </Pressable>
          </View>
          {recents.map((term) => (
            <Pressable
              key={term}
              onPress={() => onRecent(term)}
              style={styles.recentRow}
            >
              <Text style={styles.recentClock}>🕐</Text>
              <Text style={styles.recentText}>{term}</Text>
              <Pressable onPress={() => onRemoveRecent(term)} hitSlop={8}>
                <Text style={styles.recentClose}>✕</Text>
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function ResultsList({
  loading,
  results,
  onTapResult,
}: {
  loading: boolean;
  results: DBSupplier[];
  onTapResult: (s: DBSupplier) => void;
}) {
  if (loading) {
    return <ActivityIndicator color={colors.brand[500]} style={{ marginTop: 24 }} />;
  }
  if (results.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={styles.emptyTitle}>Nada encontrado</Text>
        <Text style={styles.emptyText}>
          Tente outro termo ou ajuste os filtros acima.
        </Text>
      </View>
    );
  }
  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable style={styles.resultRow} onPress={() => onTapResult(item)}>
          <View style={styles.resultImage}>
            {item.cover_url ? (
              <Image source={{ uri: item.cover_url }} style={styles.resultImageInner} />
            ) : (
              <Text style={styles.resultImagePlaceholder}>🌱</Text>
            )}
          </View>
          <View style={styles.resultBody}>
            <Text style={styles.resultName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.resultMeta} numberOfLines={1}>
              📍 {item.city ?? '—'} · {labelForType(item.type)}
            </Text>
          </View>
          <Text style={styles.resultChevron}>›</Text>
        </Pressable>
      )}
      contentContainerStyle={styles.resultsList}
    />
  );
}

function labelForType(type: DBSupplier['type']): string {
  switch (type) {
    case 'producer':
      return 'Produtor';
    case 'restaurant':
      return 'Restaurante';
    case 'hospitality':
      return 'Hotelaria';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: 999,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.ink.primary,
  },
  cancelText: { color: colors.status.danger, fontSize: 14 },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
    marginBottom: 8,
  },
  pillsRow: { flexDirection: 'row', gap: 8 },
  pillsRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  pillActive: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  pillTrending: { backgroundColor: colors.gold[100], borderColor: colors.gold[200] },
  pillEmoji: { fontSize: 14 },
  pillText: {
    color: colors.ink.primary,
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
  },
  pillTextActive: { color: colors.ink.inverse },
  pillTextTrending: { color: colors.gold[500], fontSize: 13, fontWeight: typography.fontWeight.medium },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearLink: { color: colors.status.danger, fontSize: 13 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sand[200],
    gap: 12,
  },
  recentClock: { fontSize: 14 },
  recentText: { flex: 1, fontSize: 15, color: colors.ink.primary },
  recentClose: { fontSize: 16, color: colors.ink.tertiary, padding: 4 },
  resultsList: { paddingHorizontal: 16, paddingBottom: 24 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  resultImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.sand[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  resultImageInner: { width: '100%', height: '100%' },
  resultImagePlaceholder: { fontSize: 24 },
  resultBody: { flex: 1 },
  resultName: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semibold,
    color: colors.ink.primary,
  },
  resultMeta: { fontSize: 12, color: colors.ink.secondary, marginTop: 2 },
  resultChevron: { fontSize: 22, color: colors.ink.tertiary },
  empty: { paddingVertical: 60, paddingHorizontal: 40, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
    marginBottom: 4,
  },
  emptyText: { fontSize: 14, color: colors.ink.secondary, textAlign: 'center' },
});
