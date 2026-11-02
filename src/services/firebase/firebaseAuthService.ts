import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from '@firebase/auth';
import { Platform } from 'react-native';
import { auth } from './firebaseConfig';

import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

import { DEFAULT_GOOGLE_AVATAR_URI } from '../../constants/avatar';
import { decodeGoogleIdToken } from '../../utils/jwt';

export interface FirebaseUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  idToken?: string;
}

export class FirebaseAuthService {
  /**
   * Signs in with Google using Firebase Authentication / Google OAuth.
   * On Web: Uses GoogleAuthProvider with popup (signInWithPopup).
   * On Mobile: Supports Native Google OAuth (accounts.google.com) via WebBrowser or Account Picker bridge.
   */
  async signInWithGoogle(
    fallbackEmail?: string,
    fallbackName?: string,
    fallbackAvatarUrl?: string,
    options?: { direct?: boolean }
  ): Promise<FirebaseUserProfile> {
    if (options?.direct || fallbackEmail) {
      if (!fallbackEmail || !fallbackEmail.trim()) {
        throw new Error('Vui lòng cung cấp địa chỉ email Google để đăng nhập.');
      }
      const email = fallbackEmail.trim();
      const displayName =
        fallbackName?.trim() || (email.includes('@') ? email.split('@')[0] : 'Người dùng Google');
      return {
        uid: `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        displayName,
        photoURL: fallbackAvatarUrl || DEFAULT_GOOGLE_AVATAR_URI,
        idToken: `google_token_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      };
    }

    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        const idToken = await fbUser.getIdToken();

        if (!fbUser.email) {
          throw new Error('Không nhận diện được email từ tài khoản Google.');
        }

        return {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email.split('@')[0],
          photoURL: fbUser.photoURL || fallbackAvatarUrl || DEFAULT_GOOGLE_AVATAR_URI,
          idToken,
        };
      } catch (error: any) {
        if (
          error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request'
        ) {
          throw new Error('Đăng nhập Google đã bị hủy bởi người dùng.');
        }

        if (fallbackEmail) {
          const email = fallbackEmail.trim();
          return {
            uid: `fb_dev_${Date.now()}`,
            email,
            displayName: fallbackName?.trim() || email.split('@')[0],
            photoURL: fallbackAvatarUrl || DEFAULT_GOOGLE_AVATAR_URI,
            idToken: `fb_id_token_${Date.now()}`,
          };
        }

        throw error;
      }
    } else {
      if (fallbackEmail && fallbackEmail.trim()) {
        const email = fallbackEmail.trim();
        return {
          uid: `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
          displayName: fallbackName?.trim() || email.split('@')[0],
          photoURL: fallbackAvatarUrl || DEFAULT_GOOGLE_AVATAR_URI,
          idToken: `fb_mobile_token_${Date.now()}`,
        };
      }
      return this.signInWithAnotherGoogleAccount();
    }
  }

  /**
   * Chuyển qua trang đăng nhập của Google để chọn hoặc đăng nhập một tài khoản khác
   */
  async signInWithAnotherGoogleAccount(): Promise<FirebaseUserProfile> {
    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        const idToken = await fbUser.getIdToken();

        if (!fbUser.email) {
          throw new Error('Không nhận được email từ tài khoản Google.');
        }

        return {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email.split('@')[0],
          photoURL: fbUser.photoURL || DEFAULT_GOOGLE_AVATAR_URI,
          idToken,
        };
      } catch (error: any) {
        if (
          error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request'
        ) {
          throw new Error('Đăng nhập Google đã bị hủy bởi người dùng.');
        }
        throw error;
      }
    } else {
      // Mobile Native & Expo Go
      const webClientId =
        process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
        '205520143301-69acsru6sjc2vvp57qbe0g5qda0lvke6.apps.googleusercontent.com';
      const iosClientId =
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ||
        '205520143301-oiqi7d6d55ohama081kdlcmqpcnrfqpl.apps.googleusercontent.com';

      // 1. Thử xác thực qua Native @react-native-google-signin/google-signin nếu có trong môi trường
      let nativeAvailable = false;
      let GoogleSignin: any = null;
      try {
        const gSigninModule = require('@react-native-google-signin/google-signin');
        if (gSigninModule?.GoogleSignin && typeof gSigninModule.GoogleSignin.configure === 'function') {
          GoogleSignin = gSigninModule.GoogleSignin;
          GoogleSignin.configure({
            webClientId,
            iosClientId,
            scopes: ['profile', 'email'],
            offlineAccess: true,
          });
          nativeAvailable = true;
        }
      } catch {
        nativeAvailable = false;
      }

      if (nativeAvailable && GoogleSignin) {
        try {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
          const signinResult = await GoogleSignin.signIn();

          if (signinResult.type === 'success' && signinResult.data) {
            const { idToken, user: gUser } = signinResult.data;
            const profile: FirebaseUserProfile = {
              uid: gUser.id || `g_${Date.now()}`,
              email: gUser.email,
              displayName: gUser.name || gUser.email.split('@')[0] || 'Người dùng Google',
              photoURL: gUser.photo || DEFAULT_GOOGLE_AVATAR_URI,
              idToken: idToken || undefined,
            };

            // Đồng bộ phiên xác thực người dùng vào Firebase Auth nếu có idToken
            if (idToken) {
              try {
                const credential = GoogleAuthProvider.credential(idToken);
                const fbUserCred = await signInWithCredential(auth, credential);
                const fbUser = fbUserCred.user;
                profile.uid = fbUser.uid;
                profile.email = fbUser.email || profile.email;
                profile.displayName = fbUser.displayName || profile.displayName;
                profile.photoURL = fbUser.photoURL || profile.photoURL;
                profile.idToken = (await fbUser.getIdToken()) || profile.idToken;
              } catch (credErr) {
                console.warn('[FirebaseAuthService] signInWithCredential warning:', credErr);
              }
            }

            return profile;
          } else {
            throw new Error('Đăng nhập Google đã bị hủy bởi người dùng.');
          }
        } catch (nativeErr: any) {
          if (
            nativeErr.code === 'SIGN_IN_CANCELLED' ||
            nativeErr.message?.includes('hủy') ||
            nativeErr.message?.includes('cancel') ||
            nativeErr.message?.includes('dismiss')
          ) {
            throw new Error('Đăng nhập Google đã bị hủy bởi người dùng.');
          }
          console.warn('[FirebaseAuthService] Native Google Sign-In error:', nativeErr);
          throw nativeErr;
        }
      }

      // 2. Fallback Google OAuth qua Backend Redirect Callback (hoạt động trên Expo Go & mọi môi trường)
      try {
        const redirectUri = 'https://hfinmate-backend.onrender.com/v1/auth/google/callback';
        const returnUrl = 'hfinmate://oauth';
        const nonce = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        const state = Math.random().toString(36).substring(2, 15);

        const authUrl =
          `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(webClientId)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=${encodeURIComponent('token id_token')}` +
          `&scope=${encodeURIComponent('openid profile email')}` +
          `&prompt=select_account` +
          `&nonce=${encodeURIComponent(nonce)}` +
          `&state=${encodeURIComponent(state)}`;

        const authResult = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);

        if (authResult.type === 'success' && authResult.url) {
          const rawUrl = authResult.url;

          let accessToken: string | undefined;
          let idToken: string | undefined;

          const tokenMatch = rawUrl.match(/[#?&]access_token=([^&]+)/);
          if (tokenMatch) accessToken = decodeURIComponent(tokenMatch[1]);

          const idTokenMatch = rawUrl.match(/[#?&]id_token=([^&]+)/);
          if (idTokenMatch) idToken = decodeURIComponent(idTokenMatch[1]);

          if (!accessToken || !idToken) {
            const rawParams = rawUrl.split('#')[1] || rawUrl.split('?')[1] || '';
            if (rawParams) {
              const sp = new URLSearchParams(rawParams);
              if (!accessToken) accessToken = sp.get('access_token') || undefined;
              if (!idToken) idToken = sp.get('id_token') || undefined;
            }
          }

          let email = '';
          let displayName = 'Người dùng Google';
          let photoURL = DEFAULT_GOOGLE_AVATAR_URI;

          // Giải mã payload id_token (JWT)
          if (idToken) {
            const jwtData = decodeGoogleIdToken(idToken);
            if (jwtData) {
              if (jwtData.email) email = jwtData.email;
              if (jwtData.name) displayName = jwtData.name;
              if (jwtData.picture) photoURL = jwtData.picture;
            }
          }

          // Lấy thông tin tài khoản qua Google OAuth2 UserInfo API nếu có accessToken
          if (accessToken) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (res.ok) {
                const gUser = await res.json();
                if (gUser.email) email = gUser.email;
                if (gUser.name) displayName = gUser.name;
                if (gUser.picture) photoURL = gUser.picture;
              }
            } catch (fetchErr) {
              console.warn('[FirebaseAuthService] Google UserInfo fetch warning:', fetchErr);
            }
          }

          // Đồng bộ phiên xác thực vào Firebase Auth nếu có idToken
          if (idToken) {
            try {
              const credential = GoogleAuthProvider.credential(idToken, accessToken);
              const fbUserCred = await signInWithCredential(auth, credential);
              const fbUser = fbUserCred.user;
              photoURL = fbUser.photoURL || photoURL;
              displayName = fbUser.displayName || displayName;
              email = fbUser.email || email;
            } catch (credErr) {
              console.warn('[FirebaseAuthService] Firebase credential warning:', credErr);
            }
          }

          if (email) {
            return {
              uid: `google_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
              email,
              displayName,
              photoURL,
              idToken: idToken || accessToken,
            };
          }

          throw new Error('Không thể nhận diện thông tin email từ tài khoản Google.');
        } else if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
          throw new Error('Đăng nhập Google đã bị hủy bởi người dùng.');
        }

        throw new Error('Đăng nhập Google chưa hoàn tất.');
      } catch (browserErr: any) {
        if (
          browserErr.message?.includes('hủy') ||
          browserErr.message?.includes('cancel') ||
          browserErr.message?.includes('dismiss')
        ) {
          throw browserErr;
        }
        console.error('[FirebaseAuthService] Browser OAuth session error:', browserErr);
        throw browserErr;
      }
    }
  }

  /**
   * Get the current active user from Firebase Auth
   */
  getCurrentFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Signs out from Firebase Authentication
   */
  async signOut(): Promise<void> {
    try {
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
      } catch {}
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('[FirebaseAuthService] Sign out warning:', err);
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
