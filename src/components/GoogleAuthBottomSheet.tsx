import React, { useState } from 'react';
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
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';
import { theme } from '../theme';

interface GoogleAuthBottomSheetProps {
  visible: boolean;
  isMandatory?: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

// Authentic Google Multi-Color "G" Icon
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
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
  const { loginWithGoogle, isLoading } = useAuthViewModel();
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleGoogleSignIn = async (isDemo = false) => {
    try {
      setSubmitting(true);
      const payload = isDemo
        ? {
            email: 'demo.google@hfinmate.com',
            name: 'Người dùng Thử nghiệm (Firebase)',
          }
        : undefined;

      const ok = await loginWithGoogle(payload);
      if (ok) {
        onSuccess?.();
      } else {
        Alert.alert(
          'Thông báo',
          'Đăng nhập Google chưa hoàn tất hoặc đã bị hủy. Vui lòng thử lại.'
        );
      }
    } catch (err) {
      Alert.alert('Lỗi đăng nhập', (err as Error).message || 'Có lỗi xảy ra khi xác thực Google.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropPress = () => {
    if (isMandatory) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập bằng Google để kích hoạt tính năng đồng bộ và sao lưu sổ chi tiêu HFinmate an toàn.',
        [{ text: 'Đã hiểu', style: 'default' }]
      );
    } else {
      onClose?.();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleBackdropPress}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Drag Handle Bar */}
              <View style={styles.dragBar} />

              {/* Brand Header */}
              <View style={styles.headerRow}>
                <View style={styles.logoBadge}>
                  <Ionicons name="wallet" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.brandTitleCol}>
                  <View style={styles.brandTagRow}>
                    <Text style={styles.appName}>HFinmate</Text>
                    <View style={styles.securityBadge}>
                      <Ionicons name="shield-checkmark" size={11} color="#1A6A4C" />
                      <Text style={styles.securityBadgeText}>FIREBASE AUTH</Text>
                    </View>
                  </View>
                  <Text style={styles.appTagline}>Sổ Chi Tiêu Cá Nhân Thông Minh</Text>
                </View>
              </View>

              {/* Main Headline */}
              <Text style={styles.headline}>Đăng nhập để bắt đầu</Text>
              <Text style={styles.description}>
                Liên kết tài khoản Google để bảo vệ số liệu, tự động đồng bộ và khôi phục nhật ký thu chi trên mọi thiết bị.
              </Text>

              {/* Key Benefits List */}
              <View style={styles.benefitsCard}>
                <View style={styles.benefitRow}>
                  <View style={styles.benefitIconBox}>
                    <Ionicons name="cloud-done-outline" size={18} color="#1A6A4C" />
                  </View>
                  <View style={styles.benefitTextCol}>
                    <Text style={styles.benefitTitle}>Đồng bộ đám mây liên tục</Text>
                    <Text style={styles.benefitSub}>Không lo mất sổ ghi chép khi đổi điện thoại hoặc cài lại app.</Text>
                  </View>
                </View>

                <View style={styles.benefitDivider} />

                <View style={styles.benefitRow}>
                  <View style={styles.benefitIconBox}>
                    <Ionicons name="lock-closed-outline" size={18} color="#1A6A4C" />
                  </View>
                  <View style={styles.benefitTextCol}>
                    <Text style={styles.benefitTitle}>Mã hóa an toàn tuyệt đối</Text>
                    <Text style={styles.benefitSub}>Dữ liệu thu chi cá nhân hoàn toàn riêng tư, chỉ mình bạn xem được.</Text>
                  </View>
                </View>

                <View style={styles.benefitDivider} />

                <View style={styles.benefitRow}>
                  <View style={styles.benefitIconBox}>
                    <Ionicons name="flash-outline" size={18} color="#1A6A4C" />
                  </View>
                  <View style={styles.benefitTextCol}>
                    <Text style={styles.benefitTitle}>Tiện lợi với 1 chạm</Text>
                    <Text style={styles.benefitSub}>Không cần nhớ mật khẩu mới, đăng nhập nhanh chóng và bảo mật.</Text>
                  </View>
                </View>
              </View>

              {/* Primary Google Login Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.googleButton}
                onPress={() => handleGoogleSignIn(false)}
                disabled={isLoading || submitting}
              >
                {isLoading || submitting ? (
                  <ActivityIndicator size="small" color="#1E293B" />
                ) : (
                  <>
                    <View style={styles.googleIconWrapper}>
                      <GoogleIcon size={20} />
                    </View>
                    <Text style={styles.googleButtonText}>Tiếp tục với Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Quick Demo Test Option */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.demoButton}
                onPress={() => handleGoogleSignIn(true)}
                disabled={isLoading || submitting}
              >
                <Text style={styles.demoButtonText}>Trải nghiệm nhanh với Google Demo</Text>
                <Ionicons name="arrow-forward" size={14} color="#71857A" />
              </TouchableOpacity>

              {/* Footer Terms Note */}
              <Text style={styles.footerNote}>
                Bằng cách đăng nhập, bạn đồng ý với{' '}
                <Text style={styles.footerLink}>Điều khoản dịch vụ</Text> và{' '}
                <Text style={styles.footerLink}>Chính sách bảo mật</Text> của HFinmate.
              </Text>
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
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
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
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF5EF',
    borderWidth: 1.5,
    borderColor: '#C3E7D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandTitleCol: {
    flex: 1,
  },
  brandTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#17271F',
    letterSpacing: -0.3,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EAF5EF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C3E7D6',
  },
  securityBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1A6A4C',
    letterSpacing: 0.3,
  },
  appTagline: {
    fontSize: 12.5,
    color: '#71857A',
    fontWeight: '500',
    marginTop: 2,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#17271F',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  description: {
    fontSize: 13.5,
    color: '#556960',
    lineHeight: 19,
    marginBottom: 16,
  },
  benefitsCard: {
    backgroundColor: '#F7FAF8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6EFEA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  benefitIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF5EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#17271F',
    marginBottom: 1,
  },
  benefitSub: {
    fontSize: 11.5,
    color: '#71857A',
    lineHeight: 16,
  },
  benefitDivider: {
    height: 1,
    backgroundColor: '#EAF0EC',
    marginVertical: 4,
    marginLeft: 46,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D8E2DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
  },
  googleIconWrapper: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 10,
  },
  demoButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B6B5B',
  },
  footerNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  footerLink: {
    color: '#1A6A4C',
    fontWeight: '600',
  },
});
