import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';
import { UserAvatar } from './UserAvatar';
import { GoogleAccountItem } from './GoogleAccountPickerModal';
import {
  STORAGE_KEY_SAVED_ACCOUNTS,
  STORAGE_KEY_LAST_GOOGLE_EMAIL,
  STORAGE_KEY_LAST_GOOGLE_NAME,
  STORAGE_KEY_LAST_GOOGLE_AVATAR,
} from '../services/repositories/authRepository';

interface GoogleAuthBottomSheetProps {
  visible: boolean;
  isMandatory?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

// Official Google Multi-Color "G" Icon
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <Path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <Path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12c0 2.03.45 3.84 1.25 5.42l4.03-3.15z"
    />
    <Path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </Svg>
);

export const GoogleAuthBottomSheet: React.FC<GoogleAuthBottomSheetProps> = ({
  visible,
  isMandatory = true,
  onSuccess,
  onClose,
}) => {
  const { loginWithGoogle, loginWithAnotherGoogleAccount, hideGoogleModal, isLoading } =
    useAuthViewModel();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<GoogleAccountItem[]>([]);

  // Tải danh sách tài khoản Google đã lưu trên thiết bị
  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(STORAGE_KEY_SAVED_ACCOUNTS)
        .then(async (raw) => {
          let list: GoogleAccountItem[] = [];
          if (raw) {
            try {
              list = JSON.parse(raw);
            } catch {
              list = [];
            }
          }

          if (list.length === 0) {
            const [lastEmail, lastName, lastAvatar] = await Promise.all([
              AsyncStorage.getItem(STORAGE_KEY_LAST_GOOGLE_EMAIL),
              AsyncStorage.getItem(STORAGE_KEY_LAST_GOOGLE_NAME),
              AsyncStorage.getItem(STORAGE_KEY_LAST_GOOGLE_AVATAR),
            ]);

            if (lastEmail && lastEmail.trim().length > 0) {
              const savedAcc: GoogleAccountItem = {
                id: `acc_${Date.now()}`,
                name: lastName?.trim() || lastEmail.split('@')[0],
                email: lastEmail.trim(),
                avatarUrl: lastAvatar || undefined,
              };
              list = [savedAcc];
              await AsyncStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, JSON.stringify(list));
            }
          }

          setAccounts(list);
        })
        .catch((err) => {
          console.warn('[GoogleAuthBottomSheet] Load accounts error:', err);
        });
    }
  }, [visible]);

  // Xóa tài khoản khỏi danh sách thiết bị
  const handleRemoveAccount = async (emailToRemove: string) => {
    const updated = accounts.filter(
      (a) => a.email.toLowerCase() !== emailToRemove.toLowerCase()
    );
    setAccounts(updated);
    await AsyncStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, JSON.stringify(updated));

    const lastEmail = await AsyncStorage.getItem(STORAGE_KEY_LAST_GOOGLE_EMAIL);
    if (lastEmail?.toLowerCase() === emailToRemove.toLowerCase()) {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEY_LAST_GOOGLE_EMAIL),
        AsyncStorage.removeItem(STORAGE_KEY_LAST_GOOGLE_NAME),
        AsyncStorage.removeItem(STORAGE_KEY_LAST_GOOGLE_AVATAR),
      ]);
    }
  };

  // Chọn tài khoản đã lưu (1-chạm đăng nhập ngay)
  const handleSelectSavedAccount = async (account: GoogleAccountItem) => {
    try {
      setSubmitting(true);
      const ok = await loginWithGoogle({
        email: account.email,
        name: account.name,
        avatarUrl: account.avatarUrl,
      });
      if (ok) {
        hideGoogleModal();
        onSuccess?.();
      }
    } catch (err: any) {
      Alert.alert(
        'Đăng nhập Google',
        err.message || 'Không thể đăng nhập bằng tài khoản này. Vui lòng thử lại.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Đăng nhập tài khoản Google qua OAuth
  const handleSignInWithGoogle = async () => {
    try {
      setSubmitting(true);
      const ok = await loginWithAnotherGoogleAccount();
      if (ok) {
        hideGoogleModal();
        onSuccess?.();
      }
    } catch (err: any) {
      if (
        err.message?.includes('hủy') ||
        err.message?.includes('cancel') ||
        err.message?.includes('dismiss') ||
        err.code === 'SIGN_IN_CANCELLED'
      ) {
        return;
      }

      Alert.alert(
        'Đăng nhập Google',
        err.message || 'Không thể kết nối đến dịch vụ xác thực Google.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropPress = () => {
    if (isMandatory) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập bằng Google để kích hoạt tính năng đồng bộ và bắt đầu sử dụng HFinmate.',
        [{ text: 'Đã hiểu', style: 'default' }]
      );
    } else {
      onClose?.();
    }
  };

  const isBusy = isLoading || submitting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleBackdropPress}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Google Header Logo */}
              <View style={styles.logoCircle}>
                <GoogleIcon size={34} />
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.title}>Đăng nhập bằng Google</Text>
              <Text style={styles.subtitle}>
                {accounts.length > 0
                  ? 'Chọn tài khoản để tiếp tục tới HFinmate'
                  : 'Đồng bộ hóa an toàn dữ liệu sổ thu chi HFinmate của bạn trên mọi thiết bị.'}
              </Text>

              {/* Danh sách tài khoản đã có trên thiết bị */}
              {accounts.length > 0 ? (
                <View style={styles.accountListBox}>
                  {accounts.map((acc, index) => (
                    <TouchableOpacity
                      key={acc.id || acc.email || `acc_${index}`}
                      style={styles.accountItemRow}
                      activeOpacity={0.7}
                      disabled={isBusy}
                      onPress={() => handleSelectSavedAccount(acc)}
                    >
                      <UserAvatar
                        avatarUrl={acc.avatarUrl}
                        name={acc.name}
                        email={acc.email}
                        size={40}
                      />
                      <View style={styles.accountTextCol}>
                        <Text style={styles.accountName} numberOfLines={1}>
                          {acc.name}
                        </Text>
                        <Text style={styles.accountEmail} numberOfLines={1}>
                          {acc.email}
                        </Text>
                      </View>
                      <TouchableOpacity
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={styles.removeBtn}
                        disabled={isBusy}
                        onPress={() => {
                          Alert.alert(
                            'Xóa tài khoản',
                            `Bạn có muốn xóa ${acc.email} khỏi thiết bị này?`,
                            [
                              { text: 'Hủy', style: 'cancel' },
                              {
                                text: 'Xóa',
                                style: 'destructive',
                                onPress: () => handleRemoveAccount(acc.email),
                              },
                            ]
                          );
                        }}
                      >
                        <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}

                  {/* Sử dụng một tài khoản khác */}
                  <TouchableOpacity
                    style={styles.anotherAccountRow}
                    activeOpacity={0.7}
                    disabled={isBusy}
                    onPress={handleSignInWithGoogle}
                  >
                    <View style={styles.anotherIconCircle}>
                      <Ionicons name="person-add-outline" size={18} color="#1A73E8" />
                    </View>
                    <Text style={styles.anotherAccountText}>Sử dụng một tài khoản khác</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Nút đăng nhập Google chính thức khi chưa có tài khoản nào */
                <TouchableOpacity
                  style={styles.googleBtn}
                  activeOpacity={0.8}
                  disabled={isBusy}
                  onPress={handleSignInWithGoogle}
                >
                  {isBusy ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#1A73E8" />
                      <Text style={styles.googleBtnText}>Đang xác thực Google...</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.btnIconBox}>
                        <GoogleIcon size={22} />
                      </View>
                      <Text style={styles.googleBtnText}>Tiếp tục với Google</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Loading Indicator nếu đang bận trong trường hợp có account list */}
              {isBusy && accounts.length > 0 && (
                <View style={styles.listLoadingRow}>
                  <ActivityIndicator size="small" color="#1A73E8" />
                  <Text style={styles.listLoadingText}>Đang đăng nhập...</Text>
                </View>
              )}

              {/* Privacy Notice */}
              <Text style={styles.privacyNotice}>
                Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email và ảnh hồ sơ của bạn với{' '}
                <Text style={styles.boldText}>HFinmate</Text>. Trước khi sử dụng ứng dụng này, hãy xem{' '}
                <Text style={styles.linkText}>Chính sách quyền riêng tư</Text>.
              </Text>

              {/* Close Button nếu không bắt buộc */}
              {!isMandatory && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                  disabled={isBusy}
                  onPress={onClose}
                >
                  <Text style={styles.cancelBtnText}>Để sau</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1F1F1F',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#444746',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  accountListBox: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  accountItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
  },
  accountTextCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  accountName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1F2937',
  },
  accountEmail: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  removeBtn: {
    padding: 6,
  },
  anotherAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  anotherIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anotherAccountText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1A73E8',
    marginLeft: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#DADCE0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  btnIconBox: {
    marginRight: 12,
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C4043',
    letterSpacing: 0.1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  listLoadingText: {
    fontSize: 13,
    color: '#1A73E8',
    fontWeight: '600',
  },
  privacyNotice: {
    fontSize: 11.5,
    color: '#5F6368',
    textAlign: 'center',
    lineHeight: 16.5,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  boldText: {
    fontWeight: '700',
    color: '#1F1F1F',
  },
  linkText: {
    color: '#1A73E8',
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
