import { useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';
import { DEFAULT_GOOGLE_AVATAR_URI } from '../constants/avatar';
import { firebaseAuthService } from '../services/firebase/firebaseAuthService';

const STORAGE_KEY_SAVED_ACCOUNTS = 'hfinmate_saved_device_accounts';
const STORAGE_KEY_LAST_GOOGLE_EMAIL = 'hfinmate_last_google_email';
const STORAGE_KEY_LAST_GOOGLE_NAME = 'hfinmate_last_google_name';
const STORAGE_KEY_LAST_GOOGLE_AVATAR = 'hfinmate_last_google_avatar';

export interface UseGoogleAuthSessionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useGoogleAuthSession(options?: UseGoogleAuthSessionOptions) {
  const { loginWithGoogle, loginWithAnotherGoogleAccount } = useAuthViewModel();
  const [submitting, setSubmitting] = useState(false);

  const promptAsync = async () => {
    try {
      setSubmitting(true);
      const profile = await firebaseAuthService.signInWithAnotherGoogleAccount();
      if (profile && profile.email) {
        const ok = await loginWithGoogle({
          email: profile.email,
          name: profile.displayName,
          avatarUrl: profile.photoURL || DEFAULT_GOOGLE_AVATAR_URI,
          idToken: profile.idToken,
        });

        if (ok) {
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEY_LAST_GOOGLE_EMAIL, profile.email),
            AsyncStorage.setItem(STORAGE_KEY_LAST_GOOGLE_NAME, profile.displayName),
            AsyncStorage.setItem(
              STORAGE_KEY_LAST_GOOGLE_AVATAR,
              profile.photoURL || DEFAULT_GOOGLE_AVATAR_URI
            ),
          ]);
          options?.onSuccess?.();
          return { type: 'success' };
        }
      }
      return { type: 'dismiss' };
    } catch (err: any) {
      if (
        err.message?.includes('hủy') ||
        err.message?.includes('cancel') ||
        err.message?.includes('dismiss')
      ) {
        return { type: 'cancel' };
      }
      options?.onError?.(err);
      return { type: 'error', error: err };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    promptAsync,
  };
}
