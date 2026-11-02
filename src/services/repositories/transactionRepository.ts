import {
  Transaction,
  CreateTransactionDTO,
  TransactionFilter,
} from '../../models/transaction.model';
import { DailyExpenseSheet } from '../../models/dailyExpense.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import {
  getScopedItem,
  setScopedItem,
  migrateLegacyKey,
} from '../storage/accountScope';
import { INITIAL_TRANSACTIONS } from '../mock/mockData';

import { expenseEvents } from '../eventBus';

const STORAGE_KEY = 'transactions_data';

export interface ITransactionRepository {
  getAll(filter?: TransactionFilter): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  create(dto: CreateTransactionDTO): Promise<Transaction>;
  delete(id: string): Promise<void>;
  resetToInitial(): Promise<Transaction[]>;
}

class TransactionRepository implements ITransactionRepository {
  private async getStoredList(): Promise<Transaction[]> {
    const migrated = await migrateLegacyKey<Transaction[]>(STORAGE_KEY);
    if (migrated !== null && migrated !== undefined) return migrated;
    const list = await getScopedItem<Transaction[]>(STORAGE_KEY);
    if (!list) {
      await setScopedItem(STORAGE_KEY, INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    return list;
  }

  private async setStoredList(list: Transaction[]): Promise<void> {
    await setScopedItem(STORAGE_KEY, list);
  }

  async getAll(filter?: TransactionFilter): Promise<Transaction[]> {
    let items = await this.getStoredList();
    try {
      const response = await apiClient.get<ApiResponse<Transaction[]>>('/transactions', {
        params: filter,
      });
      if (response.data && response.data.data) {
        const backendItems = response.data.data;
        // Union merge keyed by id: backend is canonical per Google account,
        // local-only (offline) items are preserved instead of dropped.
        const byId = new Map<string, Transaction>();
        for (const t of backendItems) byId.set(t.id, t);
        for (const t of items) {
          if (!byId.has(t.id)) byId.set(t.id, t);
        }
        items = Array.from(byId.values());
        await this.setStoredList(items);
      }
    } catch {
      // Backend not reached or offline, fallback to per-account local storage
    }

    if (filter) {
      if (filter.type && filter.type !== 'all') {
        items = items.filter((item) => item.type === filter.type);
      }
      if (filter.category && filter.category !== 'all') {
        items = items.filter((item) => item.category === filter.category);
      }
      if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
        const query = filter.searchQuery.toLowerCase().trim();
        items = items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            (item.note && item.note.toLowerCase().includes(query))
        );
      }
    }

    return items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getById(id: string): Promise<Transaction | null> {
    try {
      const response = await apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}`);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const items = await this.getStoredList();
    return items.find((item) => item.id === id) || null;
  }

  async create(dto: CreateTransactionDTO): Promise<Transaction> {
    try {
      const response = await apiClient.post<ApiResponse<Transaction>>('/transactions', dto);
      if (response.data && response.data.data) {
        const newTx = response.data.data;
        const items = await this.getStoredList();
        await this.setStoredList([newTx, ...items]);
        expenseEvents.notify();
        return newTx;
      }
    } catch {
      // Fallback
    }

    const now = new Date();
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      title: dto.title.trim(),
      amount: Number(dto.amount),
      type: dto.type,
      category: dto.category,
      date: dto.date || now.toISOString().split('T')[0],
      note: dto.note?.trim(),
      status: 'completed',
      createdAt: now.toISOString(),
    };

    const items = await this.getStoredList();
    const updated = [newTx, ...items];
    await this.setStoredList(updated);
    expenseEvents.notify();

    return newTx;
  }

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/transactions/${id}`);
    } catch {
      // Ignore network failure and proceed with local deletion
    }

    const items = await this.getStoredList();
    const deletedTx = items.find((item) => item.id === id);
    const filtered = items.filter((item) => item.id !== id);
    await this.setStoredList(filtered);

    if (deletedTx && deletedTx.id.startsWith('tx_daily_')) {
      const sheetKey = `daily_expense_sheet_${deletedTx.date}`;
      const sheet =
        (await getScopedItem<DailyExpenseSheet>(sheetKey)) ||
        (await migrateLegacyKey<DailyExpenseSheet>(sheetKey));
      if (sheet) {
        const prefix = `tx_daily_${deletedTx.date}_`;
        const rowId = deletedTx.id.replace(prefix, '');
        sheet.items = (sheet.items || []).filter((i) => i.id !== rowId);
        sheet.totalAmount = (sheet.items || []).reduce((sum, i) => sum + (i.amount || 0), 0);
        const parts = (sheet.items || [])
          .filter((i) => i.amount > 0)
          .map((i) => new Intl.NumberFormat('vi-VN').format(i.amount));
        sheet.formulaText =
          parts.length > 0
            ? `${parts.join(' + ')} = ${new Intl.NumberFormat('vi-VN').format(sheet.totalAmount)}đ`
            : '0đ';
        await setScopedItem(sheetKey, sheet);
      }
    }

    expenseEvents.notify();
  }

  async resetToInitial(): Promise<Transaction[]> {
    try {
      const response = await apiClient.post<ApiResponse<Transaction[]>>('/transactions/reset');
      if (response.data && response.data.data) {
        const items = response.data.data;
        await this.setStoredList(items);
        expenseEvents.notify();
        return items;
      }
    } catch {
      // Fallback
    }

    await this.setStoredList(INITIAL_TRANSACTIONS);
    expenseEvents.notify();
    return INITIAL_TRANSACTIONS;
  }
}

export const transactionRepository: ITransactionRepository =
  new TransactionRepository();
