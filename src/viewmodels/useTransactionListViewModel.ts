import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Transaction,
  TransactionType,
  TransactionFilter,
} from '../models/transaction.model';
import { transactionRepository } from '../services/repositories/transactionRepository';

/**
 * ViewModel: useTransactionListViewModel
 * Encapsulates transaction list state, filtering, searching, deletion, and refresh.
 */
export function useTransactionListViewModel() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const filter: TransactionFilter = {
          type: filterType,
          searchQuery,
        };

        const data = await transactionRepository.getAll(filter);
        setTransactions(data);
      } catch (err) {
        setError((err as Error).message || 'Không thể tải danh sách giao dịch.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filterType, searchQuery]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, [fetchTransactions]);

  const handleRefresh = useCallback(() => {
    return fetchTransactions(true);
  }, [fetchTransactions]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await transactionRepository.delete(id);
        setTransactions((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        setError((err as Error).message || 'Không thể xóa giao dịch.');
      }
    },
    []
  );

  const handleResetInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await transactionRepository.resetToInitial();
      setTransactions(items);
      setFilterType('all');
      setSearchQuery('');
    } catch (err) {
      setError((err as Error).message || 'Không thể khôi phục dữ liệu mẫu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const totalFilteredAmount = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
    }, 0);
  }, [transactions]);

  return {
    transactions,
    filterType,
    searchQuery,
    isLoading,
    isRefreshing,
    error,
    totalFilteredAmount,
    setFilterType,
    setSearchQuery,
    handleRefresh,
    handleDelete,
    handleResetInitial,
    reloadTransactions: fetchTransactions,
  };
}
