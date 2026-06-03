import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FEITO_POTIGUAR_CATEGORIES } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Bounded } from '../components/Bounded';
import { categoryIcon, categoryImage } from '../lib/icons';
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
          <Ionicons name="close" size={24} color={colors.ink.primary} />
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
          {FEITO_POTIGUAR_CATEGORIES.map((cat) => {
            const img = categoryImage(cat.slug);
            return (
              <Pressable
                key={cat.slug}
                style={styles.gridItem}
                onPress={() => openCategory(cat.slug)}
              >
                <View style={styles.photo}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.photoImg} />
                  ) : (
                    <Ionicons name={categoryIcon(cat.slug)} size={32} color={colors.brand[600]} />
                  )}
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
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
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: colors.sand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  photoImg: { width: '100%', height: '100%' },
  label: {
    fontSize: 13,
    textAlign: 'center',
    color: colors.ink.primary,
    lineHeight: 16,
  },
});
