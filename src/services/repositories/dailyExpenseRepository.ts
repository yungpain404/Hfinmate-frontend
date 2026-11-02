import { DailyExpenseSheet } from '../../models/dailyExpense.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import {
  getScopedItem,
  setScopedItem,
  migrateLegacyKey,
} from '../storage/accountScope';
import { transactionRepository } from './transactionRepository';
import { mapCategoryNameToBackendId } from '../../models/expenseCategory.model';
import { expenseEvents } from '../eventBus';
import { Transaction } from '../../models/transaction.model';

const DAILY_SHEET_KEY_PREFIX = 'daily_expense_sheet_';
const DAILY_RECORDED_DATES_KEY = 'daily_recorded_sheet_dates';
const TRANSACTIONS_STORAGE_KEY = 'transactions_data';

const getTodayDateKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatNumberString = (amount: number): string => {
  if (amount === 0) return '';
  return new Intl.NumberFormat('vi-VN').format(amount);
};

const getDisplayDateFromKey = (dateKey: string): string => {
  const parts = dateKey.split('-');
  if (parts.length === 3) {
    return `${parseInt(parts[2], 10)} tháng ${parseInt(parts[1], 10)}`;
  }
  return dateKey;
};

const createEmptySheet = (dateKey: string): DailyExpenseSheet => ({
  date: dateKey,
  displayDate: getDisplayDateFromKey(dateKey),
  footerNote: 'Xăng, nước, gửi xe và trọ được ghi riêng ở mục Cố định.',
  items: [
    {
      id: `row_${Date.now()}_1`,
      name: '',
      amount: 0,
      amountInput: '',
      category: 'Ăn uống',
    },
  ],
  totalAmount: 0,
  formulaText: '0đ',
});

export interface IDailyExpenseRepository {
  getSheet(dateKey?: string): Promise<DailyExpenseSheet>;
  saveSheet(sheet: DailyExpenseSheet): Promise<DailyExpenseSheet>;
  getAllRecordedSheets(): Promise<DailyExpenseSheet[]>;
}

class DailyExpenseRepository implements IDailyExpenseRepository {
  private sheetKey(dateKey: string): string {
    return `${DAILY_SHEET_KEY_PREFIX}${dateKey}`;
  }

  private async readSheet(dateKey: string): Promise<DailyExpenseSheet | null> {
    const migrated = await migrateLegacyKey<DailyExpenseSheet>(this.sheetKey(dateKey));
    if (migrated !== null && migrated !== undefined) return migrated;
    return getScopedItem<DailyExpenseSheet>(this.sheetKey(dateKey));
  }

  private async writeSheet(dateKey: string, sheet: DailyExpenseSheet): Promise<void> {
    await setScopedItem(this.sheetKey(dateKey), sheet);
  }

  private async readDates(): Promise<string[]> {
    const migrated = await migrateLegacyKey<string[]>(DAILY_RECORDED_DATES_KEY);
    if (migrated !== null && migrated !== undefined) return migrated;
    return (await getScopedItem<string[]>(DAILY_RECORDED_DATES_KEY)) || [];
  }

  private async writeDates(dates: string[]): Promise<void> {
    await setScopedItem(DAILY_RECORDED_DATES_KEY, dates);
  }

  async getSheet(dateKey: string = getTodayDateKey()): Promise<DailyExpenseSheet> {
    const stored = await this.readSheet(dateKey);
    const localHasData =
      stored &&
      ((stored.totalAmount && stored.totalAmount > 0) ||
        (stored.items && stored.items.some((i) => i.amount > 0 || (i.name && i.name.trim().length > 0))));

    try {
      const response = await apiClient.get<ApiResponse<DailyExpenseSheet>>(
        `/daily-expenses/${dateKey}`
      );
      if (response.data && response.data.data) {
        const sheet = response.data.data;
        const backendHasData =
          (sheet.totalAmount && sheet.totalAmount > 0) ||
          (sheet.items && sheet.items.some((i) => i.amount > 0));

        // Backend (per Google account) wins when it has real data
        if (backendHasData) {
          await this.writeSheet(dateKey, sheet);
          await this.syncLocalTransactions(sheet);
          return sheet;
        }

        if (localHasData && stored) {
          apiClient.post('/daily-expenses', stored).catch(() => {});
          return stored;
        }

        await this.writeSheet(dateKey, sheet);
        return sheet;
      }
    } catch {
      // Backend not reached or offline, fallback to per-account local storage
    }

    if (localHasData && stored) {
      return stored;
    }

    if (!stored) {
      const emptySheet = createEmptySheet(dateKey);
      await this.writeSheet(dateKey, emptySheet);
      return emptySheet;
    }
    return stored;
  }

  private async syncLocalTransactions(sheet: DailyExpenseSheet): Promise<void> {
    try {
      const migrated = await migrateLegacyKey<Transaction[]>(TRANSACTIONS_STORAGE_KEY);
      const currentTxList =
        migrated !== null && migrated !== undefined
          ? migrated
          : (await getScopedItem<Transaction[]>(TRANSACTIONS_STORAGE_KEY)) || [];
      const filteredTxList = currentTxList.filter(
        (t) =>
          !(
            t.date === sheet.date &&
            (t.id.startsWith(`tx_daily_${sheet.date}`) ||
              t.note?.includes('Chi tiêu ngày') ||
              t.note?.includes('khoản chi trong ngày'))
          )
      );

      const validItems = (sheet.items || []).filter(
        (i) => (i.name && i.name.trim().length > 0) || (i.amount && i.amount > 0)
      );
      const newDailyTx: Transaction[] = [];

      for (const item of validItems) {
        if (item.amount > 0) {
          newDailyTx.push({
            id: `tx_daily_${sheet.date}_${item.id}`,
            title: item.name.trim() || 'Khoản chi',
            amount: item.amount,
            type: 'expense',
            category: mapCategoryNameToBackendId(item.category),
            date: sheet.date,
            note: `${item.category || 'Ăn uống'} (Chi tiêu ngày)`,
            status: 'completed',
            createdAt: new Date().toISOString(),
          });
        }
      }

      await setScopedItem(TRANSACTIONS_STORAGE_KEY, [...newDailyTx, ...filteredTxList]);
    } catch {
      // Ignore local storage sync error
    }
  }

  async saveSheet(sheet: DailyExpenseSheet): Promise<DailyExpenseSheet> {
    const validItems = (sheet.items || []).filter(
      (i) => (i.name && i.name.trim().length > 0) || (i.amount && i.amount > 0)
    );
    const calculatedTotal = validItems.reduce((sum, i) => sum + (i.amount || 0), 0);

    const parts = validItems
      .filter((item) => item.amount > 0)
      .map((item) => formatNumberString(item.amount));
    const formulaText =
      parts.length > 0
        ? `${parts.join(' + ')} = ${new Intl.NumberFormat('vi-VN').format(calculatedTotal)}đ`
        : '0đ';

    const normalizedSheet: DailyExpenseSheet = {
      ...sheet,
      items: validItems,
      totalAmount: calculatedTotal,
      formulaText,
    };

    try {
      const response = await apiClient.post<ApiResponse<DailyExpenseSheet>>(
        '/daily-expenses',
        normalizedSheet
      );
      if (response.data && response.data.data) {
        const saved = response.data.data;
        await this.writeSheet(sheet.date, saved);

        const dates = await this.readDates();
        if (saved.totalAmount === 0) {
          await this.writeDates(dates.filter((d) => d !== sheet.date));
        } else if (!dates.includes(sheet.date)) {
          await this.writeDates([...dates, sheet.date]);
        }

        await this.syncLocalTransactions(saved);
        expenseEvents.notify();
        return saved;
      }
    } catch {
      // Fallback local save
    }

    await this.writeSheet(sheet.date, normalizedSheet);

    const dates = await this.readDates();
    if (normalizedSheet.totalAmount === 0) {
      await this.writeDates(dates.filter((d) => d !== sheet.date));
    } else if (!dates.includes(sheet.date)) {
      await this.writeDates([...dates, sheet.date]);
    }

    await this.syncLocalTransactions(normalizedSheet);
    expenseEvents.notify();
    return normalizedSheet;
  }

  async getAllRecordedSheets(): Promise<DailyExpenseSheet[]> {
    const dates = await this.readDates();
    const localSheets: DailyExpenseSheet[] = [];
    for (const d of dates) {
      const sheet = await this.readSheet(d);
      if (sheet && ((sheet.totalAmount && sheet.totalAmount > 0) || (sheet.items && sheet.items.some((i) => i.amount > 0)))) {
        localSheets.push(sheet);
      }
    }

    try {
      const response = await apiClient.get<ApiResponse<DailyExpenseSheet[]>>('/daily-expenses');
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const backendSheets = response.data.data;
        const sheetMap = new Map<string, DailyExpenseSheet>();

        for (const bs of backendSheets) {
          if (bs.date) {
            sheetMap.set(bs.date, bs);
            await this.writeSheet(bs.date, bs);
          }
        }

        for (const ls of localSheets) {
          const bs = sheetMap.get(ls.date);
          if (!bs || (bs.totalAmount === 0 && ls.totalAmount > 0)) {
            sheetMap.set(ls.date, ls);
            apiClient.post('/daily-expenses', ls).catch(() => {});
          }
        }

        const merged = Array.from(sheetMap.values());
        await this.writeDates(merged.filter((s) => s.totalAmount > 0).map((s) => s.date));
        return merged;
      }
    } catch {
      // Fallback
    }

    return localSheets;
  }
}

export const dailyExpenseRepository: IDailyExpenseRepository =
  new DailyExpenseRepository();
