import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { YearAnalyticsData } from '../models/analytics.model';
import { analyticsRepository } from '../services/repositories/analyticsRepository';
import { useMonthRollover } from '../hooks';
import { currentMonthRef } from '../utils/month';
import { expenseEvents } from '../services/eventBus';

export type AnalyticsPeriodTab = 'month' | 'year';

/**
 * ViewModel: useAnalyticsViewModel
 * Strictly encapsulates 12-month analytics data, segment tab toggling, month-year selection, and refresh logic
 */
export function useAnalyticsViewModel() {
  const [selectedTab, setSelectedTab] = useState<AnalyticsPeriodTab>('month');
  const [selectedYearNumber, setSelectedYearNumber] = useState<number>(
    () => new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    () => new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    () => `Năm ${new Date().getFullYear()}`
  );

  const [data, setData] = useState<YearAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Monotonic id: a slow response for a previous month must never overwrite
  // the figures of the month the user is looking at now.
  const requestIdRef = useRef(0);

  const loadData = useCallback(async (isRefresh = false) => {
    const requestId = ++requestIdRef.current;
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const res = await analyticsRepository.getYearAnalytics(selectedYear, selectedMonth);
      if (requestId !== requestIdRef.current) return; // superseded by a newer request
      setData(res);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError((err as Error).message || 'Không thể tải dữ liệu thống kê');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    const unsubscribe = expenseEvents.subscribe(() => {
      loadData(true);
    });
    return unsubscribe;
  }, [loadData]);

  // The statistics tab stays mounted between month boundaries: when a new
  // month begins, drop last month's figures and jump to the fresh month.
  useMonthRollover(
    useCallback(() => {
      const ref = currentMonthRef();
      // Invalidate any request still in flight for the old month.
      requestIdRef.current++;
      setData(null);
      const yearLabel = `Năm ${ref.year}`;
      const alreadyOnNewMonth = ref.month === selectedMonth && yearLabel === selectedYear;
      setSelectedMonth(ref.month);
      setSelectedYearNumber(ref.year);
      setSelectedYear(yearLabel);
      // If the selection already pointed at the new month, `loadData` keeps its
      // identity and the effect below never re-runs - reload explicitly so the
      // screen doesn't stay empty after `setData(null)`.
      if (alreadyOnNewMonth) loadData();
    }, [selectedMonth, selectedYear, loadData])
  );

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
