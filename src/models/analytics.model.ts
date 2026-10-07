export interface MonthAnalyticsItem {
  month: number;
  monthLabel: string; // e.g. "Tháng 1"
  amount: number;
  amountMillions: number; // e.g. 2.278
  hasData: boolean;
  amountFormatted: string; // e.g. "2.278.000đ"
}

export interface CategoryBreakdownItem {
  id: string; // 'food' | 'transport' | 'living' | 'personal' | 'photo' | etc.
  name: string; // e.g. "Ăn uống"
  color: string; // e.g. "#1A6A4C"
  amount: number; // e.g. 1775000
  amountFormatted: string; // e.g. "1.775.000đ"
  percentage: number; // e.g. 77.9
  percentageFormatted: string; // e.g. "77,9%"
  note: string; // e.g. "Bún, cơm, gà, bánh, trà tắc"
}

export interface CategoryBreakdownSectionData {
  title: string; // "Tiền đi đâu?"
  headerLinkText: string; // "Theo loại chi"
  dominantCategoryName: string; // "Ăn uống"
  dominantPercentage: number; // 77.9
  dominantPercentageFormatted: string; // "77,9%"
  dominantTitle: string; // "Ăn uống chiếm phần lớn"
  dominantSubtitle: string; // "Phân bổ trên 2.278.000đ đã ghi nhận, gồm cả chi cố định."
  totalRecordedAmount: number; // 2278000
  totalRecordedAmountFormatted: string; // "2.278.000đ"
  categories: CategoryBreakdownItem[];
  infoNote?: string; // "Đã ghi 28/30 ngày. Năm chưa được cung cấp; tiền trọ chưa nhập nên tổng tháng chưa đầy đủ."
}

export interface DailyExpenseCalendarItem {
  day: number;
  dateString: string; // e.g. "2026-09-28"
  expenseAmount: number;
  incomeAmount: number;
  hasData: boolean;
  isPeak?: boolean;
  itemsSummary?: string;
  itemsCount?: number;
}

export interface MonthCalendarData {
  month: number;
  year: number;
  monthTitle: string; // e.g. "May 2026" or "Tháng 9, 2026"
  daysInMonth: number;
  firstDayOfWeek: number; // 0 = Sun, 1 = Mon ...
  days: Record<number, DailyExpenseCalendarItem>;
  totalExpense: number;
  totalIncome: number;
  netTotal: number;
}

export interface YearAnalyticsData {
  yearTitle: string;
  yearSubtitle: string;
  selectedYear: string;
  totalYearExpense: number;
  totalYearExpenseFormatted: string;
  expenseNote: string;
  recordedMonthsBadge: string;
  recordedMonthsCount: number;

  livingExpenseTotal?: number;
  livingExpenseFormatted?: string;
  fixedExpenseTotal?: number;
  fixedExpenseFormatted?: string;

  monthlyAverage: number;
  monthlyAverageFormatted: string;
  monthlyAverageSub: string;

  dailyAverage: number;
  dailyAverageFormatted: string;
  dailyAverageSub: string;

  chartUnitText: string;
  chartMaxMillions: number;
  chartNote: string;

  months: MonthAnalyticsItem[];
  warningNote: string;

  categorySection: CategoryBreakdownSectionData;
  calendarData?: MonthCalendarData;
}
