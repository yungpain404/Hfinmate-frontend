import {
  Transaction,
  CreateTransactionDTO,
  TransactionFilter,
} from '../../models/transaction.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import { storageService } from '../storage/storageService';
import { INITIAL_TRANSACTIONS } from '../mock/mockData';

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
    const list = await storageService.getItem<Transaction[]>(STORAGE_KEY);
    if (!list) {
      await storageService.setItem(STORAGE_KEY, INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    return list;
  }

  async getAll(filter?: TransactionFilter): Promise<Transaction[]> {
    try {
      const response = await apiClient.get<ApiResponse<Transaction[]>>('/transactions', {
        params: filter,
      });
      if (response.data && response.data.data) {
        const items = response.data.data;
        await storageService.setItem(STORAGE_KEY, items);
        return items;
      }
    } catch {
      // Backend not reached or offline, fallback to local storage
    }

    let items = await this.getStoredList();

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
        await storageService.setItem(STORAGE_KEY, [newTx, ...items]);
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
    await storageService.setItem(STORAGE_KEY, updated);

    return newTx;
  }

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/transactions/${id}`);
    } catch {
      // Ignore network failure and proceed with local deletion
    }

    const items = await this.getStoredList();
    const filtered = items.filter((item) => item.id !== id);
    await storageService.setItem(STORAGE_KEY, filtered);
  }

  async resetToInitial(): Promise<Transaction[]> {
    try {
      const response = await apiClient.post<ApiResponse<Transaction[]>>('/transactions/reset');
      if (response.data && response.data.data) {
        const items = response.data.data;
        await storageService.setItem(STORAGE_KEY, items);
        return items;
      }
    } catch {
      // Fallback
    }

    await storageService.setItem(STORAGE_KEY, INITIAL_TRANSACTIONS);
    return INITIAL_TRANSACTIONS;
  }
}

export const transactionRepository: ITransactionRepository =
  new TransactionRepository();
