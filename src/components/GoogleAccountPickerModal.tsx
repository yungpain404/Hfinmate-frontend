import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { DEFAULT_GOOGLE_AVATAR_URI } from '../constants/avatar';

export interface GoogleAccountItem {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface GoogleAccountPickerModalProps {
  visible: boolean;
  accounts: GoogleAccountItem[];
  isLoading?: boolean;
  onSelectAccount: (account: GoogleAccountItem) => void;
  onUseAnotherAccount: () => void;
  onClose: () => void;
}

// Authentic Google Multi-Color "G" Icon
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
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

export const GoogleAccountPickerModal: React.FC<GoogleAccountPickerModalProps> = ({
  visible,
  accounts,
  isLoading = false,
  onSelectAccount,
  onUseAnotherAccount,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.dialogCard}>
              {/* Google Header Logo */}
              <View style={styles.logoContainer}>
                <GoogleIcon size={36} />
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.title}>Đăng nhập bằng Google</Text>
              <Text style={styles.subtitle}>
                Chọn một tài khoản để tiếp tục tới HFinmate
              </Text>

              {/* Account List */}
              <View style={styles.listContainer}>
                {accounts.map((acc, index) => {
                  const initial = (acc.name || acc.email).charAt(0).toUpperCase();
                  return (
                    <TouchableOpacity
                      key={acc.id || acc.email || `acc-${index}`}
                      style={styles.accountRow}
                      activeOpacity={0.7}
                      disabled={isLoading}
                      onPress={() => onSelectAccount(acc)}
                    >
                      {/* Avatar */}
                      <Image
                        source={{ uri: acc.avatarUrl || DEFAULT_GOOGLE_AVATAR_URI }}
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />

                      {/* Name & Email */}
                      <View style={styles.accountInfoCol}>
                        <Text style={styles.accountName} numberOfLines={1}>
                          {acc.name}
                        </Text>
                        <Text style={styles.accountEmail} numberOfLines={1}>
                          {acc.email}
                        </Text>
                      </View>

                      {/* Right Chevron */}
                      <Ionicons name="chevron-forward" size={18} color="#747775" />
                    </TouchableOpacity>
                  );
                })}

                {/* Option: Sử dụng một tài khoản khác */}
                <TouchableOpacity
                  style={styles.anotherAccountRow}
                  activeOpacity={0.7}
                  disabled={isLoading}
                  onPress={onUseAnotherAccount}
                >
                  <View style={styles.addAccountIconCircle}>
                    <Ionicons name="person-add-outline" size={20} color="#1A73E8" />
                  </View>
                  <Text style={styles.anotherAccountText}>Sử dụng một tài khoản khác</Text>
                </TouchableOpacity>
              </View>

              {/* Privacy Notice */}
              <Text style={styles.privacyText}>
                Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email và ảnh hồ sơ của bạn với{' '}
                <Text style={styles.boldText}>HFinmate</Text>. Trước khi sử dụng ứng dụng này, hãy xem{' '}
                <Text style={styles.linkText}>Chính sách quyền riêng tư</Text>.
              </Text>

              {/* Cancel Button */}
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#1A73E8" />
                  <Text style={styles.loadingText}>Đang kết nối...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                  onPress={onClose}
                >
                  <Text style={styles.cancelText}>Hủy</Text>
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
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1F1F',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#444746',
    textAlign: 'center',
    marginBottom: 20,
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
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
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
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anotherAccountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A73E8',
    marginLeft: 14,
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
});
