export interface DailyExpenseItemDraft {
  id: string;
  name: string;
  amount: number;
  amountInput: string;
  category: string;
}

export interface DailyExpenseSheet {
  date: string;
  displayDate: string;
  items: DailyExpenseItemDraft[];
  totalAmount: number;
  formulaText: string;
  footerNote: string;
}
