export interface FixedExpenseItem {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'parking' | 'water' | 'fuel' | 'rent';
  amount: number | null;
  amountFormatted: string;
  isEntered: boolean;
  extraNote?: {
    title: string;
    description: string;
  };
}

export interface FixedExpenseData {
  month: string;
  title: string;
  subtitle: string;
  totalAmount: number;
  totalAmountFormatted: string;
  heroNote: string;
  sectionTitle: string;
  sectionCountText: string;
  items: FixedExpenseItem[];
  alertNote: string;
}
