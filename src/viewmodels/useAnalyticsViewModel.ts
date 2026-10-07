import { useState, useEffect, useCallback, useMemo } from 'react';
import { YearAnalyticsData } from '../models/analytics.model';
import { analyticsRepository } from '../services/repositories/analyticsRepository';

export type AnalyticsPeriodTab = 'month' | 'year';

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_RECORDED_MONTH = new Date().getMonth() + 1;

/**
 * ViewModel: useAnalyticsViewModel
 * Strictly encapsulates 12-month analytics data, segment tab toggling, month-year selection, and refresh logic
 */
export function useAnalyticsViewModel() {
  const [selectedTab, setSelectedTab] = useState<AnalyticsPeriodTab>('month');
  const [selectedYear, setSelectedYear] = useState<string>(`Năm ${CURRENT_YEAR}`);
  const [selectedMonth, setSelectedMonth] = useState<number>(DEFAULT_RECORDED_MONTH);
  const [selectedYearNumber, setSelectedYearNumber] = useState<number>(CURRENT_YEAR);

  const [data, setData] = useState<YearAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const res = await analyticsRepository.getYearAnalytics(selectedYear, selectedMonth);
      setData(res);
    } catch (err) {
      setError((err as Error).message || 'Không thể tải dữ liệu thống kê');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  const handleSelectMonthYear = useCallback((month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYearNumber(year);
    setSelectedYear(`Năm ${year}`);
  }, []);

  const handleSelectYear = useCallback((year: string) => {
    setSelectedYear(year);
  }, []);

  const handleNavigateMonth = useCallback(
    (direction: 'prev' | 'next') => {
      let newM = selectedMonth;
      let newY = selectedYearNumber;
      if (direction === 'prev') {
        if (newM === 1) {
          newM = 12;
          newY -= 1;
        } else {
          newM -= 1;
        }
      } else {
        if (newM === 12) {
          newM = 1;
          newY += 1;
        } else {
          newM += 1;
        }
      }
      setSelectedMonth(newM);
      setSelectedYearNumber(newY);
      setSelectedYear(`Năm ${newY}`);
    },
    [selectedMonth, selectedYearNumber]
  );

  const selectedMonthYearText = useMemo(() => {
    return `Tháng ${selectedMonth}, ${selectedYearNumber}`;
  }, [selectedMonth, selectedYearNumber]);

  return {
    selectedTab,
    selectedYear,
    selectedMonth,
    selectedYearNumber,
    selectedMonthYearText,
    data,
    isLoading,
    isRefreshing,
    error,
    setSelectedTab,
    handleSelectMonthYear,
    handleSelectYear,
    handleNavigateMonth,
    handleRefresh,
    loadData,
  };
};
