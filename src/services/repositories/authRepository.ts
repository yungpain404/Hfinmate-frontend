import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, AuthSession, GoogleLoginPayload } from '../../models/auth.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import { storageService } from '../storage/storageService';
import {
  setCurrentAccount,
  getCurrentAccountEmail,
  scopedKey,
  migrateLegacyKey,
} from '../storage/accountScope';
import { firebaseAuthService } from '../firebase/firebaseAuthService';

import { DEFAULT_GOOGLE_AVATAR_URI } from '../../constants/avatar';

const SESSION_KEY = 'user_session';
const TOKEN_KEY = 'auth_token';
export const STORAGE_KEY_SAVED_ACCOUNTS = 'hfinmate_saved_device_accounts';
export const STORAGE_KEY_LAST_GOOGLE_EMAIL = 'hfinmate_last_google_email';
export const STORAGE_KEY_LAST_GOOGLE_NAME = 'hfinmate_last_google_name';
export const STORAGE_KEY_LAST_GOOGLE_AVATAR = 'hfinmate_last_google_avatar';

const TX_KEY = 'transactions_data';
const FIXED_KEY = 'fixed_expenses_data';
const BUDGET_KEY = 'budget_goals_data';
const DAILY_DATES_KEY = 'daily_recorded_sheet_dates';
const dailySheetKey = (date: string) => `daily_expense_sheet_${date}`;

export interface IAuthRepository {
  getCurrentUser(): Promise<User | null>;
  login(credentials: LoginCredentials): Promise<AuthSession>;
  loginWithGoogle(payload?: GoogleLoginPayload): Promise<AuthSession>;
  loginWithAnotherGoogleAccount(): Promise<AuthSession>;
  logout(): Promise<void>;
  updateUser(updates: Partial<User>): Promise<User>;
}

interface UserDataBundle {
  user: User | null;
  transactions?: any[];
  dailySheets?: Record<string, any>;
  fixedExpenses?: any;
  budgetGoals?: any[];
}

class AuthRepository implements IAuthRepository {
  private async persistSession(session: AuthSession): Promise<void> {
    await setCurrentAccount(session.user.email);
    await storageService.setItem(SESSION_KEY, session);
    await storageService.setItem(TOKEN_KEY, session.token);
    await this.rememberDeviceAccount(session.user);
  }

  private async rememberDeviceAccount(user: User): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY_LAST_GOOGLE_EMAIL, user.email),
        AsyncStorage.setItem(STORAGE_KEY_LAST_GOOGLE_NAME, user.name),
        AsyncStorage.setItem(
          STORAGE_KEY_LAST_GOOGLE_AVATAR,
          user.avatarUrl || DEFAULT_GOOGLE_AVATAR_URI
        ),
      ]);

      const rawAccounts = await AsyncStorage.getItem(STORAGE_KEY_SAVED_ACCOUNTS);
      let savedList: any[] = [];
      if (rawAccounts) {
        try {
          savedList = JSON.parse(rawAccounts);
        } catch {
          savedList = [];
        }
      }
      const newAccItem = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || DEFAULT_GOOGLE_AVATAR_URI,
      };
      const updatedList = [
        newAccItem,
        ...savedList.filter(
          (a) => a?.email && a.email.toLowerCase() !== user.email.toLowerCase()
        ),
      ];
      await AsyncStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, JSON.stringify(updatedList));
    } catch (persistErr) {
      console.warn('[AuthRepository] Persisting account warning:', persistErr);
    }
  }

  /**
   * Push local per-account cache to backend, then hydrate local cache
   * from the merged account bundle. This is what makes reinstall /
   * multi-device logins restore the same Google-account data.
   */
  private async syncAccountData(): Promise<void> {
    const email = await getCurrentAccountEmail();
    if (!email) return;
    try {
      // Migrate legacy global keys into this account scope first
      const [txs, fixed, budgets, dates] = await Promise.all([
        migrateLegacyKey<any[]>(TX_KEY),
        migrateLegacyKey<any>(FIXED_KEY),
        migrateLegacyKey<any[]>(BUDGET_KEY),
        migrateLegacyKey<string[]>(DAILY_DATES_KEY),
      ]);

      const dailySheets: Record<string, any> = {};
      if (dates && Array.isArray(dates)) {
        for (const d of dates) {
          const sheet =
            (await storageService.getItem<any>(scopedKey(dailySheetKey(d), email))) ||
            (await storageService.getItem<any>(dailySheetKey(d)));
          if (sheet) {
            dailySheets[d] = sheet;
            // ensure scoped copy exists
            await storageService.setItem(scopedKey(dailySheetKey(d), email), sheet);
          }
        }
      }

      await apiClient.post<ApiResponse<UserDataBundle>>('/auth/sync', {
        transactions: txs || [],
        dailySheets,
        fixedExpenses: fixed,
      });
    } catch (err) {
      console.warn('[AuthRepository] Push local data warning:', err);
    }

    await this.restoreAccountData();
  }

  /** Pull canonical account bundle and overwrite per-account local cache. */
  private async restoreAccountData(): Promise<void> {
    const email = await getCurrentAccountEmail();
    if (!email) return;
    try {
      const response = await apiClient.get<ApiResponse<UserDataBundle>>('/auth/data');
      const bundle = response.data?.data;
      if (!bundle) return;

      if (Array.isArray(bundle.transactions)) {
        await storageService.setItem(scopedKey(TX_KEY, email), bundle.transactions);
      }
      if (bundle.dailySheets && typeof bundle.dailySheets === 'object') {
        const dates = Object.keys(bundle.dailySheets);
        await storageService.setItem(scopedKey(DAILY_DATES_KEY, email), dates);
        for (const [date, sheet] of Object.entries(bundle.dailySheets)) {
          await storageService.setItem(scopedKey(dailySheetKey(date), email), sheet);
        }
      }
      if (bundle.fixedExpenses && typeof bundle.fixedExpenses === 'object') {
        await storageService.setItem(scopedKey(FIXED_KEY, email), bundle.fixedExpenses);
      }
      if (Array.isArray(bundle.budgetGoals)) {
        await storageService.setItem(scopedKey(BUDGET_KEY, email), bundle.budgetGoals);
      }
      if (bundle.user) {
        const session = await storageService.getItem<AuthSession>(SESSION_KEY);
        if (session) {
          await storageService.setItem(SESSION_KEY, { ...session, user: bundle.user });
        }
      }
    } catch (err) {
      console.warn('[AuthRepository] Restore account data warning:', err);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me');
      if (response.data && response.data.data) {
        const user = response.data.data;
        if (user?.email) {
          await setCurrentAccount(user.email);
          const currentSession = await storageService.getItem<AuthSession>(SESSION_KEY);
          if (currentSession) {
            await storageService.setItem(SESSION_KEY, { ...currentSession, user });
          }
          // Pull latest account data in background (awaited here so
          // fresh installs immediately show synced data).
          await this.restoreAccountData();
        }
        return user;
      }
    } catch {
      // Backend not reached or offline, fallback to local session
    }

    const session = await storageService.getItem<AuthSession>(SESSION_KEY);
    if (!session || !session.user?.email) {
      if (session) {
        await storageService.removeItem(SESSION_KEY);
        await storageService.removeItem(TOKEN_KEY);
      }
      return null;
    }
    await setCurrentAccount(session.user.email);
    return session.user;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    try {
      const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/login', credentials);
      if (response.data && response.data.data) {
        const session = response.data.data;
        await this.persistSession(session);
        await this.syncAccountData();
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

    await this.persistSession(session);
    return session;
  }

  async loginWithGoogle(payload?: GoogleLoginPayload): Promise<AuthSession> {
    if (!payload?.email || !payload.email.trim()) {
      return this.loginWithAnotherGoogleAccount();
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

    // Scope local cache to this Google account BEFORE any backend call,
    // so every repository reads/writes the per-account keys.
    await setCurrentAccount(creds.email);

    // 2. Synchronize with Backend (POST /v1/auth/google) — account is the key
    try {
      const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/google', creds);
      if (response.data && response.data.data) {
        const session = response.data.data;
        await this.persistSession(session);
        // Push unsynced local data then pull canonical account bundle
        await this.syncAccountData();
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

    await this.persistSession(session);

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
    // Keep per-account cached data on device for fast account switching;
    // only the active session is cleared. Reinstall (AsyncStorage wipe)
    // still restores from backend via /auth/data on next Google login.
    await setCurrentAccount(null);
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
