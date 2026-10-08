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
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';
import { DEFAULT_GOOGLE_AVATAR_URI } from '../constants/avatar';
import { GoogleAccountItem } from './GoogleAccountPickerModal';
import { UserAvatar } from './UserAvatar';

// Complete auth session at top-level
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthBottomSheetProps {
  visible: boolean;
  isMandatory?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

// Official Google Multi-Color "G" Icon
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
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

const STORAGE_KEY_SAVED_ACCOUNTS = 'hfinmate_saved_device_accounts';
const STORAGE_KEY_LAST_GOOGLE_EMAIL = 'hfinmate_last_google_email';
const STORAGE_KEY_LAST_GOOGLE_NAME = 'hfinmate_last_google_name';
const STORAGE_KEY_LAST_GOOGLE_AVATAR = 'hfinmate_last_google_avatar';

export const GoogleAuthBottomSheet: React.FC<GoogleAuthBottomSheetProps> = ({
  visible,
  isMandatory = true,
  onSuccess,
  onClose,
}) => {
  const { loginWithGoogle, loginWithAnotherGoogleAccount, isLoading } = useAuthViewModel();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isPickerVisible, setIsPickerVisible] = useState<boolean>(true);

  // Device Google Accounts list (remembered accounts on device)
  const [accounts, setAccounts] = useState<GoogleAccountItem[]>([]);

  // Google OAuth using useAuthRequest with makeRedirectUri({ scheme: 'hfinmate' })
  const clientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    '205520143301-69acsru6sjc2vvp57qbe0g5qda0lvke6.apps.googleusercontent.com';

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
    redirectUri: makeRedirectUri({
      scheme: 'hfinmate',
    }),
    responseType: ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  });

  // Watch response and exchange credentials with Firebase Auth
  useEffect(() => {
    async function handleAuthResponse() {
      if (response?.type === 'success') {
        try {
          setSubmitting(true);
          const { id_token, access_token } = response.params;

          let photoURL = DEFAULT_GOOGLE_AVATAR_URI;
          let displayName = 'Người dùng Google';
          let email = '';

          // 1. Sign in to Firebase Auth using GoogleAuthProvider.credential(id_token)
          if (id_token) {
            try {
              const credential = GoogleAuthProvider.credential(id_token, access_token);
              const fbUserCred = await signInWithCredential(auth, credential);
              const fbUser = fbUserCred.user;
              photoURL = fbUser.photoURL || photoURL;
              displayName = fbUser.displayName || fbUser.email?.split('@')[0] || displayName;
              email = fbUser.email || '';
            } catch (credErr) {
              console.warn('[GoogleAuthBottomSheet] Firebase credential exchange warning:', credErr);
            }
          }

          // 2. Fetch UserInfo if photoURL or email not yet obtained
          if (access_token && (!email || photoURL === DEFAULT_GOOGLE_AVATAR_URI)) {
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
            } catch (fetchErr) {
              console.warn('[GoogleAuthBottomSheet] UserInfo fetch warning:', fetchErr);
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
              await Promise.all([
                AsyncStorage.setItem(STORAGE_KEY_LAST_GOOGLE_EMAIL, email),
                AsyncStorage.setItem(STORAGE_KEY_LAST_GOOGLE_NAME, displayName),
                AsyncStorage.setItem(STORAGE_KEY_LAST_GOOGLE_AVATAR, photoURL),
              ]);

              const newAcc: GoogleAccountItem = {
                id: `acc_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
                name: displayName,
                email,
                avatarUrl: photoURL,
              };
              const updated = [
                newAcc,
                ...accounts.filter((a) => a.email.toLowerCase() !== email.toLowerCase()),
              ];
              setAccounts(updated);
              await AsyncStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, JSON.stringify(updated));

              setIsPickerVisible(false);
              onSuccess?.();
            }
          }
        } catch (err: any) {
          console.error('[GoogleAuthBottomSheet] Auth response error:', err);
          Alert.alert('Đăng nhập Google', err.message || 'Lỗi khi đồng bộ tài khoản Google.');
        } finally {
          setSubmitting(false);
        }
      } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
        setSubmitting(false);
      }
    }

    handleAuthResponse();
  }, [response]);

  useEffect(() => {
    if (visible) {
      setIsPickerVisible(true);

      // Load remembered accounts from device storage
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

          // Purge any deprecated test accounts from storage
          list = list.filter(
            (acc) =>
              acc &&
              acc.email &&
              !acc.email.toLowerCase().includes('nguyenngochau092@gmail.com')
          );

          if (list.length === 0) {
            const [lastEmail, lastName, lastAvatar] = await Promise.all([
              AsyncStorage.getItem(STORAGE_KEY_LAST_GOOGLE_EMAIL),
              AsyncStorage.getItem(STORAGE_KEY_LAST_GOOGLE_NAME),
              AsyncStorage.getItem(STORAGE_KEY_LAST_GOOGLE_AVATAR),
            ]);

            if (
              lastEmail &&
              lastEmail.toLowerCase().includes('nguyenngochau092@gmail.com')
            ) {
              await Promise.all([
                AsyncStorage.removeItem(STORAGE_KEY_LAST_GOOGLE_EMAIL),
                AsyncStorage.removeItem(STORAGE_KEY_LAST_GOOGLE_NAME),
                AsyncStorage.removeItem(STORAGE_KEY_LAST_GOOGLE_AVATAR),
                AsyncStorage.removeItem(STORAGE_KEY_SAVED_ACCOUNTS),
              ]);
            } else if (lastEmail && lastEmail.trim().length > 0) {
              const savedAcc: GoogleAccountItem = {
                id: `acc_${lastEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
                name: lastName?.trim() || lastEmail.split('@')[0],
                email: lastEmail.trim(),
                avatarUrl: lastAvatar || DEFAULT_GOOGLE_AVATAR_URI,
              };
              list = [savedAcc];
              await AsyncStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, JSON.stringify(list));
            }
          } else {
            await AsyncStorage.setItem(STORAGE_KEY_SAVED_ACCOUNTS, JSON.stringify(list));
          }

          setAccounts(list);
        })
        .catch(() => {
          setAccounts([]);
        });
    }
  }, [visible]);

  // Remove saved account from device
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

  // 1. Single tap on an existing device account
  const handleSelectAccount = async (account: GoogleAccountItem) => {
    try {
      setSubmitting(true);
      const ok = await loginWithGoogle({
        email: account.email,
        name: account.name,
        avatarUrl: account.avatarUrl || DEFAULT_GOOGLE_AVATAR_URI,
      });

      if (ok) {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEY_LAST_GOOGLE_EMAIL, account.email),
          AsyncStorage.setItem(STORAGE_KEY_LAST_GOOGLE_NAME, account.name),
          AsyncStorage.setItem(
            STORAGE_KEY_LAST_GOOGLE_AVATAR,
            account.avatarUrl || DEFAULT_GOOGLE_AVATAR_URI
          ),
        ]);
        setIsPickerVisible(false);
        onSuccess?.();
      } else {
        Alert.alert(
          'Đăng nhập chưa hoàn tất',
          'Không thể kết nối đến máy chủ đồng bộ. Vui lòng kiểm tra mạng và thử lại.'
        );
      }
    } catch (err: any) {
      if (
        err.message?.includes('hủy') ||
        err.message?.includes('cancel') ||
        err.message?.includes('closed')
      ) {
        return;
      }
      Alert.alert(
        'Lỗi đăng nhập',
        err.message || 'Có lỗi xảy ra khi xác thực tài khoản Google.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Trigger native Google Sign-In & system account chooser flow via promptAsync
  const handleTriggerGoogleOAuth = async () => {
    try {
      setSubmitting(true);
      if (Platform.OS === 'web') {
        const ok = await loginWithAnotherGoogleAccount();
        if (ok) {
          setIsPickerVisible(false);
          onSuccess?.();
        }
      } else {
        await promptAsync();
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
      Alert.alert(
        'Đăng nhập Google',
        err.message || 'Chưa thể hoàn tất đăng nhập bằng tài khoản Google.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropPress = () => {
    if (isMandatory) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập tài khoản Google để kích hoạt tính năng đồng bộ thu chi trên điện thoại và máy tính.',
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
        <View style={isPickerVisible ? styles.pickerBackdrop : styles.sheetBackdrop}>
          <TouchableWithoutFeedback>
            {isPickerVisible ? (
              <View style={styles.dialogCard}>
                {/* Google Multi-Color Brand Icon */}
                <View style={styles.logoContainer}>
                  <GoogleIcon size={38} />
                </View>

                {/* Dialog Header */}
                <Text style={styles.dialogTitle}>Đăng nhập bằng Google</Text>
                <Text style={styles.dialogSubtitle}>
                  {accounts.length > 0
                    ? 'Chọn một tài khoản để tiếp tục tới HFinmate'
                    : 'Đồng bộ hóa dữ liệu sổ thu chi HFinmate an toàn trên mọi thiết bị.'}
                </Text>

                {accounts.length > 0 ? (
                  /* Case A: User has saved Google accounts on device (Native Account Chooser List) */
                  <View style={styles.listContainer}>
                    {accounts.map((acc, index) => (
                      <TouchableOpacity
                        key={acc.id || acc.email || `acc-${index}`}
                        style={styles.accountRow}
                        activeOpacity={0.65}
                        disabled={isBusy}
                        onPress={() => handleSelectAccount(acc)}
                      >
                        <UserAvatar
                          avatarUrl={acc.avatarUrl}
                          name={acc.name}
                          email={acc.email}
                          size={44}
                        />

                        <View style={styles.accountInfoCol}>
                          <Text style={styles.accountName} numberOfLines={1}>
                            {acc.name}
                          </Text>
                          <Text style={styles.accountEmail} numberOfLines={1}>
                            {acc.email}
                          </Text>
                        </View>

                        <TouchableOpacity
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                          style={styles.removeAccountBtn}
                          disabled={isBusy}
                          onPress={() => {
                            Alert.alert(
                              'Xóa tài khoản',
                              `Bạn có muốn xóa tài khoản ${acc.email} khỏi thiết bị này?`,
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

                    {/* Option: Add / Use Another Account */}
                    <TouchableOpacity
                      style={styles.anotherAccountRow}
                      activeOpacity={0.65}
                      disabled={isBusy}
                      onPress={handleTriggerGoogleOAuth}
                    >
                      <View style={styles.addAccountIconCircle}>
                        <GoogleIcon size={20} />
                      </View>
                      <Text style={styles.anotherAccountText}>
                        Sử dụng một tài khoản khác
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Case B: First-time sign in or no device accounts (Official Sign In with Google Button) */
                  <View style={styles.nativeButtonContainer}>
                    <TouchableOpacity
                      style={styles.officialGoogleBtn}
                      activeOpacity={0.8}
                      disabled={isBusy}
                      onPress={handleTriggerGoogleOAuth}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color="#1A73E8" />
                      ) : (
                        <>
                          <View style={styles.btnIconBox}>
                            <GoogleIcon size={22} />
                          </View>
                          <Text style={styles.officialGoogleBtnText}>
                            Tiếp tục với Google
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Official Google OAuth Privacy Disclaimer */}
                <Text style={styles.privacyText}>
                  Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email và ảnh hồ sơ của bạn với{' '}
                  <Text style={styles.boldText}>HFinmate</Text>. Trước khi sử dụng ứng dụng này, hãy xem{' '}
                  <Text style={styles.linkText}>Chính sách quyền riêng tư</Text>.
                </Text>

                {/* Loading status or Dismiss button */}
                {isBusy ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#1A73E8" />
                    <Text style={styles.loadingText}>Đang kết nối tài khoản Google...</Text>
                  </View>
                ) : !isMandatory ? (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    activeOpacity={0.65}
                    onPress={() => {
                      setIsPickerVisible(false);
                      onClose?.();
                    }}
                  >
                    <Text style={styles.cancelText}>Đóng</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              /* Bottom Bar when modal is minimized */
              <View style={styles.sheetContainer}>
                <View style={styles.dragBar} />

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.googleActionBtn}
                  onPress={handleTriggerGoogleOAuth}
                  disabled={isBusy}
                >
                  <View style={styles.googleIconBox}>
                    <GoogleIcon size={20} />
                  </View>
                  <Text style={styles.googleActionText}>
                    {isBusy ? 'Đang xác thực...' : 'Tiếp tục với Google'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.footerNote}>
                  Bằng cách đăng nhập, bạn đồng ý với{' '}
                  <Text style={styles.footerLink}>Điều khoản dịch vụ</Text> và{' '}
                  <Text style={styles.footerLink}>Chính sách bảo mật</Text> của HFinmate.
                </Text>
              </View>
            )}
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  logoContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1F1F',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  dialogSubtitle: {
    fontSize: 13.5,
    color: '#444746',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  listContainer: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E1E3E1',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E1E3E1',
  },
  accountInfoCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  accountEmail: {
    fontSize: 13,
    color: '#444746',
    marginTop: 2,
  },
  removeAccountBtn: {
    padding: 6,
    marginLeft: 8,
  },
  anotherAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E1E3E1',
  },
  addAccountIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anotherAccountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A73E8',
    marginLeft: 14,
  },
  nativeButtonContainer: {
    width: '100%',
    marginTop: 4,
    marginBottom: 8,
  },
  officialGoogleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#DADCE0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  btnIconBox: {
    marginRight: 12,
  },
  officialGoogleBtnText: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#3C4043',
    letterSpacing: 0.1,
  },
  privacyText: {
    fontSize: 11.5,
    color: '#444746',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 18,
    marginBottom: 16,
    paddingHorizontal: 4,
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
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444746',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13.5,
    color: '#1A73E8',
    fontWeight: '600',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 20,
  },
  dragBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  googleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIconBox: {
    marginRight: 10,
  },
  googleActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  footerNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  footerLink: {
    color: '#1F2937',
    fontWeight: '700',
  },
});
