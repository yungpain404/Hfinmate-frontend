import { Transaction } from '../../models/transaction.model';
import { BudgetGoal, WalletSummary } from '../../models/wallet.model';
import { User } from '../../models/auth.model';
import { HomeDashboardData } from '../../models/dashboard.model';

export const INITIAL_USER: User | null = null;

/**
 * Blank dashboard for "now". Built on every call so the month label never
 * stays frozen on the month the bundle happened to load in.
 */
export function createInitialDashboardData(): HomeDashboardData {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  return {
    monthName: `Tháng ${currentMonth}`,
    recordedDaysCount: 0,
    calendarDaysCount: daysInMonth,

    totalExpense: 0,
    totalExpenseNote: '',
    dailyAverage: 0,

    dailyCategoryTotal: 0,
    dailyCategoryDaysCount: 0,

    fixedCategoryTotal: 0,
    fixedCategoryNote: 'Chưa nhập',

    rhythmMaxAmount: 0,
    rhythmNote: '',
    rhythmBars: Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      amount: 0,
      amountInThousands: 0,
      hasRecord: false,
      isPeak: false,
    })),
    recentDays: [],
  };
}

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_WALLET: WalletSummary = {
  totalBalance: 0,
  totalIncome: 0,
  totalExpense: 0,
  savingsRate: 0,
  currency: 'VND',
  lastUpdated: new Date().toISOString(),
};

export const INITIAL_BUDGET_GOALS: BudgetGoal[] = [];
