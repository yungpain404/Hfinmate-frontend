import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useDailyExpenseViewModel } from '../viewmodels/useDailyExpenseViewModel';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';
import { DatePickerModal, CategoryPickerModal, UserAvatar } from '../components';
import { getCategoryByName } from '../models/expenseCategory.model';
import { theme } from '../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AddTransactionScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthViewModel();
  const [isDatePickerVisible, setIsDatePickerVisible] = useState<boolean>(false);
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState<boolean>(false);
  const [pickerItemId, setPickerItemId] = useState<string | null>(null);

  // Bind ViewModel
  const {
    displayDate,
    currentDateObj,
    items,
    focusedId,
    itemCountText,
    totalAmountFormatted,
    formulaText,
    autoCountText,
    footerNote,
    isSaving,
    setFocusedId,
    handleSelectDate,
    handleNameChange,
    handleAmountChange,
    handleCategoryChange,
    handleAddRow,
    handleRemoveRow,
    handleSave,
  } = useDailyExpenseViewModel();

  const onSave = async () => {
    const success = await handleSave(() => {
      Alert.alert('Thành công', 'Đã lưu chi tiêu ngày thành công!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    });

    if (!success) {
      Alert.alert('Lưu thất bại', 'Vui lòng kiểm tra lại các khoản chi.');
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Header with Back button and Avatar */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.avatarButton}
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

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Title & Subtitle */}
          <Text style={styles.screenTitle}>Chi tiêu trong ngày</Text>
          <Text style={styles.screenSubtitle}>Ghi lại từng khoản, không bỏ sót.</Text>

          {/* 3. Date Selector Card */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.dateCard}
            onPress={() => setIsDatePickerVisible(true)}
          >
            <View style={styles.dateIconWrapper}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Ngày ghi chi tiêu</Text>
              <Text style={styles.dateValue}>{displayDate}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={theme.colors.primary} />
          </TouchableOpacity>

          {/* 4. Section: Các khoản chi */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Các khoản chi</Text>
            <Text style={styles.itemCountText}>{itemCountText}</Text>
          </View>

          {/* 5. Expense Items List */}
          <View style={styles.itemsList}>
            {items.map((item) => {
              const isFocused = focusedId === item.id;
              const currentCategory = getCategoryByName(item.category);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.itemCard,
                    isFocused && styles.itemCardFocused,
                  ]}
                >
                  {/* Labels Row */}
                  <View style={styles.labelsRow}>
                    <Text style={[styles.inputLabel, { flex: 1.3 }]}>
                      TÊN KHOẢN CHI
                    </Text>
                    <Text style={[styles.inputLabel, { flex: 1, paddingLeft: 8 }]}>
                      SỐ TIỀN (Đ)
                    </Text>
                    <View style={{ width: 24 }} />
                  </View>

                  {/* Input Fields Row */}
                  <View style={styles.inputsRow}>
                    {/* Name Input */}
                    <TextInput
                      style={[
                        styles.nameInput,
                        isFocused && styles.nameInputFocused,
                      ]}
                      value={item.name}
                      onChangeText={(val) => handleNameChange(item.id, val)}
                      onFocus={() => setFocusedId(item.id)}
                      placeholder="Tên khoản chi"
                      placeholderTextColor="#96A79E"
                    />

                    {/* Amount Input */}
                    <TextInput
                      style={styles.amountInput}
                      value={item.amountInput}
                      onChangeText={(val) => handleAmountChange(item.id, val)}
                      onFocus={() => setFocusedId(item.id)}
                      placeholder="0"
                      placeholderTextColor="#96A79E"
                      keyboardType="numeric"
                    />

                    {/* Delete Row Button */}
                    <TouchableOpacity
                      activeOpacity={0.6}
                      style={styles.deleteRowBtn}
                      onPress={() => handleRemoveRow(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={18} color="#8CA095" />
                    </TouchableOpacity>
                  </View>

                  {/* Category Selector Row (Ô Select Loại Khoản Chi) */}
                  <View style={styles.categorySelectorRow}>
                    <Text style={styles.categoryLabelText}>Loại chi:</Text>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[
                        styles.categorySelectButton,
                        {
                          borderColor: `${currentCategory.color}45`,
                          backgroundColor: `${currentCategory.color}0D`,
                        },
                      ]}
                      onPress={() => {
                        setPickerItemId(item.id);
                        setIsCategoryPickerVisible(true);
                      }}
                    >
                      <Ionicons
                        name={currentCategory.icon}
                        size={14}
                        color={currentCategory.color}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.categorySelectButtonText,
                          { color: currentCategory.color },
                        ]}
                      >
                        {currentCategory.name}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={14}
                        color={currentCategory.color}
                        style={{ marginLeft: 5 }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* 6. Button: + Thêm dòng khoản chi */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.addRowBtn}
            onPress={handleAddRow}
          >
            <Ionicons
              name="add"
              size={18}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.addRowBtnText}>Thêm dòng khoản chi</Text>
          </TouchableOpacity>

          {/* 7. Summary Card (Tổng ngày) */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.summaryTitle}>Tổng ngày</Text>
                <Text style={styles.summarySub}>{autoCountText}</Text>
              </View>
              <Text style={styles.summaryAmount}>{totalAmountFormatted}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <Text style={styles.formulaText}>{formulaText}</Text>
          </View>

          {/* 8. Save Button */}
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
              {isSaving ? 'Đang lưu...' : 'Lưu chi tiêu ngày'}
            </Text>
          </TouchableOpacity>

          {/* 9. Footer Note */}
          <Text style={styles.footerNote}>{footerNote}</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 10. Bottom Navigation Bar matching design */}
      <View style={[styles.bottomTabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="home-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.tabLabel, { color: theme.colors.primary }]}>Tổng quan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="trending-up-outline" size={20} color="#8E9F96" />
          <Text style={styles.tabLabel}>Thống kê</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="receipt-outline" size={20} color="#8E9F96" />
          <Text style={styles.tabLabel}>Cố định</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={isDatePickerVisible}
        currentDate={currentDateObj}
        onClose={() => setIsDatePickerVisible(false)}
        onSelectDate={handleSelectDate}
      />

      {/* Category Picker Modal */}
      <CategoryPickerModal
        visible={isCategoryPickerVisible}
        selectedCategory={
          items.find((i) => i.id === pickerItemId)?.category || 'Ăn uống'
        }
        onClose={() => {
          setIsCategoryPickerVisible(false);
          setPickerItemId(null);
        }}
        onSelect={(categoryName) => {
          if (pickerItemId) {
            handleCategoryChange(pickerItemId, categoryName);
          }
          setIsCategoryPickerVisible(false);
          setPickerItemId(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A6A4C',
  },
  avatarButton: {
    padding: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
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
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  dateIconWrapper: {
    marginRight: 10,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#4B6255',
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17271F',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17271F',
  },
  itemCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A6A4C',
  },
  itemsList: {
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EFEA',
    padding: 12,
    marginBottom: 12,
  },
  itemCardFocused: {
    borderColor: '#78BFA0',
  },
  labelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#71857A',
    letterSpacing: 0.3,
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameInput: {
    flex: 1.3,
    height: 42,
    backgroundColor: '#F5F7F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#17271F',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  nameInputFocused: {
    borderColor: '#78BFA0',
    backgroundColor: '#FFFFFF',
  },
  amountInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F5F7F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#17271F',
    fontWeight: '700',
    textAlign: 'right',
    marginLeft: 8,
  },
  deleteRowBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  categorySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F7F6',
  },
  categoryLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71857A',
  },
  categorySelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  categorySelectButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1E6DC',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  addRowBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A6A4C',
  },
  summaryCard: {
    backgroundColor: '#EAF5EF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#17271F',
  },
  summarySub: {
    fontSize: 11,
    color: '#4B6255',
    marginTop: 2,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A6A4C',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(26, 106, 76, 0.12)',
    marginVertical: 10,
  },
  formulaText: {
    fontSize: 11,
    color: '#7A8E82',
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1A6A4C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerNote: {
    fontSize: 11,
    color: '#8CA095',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEF4F0',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: '#8E9F96',
    fontWeight: '600',
    marginTop: 3,
  },
});
