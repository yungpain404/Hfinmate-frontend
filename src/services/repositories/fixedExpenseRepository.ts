import { FixedExpenseData } from '../../models/fixedExpense.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import {
  getScopedItem,
  setScopedItem,
  migrateLegacyKey,
} from '../storage/accountScope';

import {
  currentMonthRef,
  isSameMonth,
  monthLabel,
  parseMonthLabel,
  resolveMonthLabel,
} from '../../utils/month';

import { expenseEvents } from '../eventBus';

const FIXED_STORAGE_KEY = 'fixed_expenses_data';

/** Blank sheet for a given month, evaluated at call time (never frozen). */
const createDefaultFixedData = (month?: string): FixedExpenseData => {
  const ref = resolveMonthLabel(month);
  return {
    month: monthLabel(ref),
    title: 'Khoản riêng, dễ nhớ',
    subtitle: 'Gửi xe, nước, xăng và trọ ở một nơi.',
    totalAmount: 0,
    totalAmountFormatted: '0',
    heroNote: '0 khoản đã ghi · chưa bao gồm trọ',
    sectionTitle: 'Các khoản cố định',
    sectionCountText: '4 mục riêng',
    items: [
      {
        id: 'fix_1',
        title: 'Gửi xe',
        subtitle: `Chi phí gửi xe tháng ${ref.month}`,
        iconType: 'parking',
        amount: null,
        amountFormatted: 'Chưa nhập',
        isEntered: false,
      },
      {
        id: 'fix_2',
        title: 'Nước',
        subtitle: `Tiền nước sinh hoạt tháng ${ref.month}`,
        iconType: 'water',
        amount: null,
        amountFormatted: 'Chưa nhập',
        isEntered: false,
      },
      {
        id: 'fix_3',
        title: 'Xăng',
        subtitle: `Chi phí xăng tháng ${ref.month}`,
        iconType: 'fuel',
        amount: null,
        amountFormatted: 'Chưa nhập',
        isEntered: false,
      },
      {
        id: 'fix_4',
        title: 'Trọ',
        subtitle: `Tiền phòng trọ tháng ${ref.month}`,
        iconType: 'rent',
        amount: null,
        amountFormatted: 'Chưa nhập',
        isEntered: false,
      },
    ],
    alertNote: 'Các khoản chưa nhập không được tính vào tổng chi phí.',
  };
};

const hasEnteredData = (data?: FixedExpenseData | null): boolean =>
  !!data &&
  ((data.totalAmount && data.totalAmount > 0) ||
    !!(data.items && data.items.some((it) => it.amount !== null && it.amount > 0)));

export interface IFixedExpenseRepository {
  getFixedExpenses(month?: string): Promise<FixedExpenseData>;
  updateItem(
    id: string,
    updates: {
      amount?: number | null;
      subtitle?: string;
      extraNote?: { title: string; description: string } | null;
    },
    month?: string
  ): Promise<FixedExpenseData>;
  updateMonth(month: string): Promise<FixedExpenseData>;
  saveFixedExpenses(data: FixedExpenseData): Promise<FixedExpenseData>;
}

const cleanData = (data: FixedExpenseData): FixedExpenseData => {
  return {
    ...data,
    items: data.items.map((it) => {
      if (
        it.extraNote &&
        (it.extraNote.title?.toLowerCase().includes('nguyên') ||
          it.extraNote.description?.toLowerCase().includes('nguyên'))
      ) {
        return { ...it, extraNote: undefined };
      }
      return it;
    }),
  };
};

class FixedExpenseRepository implements IFixedExpenseRepository {
  private async readStored(): Promise<FixedExpenseData | null> {
    const migrated = await migrateLegacyKey<FixedExpenseData>(FIXED_STORAGE_KEY);
    if (migrated !== null && migrated !== undefined) return migrated;
    return getScopedItem<FixedExpenseData>(FIXED_STORAGE_KEY);
  }

  private async writeStored(data: FixedExpenseData): Promise<void> {
    await setScopedItem(FIXED_STORAGE_KEY, data);
  }

  async getFixedExpenses(month?: string): Promise<FixedExpenseData> {
    const targetRef = resolveMonthLabel(month);
    const targetLabel = monthLabel(targetRef);

    const stored = await this.readStored();
    // Local cache only counts for the month it belongs to. Otherwise the
    // previous month's amounts would be pushed back into the new month.
    const storedMatches =
      stored === null ||
      isSameMonth(parseMonthLabel(stored.month) ?? currentMonthRef(), targetRef);

    const localHasData = storedMatches && hasEnteredData(stored);

    try {
      const response = await apiClient.get<ApiResponse<FixedExpenseData>>('/fixed-expenses', {
        params: { month: targetLabel },
      });
      if (response.data && response.data.data) {
        const data = cleanData(response.data.data);
        const backendHasData = hasEnteredData(data);
        // The backend must answer with the sheet of the requested month.
        // A server that is not month-aware yet would reply with another
        // month's sheet - it must never be shown for the requested month.
        const dataRef = parseMonthLabel(data.month);
        const backendMonthMatches = !!dataRef && isSameMonth(dataRef, targetRef);

        if (backendHasData && backendMonthMatches) {
          await this.writeStored(data);
          return data;
        }

        // Backend returned an empty sheet, but local has valid expenses
        // recorded for THIS month - push them back up.
        if (localHasData && stored) {
          apiClient.put('/fixed-expenses', stored).catch(() => {});
          return cleanData(stored);
        }

        if (!backendMonthMatches) {
          // Another month's data: start this month clean instead of reusing it.
          return createDefaultFixedData(targetLabel);
        }

        await this.writeStored(data);
        return data;
      }
    } catch {
      // Backend not reached or offline, fallback to per-account local storage
    }

    if (!stored) {
      const fresh = createDefaultFixedData(targetLabel);
      await this.writeStored(fresh);
      return fresh;
    }

    // Data from another month must never be shown for the requested one.
    if (!storedMatches) {
      return createDefaultFixedData(targetLabel);
    }

    return cleanData(stored);
  }

  async updateItem(
    id: string,
    updates: {
      amount?: number | null;
      subtitle?: string;
      extraNote?: { title: string; description: string } | null;
    },
    month?: string
  ): Promise<FixedExpenseData> {
    try {
      const response = await apiClient.put<ApiResponse<FixedExpenseData>>(
        `/fixed-expenses/items/${id}`,
        month ? { ...updates, month } : updates
      );
      if (response.data && response.data.data) {
        const data = response.data.data;
        await this.writeStored(data);
        return data;
      }
    } catch {
      // Fallback local update
    }

    const data = await this.getFixedExpenses(month);
    const items = data.items.map((item) => {
      if (item.id === id) {
        const hasAmount = updates.amount !== undefined ? updates.amount : item.amount;
        const isEntered = hasAmount !== null && hasAmount > 0;
        const amountFormatted = isEntered
          ? `${new Intl.NumberFormat('vi-VN').format(hasAmount!)}đ`
          : 'Chưa nhập';

        return {
          ...item,
          amount: hasAmount,
          amountFormatted,
          isEntered,
          subtitle: updates.subtitle !== undefined ? updates.subtitle : item.subtitle,
          extraNote:
            updates.extraNote !== undefined
              ? updates.extraNote === null
                ? undefined
                : updates.extraNote
              : item.extraNote,
        };
      }
      return item;
    });

    const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const enteredCount = items.filter((i) => i.isEntered).length;

    const updated: FixedExpenseData = {
      ...data,
      items,
      totalAmount: total,
      totalAmountFormatted: new Intl.NumberFormat('vi-VN').format(total),
      heroNote: `${enteredCount} khoản đã ghi · chưa bao gồm trọ`,
    };

    await this.writeStored(updated);
    expenseEvents.notify();
    return updated;
  }

  async updateMonth(month: string): Promise<FixedExpenseData> {
    try {
      const response = await apiClient.put<ApiResponse<FixedExpenseData>>(
        '/fixed-expenses/month',
        { month }
      );
      if (response.data && response.data.data) {
        const data = response.data.data;
        await this.writeStored(data);
        expenseEvents.notify();
        return data;
      }
    } catch {
      // Fallback
    }

    const data = await this.getFixedExpenses();
    const updated: FixedExpenseData = {
      ...data,
      month,
    };
    await this.writeStored(updated);
    expenseEvents.notify();
    return updated;
  }

  async saveFixedExpenses(data: FixedExpenseData): Promise<FixedExpenseData> {
    try {
      const response = await apiClient.put<ApiResponse<FixedExpenseData>>(
        '/fixed-expenses',
        data
      );
      if (response.data && response.data.data) {
        const saved = response.data.data;
        await this.writeStored(saved);
        expenseEvents.notify();
        return saved;
      }
    } catch {
      // Fallback
    }

    await this.writeStored(data);
    expenseEvents.notify();
    return data;
  }
}

export const fixedExpenseRepository: IFixedExpenseRepository =
  new FixedExpenseRepository();
