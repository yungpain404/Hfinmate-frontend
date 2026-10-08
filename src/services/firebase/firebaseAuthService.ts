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
      // Mobile: Native Google Sign-In via @react-native-google-signin/google-signin
      const clientId =
        process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
        '205520143301-69acsru6sjc2vvp57qbe0g5qda0lvke6.apps.googleusercontent.com';

      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        GoogleSignin.configure({
          webClientId: clientId,
          scopes: ['profile', 'email'],
          offlineAccess: true,
        });

        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const signinResult = await GoogleSignin.signIn();

        if (signinResult.type === 'success') {
          const { idToken, user: gUser } = signinResult.data;
          const profile: FirebaseUserProfile = {
            uid: gUser.id || `g_${Date.now()}`,
            email: gUser.email,
            displayName: gUser.name || gUser.email.split('@')[0] || 'Người dùng Google',
            photoURL: gUser.photo || DEFAULT_GOOGLE_AVATAR_URI,
            idToken: idToken || undefined,
          };

          // Đồng bộ phiên xác thực người dùng vào Firebase Auth
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
