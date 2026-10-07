import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useFixedExpenseViewModel } from '../viewmodels/useFixedExpenseViewModel';
import { FixedExpenseItem } from '../models/fixedExpense.model';
import {
  LoadingIndicator,
  MonthYearPickerModal,
  EditFixedItemModal,
} from '../components';
import { theme } from '../theme';

export const FixedExpenseScreen: React.FC = () => {
  const scrollRef = useRef<ScrollView>(null);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState<boolean>(false);

  // Scroll to top whenever tab is switched to
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Bind ViewModel
  const {
    data,
    selectedMonth,
    selectedYear,
    displayMonth,
    editingItem,
    isLoading,
    isRefreshing,
    isSaving,
    setEditingItem,
    handleRefresh,
    handleSelectMonthYear,
    handleInlineAmountChange,
    handleUpdateItem,
    handleSave,
  } = useFixedExpenseViewModel();

  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const onAmountChange = (id: string, text: string) => {
    const cleanDigits = text.replace(/[^0-9]/g, '');
    let formatted = '';
    let num: number | null = null;
    if (cleanDigits) {
      num = parseInt(cleanDigits, 10);
      formatted = new Intl.NumberFormat('vi-VN').format(num);
    }
    setInputValues((prev) => ({ ...prev, [id]: formatted }));
    handleInlineAmountChange(id, num);
  };

  if (isLoading && !data) {
    return <LoadingIndicator message="Đang nạp chi phí cố định..." />;
  }

  if (!data) {
    return null;
  }

  const tabHeight = Platform.OS === 'ios' ? 84 : 62;

  const onSave = async () => {
    const success = await handleSave(() => {
      Alert.alert('Thành công', 'Đã lưu chi phí cố định thành công!');
    });
    if (!success) {
      Alert.alert('Lỗi', 'Không thể lưu chi phí cố định.');
    }
  };

  const renderItemIcon = (type: FixedExpenseItem['iconType']) => {
    switch (type) {
      case 'parking':
        return (
          <View style={styles.parkingIconBox}>
            <Text style={styles.parkingText}>P</Text>
          </View>
        );
      case 'water':
        return (
          <View style={styles.iconCircleBox}>
            <Ionicons name="water-outline" size={18} color={theme.colors.primary} />
          </View>
        );
      case 'fuel':
        return (
          <View style={styles.iconCircleBox}>
            <Ionicons name="speedometer-outline" size={18} color={theme.colors.primary} />
          </View>
        );
      case 'rent':
        return (
          <View style={styles.iconCircleBox}>
            <Ionicons name="home-outline" size={18} color={theme.colors.primary} />
          </View>
        );
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabHeight + 40 },
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
      >
        {/* 2. Month Dropdown with DatePicker (Month/Year) */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.monthDropdown}
          onPress={() => setIsMonthPickerVisible(true)}
        >
          <Text style={styles.monthDropdownText}>{displayMonth}</Text>
          <Ionicons name="chevron-down" size={18} color="#71857A" />
        </TouchableOpacity>

        {/* 4. Hero Card: Chi cố định đã nhập */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Chi cố định đã nhập</Text>

          <View style={styles.heroAmountRow}>
            <Text style={styles.heroAmount}>{data.totalAmountFormatted}</Text>
            <Text style={styles.heroCurrencySymbol}>đ</Text>
          </View>
        </View>

        {/* 5. Section: Các khoản cố định */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{data.sectionTitle}</Text>
          <Text style={styles.sectionCountText}>{data.sectionCountText}</Text>
        </View>

        {/* List of 4 Fixed Expense Cards */}
        <View style={styles.cardsList}>
          {data.items.map((item) => (
            <View key={item.id} style={styles.expenseCard}>
              {/* Top Row: Icon + Info (No edit pen icon, no subtitle) */}
              <View style={styles.cardTopRow}>
                {renderItemIcon(item.iconType)}

                <View style={styles.cardInfoCol}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
              </View>

              {/* Amount Box: Direct Inline TextInput */}
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Số tiền</Text>
                <View style={styles.amountInputRow}>
                  <TextInput
                    style={styles.amountInput}
                    value={
                      inputValues[item.id] !== undefined
                        ? inputValues[item.id]
                        : item.amount
                        ? new Intl.NumberFormat('vi-VN').format(item.amount)
                        : ''
                    }
                    onChangeText={(val) => onAmountChange(item.id, val)}
                    placeholder="Chưa nhập"
                    placeholderTextColor="#96A79E"
                    keyboardType="numeric"
                    returnKeyType="done"
                    selectTextOnFocus
                  />
                  <Text style={styles.amountCurrencySuffix}>đ</Text>
                </View>
              </View>

              {/* Extra Note Box (Click to edit or add note, no pen icon) */}
              {item.extraNote ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.noteCallout}
                  onPress={() => setEditingItem(item)}
                >
                  <Ionicons
                    name="newspaper-outline"
                    size={16}
                    color="#B45309"
                    style={{ marginRight: 8, marginTop: 1 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteCalloutTitle}>
                      {item.extraNote.title}
                    </Text>
                    <Text style={styles.noteCalloutDesc}>
                      {item.extraNote.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.addNoteChip}
                  onPress={() => setEditingItem(item)}
                >
                  <Ionicons
                    name="add"
                    size={14}
                    color={theme.colors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.addNoteChipText}>Thêm ghi chú</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* 6. Info Alert Box */}
        <View style={styles.alertBox}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#71857A"
            style={{ marginRight: 8, marginTop: 1 }}
          />
          <Text style={styles.alertText}>{data.alertNote}</Text>
        </View>

        {/* 7. Action Button: Lưu chi phí cố định */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.saveBtn}
          onPress={onSave}
          disabled={isSaving}
        >
          <Ionicons
            name="checkmark"
            size={20}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.saveBtnText}>
            {isSaving ? 'Đang lưu...' : 'Lưu chi phí cố định'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Month Year Picker Modal */}
      <MonthYearPickerModal
        visible={isMonthPickerVisible}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
        onClose={() => setIsMonthPickerVisible(false)}
        onSelect={handleSelectMonthYear}
      />

      {/* Edit Fixed Item & Note Modal */}
      <EditFixedItemModal
        visible={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleUpdateItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A6A4C',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#17271F',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#71857A',
    marginTop: 4,
    marginBottom: 16,
  },

  // Month Dropdown
  monthDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EFEA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    marginTop: 6,
  },
  monthDropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#17271F',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#EAF5EF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 13,
    color: '#4B6255',
    fontWeight: '500',
    marginBottom: 4,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 0,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#17271F',
    letterSpacing: -0.5,
  },
  heroCurrencySymbol: {
    fontSize: 17,
    fontWeight: '600',
    color: '#17271F',
    marginLeft: 4,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17271F',
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A6A4C',
  },

  // Cards List
  cardsList: {
    gap: 12,
    marginBottom: 16,
  },
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EFEA',
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  parkingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EAF5EF',
    borderWidth: 1,
    borderColor: '#CDE2D7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  parkingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A6A4C',
  },
  iconCircleBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF5EF',
    borderWidth: 1,
    borderColor: '#CDE2D7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17271F',
  },
  // Amount Box inside Card
  amountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F7F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
    borderColor: '#E8EFEA',
  },
  amountLabel: {
    fontSize: 12,
    color: '#71857A',
    fontWeight: '500',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    marginLeft: 10,
  },
  amountInput: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17271F',
    textAlign: 'right',
    minWidth: 100,
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
    paddingHorizontal: 4,
  },
  amountCurrencySuffix: {
    fontSize: 15,
    fontWeight: '600',
    color: '#17271F',
    marginLeft: 3,
  },

  // Extra Note Box
  noteCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF6E9',
    borderWidth: 1,
    borderColor: '#FDE6BA',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  noteCalloutTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  noteCalloutDesc: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },

  // Add Note Chip
  addNoteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EAF5EF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  addNoteChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A6A4C',
  },

  // Alert Box
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EFEA',
    padding: 12,
    marginBottom: 16,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: '#71857A',
    lineHeight: 17,
  },

  // Save Button
  saveBtn: {
    backgroundColor: '#1A6A4C',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
