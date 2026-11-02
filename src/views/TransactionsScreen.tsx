import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTransactionListViewModel } from '../viewmodels/useTransactionListViewModel';
import { formatVND } from '../viewmodels/useWalletViewModel';
import { Transaction, TransactionType } from '../models/transaction.model';
import { Input, Badge, EmptyState, LoadingIndicator } from '../components';
import { theme } from '../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const TransactionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  // Bind ViewModel
  const {
    transactions,
    filterType,
    searchQuery,
    isLoading,
    isRefreshing,
    setFilterType,
    setSearchQuery,
    handleRefresh,
    handleDelete,
  } = useTransactionListViewModel();

  const confirmDelete = (item: Transaction) => {
    Alert.alert(
      'Xóa giao dịch',
      `Bạn có chắc chắn muốn xóa "${item.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => handleDelete(item.id),
        },
      ]
    );
  };

  const renderFilterChip = (
    label: string,
    value: TransactionType | 'all',
    icon: keyof typeof Ionicons.glyphMap
  ) => {
    const isSelected = filterType === value;
    return (
      <TouchableOpacity
        key={value}
        activeOpacity={0.7}
        onPress={() => setFilterType(value)}
        style={[styles.filterChip, isSelected && styles.filterChipActive]}
      >
        <Ionicons
          name={icon}
          size={14}
          color={isSelected ? '#FFFFFF' : theme.colors.textSecondary}
          style={{ marginRight: 4 }}
        />
        <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';

    return (
      <TouchableOpacity
        style={styles.cardItem}
        activeOpacity={0.75}
        onPress={() => {
          if (item.date) {
            navigation.navigate('AddTransaction', { date: item.date });
          }
        }}
      >
        <View
          style={[
            styles.typeIndicator,
            { backgroundColor: isIncome ? theme.colors.incomeLight : theme.colors.expenseLight },
          ]}
        >
          <Ionicons
            name={isIncome ? 'arrow-down' : 'arrow-up'}
            size={18}
            color={isIncome ? theme.colors.income : theme.colors.expense}
          />
        </View>

        <View style={styles.detailsCol}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.itemMetaRow}>
            <Badge
              label={item.category.toUpperCase()}
              size="sm"
              variant={isIncome ? 'success' : 'neutral'}
            />
            <Text style={styles.itemDate}>{item.date}</Text>
          </View>
          {item.note && (
            <Text style={styles.itemNote} numberOfLines={1}>
              {item.note}
            </Text>
          )}
        </View>

        <View style={styles.actionCol}>
          <Text
            style={[
              styles.itemAmount,
              { color: isIncome ? theme.colors.income : theme.colors.expense },
            ]}
          >
            {isIncome ? '+' : '-'}
            {formatVND(item.amount)}
          </Text>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.card} />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Sổ giao dịch</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Tìm theo tên giao dịch, ghi chú..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={18} color={theme.colors.textMuted} />}
          rightIcon={
            searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ) : undefined
          }
          containerStyle={styles.searchInputContainer}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {renderFilterChip('Tất cả', 'all', 'layers-outline')}
        {renderFilterChip('Thu nhập', 'income', 'arrow-down-circle-outline')}
        {renderFilterChip('Chi tiêu', 'expense', 'arrow-up-circle-outline')}
      </View>

      {/* Transaction List */}
      {isLoading && transactions.length === 0 ? (
        <LoadingIndicator message="Đang tải danh sách..." />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 90 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Không tìm thấy giao dịch"
              description="Thử tìm từ khóa khác hoặc ghi nhận giao dịch mới."
              actionTitle="Ghi chép giao dịch"
              onActionPress={() => navigation.navigate('AddTransaction')}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.card,
  },
  searchInputContainer: {
    marginBottom: theme.spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeIndicator: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailsCol: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemDate: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  itemNote: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    paddingTop: 8,
  },
});
