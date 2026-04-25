import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AddressForm } from '../../components/AddressForm';
import { useAuth } from '../../lib/auth-context';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AddressForm'>;

export function AddressFormScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AddressForm
      userId={user.id}
      initial={route.params?.address ?? null}
      onSaved={() => {
        navigation.goBack();
      }}
      onCancel={() => navigation.goBack()}
    />
  );
}
