import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
import { useAuthViewModel } from './src/viewmodels/useAuthViewModel';
import { GoogleAuthBottomSheet } from './src/components';
import { AuthProvider } from './src/context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

function MainAppContent() {
  const { user, isLoading, initAuth, isGoogleModalVisible, hideGoogleModal } =
    useAuthViewModel();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Auth Gate: Hiển thị Splash Screen khi đang kiểm tra phiên làm việc lần đầu
  if (isLoading && !user) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <Image
          source={require('./assets/splash-icon.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <Text style={styles.splashTitle}>HFinmate</Text>
        <Text style={styles.splashSubtitle}>Sổ thu chi & Quản lý tài chính cá nhân</Text>
        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <RootNavigator />

      {/* Hộp thoại đăng nhập Google Bottom Sheet */}
      <GoogleAuthBottomSheet
        visible={isGoogleModalVisible}
        isMandatory={true}
        onSuccess={() => {
          hideGoogleModal();
        }}
      />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#004B2C',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  splashLogo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 14,
    color: '#A7F3D0',
    marginTop: 6,
    textAlign: 'center',
  },
});
