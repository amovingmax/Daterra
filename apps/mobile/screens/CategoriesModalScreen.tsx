import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FEITO_POTIGUAR_CATEGORIES } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Bounded } from '../components/Bounded';
import type { HomeStackParamList, MainTabParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'CategoriesModal'>;

export function CategoriesModalScreen({ navigation }: Props) {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  function openCategory(slug: string) {
    navigation.goBack();
    tabNav.navigate('SearchTab', {
      screen: 'Search',
      params: { category: slug },
    });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Todas as categorias</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Bounded>
        <Text style={styles.subtitle}>
          As 8 categorias do programa Feito Potiguar.
        </Text>
        <View style={styles.grid}>
          {FEITO_POTIGUAR_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.slug}
              style={styles.gridItem}
              onPress={() => openCategory(cat.slug)}
            >
              <View style={styles.iconBox}>
                <Text style={styles.icon}>{cat.icon}</Text>
              </View>
              <Text style={styles.label} numberOfLines={2}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Bounded>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.sand[200],
  },
  close: { fontSize: 22, color: colors.ink.primary },
  title: {
    fontSize: 17,
    fontWeight: typography.fontWeight.semibold,
    color: colors.brand[700],
  },
  scroll: { padding: 20, paddingBottom: 40 },
  subtitle: {
    fontSize: 14,
    color: colors.ink.secondary,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: colors.surface.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: { fontSize: 38 },
  label: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.ink.primary,
    lineHeight: 15,
  },
});
