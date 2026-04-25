import { forwardRef, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { colors, typography } from '@daterra/ui/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  helper?: string;
  /** Slot opcional renderizado no canto direito do input (ex: botão de mostrar senha). */
  rightAdornment?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, helper, rightAdornment, style, ...rest },
  ref,
) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.wrapper, error ? styles.wrapperError : undefined]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.ink.tertiary}
          style={[styles.input, rightAdornment ? styles.inputWithAdornment : undefined, style]}
          {...rest}
        />
        {rightAdornment ? <View style={styles.adornment}>{rightAdornment}</View> : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    color: colors.ink.primary,
    marginBottom: 6,
  },
  wrapper: {
    position: 'relative',
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
  },
  wrapperError: {
    borderColor: colors.status.danger,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink.primary,
  },
  inputWithAdornment: {
    paddingRight: 48,
  },
  adornment: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  error: {
    marginTop: 6,
    fontSize: 13,
    color: colors.status.danger,
  },
  helper: {
    marginTop: 6,
    fontSize: 13,
    color: colors.ink.secondary,
  },
});
