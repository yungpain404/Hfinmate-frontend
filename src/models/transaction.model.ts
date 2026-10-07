export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'food'
  | 'shopping'
  | 'transport'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'other';

export type TransactionStatus = 'completed' | 'pending' | 'failed';

/**
 * Transaction Domain Entity
 */
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO date string (YYYY-MM-DD or full timestamp)
  note?: string;
  status: TransactionStatus;
  createdAt: string;
}

/**
 * Data Transfer Object for creating a transaction
 */
export interface CreateTransactionDTO {
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date?: string;
  note?: string;
}

/**
 * Filters applied to query transactions
 */
export interface TransactionFilter {
  type?: TransactionType | 'all';
  category?: TransactionCategory | 'all';
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}
