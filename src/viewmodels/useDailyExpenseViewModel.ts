import { useState, useEffect, useCallback, useMemo } from 'react';
import { DailyExpenseItemDraft, DailyExpenseSheet } from '../models/dailyExpense.model';
import { detectCategoryFromItemName } from '../models/expenseCategory.model';
import { dailyExpenseRepository } from '../services/repositories/dailyExpenseRepository';

function parseAmount(text: string): number {
  const clean = text.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

function formatNumberString(amount: number): string {
  if (amount === 0) return '';
  return new Intl.NumberFormat('vi-VN').format(amount);
}

function formatDateToVietnamese(date: Date): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${day} tháng ${month}`;
}

function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ViewModel: useDailyExpenseViewModel
 * Strictly encapsulates business logic, dynamic row calculations, and sheet saving
 */
export function useDailyExpenseViewModel(initialDate: Date = new Date()) {
  const [currentDateObj, setCurrentDateObj] = useState<Date>(initialDate);
  const [date, setDate] = useState<string>(formatDateToISO(initialDate));
  const [displayDate, setDisplayDate] = useState<string>(formatDateToVietnamese(initialDate));
  const [items, setItems] = useState<DailyExpenseItemDraft[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>('row_1');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadSheet = useCallback(async (dateKey: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const sheet = await dailyExpenseRepository.getSheet(dateKey);
      setDisplayDate(sheet.displayDate);
      setItems(sheet.items);
    } catch (err) {
      setError((err as Error).message || 'Không thể tải chi tiêu ngày');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSheet(date);
  }, [date, loadSheet]);

  const handleSelectDate = useCallback(
    (newDate: Date) => {
      setCurrentDateObj(newDate);
      const iso = formatDateToISO(newDate);
      const text = formatDateToVietnamese(newDate);
      setDate(iso);
      setDisplayDate(text);
      loadSheet(iso);
    },
    [loadSheet]
  );

  const handleNameChange = useCallback((id: string, name: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, name };
          const detected = detectCategoryFromItemName(name);
          if (detected && (item.category === 'Ăn uống' || !item.category)) {
            updated.category = detected;
          }
          return updated;
        }
        return item;
      })
    );
  }, []);

  const handleAmountChange = useCallback((id: string, text: string) => {
    const numeric = parseAmount(text);
    const formatted = numeric > 0 ? formatNumberString(numeric) : '';

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              amount: numeric,
              amountInput: formatted,
            }
          : item
      )
    );
  }, []);

  const handleCategoryChange = useCallback((id: string, category: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category } : item))
    );
  }, []);

  const handleAddRow = useCallback(() => {
    const newId = `row_${Date.now()}`;
    const newItem: DailyExpenseItemDraft = {
      id: newId,
      name: '',
      amount: 0,
      amountInput: '',
      category: 'Ăn uống',
    };
    setItems((prev) => [...prev, newItem]);
    setFocusedId(newId);
  }, []);

  const handleRemoveRow = useCallback((id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev; // keep at least 1 row
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  // Compute total and equation formula
  const { totalAmount, totalAmountFormatted, formulaText, autoCountText } =
    useMemo(() => {
      const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalFormatted = `${new Intl.NumberFormat('vi-VN').format(total)}đ`;

      const parts = items
        .filter((item) => item.amount > 0)
        .map((item) => formatNumberString(item.amount));

      const formula =
        parts.length > 0 ? `${parts.join(' + ')} = ${totalFormatted}` : '0đ';

      return {
        totalAmount: total,
        totalAmountFormatted: totalFormatted,
        formulaText: formula,
        autoCountText: `Tự tính từ ${items.length} khoản chi`,
      };
    }, [items]);

  const handleSave = useCallback(
    async (onSuccess?: () => void): Promise<boolean> => {
      try {
        setIsSaving(true);
        setError(null);

        const sheetData: DailyExpenseSheet = {
          date,
          displayDate,
          items: items.filter((i) => i.name.trim().length > 0 || i.amount > 0),
          totalAmount,
          formulaText,
          footerNote: 'Xăng, nước, gửi xe và trọ được ghi riêng ở mục Cố định.',
        };

        await dailyExpenseRepository.saveSheet(sheetData);
        if (onSuccess) {
          onSuccess();
        }
        return true;
      } catch (err) {
        setError((err as Error).message || 'Có lỗi xảy ra khi lưu chi tiêu');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [date, displayDate, items, totalAmount, formulaText]
  );

  return {
    date,
    displayDate,
    currentDateObj,
    items,
    focusedId,
    itemCountText: `${items.length} khoản`,
    totalAmount,
    totalAmountFormatted,
    formulaText,
    autoCountText,
    footerNote: 'Xăng, nước, gửi xe và trọ được ghi riêng ở mục Cố định.',
    isLoading,
    isSaving,
    error,
    setFocusedId,
    handleSelectDate,
    handleNameChange,
    handleAmountChange,
    handleCategoryChange,
    handleAddRow,
    handleRemoveRow,
    handleSave,
  };
}
