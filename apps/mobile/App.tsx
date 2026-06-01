import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, typography } from '@daterra/ui/tokens';

import { AuthProvider, useAuth } from './lib/auth-context';
import { CartProvider } from './lib/cart-context';
import { AuthHubScreen } from './screens/auth/AuthHubScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from './screens/auth/ResetPasswordScreen';
import { SignupStep1Screen } from './screens/auth/SignupStep1Screen';
import { SignupStep2Screen } from './screens/auth/SignupStep2Screen';
import { HomeScreen } from './screens/HomeScreen';
import { StoreScreen } from './screens/StoreScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { CategoriesModalScreen } from './screens/CategoriesModalScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { CheckoutAddressFormScreen } from './screens/CheckoutAddressFormScreen';
import { OrderConfirmationScreen } from './screens/OrderConfirmationScreen';
import { OrdersListScreen } from './screens/OrdersListScreen';
import { OrderDetailScreen } from './screens/OrderDetailScreen';
import { SuperScreen } from './screens/SuperScreen';
import { SearchScreen } from './screens/SearchScreen';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { EditProfileScreen } from './screens/profile/EditProfileScreen';
import { AddressesListScreen } from './screens/profile/AddressesListScreen';
import { AddressFormScreen } from './screens/profile/AddressFormScreen';
import { AboutScreen } from './screens/profile/AboutScreen';
import type {
  AuthStackParamList,
  HomeStackParamList,
  MainTabParamList,
  OrdersStackParamList,
  ProfileStackParamList,
  SearchStackParamList,
} from './navigation/types';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Store" component={StoreScreen} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStack.Screen
        name="CategoriesModal"
        component={CategoriesModalScreen}
        options={{ presentation: 'modal' }}
      />
      {/* Cart agora é stack do Home — acessível de qualquer tela */}
      <HomeStack.Screen name="Cart" component={CartScreen} />
      <HomeStack.Screen name="Checkout" component={CheckoutScreen} />
      <HomeStack.Screen
        name="CheckoutAddressForm"
        component={CheckoutAddressFormScreen}
      />
      <HomeStack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
    </HomeStack.Navigator>
  );
}

const SearchStack = createNativeStackNavigator<SearchStackParamList>();
function SearchStackNavigator() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
    </SearchStack.Navigator>
  );
}

const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrdersList" component={OrdersListScreen} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </OrdersStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Addresses" component={AddressesListScreen} />
      <ProfileStack.Screen name="AddressForm" component={AddressFormScreen} />
      <ProfileStack.Screen name="About" component={AboutScreen} />
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand[500],
        tabBarInactiveTintColor: colors.ink.tertiary,
        tabBarStyle: {
          backgroundColor: colors.surface.primary,
          borderTopColor: colors.sand[200],
          height: 64,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: typography.fontWeight.medium,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStackNavigator}
        options={{
          tabBarLabel: 'Busca',
          tabBarIcon: ({ focused }) => <TabIcon icon="🔍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SuperTab"
        component={SuperScreen}
        options={{
          tabBarLabel: 'Super',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚡" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{
          tabBarLabel: 'Pedidos',
          tabBarIcon: ({ focused }) => <TabIcon icon="📦" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 24 : 22, opacity: focused ? 1 : 0.6 }}>{icon}</Text>;
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.sand[50] },
      }}
    >
      <AuthStack.Screen name="AuthHub" component={AuthHubScreen} />
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: true, title: '', headerBackTitle: 'Voltar' }}
      />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: true, title: '', headerBackTitle: 'Voltar' }}
      />
      <AuthStack.Screen
        name="SignupStep1"
        component={SignupStep1Screen}
        options={{ headerShown: true, title: '', headerBackTitle: 'Voltar' }}
      />
      <AuthStack.Screen
        name="SignupStep2"
        component={SignupStep2Screen}
        options={{ headerShown: true, title: '', headerBackTitle: 'Voltar' }}
      />
    </AuthStack.Navigator>
  );
}

function RootNavigator() {
  const { session, loading, recovery } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.ink.inverse} />
      </View>
    );
  }

  // Veio do link de recuperação de senha: força a tela de nova senha,
  // independente de já haver sessão ativa.
  if (recovery) return <ResetPasswordScreen />;

  return session ? <MainTabs /> : <AuthNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand[500],
  },
});
