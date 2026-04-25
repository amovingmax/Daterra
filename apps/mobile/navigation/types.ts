import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Signup } from '@daterra/shared';
import type { DBAddress } from '../lib/supabase';

export type HomeStackParamList = {
  Home: undefined;
  Store: { supplierId: string };
  ProductDetail: { productId: string };
  Notifications: undefined;
  CategoriesModal: undefined;
};

export type CartStackParamList = {
  Cart: undefined;
  Checkout: undefined;
  CheckoutAddressForm: { address?: DBAddress };
  OrderConfirmation: { orderId: string };
};

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { orderId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Addresses: undefined;
  AddressForm: { address?: DBAddress };
  About: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  SuperTab: undefined;
  CartTab: NavigatorScreenParams<CartStackParamList>;
  OrdersTab: NavigatorScreenParams<OrdersStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type AuthStackParamList = {
  AuthHub: undefined;
  Login: undefined;
  SignupStep1: undefined;
  SignupStep2: { step1: Pick<Signup, 'full_name' | 'email' | 'phone' | 'password'> };
};

export type RootStackParamList = AuthStackParamList & MainTabParamList & {
  Home: undefined; // legado — pra compatibilidade com telas antigas
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
