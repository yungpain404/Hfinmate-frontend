import { useState, useEffect, useCallback, useMemo } from 'react';
import { FixedExpenseData, FixedExpenseItem } from '../models/fixedExpense.model';
import { fixedExpenseRepository } from '../services/repositories/fixedExpenseRepository';

/**
 * ViewModel: useFixedExpenseViewModel
 * Strictly encapsulates state, item editing, month selection, calculations, and persistence for Fixed Expenses
 */
export function useFixedExpenseViewModel() {
  const now = new Date();
  const [data, setData] = useState<FixedExpenseData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [editingItem, setEditingItem] = useState<FixedExpenseItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const res = await fixedExpenseRepository.getFixedExpenses();
      setData(res);
    } catch (err) {
      setError((err as Error).message || 'Không thể tải chi phí cố định');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  const handleSelectMonthYear = useCallback(
    async (month: number, year: number) => {
      setSelectedMonth(month);
      setSelectedYear(year);
      const monthStr = `Tháng ${month}, ${year}`;
      try {
        const updated = await fixedExpenseRepository.updateMonth(monthStr);
        setData(updated);
      } catch (err) {
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

      return {
        ...prev,
        items,
        totalAmount: total,
        totalAmountFormatted: new Intl.NumberFormat('vi-VN').format(total),
        heroNote: `${enteredCount} khoản đã ghi · chưa bao gồm trọ`,
      };
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
      try {
        const updated = await fixedExpenseRepository.updateItem(id, {
          amount,
          subtitle,
          extraNote,
        });
        setData(updated);
      } catch (err) {
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
    return data?.month || `Tháng ${selectedMonth}, ${selectedYear}`;
  }, [data?.month, selectedMonth, selectedYear]);

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
