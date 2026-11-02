import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedExpenseData, FixedExpenseItem } from '../models/fixedExpense.model';
import { fixedExpenseRepository } from '../services/repositories/fixedExpenseRepository';
import { useMonthRollover } from '../hooks';
import { currentMonthRef, monthLabel } from '../utils/month';

import { expenseEvents } from '../services/eventBus';

/**
 * ViewModel: useFixedExpenseViewModel
 * Strictly encapsulates state, item editing, month selection, calculations, and persistence for Fixed Expenses
 */
export function useFixedExpenseViewModel() {
  const [data, setData] = useState<FixedExpenseData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    () => new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    () => new Date().getFullYear()
  );
  const [editingItem, setEditingItem] = useState<FixedExpenseItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedMonthLabel = useMemo(
    () => monthLabel({ year: selectedYear, month: selectedMonth }),
    [selectedMonth, selectedYear]
  );

  // Monotonic id: a slow response for a previous month must never overwrite
  // the sheet of the month the user is looking at now.
  const requestIdRef = useRef(0);
  // Mirror of the selected month label, updated synchronously wherever the
  // selection changes, so awaited mutations can detect they were superseded.
  const selectedLabelRef = useRef(selectedMonthLabel);

  const loadData = useCallback(
    async (isRefresh = false) => {
      const requestId = ++requestIdRef.current;
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);
        const res = await fixedExpenseRepository.getFixedExpenses(selectedMonthLabel);
        if (requestId !== requestIdRef.current) return; // superseded by a newer request
        setData(res);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError((err as Error).message || 'Không thể tải chi phí cố định');
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [selectedMonthLabel, setData]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    const unsubscribe = expenseEvents.subscribe(() => {
      loadData(true);
    });
    return unsubscribe;
  }, [loadData]);

  // A new month starts while the screen stays mounted: drop the previous
  // month's sheet and jump back to the current one so fixed expenses restart
  // from a clean sheet instead of carrying last month's amounts over.
  useMonthRollover(
    useCallback(() => {
      const ref = currentMonthRef();
      // Invalidate any request still in flight for the old month.
      requestIdRef.current++;
      setData(null);
      const label = monthLabel(ref);
      const alreadyOnNewMonth = ref.month === selectedMonth && ref.year === selectedYear;
      selectedLabelRef.current = label;
      setSelectedMonth(ref.month);
      setSelectedYear(ref.year);
      // If the selection already pointed at the new month, `loadData` keeps its
      // identity and the effect above never re-runs - reload explicitly so the
      // screen doesn't stay empty after `setData(null)`.
      if (alreadyOnNewMonth) loadData();
    }, [selectedMonth, selectedYear, loadData])
  );

  const handleRefresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  const handleSelectMonthYear = useCallback(
    async (month: number, year: number) => {
      setSelectedMonth(month);
      setSelectedYear(year);
      const monthStr = monthLabel({ year, month });
      selectedLabelRef.current = monthStr;
      try {
        await fixedExpenseRepository.updateMonth(monthStr);
        // Re-read the sheet of that month: the server may answer the switch
        // with a relabeled copy, which must not be trusted as-is.
        const sheet = await fixedExpenseRepository.getFixedExpenses(monthStr);
        // Only apply while this is still the month on screen - otherwise a
        // later switch (or a month rollover) would show the old sheet again.
        if (selectedLabelRef.current !== monthStr) return;
        setData(sheet);
      } catch (err) {
        if (selectedLabelRef.current !== monthStr) return;
        setError((err as Error).message || 'Không thể đổi tháng');
      }
    },
    [setSelectedMonth, setSelectedYear, setData]
  );

  const handleInlineAmountChange = useCallback((id: string, amount: number | null) => {
    setData((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((item) => {
        if (item.id === id) {
          const isEntered = amount !== null && amount > 0;
          const amountFormatted = isEntered
            ? `${new Intl.NumberFormat('vi-VN').format(amount)}đ`
            : 'Chưa nhập';
          return {
            ...item,
            amount,
            amountFormatted,
            isEntered,
          };
        }
        return item;
      });

      const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
      const enteredCount = items.filter((i) => i.isEntered).length;

      const updatedData: FixedExpenseData = {
        ...prev,
        items,
        totalAmount: total,
        totalAmountFormatted: new Intl.NumberFormat('vi-VN').format(total),
        heroNote: `${enteredCount} khoản đã ghi · chưa bao gồm trọ`,
      };

      // Debounced auto-save to ensure data persists even if user exits without clicking save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        fixedExpenseRepository.saveFixedExpenses(updatedData).catch(() => {});
      }, 800);

      return updatedData;
    });
  }, [setData]);

  const handleUpdateNote = useCallback(
    (
      id: string,
      extraNote?: { title: string; description: string } | null,
      subtitle?: string
    ) => {
      setData((prev) => {
        if (!prev) return prev;
        const items = prev.items.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              subtitle: subtitle !== undefined ? subtitle : item.subtitle,
              extraNote: extraNote === null ? undefined : (extraNote || item.extraNote),
            };
          }
          return item;
        });
        return {
          ...prev,
          items,
        };
      });
    },
    [setData]
  );

  const handleUpdateItem = useCallback(
    async (
      id: string,
      amount: number | null,
      subtitle: string,
      extraNote?: { title: string; description: string } | null
    ) => {
      const label = selectedLabelRef.current;
      try {
        const updated = await fixedExpenseRepository.updateItem(
          id,
          {
            amount,
            subtitle,
            extraNote,
          },
          label
        );
        // Drop the result if the month changed while saving.
        if (selectedLabelRef.current !== label) return;
        setData(updated);
      } catch (err) {
        if (selectedLabelRef.current !== label) return;
        setError((err as Error).message || 'Không thể cập nhật khoản chi');
      }
    },
    [setData]
  );

  const handleSave = useCallback(
    async (onSuccess?: () => void): Promise<boolean> => {
      if (!data) return false;
      try {
        setIsSaving(true);
        setError(null);
        await fixedExpenseRepository.saveFixedExpenses(data);
        if (onSuccess) {
          onSuccess();
        }
        return true;
      } catch (err) {
        setError((err as Error).message || 'Có lỗi xảy ra khi lưu chi phí');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [data]
  );

  const displayMonth = useMemo(() => {
    return data?.month || selectedMonthLabel;
  }, [data?.month, selectedMonthLabel]);

  return {
    data,
    selectedMonth,
    selectedYear,
    displayMonth,
    editingItem,
    isLoading,
    isRefreshing,
    isSaving,
    error,
    setEditingItem,
    handleRefresh,
    handleSelectMonthYear,
    handleInlineAmountChange,
    handleUpdateNote,
    handleUpdateItem,
    handleSave,
  };
}
