import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';
import { useTransactionListViewModel } from '../viewmodels/useTransactionListViewModel';
import { Card, Button, Badge, Header } from '../components';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout, showGoogleModal } = useAuthViewModel();
  const { handleResetInitial } = useTransactionListViewModel();

  const handleResetData = () => {
    Alert.alert(
      'Khôi phục dữ liệu mặc định',
      'Hành động này sẽ thiết lập lại danh sách giao dịch về mặc định của tháng hiện tại.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Khôi phục',
          onPress: async () => {
            await handleResetInitial();
            Alert.alert('Thành công', 'Đã khôi phục dữ liệu mặc định thành công.');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất khỏi tài khoản Google hiện tại?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.card} />

      <Header
        title="Hồ sơ & Cài đặt"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <Card style={styles.userCard} padding="lg">
          <View style={styles.avatarCircle}>
            <Ionicons name={user ? 'logo-google' : 'person'} size={28} color="#FFFFFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Chưa đăng nhập'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'Chưa liên kết Google'}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              <Badge
                label={user ? 'Google Connected' : 'Chưa đăng nhập'}
                variant={user ? 'success' : 'warning'}
                size="sm"
              />
              <Badge
                label={`Tiền tệ: ${user?.preferredCurrency || 'VND'}`}
                variant="primary"
                size="sm"
              />
            </View>
          </View>
        </Card>

        {!user ? (
          <TouchableOpacity
            style={styles.googleActionBtn}
            activeOpacity={0.8}
            onPress={showGoogleModal}
          >
            <Ionicons name="logo-google" size={18} color="#1A6A4C" style={{ marginRight: 8 }} />
            <Text style={styles.googleActionText}>Đăng nhập với Google ngay</Text>
          </TouchableOpacity>
        ) : null}

        {/* Architecture Spec Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kiến trúc ứng dụng MVVM</Text>
          <Card padding="md">
            <View style={styles.specRow}>
              <View style={styles.specIcon}>
                <Ionicons name="layers" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.specContent}>
                <Text style={styles.specHeading}>Model</Text>
                <Text style={styles.specDetail}>
                  Entity DTOs, Axios ApiClient, StorageService, Repositories.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.specRow}>
              <View style={styles.specIcon}>
                <Ionicons name="cog" size={20} color={theme.colors.secondary} />
              </View>
              <View style={styles.specContent}>
                <Text style={styles.specHeading}>ViewModel</Text>
                <Text style={styles.specDetail}>
                  Custom Hooks (`useWallet`, `useTransactionList`, `useCreateTransaction`) & Zustand.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.specRow}>
              <View style={styles.specIcon}>
                <Ionicons name="phone-portrait" size={20} color={theme.colors.warning} />
              </View>
              <View style={styles.specContent}>
                <Text style={styles.specHeading}>View</Text>
                <Text style={styles.specDetail}>
                  Pure Presentation, SafeAreaView, KeyboardAvoidingView, Binding từ ViewModel.
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* System Settings & Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quản lý dữ liệu</Text>
          <Card padding="sm">
            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleResetData}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="refresh-circle-outline" size={22} color={theme.colors.primary} />
                <Text style={styles.actionText}>Khôi phục dữ liệu mẫu</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => Alert.alert('Thông tin', 'HFinmate v1.0.0 (Expo SDK 57)')}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="information-circle-outline" size={22} color={theme.colors.info} />
                <Text style={styles.actionText}>Phiên bản hệ thống</Text>
              </View>
              <Text style={styles.versionText}>v1.0.0</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Logout Button */}
        <Button
          title="Đăng xuất"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutBtn}
          leftIcon={<Ionicons name="log-out-outline" size={20} color={theme.colors.primary} />}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  specIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  specContent: {
    flex: 1,
  },
  specHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  specDetail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  versionText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  logoutBtn: {
    marginTop: theme.spacing.xs,
  },
  googleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5EF',
    borderWidth: 1.5,
    borderColor: '#C3E7D6',
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: theme.spacing.lg,
  },
  googleActionText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1A6A4C',
  },
});
