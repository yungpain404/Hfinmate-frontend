import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';
import { DEFAULT_GOOGLE_AVATAR_URI } from '../constants/avatar';
import { firebaseAuthService } from '../services/firebase/firebaseAuthService';

WebBrowser.maybeCompleteAuthSession();

export const EXPO_PROXY_REDIRECT_URI = 'https://auth.expo.io/@yungpain404/HFinmate';

const STORAGE_KEY_SAVED_ACCOUNTS = 'hfinmate_saved_device_accounts';
const STORAGE_KEY_LAST_GOOGLE_EMAIL = 'hfinmate_last_google_email';
const STORAGE_KEY_LAST_GOOGLE_NAME = 'hfinmate_last_google_name';
const STORAGE_KEY_LAST_GOOGLE_AVATAR = 'hfinmate_last_google_avatar';

export interface UseGoogleAuthSessionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useGoogleAuthSession(options?: UseGoogleAuthSessionOptions) {
  const { loginWithGoogle } = useAuthViewModel();
  const [submitting, setSubmitting] = useState(false);

  const clientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    '205520143301-69acsru6sjc2vvp57qbe0g5qda0lvke6.apps.googleusercontent.com';

  const redirectUri = makeRedirectUri({
    scheme: 'hfinmate',
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
    redirectUri,
    responseType: ResponseType.IdToken,
    selectAccount: true,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    async function handleResponse() {
      if (!response) return;

      if (response.type === 'success') {
        try {
          setSubmitting(true);
          const { id_token, access_token } = response.params;

          let photoURL = DEFAULT_GOOGLE_AVATAR_URI;
          let displayName = 'Người dùng Google';
          let email = '';

          // 1. Fetch Google UserInfo if access_token is available
          if (access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
                headers: { Authorization: `Bearer ${access_token}` },
              });
              if (res.ok) {
                const info = await res.json();
                photoURL = info.picture || photoURL;
                displayName = info.name || displayName;
                email = info.email || email;
              }
            } catch (err) {
              console.warn('[useGoogleAuthSession] UserInfo warning:', err);
            }
          }

          // 2. Exchange credentials with Firebase Auth
          if (id_token) {
            try {
              const credential = GoogleAuthProvider.credential(id_token, access_token);
              const fbCred = await signInWithCredential(auth, credential);
              const fbUser = fbCred.user;
              photoURL = fbUser.photoURL || photoURL;
              displayName = fbUser.displayName || displayName;
              email = fbUser.email || email;
            } catch (credErr) {
              console.warn('[useGoogleAuthSession] Firebase credential warning:', credErr);
            }
          }

          if (email) {
            const ok = await loginWithGoogle({
              email,
              name: displayName,
              avatarUrl: photoURL,
              idToken: id_token || access_token,
            });

            if (ok) {
              // Save to device storage
              await Promise.all([
                AsyncStorage.setItem(STORAGE_KEY_LAST_GOOGLE_EMAIL, email),
                AsyncStorage.setItem(STORAGE_KEY_LAST_GOOGLE_NAME, displayName),
                AsyncStorage.setItem(STORAGE_KEY_LAST_GOOGLE_AVATAR, photoURL),
              ]);

              // Update saved accounts list
              try {
                const rawList = await AsyncStorage.getItem(STORAGE_KEY_SAVED_ACCOUNTS);
                let list = rawList ? JSON.parse(rawList) : [];
                list = [
                  {
                    id: `acc_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
                    name: displayName,
                    email,
                    avatarUrl: photoURL,
                  },
                  ...list.filter((a: any) => a?.email?.toLowerCase() !== email.toLowerCase()),
                ];
                await AsyncStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, JSON.stringify(list));
              } catch (storageErr) {
                console.warn('[useGoogleAuthSession] Update saved accounts error:', storageErr);
              }

              options?.onSuccess?.();
            }
          }
        } catch (err: any) {
          console.error('[useGoogleAuthSession] Error:', err);
          options?.onError?.(err);
        } finally {
          setSubmitting(false);
        }
      } else if (response.type === 'cancel' || response.type === 'dismiss') {
        setSubmitting(false);
      }
    }

    handleResponse();
  }, [response]);

  const signIn = async () => {
    try {
      setSubmitting(true);
      if (Platform.OS === 'web') {
        const profile = await firebaseAuthService.signInWithAnotherGoogleAccount();
        const ok = await loginWithGoogle({
          email: profile.email,
          name: profile.displayName,
          avatarUrl: profile.photoURL,
          idToken: profile.idToken,
        });
        if (ok) {
          options?.onSuccess?.();
        }
      } else {
        if (request) {
          await promptAsync({ windowFeatures: { width: 515, height: 680 } });
        } else {
          const profile = await firebaseAuthService.signInWithAnotherGoogleAccount();
          const ok = await loginWithGoogle({
            email: profile.email,
            name: profile.displayName,
            avatarUrl: profile.photoURL,
            idToken: profile.idToken,
          });
          if (ok) {
            options?.onSuccess?.();
          }
        }
      }
    } catch (err: any) {
      if (
        err.message?.includes('hủy') ||
        err.message?.includes('cancel') ||
        err.message?.includes('closed') ||
        err.message?.includes('dismiss')
      ) {
        return;
      }
      options?.onError?.(err);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    request,
    response,
    promptAsync,
    signIn,
    submitting,
  };
}
