import { FixedExpenseData } from '../../models/fixedExpense.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import { storageService } from '../storage/storageService';

const FIXED_STORAGE_KEY = 'fixed_expenses_data';

const now = new Date();
const currentMonthStr = `Tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;

const DEFAULT_FIXED_DATA: FixedExpenseData = {
  month: currentMonthStr,
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
      subtitle: 'Chi phí gửi xe',
      iconType: 'parking',
      amount: null,
      amountFormatted: 'Chưa nhập',
      isEntered: false,
    },
    {
      id: 'fix_2',
      title: 'Nước',
      subtitle: 'Nước uống',
      iconType: 'water',
      amount: null,
      amountFormatted: 'Chưa nhập',
      isEntered: false,
    },
    {
      id: 'fix_3',
      title: 'Xăng',
      subtitle: 'Chi phí xăng xe',
      iconType: 'fuel',
      amount: null,
      amountFormatted: 'Chưa nhập',
      isEntered: false,
    },
    {
      id: 'fix_4',
      title: 'Trọ',
      subtitle: 'Chưa có số tiền trong ghi chép',
      iconType: 'rent',
      amount: null,
      amountFormatted: 'Chưa nhập',
      isEntered: false,
    },
  ],
  alertNote: 'Tiền trọ chưa nhập, không được xem là 0đ hoặc đã thanh toán.',
};

export interface IFixedExpenseRepository {
  getFixedExpenses(): Promise<FixedExpenseData>;
  updateItem(
    id: string,
    updates: {
      amount?: number | null;
      subtitle?: string;
      extraNote?: { title: string; description: string } | null;
    }
  ): Promise<FixedExpenseData>;
  updateMonth(month: string): Promise<FixedExpenseData>;
  saveFixedExpenses(data: FixedExpenseData): Promise<FixedExpenseData>;
}

class FixedExpenseRepository implements IFixedExpenseRepository {
  async getFixedExpenses(): Promise<FixedExpenseData> {
    try {
      const response = await apiClient.get<ApiResponse<FixedExpenseData>>('/fixed-expenses');
      if (response.data && response.data.data) {
        const data = response.data.data;
        await storageService.setItem(FIXED_STORAGE_KEY, data);
        return data;
      }
    } catch {
      // Backend not reached or offline, fallback to local storage
    }

    const stored = await storageService.getItem<FixedExpenseData>(FIXED_STORAGE_KEY);
    if (!stored) {
      await storageService.setItem(FIXED_STORAGE_KEY, DEFAULT_FIXED_DATA);
      return DEFAULT_FIXED_DATA;
    }
    return stored;
  }

  async updateItem(
    id: string,
    updates: {
      amount?: number | null;
      subtitle?: string;
      extraNote?: { title: string; description: string } | null;
    }
  ): Promise<FixedExpenseData> {
    try {
      const response = await apiClient.put<ApiResponse<FixedExpenseData>>(
        `/fixed-expenses/items/${id}`,
        updates
      );
      if (response.data && response.data.data) {
        const data = response.data.data;
        await storageService.setItem(FIXED_STORAGE_KEY, data);
        return data;
      }
    } catch {
      // Fallback local update
    }

    const data = await this.getFixedExpenses();
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

    await storageService.setItem(FIXED_STORAGE_KEY, updated);
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
        await storageService.setItem(FIXED_STORAGE_KEY, data);
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
    await storageService.setItem(FIXED_STORAGE_KEY, updated);
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
        await storageService.setItem(FIXED_STORAGE_KEY, saved);
        return saved;
      }
    } catch {
      // Fallback
    }

    await storageService.setItem(FIXED_STORAGE_KEY, data);
    return data;
  }
}

export const fixedExpenseRepository: IFixedExpenseRepository =
  new FixedExpenseRepository();
