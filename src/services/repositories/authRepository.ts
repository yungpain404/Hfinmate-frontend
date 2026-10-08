import { User, LoginCredentials, AuthSession, GoogleLoginPayload } from '../../models/auth.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import { storageService } from '../storage/storageService';
import { firebaseAuthService } from '../firebase/firebaseAuthService';

import { DEFAULT_GOOGLE_AVATAR_URI } from '../../constants/avatar';

const SESSION_KEY = 'user_session';
const TOKEN_KEY = 'auth_token';

export interface IAuthRepository {
  getCurrentUser(): Promise<User | null>;
  login(credentials: LoginCredentials): Promise<AuthSession>;
  loginWithGoogle(payload?: GoogleLoginPayload): Promise<AuthSession>;
  loginWithAnotherGoogleAccount(): Promise<AuthSession>;
  logout(): Promise<void>;
  updateUser(updates: Partial<User>): Promise<User>;
}

class AuthRepository implements IAuthRepository {
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me');
      if (response.data && response.data.data) {
        const user = response.data.data;
        const currentSession = await storageService.getItem<AuthSession>(SESSION_KEY);
        if (currentSession) {
          await storageService.setItem(SESSION_KEY, { ...currentSession, user });
        }
        return user;
      }
    } catch {
      // Backend not reached or offline, fallback to local session
    }

    const session = await storageService.getItem<AuthSession>(SESSION_KEY);
    if (
      !session ||
      !session.user?.email ||
      session.user.email.toLowerCase().includes('nguyenngochau092@gmail.com')
    ) {
      if (session) {
        await storageService.removeItem(SESSION_KEY);
        await storageService.removeItem(TOKEN_KEY);
      }
      return null;
    }
    return session.user;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    try {
      const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/login', credentials);
      if (response.data && response.data.data) {
        const session = response.data.data;
        await storageService.setItem(SESSION_KEY, session);
        await storageService.setItem(TOKEN_KEY, session.token);
        return session;
      }
    } catch {
      // Fallback offline session
    }

    const session: AuthSession = {
      token: `token_${Date.now()}`,
      user: {
        id: `usr_${Date.now()}`,
        name: credentials.email.split('@')[0],
        email: credentials.email,
        preferredCurrency: 'VND',
      },
    };

    await storageService.setItem(SESSION_KEY, session);
    await storageService.setItem(TOKEN_KEY, session.token);
    return session;
  }

  async loginWithGoogle(payload?: GoogleLoginPayload): Promise<AuthSession> {
    if (!payload?.email || !payload.email.trim()) {
      throw new Error('Vui lòng cung cấp email tài khoản Google để đăng nhập.');
    }

    const targetEmail = payload.email.trim();
    const targetName = payload.name?.trim() || targetEmail.split('@')[0];
    const targetAvatar = payload.avatarUrl || DEFAULT_GOOGLE_AVATAR_URI;

    // 1. First authenticate with Firebase Google Auth
    let fbProfile = {
      email: targetEmail,
      displayName: targetName,
      photoURL: targetAvatar,
      idToken: payload?.idToken,
    };

    try {
      const result = await firebaseAuthService.signInWithGoogle(
        targetEmail,
        targetName,
        targetAvatar,
        { direct: true }
      );
      fbProfile = {
        email: result.email || fbProfile.email,
        displayName: result.displayName || fbProfile.displayName,
        photoURL: result.photoURL || fbProfile.photoURL,
        idToken: result.idToken || fbProfile.idToken,
      };
    } catch (fbErr: any) {
      if (fbErr.message?.includes('hủy')) {
        throw fbErr;
      }
      console.warn('[AuthRepository] Firebase sign-in warning:', fbErr.message);
    }

    const creds: GoogleLoginPayload = {
      email: fbProfile.email,
      name: fbProfile.displayName,
      avatarUrl: fbProfile.photoURL,
      idToken: fbProfile.idToken,
    };

    // 2. Synchronize with Backend (POST /v1/auth/google)
    try {
      const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/google', creds);
      if (response.data && response.data.data) {
        const session = response.data.data;
        await storageService.setItem(SESSION_KEY, session);
        await storageService.setItem(TOKEN_KEY, session.token);
        return session;
      }
    } catch (apiErr) {
      console.warn('[AuthRepository] Sync with backend error, fallback local:', apiErr);
    }

    // 3. Fallback offline session with dynamic credentials
    const userEmail = creds.email || targetEmail;
    const session: AuthSession = {
      token: creds.idToken || `token_google_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      user: {
        id: `usr_google_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: creds.name || targetName,
        email: userEmail,
        avatarUrl: creds.avatarUrl,
        preferredCurrency: 'VND',
      },
    };

    await storageService.setItem(SESSION_KEY, session);
    await storageService.setItem(TOKEN_KEY, session.token);
    return session;
  }

  async loginWithAnotherGoogleAccount(): Promise<AuthSession> {
    const profile = await firebaseAuthService.signInWithAnotherGoogleAccount();
    return this.loginWithGoogle({
      email: profile.email,
      name: profile.displayName,
      avatarUrl: profile.photoURL,
      idToken: profile.idToken,
    });
  }

  async logout(): Promise<void> {
    try {
      await firebaseAuthService.signOut();
    } catch {
      // Ignore Firebase signOut error
    }
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
    await storageService.removeItem(SESSION_KEY);
    await storageService.removeItem(TOKEN_KEY);
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>('/auth/me', updates);
      if (response.data && response.data.data) {
        const updated = response.data.data;
        const session = await storageService.getItem<AuthSession>(SESSION_KEY);
        if (session) {
          await storageService.setItem(SESSION_KEY, { ...session, user: updated });
        }
        return updated;
      }
    } catch {
      // Fallback
    }

    const session = await storageService.getItem<AuthSession>(SESSION_KEY);
    const currentUser: User = session?.user || {
      id: `usr_${Date.now()}`,
      name: 'Người dùng',
      email: '',
      preferredCurrency: 'VND',
    };
    const updatedUser: User = { ...currentUser, ...updates };

    await storageService.setItem(SESSION_KEY, {
      token: session?.token || 'mock_token',
      user: updatedUser,
    });

    return updatedUser;
  }
}

export const authRepository: IAuthRepository = new AuthRepository();
