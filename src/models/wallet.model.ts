import { TransactionCategory } from './transaction.model';

export interface WalletSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savingsRate: number; // percentage 0 - 100
  currency: string;
  lastUpdated: string;
}

export interface BudgetGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category?: TransactionCategory;
  dueDate: string;
}

export interface CategoryExpenseStat {
  category: TransactionCategory;
  categoryLabel: string;
  totalAmount: number;
  percentage: number;
  color: string;
}
