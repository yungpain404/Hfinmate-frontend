import { User, LoginCredentials, AuthSession, GoogleLoginPayload } from '../../models/auth.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import { storageService } from '../storage/storageService';
import { firebaseAuthService } from '../firebase/firebaseAuthService';
import { INITIAL_USER } from '../mock/mockData';

const SESSION_KEY = 'user_session';
const TOKEN_KEY = 'auth_token';

export interface IAuthRepository {
  getCurrentUser(): Promise<User | null>;
  login(credentials: LoginCredentials): Promise<AuthSession>;
  loginWithGoogle(payload?: GoogleLoginPayload): Promise<AuthSession>;
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
    if (!session) {
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
        ...INITIAL_USER,
        email: credentials.email,
      },
    };

    await storageService.setItem(SESSION_KEY, session);
    await storageService.setItem(TOKEN_KEY, session.token);
    return session;
  }

  async loginWithGoogle(payload?: GoogleLoginPayload): Promise<AuthSession> {
    // 1. First authenticate with Firebase Google Auth
    let fbProfile = {
      email: payload?.email || 'user.google@gmail.com',
      displayName: payload?.name || 'Người dùng Google',
      photoURL: payload?.avatarUrl,
      idToken: payload?.idToken,
    };

    try {
      const result = await firebaseAuthService.signInWithGoogle(payload?.email, payload?.name);
      fbProfile = {
        email: result.email || fbProfile.email,
        displayName: result.displayName || fbProfile.displayName,
        photoURL: result.photoURL || fbProfile.photoURL,
        idToken: result.idToken || fbProfile.idToken,
      };
    } catch (fbErr: any) {
      // Re-throw if user explicitly cancelled the login popup
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
    } catch {
      // Fallback offline session
    }

    // 3. Fallback offline session with Firebase credentials
    const session: AuthSession = {
      token: creds.idToken || `token_google_${Date.now()}`,
      user: {
        id: `usr_google_${Date.now()}`,
        name: creds.name || 'Người dùng Google',
        email: creds.email || 'user.google@gmail.com',
        avatarUrl: creds.avatarUrl,
        preferredCurrency: 'VND',
      },
    };

    await storageService.setItem(SESSION_KEY, session);
    await storageService.setItem(TOKEN_KEY, session.token);
    return session;
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
    const currentUser = session?.user || INITIAL_USER;
    const updatedUser: User = { ...currentUser, ...updates };

    await storageService.setItem(SESSION_KEY, {
      token: session?.token || 'mock_token',
      user: updatedUser,
    });

    return updatedUser;
  }
}

export const authRepository: IAuthRepository = new AuthRepository();
