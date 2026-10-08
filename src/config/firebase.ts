import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as authExports from 'firebase/auth';

/**
 * Firebase Project Configuration
 * Loads environment variables from Expo Public config with safe defaults
 */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA_DEMO_KEY_HFINMATE_FIREBASE_AUTH_2026',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'hfinmate-app.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'hfinmate-app',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'hfinmate-app.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
};

// Singleton Firebase App instance (Modular API)
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Singleton Firebase Auth instance configured safely with React Native AsyncStorage persistence
let authInstance: Auth;

try {
  if (Platform.OS !== 'web') {
    // In React Native / Expo Go, use AsyncStorage persistence
    const getReactNativePersistence = (authExports as any).getReactNativePersistence;
    if (typeof getReactNativePersistence === 'function') {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      authInstance = getAuth(app);
    }
  } else {
    authInstance = getAuth(app);
  }
} catch {
  // Catch any re-initialization during Fast Refresh / HMR
  authInstance = getAuth(app);
}

export const auth: Auth = authInstance;
