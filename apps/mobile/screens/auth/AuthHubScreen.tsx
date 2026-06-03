import { useState } from 'react';
import { Alert, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '@daterra/ui/tokens';
import { Button } from '../../components/Button';
import { signInWithProvider, type OAuthProvider } from '../../lib/oauth';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthHub'>;

export function AuthHubScreen({ navigation }: Props) {
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  async function handleSocial(provider: OAuthProvider) {
    setPending(provider);
    const { error, cancelled } = await signInWithProvider(provider);
    setPending(null);
    if (cancelled) return;
    if (error) {
      Alert.alert('Não foi possível entrar', error);
      return;
    }
    // Sucesso: o AuthProvider escuta a sessão e redireciona pra Home automaticamente.
  }

  return (
    <View style={styles.root}>
      <ImageBackground
        // sem foto real ainda — gradiente sólido com overlay
        source={undefined}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <Pressable
          onPress={() => navigation.getParent()?.goBack()}
          style={styles.closeBtn}
          hitSlop={10}
          accessibilityLabel="Fechar e continuar como visitante"
        >
          <Ionicons name="close" size={22} color={colors.ink.inverse} />
        </Pressable>
        <View style={styles.overlay}>
          <View style={styles.brand}>
            <Ionicons name="leaf" size={34} color={colors.ink.inverse} style={styles.brandIcon} />
            <Text style={styles.brandName}>Da Terra</Text>
          </View>
          <Text style={styles.headline}>Direto da terra potiguar pra sua mesa.</Text>
          <Text style={styles.subhead}>
            Marketplace dos produtos com Selo Feito Potiguar — entrega em todo RN.
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.actions}>
        <Button label="Já tenho uma conta" onPress={() => navigation.navigate('Login')} />
        <View style={styles.spacer} />
        <Button
          label="Criar nova conta"
          variant="secondary"
          onPress={() => navigation.navigate('SignupStep1')}
        />
        <Text style={styles.divider}>ou acesse com</Text>
        <View style={styles.socialRow}>
          <Button
            label="Google"
            variant="secondary"
            loading={pending === 'google'}
            disabled={pending !== null}
            onPress={() => handleSocial('google')}
            fullWidth={false}
          />
          <Button
            label="Apple"
            variant="secondary"
            loading={pending === 'apple'}
            disabled={pending !== null}
            onPress={() => handleSocial('apple')}
            fullWidth={false}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.brand[500],
  },
  hero: {
    flex: 1,
    backgroundColor: colors.brand[500],
  },
  heroImage: {
    resizeMode: 'cover',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: colors.ink.inverse,
    fontSize: 18,
    fontWeight: typography.fontWeight.semibold,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIcon: {
    fontSize: 40,
    marginRight: 8,
  },
  brandName: {
    color: colors.ink.inverse,
    fontSize: 26,
    fontWeight: typography.fontWeight.semibold,
  },
  headline: {
    color: colors.ink.inverse,
    fontSize: 30,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 36,
    marginBottom: 12,
  },
  subhead: {
    color: colors.brand[100],
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    backgroundColor: colors.sand[50],
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  spacer: {
    height: 12,
  },
  divider: {
    textAlign: 'center',
    color: colors.ink.tertiary,
    marginVertical: 18,
    fontSize: 13,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
});
