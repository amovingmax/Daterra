import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatBRL } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { useCart } from '../lib/cart-context';

interface CartBarProps {
  onPress: () => void;
}

/** Barra fixa no rodapé com resumo da sacola. Renderiza null se sacola vazia. */
export function CartBar({ onPress }: CartBarProps) {
  const { itemCount, subtotalCents, cart } = useCart();
  if (itemCount === 0) return null;

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.bar} onPress={onPress}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🛒</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{itemCount}</Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            Sua sacola
          </Text>
          <Text style={styles.supplier} numberOfLines={1}>
            de {cart.supplier_name}
          </Text>
        </View>
        <Text style={styles.total}>{formatBRL(subtotalCents)}</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand[500],
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent[400],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.brand[500],
  },
  badgeText: {
    color: colors.ink.inverse,
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  info: { flex: 1 },
  title: {
    color: colors.ink.inverse,
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
  },
  supplier: {
    color: colors.brand[100],
    fontSize: 12,
    marginTop: 2,
  },
  total: {
    color: colors.ink.inverse,
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
  },
  chevron: {
    color: colors.ink.inverse,
    fontSize: 22,
    marginLeft: -4,
  },
});
