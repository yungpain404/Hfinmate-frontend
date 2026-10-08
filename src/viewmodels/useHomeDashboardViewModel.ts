import { useState, useEffect, useCallback, useMemo } from 'react';
import { HomeDashboardData } from '../models/dashboard.model';
import { dashboardRepository } from '../services/repositories/dashboardRepository';
import { INITIAL_DASHBOARD_DATA } from '../services/mock/mockData';
import { formatVND } from './useWalletViewModel';

export function formatVNDNumber(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

/**
 * ViewModel: useHomeDashboardViewModel
 * Strictly encapsulates state and business formatting for the first screen (Dashboard)
 */
export function useHomeDashboardViewModel() {
  const [data, setData] = useState<HomeDashboardData | null>(INITIAL_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      }
      setError(null);
      const res = await dashboardRepository.getDashboardData();
      setData(res);
    } catch (err) {
      setError((err as Error).message || 'Không thể tải thông tin sổ chi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  // Prepared view bindings
  const formattedData = useMemo(() => {
    if (!data) return null;

    const maxChartValue = 160; // Chart Y-axis maximum is 160k

    const rhythmBarsWithHeight = data.rhythmBars.map((item) => {
      // Calculate bar height percentage (max 100%)
      const heightPercent = item.hasRecord
        ? Math.min(100, Math.max(8, (item.amountInThousands / maxChartValue) * 100))
        : 4; // Flat indicator for unrecorded days

      return {
        ...item,
        heightPercent,
      };
    });

    const formattedRecentDays = data.recentDays.map((group) => ({
      ...group,
      totalAmountFormatted: formatVND(group.totalAmount),
    }));

    return {
      monthName: data.monthName,
      recordedDaysCount: data.recordedDaysCount,
      calendarDaysCount: data.calendarDaysCount,
      recordedDaysText: `${data.recordedDaysCount} ngày có ghi chép`,

      totalExpenseFormatted: formatVNDNumber(data.totalExpense),
      totalExpenseNote: data.totalExpenseNote,

      dailyAverageFormatted: formatVND(data.dailyAverage),
      dailyAverageSub: `Trên ${data.calendarDaysCount} ngày lịch`,

      dailyCategoryTotalFormatted: formatVND(data.dailyCategoryTotal),
      dailyCategorySub: `${data.dailyCategoryDaysCount} ngày ghi chép`,

      fixedCategoryTotalFormatted: formatVND(data.fixedCategoryTotal),
      fixedCategoryNote: data.fixedCategoryNote,

      rhythmHighestText: `Cao nhất: ${Math.round(data.rhythmMaxAmount / 1000)}k`,
      rhythmNote: data.rhythmNote,
      rhythmBars: rhythmBarsWithHeight,

      recentDays: formattedRecentDays,
    };
  }, [data]);

  return {
    dashboard: formattedData,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
  };
}
