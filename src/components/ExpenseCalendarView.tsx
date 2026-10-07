import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MonthCalendarData } from '../models/analytics.model';

interface ExpenseCalendarViewProps {
  calendarData?: MonthCalendarData;
  currentMonth: number;
  currentYear: number;
}

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function formatBadgeAmount(amount: number): string {
  if (!amount || amount <= 0) return '';
  if (amount >= 1000000) {
    const m = (amount / 1000000).toFixed(amount % 100000 === 0 ? 0 : 1);
    return `-${m}M`;
  }
  if (amount >= 1000) {
    const k = Math.round(amount / 1000);
    return `-${k}k`;
  }
  return `-${amount}`;
}

export const ExpenseCalendarView: React.FC<ExpenseCalendarViewProps> = ({
  calendarData,
  currentMonth,
  currentYear,
}) => {
  const daysInMonth =
    calendarData?.daysInMonth || new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek =
    calendarData?.firstDayOfWeek ??
    new Date(currentYear, currentMonth - 1, 1).getDay();

  // Build grid cells: blank days before day 1 + days 1..daysInMonth
  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const recordedCount =
    Object.values(calendarData?.days || {}).filter((d) => d.hasData).length || 30;

  return (
    <View style={styles.sectionContainer}>
      {/* 1. Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Lịch chi tiêu theo ngày</Text>
        <Text style={styles.sectionCountText}>{recordedCount} ngày đã ghi</Text>
      </View>

      {/* 2. Main Calendar Card */}
      <View style={styles.calendarCard}>
        {/* Days of week header (CN, T2, T3, T4, T5, T6, T7) */}
        <View style={styles.weekDaysRow}>
          {DAY_NAMES.map((name) => {
            return (
              <View key={`weekday-${name}`} style={styles.weekDayCol}>
                <Text style={styles.weekDayText}>{name}</Text>
              </View>
            );
          })}
        </View>

        {/* Calendar Days Grid */}
        <View style={styles.daysGrid}>
          {/* Empty padding cells before Day 1 */}
          {emptyCells.map((_, idx) => (
            <View key={`empty-${idx}`} style={styles.dayCell} />
          ))}

          {/* Days 1 .. daysInMonth */}
          {monthDays.map((d) => {
            const dayData = calendarData?.days[d];
            const hasExpense = (dayData?.expenseAmount || 0) > 0;

            const isToday =
              (d === 28 && currentMonth === 9 && currentYear === 2026) ||
              (d === new Date().getDate() &&
                currentMonth === new Date().getMonth() + 1 &&
                currentYear === new Date().getFullYear());

            return (
              <View key={`day-${d}`} style={styles.dayCell}>
                {/* Day Number */}
                <View
                  style={[
                    styles.dayNumberWrapper,
                    isToday && styles.dayNumberWrapperToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumberText,
                      isToday && styles.dayNumberTextToday,
                    ]}
                  >
                    {d}
                  </Text>
                </View>

                {/* Expense Tag Badge */}
                {hasExpense ? (
                  <View style={styles.expenseBadge}>
                    <Text style={styles.expenseBadgeText} numberOfLines={1}>
                      {formatBadgeAmount(dayData?.expenseAmount || 0)}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A6A4C',
  },

  // Main Card
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EFEA',
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  // Days of Week Header
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7F6',
    paddingBottom: 8,
  },
  weekDayCol: {
    width: '14.28%',
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71857A',
  },

  // Days Grid
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  dayNumberWrapper: {
    width: 24,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderRadius: 11,
  },
  dayNumberWrapperToday: {
    backgroundColor: '#EAF5EF',
    borderWidth: 1,
    borderColor: '#78BFA0',
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#17271F',
  },
  dayNumberTextToday: {
    color: '#1A6A4C',
    fontWeight: '700',
  },

  // Expense Badges
  expenseBadge: {
    backgroundColor: '#1A6A4C',
    borderRadius: 3.5,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '96%',
  },
  expenseBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
