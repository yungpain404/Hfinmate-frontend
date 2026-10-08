import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from '../config/firebase';

/**
 * Maps Firebase Auth error codes to user-friendly Vietnamese messages
 */
export function mapFirebaseAuthError(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Tài khoản không tồn tại trong hệ thống.';
    case 'auth/wrong-password':
      return 'Mật khẩu không chính xác.';
    case 'auth/invalid-credential':
      return 'Thông tin đăng nhập không chính xác hoặc đã hết hạn.';
    case 'auth/too-many-requests':
      return 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau ít phút.';
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký cho một tài khoản khác.';
    case 'auth/invalid-email':
      return 'Địa chỉ email không đúng định dạng.';
    case 'auth/user-disabled':
      return 'Tài khoản này hiện đã bị tạm khóa.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu có ít nhất 6 ký tự.';
    case 'auth/popup-closed-by-user':
      return 'Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.';
    case 'auth/cancelled-popup-request':
      return 'Yêu cầu đăng nhập Google đã bị hủy.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet.';
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập này chưa được kích hoạt trên Firebase Console.';
    default:
      return 'Đã có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.';
  }
}

export interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<FirebaseUser>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<FirebaseUser>;
  signInWithGoogle: () => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Monitor Firebase Auth state change with Modular onAuthStateChanged
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setLoading(false);
      },
      (err: any) => {
        setError(mapFirebaseAuthError(err?.code || ''));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  /**
   * Đăng nhập bằng Email & Mật khẩu
   */
  const signInWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      setCurrentUser(userCredential.user);
      return userCredential.user;
    } catch (err: any) {
      const friendlyMessage = mapFirebaseAuthError(err.code || '');
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đăng ký tài khoản mới bằng Email & Mật khẩu
   */
  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<FirebaseUser> => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      if (displayName?.trim()) {
        await updateProfile(user, { displayName: displayName.trim() });
      }

      setCurrentUser(user);
      return user;
    } catch (err: any) {
      const friendlyMessage = mapFirebaseAuthError(err.code || '');
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đăng nhập bằng Google OAuth (Modular SDK)
   */
  const signInWithGoogle = async (): Promise<FirebaseUser> => {
    try {
      setLoading(true);
      setError(null);

      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        setCurrentUser(result.user);
        return result.user;
      } else {
        // Native / Expo mobile environment fallback
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        setCurrentUser(result.user);
        return result.user;
      }
    } catch (err: any) {
      const friendlyMessage = mapFirebaseAuthError(err.code || '');
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đăng xuất khỏi Firebase Auth
   */
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setError(null);
    } catch (err: any) {
      const friendlyMessage = mapFirebaseAuthError(err.code || '');
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom Hook: useAuth
 * Access Firebase Auth context anywhere in the application
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
};
