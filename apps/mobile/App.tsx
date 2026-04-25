import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@daterra/ui/tokens';

import { AuthProvider, useAuth } from './lib/auth-context';
import { AuthHubScreen } from './screens/auth/AuthHubScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { SignupStep1Screen } from './screens/auth/SignupStep1Screen';
import { SignupStep2Screen } from './screens/auth/SignupStep2Screen';
import { HomeScreen } from './screens/HomeScreen';
import type { RootStackParamList } from './navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.ink.inverse} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.sand[50] },
      }}
    >
      {session ? (
        <Stack.Screen name="Home" component={HomeScreen} />
      ) : (
        <>
          <Stack.Screen name="AuthHub" component={AuthHubScreen} />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: true, title: '', headerBackTitle: 'Voltar' }}
          />
          <Stack.Screen
            name="SignupStep1"
            component={SignupStep1Screen}
            options={{ headerShown: true, title: '', headerBackTitle: 'Voltar' }}
          />
          <Stack.Screen
            name="SignupStep2"
            component={SignupStep2Screen}
            options={{ headerShown: true, title: '', headerBackTitle: 'Voltar' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand[500],
  },
});
