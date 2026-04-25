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
import { CartProvider, useCart } from './lib/cart-context';
import { AuthHubScreen } from './screens/auth/AuthHubScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { SignupStep1Screen } from './screens/auth/SignupStep1Screen';
import { SignupStep2Screen } from './screens/auth/SignupStep2Screen';
import { HomeScreen } from './screens/HomeScreen';
import { StoreScreen } from './screens/StoreScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { OrderConfirmationScreen } from './screens/OrderConfirmationScreen';
import { OrdersListScreen } from './screens/OrdersListScreen';
import { OrderDetailScreen } from './screens/OrderDetailScreen';
import type {
  AuthStackParamList,
  CartStackParamList,
  HomeStackParamList,
  MainTabParamList,
  OrdersStackParamList,
} from './navigation/types';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Store" component={StoreScreen} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </HomeStack.Navigator>
  );
}

const CartStack = createNativeStackNavigator<CartStackParamList>();
function CartStackNavigator() {
  return (
    <CartStack.Navigator screenOptions={{ headerShown: false }}>
      <CartStack.Screen name="Cart" component={CartScreen} />
      <CartStack.Screen name="Checkout" component={CheckoutScreen} />
      <CartStack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
    </CartStack.Navigator>
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

const Tab = createBottomTabNavigator<MainTabParamList>();
function MainTabs() {
  const { itemCount } = useCart();
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
        name="CartTab"
        component={CartStackNavigator}
        options={{
          tabBarLabel: 'Sacola',
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent[400] },
          tabBarIcon: ({ focused }) => <TabIcon icon="🛒" focused={focused} />,
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
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.ink.inverse} />
      </View>
    );
  }

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
