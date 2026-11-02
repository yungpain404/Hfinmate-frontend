import { WalletSummary, BudgetGoal, CategoryExpenseStat } from '../../models/wallet.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import { transactionRepository } from './transactionRepository';
import { INITIAL_BUDGET_GOALS } from '../mock/mockData';
import {
  getScopedItem,
  setScopedItem,
  migrateLegacyKey,
} from '../storage/accountScope';

const BUDGET_KEY = 'budget_goals_data';

export interface IWalletRepository {
  getSummary(): Promise<WalletSummary>;
  getBudgetGoals(): Promise<BudgetGoal[]>;
  getExpenseStats(): Promise<CategoryExpenseStat[]>;
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F59E0B',
  shopping: '#EC4899',
  transport: '#3B82F6',
  bills: '#8B5CF6',
  health: '#10B981',
  entertainment: '#6366F1',
  salary: '#10B981',
  freelance: '#0D9488',
  investment: '#06B6D4',
  education: '#14B8A6',
  other: '#94A3B8',
};

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Ăn uống',
  shopping: 'Mua sắm',
  transport: 'Di chuyển',
  bills: 'Hóa đơn & Dịch vụ',
  health: 'Sức khỏe & Gym',
  entertainment: 'Giải trí',
  salary: 'Tiền lương',
  freelance: 'Dự án Freelance',
  investment: 'Đầu tư',
  education: 'Học tập',
  other: 'Khác',
};

class WalletRepository implements IWalletRepository {
  async getSummary(): Promise<WalletSummary> {
    try {
      const response = await apiClient.get<ApiResponse<WalletSummary>>('/wallet/summary');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Backend not reached or offline, fallback to local calculation
    }

    const transactions = await transactionRepository.getAll();

    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }
    }

    const totalBalance = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      savingsRate: Math.max(0, savingsRate),
      currency: 'VND',
      lastUpdated: new Date().toISOString(),
    };
  }

  async getBudgetGoals(): Promise<BudgetGoal[]> {
    try {
      const response = await apiClient.get<ApiResponse<BudgetGoal[]>>('/wallet/goals');
      if (response.data && response.data.data) {
        const goals = response.data.data;
        await setScopedItem(BUDGET_KEY, goals);
        return goals;
      }
    } catch {
      // Fallback
    }

    const migrated = await migrateLegacyKey<BudgetGoal[]>(BUDGET_KEY);
    if (migrated !== null && migrated !== undefined) return migrated;
    const stored = await getScopedItem<BudgetGoal[]>(BUDGET_KEY);
    if (!stored) {
      await setScopedItem(BUDGET_KEY, INITIAL_BUDGET_GOALS);
      return INITIAL_BUDGET_GOALS;
    }
    return stored;
  }

  async getExpenseStats(): Promise<CategoryExpenseStat[]> {
    try {
      const response = await apiClient.get<ApiResponse<CategoryExpenseStat[]>>('/wallet/categories');
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const transactions = await transactionRepository.getAll();
    const expenses = transactions.filter((t) => t.type === 'expense');

    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
    if (totalExpense === 0) return [];

    const categoryMap: Record<string, number> = {};
    for (const item of expenses) {
      categoryMap[item.category] = (categoryMap[item.category] || 0) + item.amount;
    }

    const stats: CategoryExpenseStat[] = Object.entries(categoryMap).map(
      ([cat, amount]) => ({
        category: cat as any,
        categoryLabel: CATEGORY_LABELS[cat] || cat,
        totalAmount: amount,
        percentage: Math.round((amount / totalExpense) * 100),
        color: CATEGORY_COLORS[cat] || '#94A3B8',
      })
    );

    return stats.sort((a, b) => b.totalAmount - a.totalAmount);
  }
}

export const walletRepository: IWalletRepository = new WalletRepository();
