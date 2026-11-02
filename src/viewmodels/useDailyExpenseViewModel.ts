import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

function parseInitialDate(input?: Date | string): Date {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  const parts = input.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function createSnapshot(
  list: { name: string; amount: number; category?: string }[]
): string {
  const filtered = list
    .filter((i) => (i.name && i.name.trim().length > 0) || i.amount > 0)
    .map((i) => ({
      name: (i.name || '').trim(),
      amount: i.amount || 0,
      category: i.category || 'Ăn uống',
    }));
  return JSON.stringify(filtered);
}

/**
 * ViewModel: useDailyExpenseViewModel
 * Strictly encapsulates business logic, dynamic row calculations, snapshot comparison, and sheet saving
 */
export function useDailyExpenseViewModel(initialDateInput?: Date | string) {
  const parsedInitial = useMemo(() => parseInitialDate(initialDateInput), [initialDateInput]);
  const [currentDateObj, setCurrentDateObj] = useState<Date>(parsedInitial);
  const [date, setDate] = useState<string>(formatDateToISO(parsedInitial));
  const [displayDate, setDisplayDate] = useState<string>(formatDateToVietnamese(parsedInitial));
  const [items, setItems] = useState<DailyExpenseItemDraft[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>('row_1');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Snapshot tracking to prevent duplicate saves and redundant adds
  const initialSnapshotRef = useRef<string>('');

  const loadSheet = useCallback(async (dateKey: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const sheet = await dailyExpenseRepository.getSheet(dateKey);
      setDisplayDate(sheet.displayDate);
      if (sheet.items && sheet.items.length > 0) {
        const loadedDrafts = sheet.items.map((i) => ({
          ...i,
          category: i.category || 'Ăn uống',
          amountInput: i.amount > 0 ? formatNumberString(i.amount) : '',
        }));
        setItems(loadedDrafts);
        initialSnapshotRef.current = createSnapshot(sheet.items);
      } else {
        setItems([
          {
            id: `row_${Date.now()}_1`,
            name: '',
            amount: 0,
            amountInput: '',
            category: 'Ăn uống',
          },
        ]);
        initialSnapshotRef.current = '[]';
      }
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
          // Only auto-detect if the user hasn't explicitly chosen a category
          if (!(item as any).userChosenCategory) {
            const detected = detectCategoryFromItemName(name);
            if (detected) {
              updated.category = detected;
            }
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
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              category,
              userChosenCategory: true,
            }
          : item
      )
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
      if (prev.length <= 1) {
        // If there's only 1 row, clear it to 0 instead of refusing to delete
        return [
          {
            id: `row_${Date.now()}`,
            name: '',
            amount: 0,
            amountInput: '',
            category: 'Ăn uống',
          },
        ];
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  // Compute total and equation formula
  const { totalAmount, totalAmountFormatted, formulaText, autoCountText, validCount } =
    useMemo(() => {
      const valid = items.filter(
        (i) => (i.name && i.name.trim().length > 0) || (i.amount && i.amount > 0)
      );
      const total = valid.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalFormatted = `${new Intl.NumberFormat('vi-VN').format(total)}đ`;

      const parts = valid
        .filter((item) => item.amount > 0)
        .map((item) => formatNumberString(item.amount));

      const formula =
        parts.length > 0 ? `${parts.join(' + ')} = ${totalFormatted}` : '0đ';

      return {
        totalAmount: total,
        totalAmountFormatted: totalFormatted,
        formulaText: formula,
        autoCountText: `Tự tính từ ${valid.length} khoản chi`,
        validCount: valid.length,
      };
    }, [items]);

  const handleSave = useCallback(
    async (onSuccess?: () => void): Promise<boolean> => {
      if (isSaving) return false;
      try {
        setIsSaving(true);
        setError(null);

        const validItems = items.filter(
          (i) => (i.name && i.name.trim().length > 0) || (i.amount && i.amount > 0)
        );
        const actualTotal = validItems.reduce(
          (sum, item) => sum + (item.amount || 0),
          0
        );

        const currentSnapshot = createSnapshot(validItems);

        // If nothing has changed compared to loaded/saved data, return immediately without re-adding or re-saving
        if (currentSnapshot === initialSnapshotRef.current) {
          if (onSuccess) {
            onSuccess();
          }
          return true;
        }

        const parts = validItems
          .filter((item) => item.amount > 0)
          .map((item) => formatNumberString(item.amount));
        const actualFormula =
          parts.length > 0
            ? `${parts.join(' + ')} = ${new Intl.NumberFormat('vi-VN').format(actualTotal)}đ`
            : '0đ';

        const sheetData: DailyExpenseSheet = {
          date,
          displayDate,
          items: validItems,
          totalAmount: actualTotal,
          formulaText: actualFormula,
          footerNote: 'Xăng, nước, gửi xe và trọ được ghi riêng ở mục Cố định.',
        };

        await dailyExpenseRepository.saveSheet(sheetData);
        initialSnapshotRef.current = currentSnapshot;

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
    [isSaving, date, displayDate, items]
  );

  return {
    date,
    displayDate,
    currentDateObj,
    items,
    focusedId,
    itemCountText: `${validCount} khoản`,
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
