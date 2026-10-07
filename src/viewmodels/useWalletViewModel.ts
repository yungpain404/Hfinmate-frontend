import { useState, useEffect, useCallback } from 'react';
import { WalletSummary, BudgetGoal, CategoryExpenseStat } from '../models/wallet.model';
import { walletRepository } from '../services/repositories/walletRepository';

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * ViewModel: useWalletViewModel
 * Manages financial overview, budget goals, and expense category analytics.
 */
export function useWalletViewModel() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [expenseStats, setExpenseStats] = useState<CategoryExpenseStat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const [summaryData, goalsData, statsData] = await Promise.all([
        walletRepository.getSummary(),
        walletRepository.getBudgetGoals(),
        walletRepository.getExpenseStats(),
      ]);

      setSummary(summaryData);
      setBudgetGoals(goalsData);
      setExpenseStats(statsData);
    } catch (err) {
      setError((err as Error).message || 'Không thể tải thông tin ví.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  return {
    summary,
    budgetGoals,
    expenseStats,
    isLoading,
    isRefreshing,
    error,
    formatCurrency: formatVND,
    handleRefresh,
    reloadData: loadData,
  };
}
