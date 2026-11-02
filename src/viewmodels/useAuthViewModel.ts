import { create } from 'zustand';
import { User, LoginCredentials, GoogleLoginPayload } from '../models/auth.model';
import { authRepository } from '../services/repositories/authRepository';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGoogleModalVisible: boolean;
  isLoading: boolean;
  error: string | null;
  initAuth: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginWithGoogle: (payload?: GoogleLoginPayload) => Promise<boolean>;
  loginWithAnotherGoogleAccount: () => Promise<boolean>;
  logout: () => Promise<void>;
  showGoogleModal: () => void;
  hideGoogleModal: () => void;
  clearError: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isGoogleModalVisible: false,
  isLoading: true,
  error: null,

  initAuth: async () => {
    try {
      set({ error: null });
      const user = await authRepository.getCurrentUser();
      const isAuth = !!user;
      set({
        user,
        isAuthenticated: isAuth,
        isGoogleModalVisible: !isAuth,
        isLoading: false,
      });
    } catch (err) {
      set({
        user: null,
        isAuthenticated: false,
        isGoogleModalVisible: true,
        isLoading: false,
        error: (err as Error).message || 'Không thể khôi phục phiên đăng nhập',
      });
    }
  },

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });
      const session = await authRepository.login(credentials);
      set({
        user: session.user,
        isAuthenticated: true,
        isGoogleModalVisible: false,
        isLoading: false,
      });
      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: (err as Error).message || 'Đăng nhập không thành công',
      });
      return false;
    }
  },

  loginWithGoogle: async (payload?: GoogleLoginPayload) => {
    try {
      set({ isLoading: true, error: null });
      const session = await authRepository.loginWithGoogle(payload);
      set({
        user: session.user,
        isAuthenticated: true,
        isGoogleModalVisible: false,
        isLoading: false,
      });
      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: (err as Error).message || 'Đăng nhập Google không thành công',
      });
      return false;
    }
  },

  loginWithAnotherGoogleAccount: async () => {
    try {
      set({ isLoading: true, error: null });
      const session = await authRepository.loginWithAnotherGoogleAccount();
      set({
        user: session.user,
        isAuthenticated: true,
        isGoogleModalVisible: false,
        isLoading: false,
      });
      return true;
    } catch (err) {
      set({
        isLoading: false,
        error: (err as Error).message || 'Đăng nhập Google không thành công',
      });
      return false;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authRepository.logout();
      set({
        user: null,
        isAuthenticated: false,
        isGoogleModalVisible: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: (err as Error).message || 'Lỗi khi đăng xuất',
      });
    }
  },

  showGoogleModal: () => set({ isGoogleModalVisible: true }),
  hideGoogleModal: () => set({ isGoogleModalVisible: false }),
  clearError: () => set({ error: null }),
}));

/**
 * ViewModel: useAuthViewModel
 * Decouples authentication logic and state from View components.
 */
export function useAuthViewModel() {
  const store = useAuthStore();

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isGoogleModalVisible: store.isGoogleModalVisible,
    isLoading: store.isLoading,
    error: store.error,
    initAuth: store.initAuth,
    login: store.login,
    loginWithGoogle: store.loginWithGoogle,
    loginWithAnotherGoogleAccount: store.loginWithAnotherGoogleAccount,
    logout: store.logout,
    showGoogleModal: store.showGoogleModal,
    hideGoogleModal: store.hideGoogleModal,
    clearError: store.clearError,
  };
}
