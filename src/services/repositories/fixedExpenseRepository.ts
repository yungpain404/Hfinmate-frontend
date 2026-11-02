import { FixedExpenseData } from '../../models/fixedExpense.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import {
  getScopedItem,
  setScopedItem,
  migrateLegacyKey,
} from '../storage/accountScope';

import {
  MonthRef,
  isSameMonth,
  monthKey,
  monthLabel,
  parseMonthLabel,
  resolveMonthLabel,
} from '../../utils/month';

import { expenseEvents } from '../eventBus';

const FIXED_STORAGE_KEY = 'fixed_expenses_data';
/**
 * Sheets of every month this device has seen, keyed by `YYYY-MM`.
 * Keeping them apart is what lets the app show last month's real figures (and
 * a clean new month) even when the backend can only hold one open sheet.
 */
const FIXED_BY_MONTH_STORAGE_KEY = 'fixed_expenses_by_month';

type FixedSheetsByMonth = Record<string, FixedExpenseData>;

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

/** `YYYY-MM` key of a sheet, or `null` when its month label cannot be read. */
const sheetMonthKey = (data?: FixedExpenseData | null): string | null => {
  const ref = parseMonthLabel(data?.month);
  return ref ? monthKey(ref) : null;
};

/** Months named by the generated item subtitles (`Chi phí gửi xe tháng 10`). */
const subtitleMonths = (data?: FixedExpenseData | null): number[] => {
  const months: number[] = [];
  for (const item of data?.items ?? []) {
    const match = /tháng\s*(\d{1,2})/i.exec(item.subtitle || '');
    if (!match) continue;
    const value = Number(match[1]);
    if (value >= 1 && value <= 12) months.push(value);
  }
  return months;
};

/**
 * True when the sheet really belongs to `target`.
 *
 * A backend that is not month-aware answers a month switch by re-labelling the
 * sheet it currently holds: `month` reads "Tháng 11, 2026" while the generated
 * item subtitles still describe the month the amounts were typed in
 * (`Chi phí gửi xe tháng 10`). Accepting that copy is exactly how last month's
 * money reappears as the new month's total, so a subtitle naming another month
 * means "this is some other month's sheet".
 */
const contentBelongsToMonth = (data: FixedExpenseData, target: MonthRef): boolean => {
  const named = subtitleMonths(data);
  if (named.length === 0) return true;
  return named.every((value) => value === target.month);
};

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

  /** Every sheet this device has recorded, keyed by `YYYY-MM`. */
  private async readArchive(): Promise<FixedSheetsByMonth> {
    const stored = await getScopedItem<FixedSheetsByMonth>(FIXED_BY_MONTH_STORAGE_KEY);
    const archive: FixedSheetsByMonth = stored && typeof stored === 'object' ? { ...stored } : {};
    // Builds that only kept the most recent sheet: adopt it before anything
    // overwrites that single slot, so its month keeps its recorded amounts.
    const last = await this.readStored();
    const lastKey = sheetMonthKey(last);
    if (last && lastKey && !archive[lastKey]) archive[lastKey] = last;
    return archive;
  }

  private async writeArchive(archive: FixedSheetsByMonth): Promise<void> {
    await setScopedItem(FIXED_BY_MONTH_STORAGE_KEY, archive);
  }

  /** Remembers `data` both as the last read sheet and under its own month. */
  private async remember(data: FixedExpenseData): Promise<void> {
    const archive = await this.readArchive();
    await this.writeStored(data);
    const key = sheetMonthKey(data);
    if (!key) return;
    archive[key] = data;
    await this.writeArchive(archive);
  }

  /**
   * The sheet this device recorded for `key`.
   * A sheet whose content points at another month is ignored - it is a
   * carry-over copy, not a recording of the requested month.
   */
  private async localSheet(key: string, target: MonthRef): Promise<FixedExpenseData | null> {
    const archive = await this.readArchive();
    const sheet = archive[key];
    if (!sheet) return null;
    const cleaned = cleanData(sheet);
    return contentBelongsToMonth(cleaned, target) ? cleaned : null;
  }

  async getFixedExpenses(month?: string): Promise<FixedExpenseData> {
    const targetRef = resolveMonthLabel(month);
    const targetLabel = monthLabel(targetRef);
    const targetKey = monthKey(targetRef);
    // What this device has recorded for the month, if anything.
    const localSheet = await this.localSheet(targetKey, targetRef);

    try {
      const response = await apiClient.get<ApiResponse<FixedExpenseData>>('/fixed-expenses', {
        params: { month: targetLabel },
      });
      if (response.data && response.data.data) {
        const data = cleanData(response.data.data);
        const dataRef = parseMonthLabel(data.month);
        const backendMonthMatches = !!dataRef && isSameMonth(dataRef, targetRef);

        // The backend answered for the requested month AND its amounts belong
        // to that month: safe to show, and it becomes this month's record.
        if (backendMonthMatches && contentBelongsToMonth(data, targetRef)) {
          // The backend has nothing for this month yet, but this device does:
          // push the recorded sheet back up instead of losing it.
          if (!hasEnteredData(data) && localSheet && hasEnteredData(localSheet)) {
            apiClient.put('/fixed-expenses', localSheet).catch(() => {});
            await this.remember(localSheet);
            return localSheet;
          }
          await this.remember(data);
          return data;
        }

        // The backend handed over another month's sheet, merely re-labelled as
        // this one. Show what this device recorded for the month instead - or a
        // clean sheet, so a brand new month always starts at 0.
        return localSheet ?? createDefaultFixedData(targetLabel);
      }
    } catch {
      // Backend not reached or offline, fallback to per-account local storage
    }

    if (localSheet) return localSheet;

    const fresh = createDefaultFixedData(targetLabel);
    await this.remember(fresh);
    return fresh;
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
        const data = cleanData(response.data.data);
        // Only keep an answer whose content belongs to the month it claims -
        // a re-labelled copy of another month must not overwrite this record.
        if (contentBelongsToMonth(data, resolveMonthLabel(month ?? data.month))) {
          await this.remember(data);
          return data;
        }
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

    await this.remember(updated);
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
        const data = cleanData(response.data.data);
        // Backends that are not month-aware switch months by re-labelling the
        // sheet they hold. Such a copy is not this month's data - fall through
        // and let the re-read below resolve the real sheet of the month.
        if (contentBelongsToMonth(data, resolveMonthLabel(month))) {
          await this.remember(data);
          expenseEvents.notify();
          return data;
        }
      }
    } catch {
      // Fallback
    }

    const data = await this.getFixedExpenses(month);
    await this.remember(data);
    expenseEvents.notify();
    return data;
  }

  async saveFixedExpenses(data: FixedExpenseData): Promise<FixedExpenseData> {
    try {
      const response = await apiClient.put<ApiResponse<FixedExpenseData>>(
        '/fixed-expenses',
        data
      );
      if (response.data && response.data.data) {
        const saved = cleanData(response.data.data);
        await this.remember(saved);
        expenseEvents.notify();
        return saved;
      }
    } catch {
      // Fallback
    }

    await this.remember(data);
    expenseEvents.notify();
    return data;
  }
}

export const fixedExpenseRepository: IFixedExpenseRepository =
  new FixedExpenseRepository();
