import { type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { CONTENT_MAX_WIDTH } from '../lib/responsive';

interface BoundedProps {
  children: ReactNode;
  /** Largura máxima no tablet (default: conteúdo). */
  maxWidth?: number;
  style?: ViewStyle;
}

/**
 * Limita a largura do conteúdo e centraliza — no iPhone ocupa 100%, no iPad
 * vira uma coluna central (não "estica"). Use como filho direto de um
 * ScrollView/contentContainer (coluna flex) ou de uma View em coluna.
 */
export function Bounded({ children, maxWidth = CONTENT_MAX_WIDTH, style }: BoundedProps) {
  return <View style={[styles.base, { maxWidth }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    alignSelf: 'center',
  },
});
