import { forwardRef } from 'react';
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
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, helper, style, ...rest },
  ref,
) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.ink.tertiary}
        style={[styles.input, error ? styles.inputError : undefined, style]}
        {...rest}
      />
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
  input: {
    backgroundColor: colors.surface.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink.primary,
  },
  inputError: {
    borderColor: colors.status.danger,
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
