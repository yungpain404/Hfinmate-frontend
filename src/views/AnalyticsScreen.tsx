import React, { useState, useRef, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useAnalyticsViewModel } from '../viewmodels/useAnalyticsViewModel';
import {
  YearlyBarChart,
  LoadingIndicator,
  MonthYearPickerModal,
  YearPickerModal,
  CategoryBreakdownSection,
  ExpenseCalendarView,
} from '../components';
import { theme } from '../theme';

export const AnalyticsScreen: React.FC = () => {
  const scrollRef = useRef<ScrollView>(null);

  const [isMonthYearPickerVisible, setIsMonthYearPickerVisible] = useState<boolean>(false);
  const [isYearPickerVisible, setIsYearPickerVisible] = useState<boolean>(false);

  // Bind ViewModel
  const {
    selectedTab,
    selectedYear,
    selectedMonth,
    selectedYearNumber,
    selectedMonthYearText,
    data,
    isLoading,
    isRefreshing,
    setSelectedTab,
    handleSelectMonthYear,
    handleSelectYear,
    handleRefresh,
    loadData,
  } = useAnalyticsViewModel();

  // Scroll to top and refresh data whenever tab is switched to
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      loadData();
    }, [loadData])
  );

  if (isLoading && !data) {
    return <LoadingIndicator message="Đang nạp dữ liệu thống kê năm..." />;
  }

  if (!data) {
    return null;
  }

  const tabHeight = Platform.OS === 'ios' ? 84 : 62;

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
        {/* 2. Segment Tab Switcher (Theo tháng / Theo năm) */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.segmentTab,
              selectedTab === 'month' && styles.segmentTabActive,
            ]}
            onPress={() => setSelectedTab('month')}
          >
            <Text
              style={[
                styles.segmentText,
                selectedTab === 'month' && styles.segmentTextActive,
              ]}
            >
              Theo tháng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.segmentTab,
              selectedTab === 'year' && styles.segmentTabActive,
            ]}
            onPress={() => setSelectedTab('year')}
          >
            <Text
              style={[
                styles.segmentText,
                selectedTab === 'year' && styles.segmentTextActive,
              ]}
            >
              Theo năm
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Month-Year or Year Selector Dropdown */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.yearDropdown}
          onPress={() => {
            if (selectedTab === 'month') {
              setIsMonthYearPickerVisible(true);
            } else {
              setIsYearPickerVisible(true);
            }
          }}
        >
          <Text style={styles.yearDropdownText}>
            {selectedTab === 'month' ? selectedMonthYearText : selectedYear}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#71857A" />
        </TouchableOpacity>

        {/* 5. Hero Card: Tổng chi */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>
            {selectedTab === 'month'
              ? `Tổng chi ${selectedMonthYearText} đã ghi nhận`
              : 'Tổng chi năm đã ghi nhận'}
          </Text>

          <View style={styles.heroAmountRow}>
            <Text style={styles.heroAmount}>{data.totalYearExpenseFormatted}</Text>
            <Text style={styles.heroCurrencySymbol}>đ</Text>
          </View>

          {/* Badge */}
          <View style={styles.badgeRow}>
            <Ionicons
              name="pie-chart-outline"
              size={15}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.badgeText}>
              {selectedTab === 'month' ? 'Sinh hoạt + Cố định' : data.recordedMonthsBadge}
            </Text>
          </View>
        </View>

        {selectedTab === 'month' ? (
          <>
            {/* Sub-Card 1: Tiền sinh hoạt */}
            <View style={styles.statCard}>
              <View style={styles.statHeaderRow}>
                <Ionicons
                  name="cart-outline"
                  size={15}
                  color={theme.colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.statCardLabel, { marginBottom: 0 }]}>
                  Tiền sinh hoạt (hàng ngày)
                </Text>
              </View>
              <Text style={styles.statCardAmount}>{data.livingExpenseFormatted ?? '1.911.000đ'}</Text>
            </View>

            {/* Sub-Card 2: Khoản chi cố định */}
            <View style={styles.statCard}>
              <View style={styles.statHeaderRow}>
                <Ionicons
                  name="repeat-outline"
                  size={15}
                  color={theme.colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.statCardLabel, { marginBottom: 0 }]}>
                  Khoản chi cố định
                </Text>
              </View>
              <Text style={styles.statCardAmount}>{data.fixedExpenseFormatted ?? '367.000đ'}</Text>
            </View>

            {/* Sub-Card 3: Trung bình / ngày trong kỳ */}
            <View style={styles.statCard}>
              <View style={styles.statHeaderRow}>
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color={theme.colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.statCardLabel, { marginBottom: 0 }]}>
                  Trung bình / ngày trong kỳ
                </Text>
              </View>
              <Text style={styles.statCardAmount}>{data.dailyAverageFormatted}</Text>
            </View>
          </>
        ) : (
          <>
            {/* Sub-Card 1: Trung bình / tháng có dữ liệu */}
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>Trung bình / tháng có dữ liệu</Text>
              <Text style={styles.statCardAmount}>{data.monthlyAverageFormatted}</Text>
            </View>

            {/* Sub-Card 2: Trung bình / ngày trong kỳ */}
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>Trung bình / ngày trong kỳ</Text>
              <Text style={styles.statCardAmount}>{data.dailyAverageFormatted}</Text>
            </View>
          </>
        )}

        {/* 8. Section: Chi tiêu theo tháng */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chi tiêu theo tháng</Text>
            <Text style={styles.sectionUnit}>{data.chartUnitText}</Text>
          </View>

          {/* 12-Month Bar Chart */}
          <YearlyBarChart
            months={data.months}
            maxMillions={data.chartMaxMillions}
            noteText={data.chartNote}
          />
        </View>

        {/* 9. Section: Lịch chi tiêu theo ngày (Tab Theo tháng) HOẶC Dữ liệu từng tháng (Tab Theo năm) */}
        {selectedTab === 'month' ? (
          <ExpenseCalendarView
            calendarData={data.calendarData}
            currentMonth={selectedMonth}
            currentYear={selectedYearNumber}
          />
        ) : (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Dữ liệu từng tháng</Text>
              <Text style={styles.sectionCountText}>
                {data.recordedMonthsCount} tháng đã ghi
              </Text>
            </View>

            {/* 3 Columns Grid */}
            <View style={styles.monthGrid}>
              {data.months.map((item) => {
                const hasData = item.hasData;
                return (
                  <View
                    key={`card-m-${item.month}`}
                    style={[
                      styles.monthGridCard,
                      hasData && styles.monthGridCardActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthCardTitle,
                        hasData && styles.monthCardTitleActive,
                      ]}
                    >
                      {item.monthLabel}
                    </Text>
                    <Text
                      style={[
                        styles.monthCardAmount,
                        hasData && styles.monthCardAmountActive,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                    >
                      {item.amountFormatted}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 10. Category Breakdown Section (Tiền đi đâu?) - Chỉ hiển thị ở tab Theo tháng */}
        {selectedTab === 'month' && data.categorySection ? (
          <CategoryBreakdownSection data={data.categorySection} />
        ) : null}
      </ScrollView>

      {/* Month & Year Picker Modal (For "Theo tháng" tab) */}
      <MonthYearPickerModal
        visible={isMonthYearPickerVisible}
        currentMonth={selectedMonth}
        currentYear={selectedYearNumber}
        onClose={() => setIsMonthYearPickerVisible(false)}
        onSelect={handleSelectMonthYear}
      />

      {/* Year Picker Modal (For "Theo năm" tab) */}
      <YearPickerModal
        visible={isYearPickerVisible}
        selectedYear={selectedYear}
        onClose={() => setIsYearPickerVisible(false)}
        onSelect={handleSelectYear}
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

  // Segment Tab Switcher
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F7F6',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
    marginTop: 6,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71857A',
  },
  segmentTextActive: {
    color: '#1A6A4C',
    fontWeight: '700',
  },

  // Year Dropdown
  yearDropdown: {
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
  },
  yearDropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#17271F',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#EAF5EF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
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
    marginBottom: 10,
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A6A4C',
  },

  // Stat Cards
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EFEA',
    padding: 14,
    marginBottom: 12,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#71857A',
    fontWeight: '500',
    marginBottom: 4,
  },
  statCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#17271F',
    marginBottom: 0,
  },

  // Sections
  sectionContainer: {
    marginBottom: 20,
    marginTop: 4,
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
  sectionUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A6A4C',
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A6A4C',
  },

  // 12 Months Grid
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  monthGridCard: {
    width: '31.8%',
    backgroundColor: '#F5F7F6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E8EFEA',
    alignItems: 'center',
  },
  monthGridCardActive: {
    backgroundColor: '#EAF5EF',
    borderColor: '#BDE2CF',
  },
  monthCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B6255',
    marginBottom: 4,
  },
  monthCardTitleActive: {
    color: '#1A6A4C',
    fontWeight: '700',
  },
  monthCardAmount: {
    fontSize: 10,
    color: '#96A79E',
  },
  monthCardAmountActive: {
    color: '#1A6A4C',
    fontWeight: '700',
    fontSize: 11,
  },

  // Alert Callout
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF9EE',
    borderWidth: 1,
    borderColor: '#FBEEC8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  alertIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
});
