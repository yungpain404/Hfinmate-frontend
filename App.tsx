import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
import { useAuthViewModel } from './src/viewmodels/useAuthViewModel';
import { GoogleAuthBottomSheet } from './src/components';

import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  const { initAuth, isGoogleModalVisible, hideGoogleModal } = useAuthViewModel();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />

          {/* Popup cạnh dưới ràng buộc đăng nhập Google khi lần đầu mở app / chưa đăng nhập */}
          <GoogleAuthBottomSheet
            visible={isGoogleModalVisible}
            isMandatory={true}
            onSuccess={() => {
              hideGoogleModal();
            }}
          />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
