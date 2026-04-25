import type { Signup } from '@daterra/shared';

export type RootStackParamList = {
  AuthHub: undefined;
  Login: undefined;
  SignupStep1: undefined;
  SignupStep2: { step1: Pick<Signup, 'full_name' | 'email' | 'phone' | 'password'> };
  Home: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
