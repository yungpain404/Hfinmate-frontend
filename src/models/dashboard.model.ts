export interface DailyRhythmBar {
  day: number;
  amount: number; // in VND
  amountInThousands: number;
  hasRecord: boolean;
  isPeak: boolean;
}

export interface DayExpenseItem {
  id: string;
  title: string;
  amount: number;
  category?: string;
}

export interface DayExpenseGroup {
  id: string;
  day: number;
  monthText: string; // e.g. "THÁNG 9"
  itemsSummary: string; // e.g. "Cơm, Hớt tóc"
  itemsCount: number; // e.g. 2
  totalAmount: number; // e.g. 106000
  items: DayExpenseItem[];
}

export interface HomeDashboardData {
  monthName: string; // e.g. "Tháng 9"
  recordedDaysCount: number; // e.g. 28
  calendarDaysCount: number; // e.g. 30

  totalExpense: number; // 2278000
  totalExpenseNote: string; // "Chưa bao gồm tiền trọ"
  dailyAverage: number; // 75933

  dailyCategoryTotal: number; // 1911000
  dailyCategoryDaysCount: number; // 28

  fixedCategoryTotal: number; // 367000
  fixedCategoryNote: string; // "Đã nhập · chưa có trọ"

  rhythmMaxAmount: number; // 158000
  rhythmBars: DailyRhythmBar[];
  rhythmNote: string; // "1-2/9 chưa nhập · không tính là chi 0đ"

  recentDays: DayExpenseGroup[];
}
