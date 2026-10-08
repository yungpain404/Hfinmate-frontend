import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { theme } from '../theme';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';
import { UserAvatar } from './UserAvatar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * MainTopHeader
 * Shared, fixed Top App Bar across the 3 main tab screens (Tổng quan, Thống kê, Cố định).
 * Stays permanently fixed above the tab navigator during transitions.
 */
export const MainTopHeader: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthViewModel();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.ledgerButton}
          onPress={() => navigation.navigate('Transactions')}
        >
          <Ionicons name="journal-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.ledgerText}>Sổ chi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.avatarTouchArea}
          onPress={() => navigation.navigate('Profile')}
        >
          <UserAvatar
            avatarUrl={user?.avatarUrl}
            name={user?.name}
            email={user?.email}
            size={34}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  ledgerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  ledgerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17271F',
    marginLeft: 6,
  },
  avatarTouchArea: {
    padding: 2,
  },
});
