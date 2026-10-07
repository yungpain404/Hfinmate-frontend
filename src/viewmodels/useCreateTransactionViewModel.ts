import { useState, useCallback } from 'react';
import {
  TransactionType,
  TransactionCategory,
  CreateTransactionDTO,
} from '../models/transaction.model';
import { transactionRepository } from '../services/repositories/transactionRepository';

export interface FormErrors {
  title?: string;
  amount?: string;
  category?: string;
}

/**
 * ViewModel: useCreateTransactionViewModel
 * Manages form state, validation, and submission for creating a new transaction.
 */
export function useCreateTransactionViewModel() {
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Vui lòng nhập tên giao dịch / tiêu đề';
    }

    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!amount.trim() || isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = 'Số tiền phải lớn hơn 0';
    }

    if (!category) {
      newErrors.category = 'Vui lòng chọn phân loại';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, amount, category]);

  const resetForm = useCallback(() => {
    setTitle('');
    setAmount('');
    setType('expense');
    setCategory('food');
    setNote('');
    setErrors({});
    setSubmitError(null);
  }, []);

  const handleSubmit = useCallback(
    async (onSuccess?: () => void): Promise<boolean> => {
      setSubmitError(null);

      if (!validate()) {
        return false;
      }

      try {
        setIsSubmitting(true);
        const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));

        const dto: CreateTransactionDTO = {
          title: title.trim(),
          amount: numericAmount,
          type,
          category,
          note: note.trim() || undefined,
          date: new Date().toISOString().split('T')[0],
        };

        await transactionRepository.create(dto);
        resetForm();
        if (onSuccess) {
          onSuccess();
        }
        return true;
      } catch (err) {
        setSubmitError(
          (err as Error).message || 'Có lỗi xảy ra khi lưu giao dịch.'
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [title, amount, type, category, note, validate, resetForm]
  );

  return {
    title,
    amount,
    type,
    category,
    note,
    errors,
    isSubmitting,
    submitError,
    setTitle,
    setAmount,
    setType,
    setCategory,
    setNote,
    handleSubmit,
    resetForm,
    validate,
  };
}
