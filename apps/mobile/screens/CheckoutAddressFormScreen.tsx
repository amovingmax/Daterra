import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AddressForm } from '../components/AddressForm';
import { useAuth } from '../lib/auth-context';
import type { CartStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<CartStackParamList, 'CheckoutAddressForm'>;

export function CheckoutAddressFormScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AddressForm
      userId={user.id}
      initial={route.params?.address ?? null}
      intro="Adicionando endereço para esta entrega"
      onSaved={() => navigation.goBack()}
      onCancel={() => navigation.goBack()}
    />
  );
}
