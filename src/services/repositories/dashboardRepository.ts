import {
  HomeDashboardData,
  DailyRhythmBar,
  DayExpenseGroup,
} from '../../models/dashboard.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import {
  getScopedItem,
  setScopedItem,
  migrateLegacyKey,
} from '../storage/accountScope';
import { dailyExpenseRepository } from './dailyExpenseRepository';
import { fixedExpenseRepository } from './fixedExpenseRepository';

const DASHBOARD_KEY = 'home_dashboard_data';

export interface IDashboardRepository {
  getDashboardData(): Promise<HomeDashboardData>;
  refresh(): Promise<HomeDashboardData>;
  computeLocalDashboardData(): Promise<HomeDashboardData>;
}

class DashboardRepository implements IDashboardRepository {
  async computeLocalDashboardData(): Promise<HomeDashboardData> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const padMonth = String(currentMonth).padStart(2, '0');
    const monthPrefix = `${currentYear}-${padMonth}`;

    const [recordedSheets, fixedData] = await Promise.all([
      dailyExpenseRepository.getAllRecordedSheets(),
      fixedExpenseRepository.getFixedExpenses(),
    ]);

    const dayExpensesMap: Record<
      number,
      {
        amount: number;
        items: { id: string; title: string; amount: number; category?: string }[];
      }
    > = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dayExpensesMap[d] = { amount: 0, items: [] };
    }

    for (const sheet of recordedSheets) {
      if (sheet.date && sheet.date.startsWith(monthPrefix)) {
        const parts = sheet.date.split('-');
        const dayNum = parseInt(parts[2], 10);
        if (dayNum >= 1 && dayNum <= daysInMonth) {
          const validItems = (sheet.items || []).filter((i) => i.amount > 0);
          const sheetTotal = validItems.reduce((sum, i) => sum + i.amount, 0);
          dayExpensesMap[dayNum].amount = sheetTotal;
          dayExpensesMap[dayNum].items = validItems.map((i) => ({
            id: i.id,
            title: i.name || 'Khoản chi',
            amount: i.amount,
            category: i.category,
          }));
        }
      }
    }

    const fixedTotal = fixedData?.totalAmount || 0;
    let totalDailyExpense = 0;
    let recordedDaysCount = 0;
    let maxDayAmount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const amt = dayExpensesMap[d].amount;
      if (amt > 0) {
        totalDailyExpense += amt;
        recordedDaysCount += 1;
        if (amt > maxDayAmount) maxDayAmount = amt;
      }
    }

    const totalExpense = totalDailyExpense + fixedTotal;
    const dailyAverage = daysInMonth > 0 ? Math.round(totalExpense / daysInMonth) : 0;

    const rhythmBars: DailyRhythmBar[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const amt = dayExpensesMap[d].amount;
      rhythmBars.push({
        day: d,
        amount: amt,
        amountInThousands: Math.round(amt / 1000),
        hasRecord: amt > 0,
        isPeak: maxDayAmount > 0 && amt === maxDayAmount,
      });
    }

    const recentDays: DayExpenseGroup[] = [];
    for (let d = daysInMonth; d >= 1; d--) {
      const dayData = dayExpensesMap[d];
      if (dayData.amount > 0) {
        recentDays.push({
          id: `day_${d}`,
          day: d,
          monthText: `Tháng ${currentMonth}`,
          itemsSummary: dayData.items.map((i) => i.title).join(', ') || 'Khoản chi',
          itemsCount: dayData.items.length,
          totalAmount: dayData.amount,
          items: dayData.items,
        });
      }
    }

    const localData: HomeDashboardData = {
      monthName: `Tháng ${currentMonth}`,
      recordedDaysCount,
      calendarDaysCount: daysInMonth,
      totalExpense,
      totalExpenseNote:
        totalExpense > 0
          ? `Gồm sinh hoạt và cố định tháng ${currentMonth}`
          : 'Chưa có khoản chi ghi nhận trong tháng',
      dailyAverage,
      dailyCategoryTotal: totalDailyExpense,
      dailyCategoryDaysCount: recordedDaysCount,
      fixedCategoryTotal: fixedTotal,
      fixedCategoryNote:
        fixedTotal > 0 ? 'Các khoản cố định đã nhập' : 'Chưa có khoản cố định',
      rhythmMaxAmount: maxDayAmount,
      rhythmBars,
      rhythmNote: '',
      recentDays: recentDays.slice(0, 5),
    };

    await setScopedItem(DASHBOARD_KEY, localData);
    return localData;
  }

  async getDashboardData(): Promise<HomeDashboardData> {
    const localData = await this.computeLocalDashboardData();
    try {
      const response = await apiClient.get<ApiResponse<HomeDashboardData>>('/dashboard');
      if (response.data && response.data.data) {
        const data = response.data.data;
        const backendHasData = data.totalExpense > 0 || data.recordedDaysCount > 0;
        const localHasData = localData.totalExpense > 0 || localData.recordedDaysCount > 0;

        if (backendHasData || !localHasData) {
          await setScopedItem(DASHBOARD_KEY, data);
          return data;
        }

        await setScopedItem(DASHBOARD_KEY, localData);
        return localData;
      }
    } catch {
      // Backend not reached or offline, fallback to local calculation
    }

    return localData;
  }

  async refresh(): Promise<HomeDashboardData> {
    const localData = await this.computeLocalDashboardData();
    try {
      const response = await apiClient.post<ApiResponse<HomeDashboardData>>('/dashboard/refresh');
      if (response.data && response.data.data) {
        const data = response.data.data;
        const backendHasData = data.totalExpense > 0 || data.recordedDaysCount > 0;
        const localHasData = localData.totalExpense > 0 || localData.recordedDaysCount > 0;

        if (backendHasData || !localHasData) {
          await setScopedItem(DASHBOARD_KEY, data);
          return data;
        }

        await setScopedItem(DASHBOARD_KEY, localData);
        return localData;
      }
    } catch {
      // Fallback
    }

    return localData;
  }
}

export const dashboardRepository: IDashboardRepository = new DashboardRepository();
