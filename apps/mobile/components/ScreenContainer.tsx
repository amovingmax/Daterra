import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type ReactNode } from 'react';
import { colors } from '@daterra/ui/tokens';
import { FORM_MAX_WIDTH } from '../lib/responsive';

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

export function ScreenContainer({
  children,
  scroll = true,
  contentStyle,
}: ScreenContainerProps) {
  // No iPad o conteúdo é limitado e centralizado (não estica a tela toda).
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;

  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  ) : (
    <View style={styles.fill}>{content}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {inner}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.sand[50],
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  fill: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexGrow: 1,
  },
});
