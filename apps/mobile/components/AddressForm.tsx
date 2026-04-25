import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { addressSchema, maskCEP } from '@daterra/shared';
import { colors, typography } from '@daterra/ui/tokens';
import { Button } from './Button';
import { Input } from './Input';
import { ScreenContainer } from './ScreenContainer';
import { fetchAddressByCEP } from '../lib/viacep';
import { createAddress, updateAddress } from '../lib/queries';
import type { DBAddress } from '../lib/supabase';

interface AddressFormProps {
  userId: string;
  initial?: DBAddress | null;
  /** Mensagem opcional acima do form (ex: "Adicionar endereço pra esta entrega"). */
  intro?: string;
  /** Chamado após salvar com sucesso. Recebe o endereço criado/atualizado. */
  onSaved: (address: DBAddress) => void;
  /** Chamado ao cancelar. */
  onCancel: () => void;
}

export function AddressForm({ userId, initial, intro, onSaved, onCancel }: AddressFormProps) {
  const [zipCode, setZipCode] = useState(initial?.zip_code ?? '');
  const [street, setStreet] = useState(initial?.street ?? '');
  const [number, setNumber] = useState(initial?.number ?? '');
  const [complement, setComplement] = useState(initial?.complement ?? '');
  const [district, setDistrict] = useState(initial?.district ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [stateUf, setStateUf] = useState(initial?.state ?? 'RN');
  const [label, setLabel] = useState(initial?.label ?? 'Casa');
  const [isPrimary, setIsPrimary] = useState(initial?.is_primary ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCEPLookup(input: string) {
    const masked = maskCEP(input);
    setZipCode(masked);
    const digits = masked.replace(/\D/g, '');
    if (digits.length === 8) {
      setLoadingCEP(true);
      const found = await fetchAddressByCEP(digits);
      setLoadingCEP(false);
      if (found) {
        setStreet(found.street);
        setDistrict(found.district);
        setCity(found.city);
        setStateUf(found.state);
      }
    }
  }

  async function handleSubmit() {
    setErrors({});
    const parsed = addressSchema.safeParse({
      label,
      zip_code: zipCode,
      street,
      number,
      complement: complement || null,
      district,
      city,
      state: stateUf,
      reference: null,
      is_primary: isPrimary,
    });

    if (!parsed.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0]?.toString() ?? '_';
        if (!newErrors[path]) newErrors[path] = issue.message;
      }
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    const result = initial
      ? await updateAddress(initial.id, parsed.data, userId)
      : await createAddress(userId, parsed.data);
    setSubmitting(false);

    if (!result) {
      Alert.alert('Erro', 'Não foi possível salvar o endereço. Tente de novo.');
      return;
    }
    onSaved(result);
  }

  return (
    <ScreenContainer>
      {intro && <Text style={styles.intro}>{intro}</Text>}
      <Text style={styles.title}>{initial ? 'Editar endereço' : 'Novo endereço'}</Text>

      <View style={styles.form}>
        <Input
          label="Apelido"
          value={label}
          onChangeText={setLabel}
          placeholder="Casa, Trabalho, Outro"
          error={errors.label}
        />
        <Input
          label="CEP"
          keyboardType="number-pad"
          value={zipCode}
          onChangeText={handleCEPLookup}
          placeholder="59000-000"
          maxLength={9}
          helper={loadingCEP ? 'Buscando endereço...' : 'Preenchemos automaticamente'}
          error={errors.zip_code}
        />
        <Input
          label="Logradouro"
          value={street}
          onChangeText={setStreet}
          placeholder="Rua, Avenida, etc."
          error={errors.street}
        />
        <View style={styles.row}>
          <View style={styles.flex2}>
            <Input
              label="Número"
              keyboardType="number-pad"
              value={number}
              onChangeText={setNumber}
              placeholder="123"
              error={errors.number}
            />
          </View>
          <View style={styles.flex3}>
            <Input
              label="Complemento"
              value={complement ?? ''}
              onChangeText={setComplement}
              placeholder="Apto 302"
            />
          </View>
        </View>
        <Input
          label="Bairro"
          value={district}
          onChangeText={setDistrict}
          error={errors.district}
        />
        <View style={styles.row}>
          <View style={styles.flex3}>
            <Input
              label="Cidade"
              value={city}
              onChangeText={setCity}
              error={errors.city}
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="UF"
              value={stateUf}
              onChangeText={(v) => setStateUf(v.toUpperCase().slice(0, 2))}
              maxLength={2}
              autoCapitalize="characters"
              error={errors.state}
            />
          </View>
        </View>

        <View style={styles.primaryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.primaryLabel}>Usar como endereço principal</Text>
            <Text style={styles.primaryHelper}>
              É o que aparece pré-selecionado na hora de fazer um pedido.
            </Text>
          </View>
          <Switch
            value={isPrimary}
            onValueChange={setIsPrimary}
            trackColor={{ false: colors.sand[300], true: colors.brand[300] }}
            thumbColor={isPrimary ? colors.brand[500] : colors.surface.primary}
          />
        </View>

        <View style={styles.actionsRow}>
          <View style={{ flex: 1 }}>
            <Button label="Cancelar" variant="ghost" onPress={onCancel} />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Button label={initial ? 'Salvar' : 'Criar'} onPress={handleSubmit} loading={submitting} />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 13,
    color: colors.ink.secondary,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand[700],
    marginBottom: 20,
  },
  form: { marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  flex3: { flex: 3 },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
    gap: 12,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: typography.fontWeight.medium,
    color: colors.ink.primary,
  },
  primaryHelper: {
    fontSize: 12,
    color: colors.ink.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
