import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type BottomTabParamList = {
  Home: undefined;
  Analytics: undefined;
  Fixed: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  AddTransaction: undefined;
  Transactions: undefined;
  Profile: undefined;
};

// Screen props helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type BottomTabScreenPropsHelper<T extends keyof BottomTabParamList> =
  BottomTabScreenProps<BottomTabParamList, T>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
