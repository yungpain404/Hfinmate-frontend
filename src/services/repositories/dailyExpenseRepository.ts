import { DailyExpenseSheet } from '../../models/dailyExpense.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import { storageService } from '../storage/storageService';
import { transactionRepository } from './transactionRepository';

const DAILY_SHEET_KEY_PREFIX = 'daily_expense_sheet_';
const DAILY_RECORDED_DATES_KEY = 'daily_recorded_sheet_dates';

const getTodayDateKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  async getSheet(dateKey: string = getTodayDateKey()): Promise<DailyExpenseSheet> {
    try {
      const response = await apiClient.get<ApiResponse<DailyExpenseSheet>>(
        `/daily-expenses/${dateKey}`
      );
      if (response.data && response.data.data) {
        const sheet = response.data.data;
        await storageService.setItem(`${DAILY_SHEET_KEY_PREFIX}${dateKey}`, sheet);
        return sheet;
      }
    } catch {
      // Backend not reached or offline, fallback to local storage
    }

    const stored = await storageService.getItem<DailyExpenseSheet>(
      `${DAILY_SHEET_KEY_PREFIX}${dateKey}`
    );
    if (!stored) {
      const emptySheet = createEmptySheet(dateKey);
      await storageService.setItem(
        `${DAILY_SHEET_KEY_PREFIX}${dateKey}`,
        emptySheet
      );
      return emptySheet;
    }
    return stored;
  }

  async saveSheet(sheet: DailyExpenseSheet): Promise<DailyExpenseSheet> {
    try {
      const response = await apiClient.post<ApiResponse<DailyExpenseSheet>>(
        '/daily-expenses',
        sheet
      );
      if (response.data && response.data.data) {
        const saved = response.data.data;
        await storageService.setItem(`${DAILY_SHEET_KEY_PREFIX}${sheet.date}`, saved);
        return saved;
      }
    } catch {
      // Fallback local save
    }

    await storageService.setItem(
      `${DAILY_SHEET_KEY_PREFIX}${sheet.date}`,
      sheet
    );

    // Save date in index of recorded dates
    const dates = (await storageService.getItem<string[]>(DAILY_RECORDED_DATES_KEY)) || [];
    if (!dates.includes(sheet.date)) {
      dates.push(sheet.date);
      await storageService.setItem(DAILY_RECORDED_DATES_KEY, dates);
    }

    // Synchronize day with Transaction repository
    if (sheet.items.length > 0) {
      const summaryTitle = sheet.items.map((i) => i.name).filter(Boolean).join(', ');
      const dominantCategory = sheet.items[0]?.category || 'Ăn uống';
      await transactionRepository.create({
        title: summaryTitle || 'Chi tiêu ngày',
        amount: sheet.totalAmount,
        type: 'expense',
        category: 'other',
        date: sheet.date,
        note: `${sheet.items.length} khoản chi trong ngày (${dominantCategory})`,
      });
    }

    return sheet;
  }

  async getAllRecordedSheets(): Promise<DailyExpenseSheet[]> {
    try {
      const response = await apiClient.get<ApiResponse<DailyExpenseSheet[]>>('/daily-expenses');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const dates = (await storageService.getItem<string[]>(DAILY_RECORDED_DATES_KEY)) || [];
    const sheets: DailyExpenseSheet[] = [];
    for (const d of dates) {
      const sheet = await storageService.getItem<DailyExpenseSheet>(`${DAILY_SHEET_KEY_PREFIX}${d}`);
      if (sheet) sheets.push(sheet);
    }
    return sheets;
  }
}

export const dailyExpenseRepository: IDailyExpenseRepository =
  new DailyExpenseRepository();
