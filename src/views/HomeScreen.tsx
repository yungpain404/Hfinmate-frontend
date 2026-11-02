import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useHomeDashboardViewModel } from '../viewmodels/useHomeDashboardViewModel';
import { DailyRhythmChart, LoadingIndicator } from '../components';
import { theme } from '../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const scrollRef = useRef<ScrollView>(null);
  const tabHeight = Platform.OS === 'ios' ? 84 : 62;
  const bottomOffset = tabHeight + 10;

  // Bind ViewModel
  const { dashboard, isLoading, isRefreshing, handleRefresh } =
    useHomeDashboardViewModel();

  // Scroll to top and refresh whenever tab is switched to
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      handleRefresh();
    }, [handleRefresh])
  );

  if (isLoading && !dashboard) {
    return <LoadingIndicator message="Đang nạp dữ liệu sổ chi..." />;
  }

  if (!dashboard) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomOffset + 60 },
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
        {/* 2. Month Selector Row */}
        <View style={styles.monthRow}>
          <View style={styles.monthSelector}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.monthTitle}>{dashboard.monthName}</Text>
          </View>

          <Text style={styles.recordedDaysText}>{dashboard.recordedDaysText}</Text>
        </View>

        {/* 3. Hero Card: Total Recorded Expense */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Tổng chi đã ghi nhận</Text>

          <View style={styles.heroAmountRow}>
            <Text style={styles.heroAmount}>{dashboard.totalExpenseFormatted}</Text>
            <Text style={styles.heroCurrencySymbol}>đ</Text>
          </View>

          <Text style={styles.heroNote}>{dashboard.totalExpenseNote}</Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroFooter}>
            <View>
              <Text style={styles.averageLabel}>Trung bình / ngày</Text>
              <Text style={styles.averageSub}>{dashboard.dailyAverageSub}</Text>
            </View>
            <Text style={styles.averageAmount}>{dashboard.dailyAverageFormatted}</Text>
          </View>
        </View>

        {/* 4. Split Sub-Cards (Hàng ngày & Cố định) */}
        <View style={styles.subCardsRow}>
          {/* Card 1: Hàng ngày */}
          <View style={styles.subCard}>
            <View style={styles.subCardHeader}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={theme.colors.primary}
                style={{ marginRight: 5 }}
              />
              <Text style={styles.subCardTitle}>Hàng ngày</Text>
            </View>
            <Text style={styles.subCardAmount}>{dashboard.dailyCategoryTotalFormatted}</Text>
            <Text style={styles.subCardSub}>{dashboard.dailyCategorySub}</Text>
          </View>

          {/* Card 2: Cố định */}
          <View style={styles.subCard}>
            <View style={styles.subCardHeader}>
              <Ionicons
                name="receipt-outline"
                size={16}
                color={theme.colors.primary}
                style={{ marginRight: 5 }}
              />
              <Text style={styles.subCardTitle}>Cố định</Text>
            </View>
            <Text style={styles.subCardAmount}>{dashboard.fixedCategoryTotalFormatted}</Text>
            <Text style={styles.subCardSub}>{dashboard.fixedCategoryNote}</Text>
          </View>
        </View>

        {/* 5. Section: Nhịp chi trong tháng */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nhịp chi trong tháng</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.linkRow}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Analytics' })}
            >
              <Text style={styles.linkText}>Thống kê</Text>
              <Ionicons name="arrow-forward" size={13} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.chartSubHeader}>
            <Text style={styles.chartUnitText}>Chi hàng ngày · nghìn đồng</Text>
            <Text style={styles.chartPeakText}>{dashboard.rhythmHighestText}</Text>
          </View>

          {/* Daily Rhythm Bar Chart */}
          <DailyRhythmChart
            bars={dashboard.rhythmBars}
            noteText=""
          />
        </View>

        {/* 6. Section: Các ngày gần đây */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Các ngày gần đây</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Transactions')}
            >
              <Text style={styles.linkText}>Xem {dashboard.recordedDaysCount} ngày</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentDaysList}>
            {dashboard.recentDays.map((dayGroup, index) => {
              const now = new Date();
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth() + 1;
              const padMonth = String(currentMonth).padStart(2, '0');
              const padDay = String(dayGroup.day).padStart(2, '0');
              const dayDateISO = `${currentYear}-${padMonth}-${padDay}`;

              return (
                <TouchableOpacity
                  key={dayGroup.id}
                  activeOpacity={0.75}
                  style={[
                    styles.dayRow,
                    index < dashboard.recentDays.length - 1 && styles.dayRowBorder,
                  ]}
                  onPress={() => navigation.navigate('AddTransaction', { date: dayDateISO })}
                >
                  {/* Left Date Box */}
                  <View style={styles.dateBox}>
                    <Text style={styles.dateNumber}>
                      {dayGroup.day}
                    </Text>
                    <Text style={styles.dateMonthText}>{dayGroup.monthText}</Text>
                  </View>

                  {/* Center Details */}
                  <View style={styles.dayDetails}>
                    <Text style={styles.daySummaryText} numberOfLines={1}>
                      {dayGroup.itemsSummary}
                    </Text>
                    <Text style={styles.dayItemsCount}>
                      {dayGroup.itemsCount} khoản chi
                    </Text>
                  </View>

                  {/* Right Amount & Arrow */}
                  <View style={styles.dayAmountCol}>
                    <Text style={styles.dayAmountText}>
                      {dayGroup.totalAmountFormatted}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color="#B4C4BC"
                      style={{ marginLeft: 6 }}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* 7. Action Button: + Thêm khoản chi (Fixed / Sticky above bottom tabs) */}
      <View style={[styles.fixedButtonWrapper, { bottom: bottomOffset }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.addExpenseBtn}
          onPress={() => navigation.navigate('AddTransaction')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addExpenseBtnText}>Thêm khoản chi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Month row
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#17271F',
  },
  recordedDaysText: {
    fontSize: 12,
    color: '#71857A',
    fontWeight: '400',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#EAF5EF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
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
    marginBottom: 2,
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
  heroNote: {
    fontSize: 12,
    color: '#7A8E82',
    marginBottom: 16,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(26, 106, 76, 0.12)',
    marginBottom: 12,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  averageLabel: {
    fontSize: 12,
    color: '#4B6255',
    fontWeight: '500',
  },
  averageSub: {
    fontSize: 11,
    color: '#7A8E82',
    marginTop: 1,
  },
  averageAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A6A4C',
  },

  // Sub-Cards Row
  subCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  subCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EFEA',
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  subCardTitle: {
    fontSize: 12,
    color: '#4B6255',
    fontWeight: '500',
  },
  subCardAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17271F',
    marginBottom: 4,
  },
  subCardSub: {
    fontSize: 11,
    color: '#7A8E82',
  },

  // Sections
  sectionContainer: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17271F',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A6A4C',
  },
  chartSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartUnitText: {
    fontSize: 12,
    color: '#71857A',
  },
  chartPeakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A6A4C',
  },

  // Recent Days List
  recentDaysList: {
    backgroundColor: '#FFFFFF',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dayRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5F2',
  },
  dateBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3EDE7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FCFA',
    marginRight: 12,
  },
  dateBoxHighlight: {
    borderColor: '#78BFA0',
    backgroundColor: '#F1F9F4',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17271F',
    lineHeight: 18,
  },
  dateNumberHighlight: {
    color: '#1A6A4C',
  },
  dateMonthText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#71857A',
    marginTop: 1,
  },
  dayDetails: {
    flex: 1,
  },
  daySummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17271F',
    marginBottom: 3,
  },
  dayItemsCount: {
    fontSize: 12,
    color: '#71857A',
  },
  dayAmountCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#17271F',
  },

  // Action Button (Fixed Sticky)
  fixedButtonWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
  },
  addExpenseBtn: {
    backgroundColor: '#1A6A4C',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17271F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  addExpenseBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
