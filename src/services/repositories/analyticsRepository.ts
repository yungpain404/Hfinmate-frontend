import {
  YearAnalyticsData,
  MonthAnalyticsItem,
  CategoryBreakdownItem,
  CategoryBreakdownSectionData,
  DailyExpenseCalendarItem,
  MonthCalendarData,
} from '../../models/analytics.model';
import { ApiResponse } from '../../models/api.model';
import { apiClient } from '../api/apiClient';
import { getCategoryByName } from '../../models/expenseCategory.model';
import { monthLabel } from '../../utils/month';
import { setScopedItem } from '../storage/accountScope';
import { fixedExpenseRepository } from './fixedExpenseRepository';
import { dashboardRepository } from './dashboardRepository';
import { dailyExpenseRepository } from './dailyExpenseRepository';

const ANALYTICS_STORAGE_KEY = 'year_analytics_data';

// Evaluated per call: a session that crosses into a new month (or a new year)
// must never keep reporting the period captured when the bundle loaded.
const getCurrentYearNum = (): number => new Date().getFullYear();
const getCurrentMonthNum = (): number => new Date().getMonth() + 1;
const getDefaultYearLabel = (): string => `Năm ${getCurrentYearNum()}`;

const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export interface IAnalyticsRepository {
  getYearAnalytics(year?: string, month?: number): Promise<YearAnalyticsData>;
  getMonthCalendarData(month?: number, year?: number): Promise<MonthCalendarData>;
}

class AnalyticsRepository implements IAnalyticsRepository {
  async getMonthCalendarData(
    month: number = getCurrentMonthNum(),
    year: number = getCurrentYearNum()
  ): Promise<MonthCalendarData> {
    try {
      const response = await apiClient.get<ApiResponse<MonthCalendarData>>('/analytics/calendar', {
        params: { month, year },
      });
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback local calculation
    }

    const now = new Date();
    const isCurrent = month === now.getMonth() + 1 && year === now.getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

    const [dashboardData, recordedSheets] = await Promise.all([
      dashboardRepository.getDashboardData(),
      dailyExpenseRepository.getAllRecordedSheets(),
    ]);

    const daysMap: Record<number, DailyExpenseCalendarItem> = {};
    let totalExpense = 0;
    const totalIncome = 0;

    const rhythmBars = dashboardData?.rhythmBars || [];
    const recentDays = dashboardData?.recentDays || [];

    for (let d = 1; d <= daysInMonth; d++) {
      const padM = String(month).padStart(2, '0');
      const padD = String(d).padStart(2, '0');
      const dateString = `${year}-${padM}-${padD}`;

      const bar = isCurrent ? rhythmBars.find((b) => b.day === d) : undefined;
      const recent = isCurrent ? recentDays.find((r) => r.day === d) : undefined;
      const customSheet = recordedSheets.find((s) => s.date === dateString);

      let expense = 0;
      let summary = '';
      let isPeak = false;
      let count = 0;

      if (customSheet && customSheet.items.length > 0) {
        expense = customSheet.totalAmount;
        summary = customSheet.items.map((i) => i.name).filter(Boolean).join(', ');
        count = customSheet.items.length;
      } else if (recent) {
        expense = recent.totalAmount;
        summary = recent.itemsSummary;
        count = recent.itemsCount;
      } else if (bar && bar.hasRecord) {
        expense = bar.amount;
        isPeak = bar.isPeak;
      }

      const hasData = expense > 0;
      totalExpense += expense;

      daysMap[d] = {
        day: d,
        dateString,
        expenseAmount: expense,
        incomeAmount: 0,
        hasData,
        isPeak,
        itemsSummary: summary,
        itemsCount: count,
      };
    }

    return {
      month,
      year,
      monthTitle: `Tháng ${month}, ${year}`,
      daysInMonth,
      firstDayOfWeek,
      days: daysMap,
      totalExpense,
      totalIncome,
      netTotal: totalIncome - totalExpense,
    };
  }

  async getYearAnalytics(
    year: string = getDefaultYearLabel(),
    month: number = getCurrentMonthNum()
  ): Promise<YearAnalyticsData> {
    const targetYear = year || getDefaultYearLabel();
    const yearMatch = targetYear.match(/\d{4}/);
    const targetYearNum = yearMatch ? parseInt(yearMatch[0], 10) : getCurrentYearNum();

    try {
      const response = await apiClient.get<ApiResponse<YearAnalyticsData>>('/analytics/year', {
        params: { year: targetYear, month },
      });
      if (response.data && response.data.data) {
        const data = response.data.data;
        await setScopedItem(`${ANALYTICS_STORAGE_KEY}_${targetYear}_${month}`, data);
        return data;
      }
    } catch {
      // Fallback local calculation
    }

    // Dynamic aggregation: Tiền sinh hoạt (hàng ngày) + Khoản chi cố định
    const [dashboardData, fixedData, recordedSheets, calendarData] = await Promise.all([
      dashboardRepository.getDashboardData(),
      // Fixed expenses of the selected month - never last month's sheet
      fixedExpenseRepository.getFixedExpenses(monthLabel({ year: targetYearNum, month })),
      dailyExpenseRepository.getAllRecordedSheets(),
      this.getMonthCalendarData(month, targetYearNum),
    ]);

    // Fixed expense items values
    const xangItem = fixedData.items.find((i) => i.id === 'fix_3' || i.title.toLowerCase().includes('xăng'));
    const xangAmount = xangItem?.amount ?? 0;

    const guiXeItem = fixedData.items.find((i) => i.id === 'fix_1' || i.title.toLowerCase().includes('gửi xe'));
    const guiXeAmount = guiXeItem?.amount ?? 0;

    const nuocItem = fixedData.items.find((i) => i.id === 'fix_2' || i.title.toLowerCase().includes('nước'));
    const nuocAmount = nuocItem?.amount ?? 0;

    const troItem = fixedData.items.find((i) => i.id === 'fix_4' || i.title.toLowerCase().includes('trọ'));
    const troAmount = troItem?.amount ?? 0;

    const fixedTotal = fixedData?.totalAmount ?? (xangAmount + guiXeAmount + nuocAmount + troAmount);

    let foodAmount = 0;
    let dailyGrabAmount = 0;
    let personalAmount = 0;
    let photoAmount = 0;
    let entertainmentAmount = 0;
    let otherAmount = 0;

    // Aggregate from recorded sheets matching target year & month
    if (recordedSheets.length > 0) {
      for (const sheet of recordedSheets) {
        if (sheet.date) {
          const [sYear, sMonth] = sheet.date.split('-').map(Number);
          if (sYear === targetYearNum && sMonth === month) {
            for (const it of sheet.items) {
              const amt = it.amount || 0;
              if (amt <= 0) continue;
              const normCat = (it.category || '').toLowerCase().trim();
              if (
                normCat.includes('ăn') ||
                normCat.includes('uống') ||
                normCat.includes('thức ăn') ||
                normCat === 'food' ||
                normCat.includes('cơm')
              ) {
                foodAmount += amt;
              } else if (
                normCat.includes('chuyển') ||
                normCat.includes('xe') ||
                normCat === 'transport'
              ) {
                dailyGrabAmount += amt;
              } else if (
                normCat.includes('cá nhân') ||
                normCat === 'shopping' ||
                normCat === 'personal'
              ) {
                personalAmount += amt;
              } else if (
                normCat.includes('photo') ||
                normCat === 'education'
              ) {
                photoAmount += amt;
              } else if (
                normCat.includes('giải trí') ||
                normCat === 'entertainment'
              ) {
                entertainmentAmount += amt;
              } else {
                otherAmount += amt;
              }
            }
          }
        }
      }
    }

    const transportTotal = dailyGrabAmount + xangAmount + guiXeAmount;
    const livingCategoryTotal = nuocAmount + troAmount;

    // Build categories list
    const rawCategories: {
      id: string;
      name: string;
      amount: number;
      note: string;
    }[] = [
      {
        id: 'food',
        name: 'Ăn uống',
        amount: foodAmount,
        note: foodAmount > 0 ? 'Chi tiêu ăn uống' : 'Chưa có khoản chi',
      },
      {
        id: 'transport',
        name: 'Di chuyển',
        amount: transportTotal,
        note: transportTotal > 0 ? 'Chi phí di chuyển & xe' : 'Chưa có khoản chi',
      },
      {
        id: 'living',
        name: 'Sinh hoạt',
        amount: livingCategoryTotal,
        note: livingCategoryTotal > 0 ? 'Nước sinh hoạt, trọ' : 'Chưa có khoản chi',
      },
      {
        id: 'personal',
        name: 'Cá nhân',
        amount: personalAmount,
        note: personalAmount > 0 ? 'Chi tiêu cá nhân' : 'Chưa có khoản chi',
      },
      {
        id: 'photo',
        name: 'Photo',
        amount: photoAmount,
        note: photoAmount > 0 ? 'Photo tài liệu' : 'Chưa có khoản chi',
      },
    ];

    if (entertainmentAmount > 0) {
      rawCategories.push({
        id: 'entertainment',
        name: 'Giải trí',
        amount: entertainmentAmount,
        note: 'Chi tiêu giải trí đã ghi',
      });
    }

    if (otherAmount > 0) {
      rawCategories.push({
        id: 'other',
        name: 'Khác',
        amount: otherAmount,
        note: 'Khoản chi khác',
      });
    }

    // Sort descending by amount
    rawCategories.sort((a, b) => b.amount - a.amount);

    const totalCategoryExpense = rawCategories.reduce((sum, c) => sum + c.amount, 0);

    const categories: CategoryBreakdownItem[] = rawCategories.map((c) => {
      const def = getCategoryByName(c.name);
      const pct = totalCategoryExpense > 0 ? (c.amount / totalCategoryExpense) * 100 : 0;
      const formattedPct = `${(Math.round(pct * 10) / 10).toFixed(1).replace('.', ',')}%`;

      return {
        id: c.id,
        name: c.name,
        color: def.color,
        amount: c.amount,
        amountFormatted: `${formatVND(c.amount)}đ`,
        percentage: Number(pct.toFixed(1)),
        percentageFormatted: formattedPct,
        note: c.note,
      };
    });

    const dominant = categories.find((c) => c.amount > 0) || {
      name: categories[0]?.name || 'Ăn uống',
      percentage: 0,
      percentageFormatted: '0%',
    };

    const categorySection: CategoryBreakdownSectionData = {
      title: 'Tiền đi đâu?',
      headerLinkText: 'Theo loại chi',
      dominantCategoryName: dominant.name,
      dominantPercentage: dominant.percentage,
      dominantPercentageFormatted: dominant.percentageFormatted,
      dominantTitle:
        dominant.percentage >= 40 && dominant.percentage > 0
          ? `${dominant.name} chiếm phần lớn`
          : totalCategoryExpense > 0
          ? `${dominant.name} cao nhất`
          : 'Chưa có dữ liệu chi tiêu',
      dominantSubtitle: `Phân bổ trên ${formatVND(totalCategoryExpense)}đ đã ghi nhận, gồm cả chi cố định.`,
      totalRecordedAmount: totalCategoryExpense,
      totalRecordedAmountFormatted: `${formatVND(totalCategoryExpense)}đ`,
      categories,
      infoNote: `Tổng hợp chi tiêu Tháng ${month}, ${targetYearNum}.`,
    };

    const livingTotal = foodAmount + dailyGrabAmount + personalAmount + photoAmount + entertainmentAmount + otherAmount;
    const totalMonth = totalCategoryExpense;

    const months: MonthAnalyticsItem[] = Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const isTargetMonth = monthNum === month;
      const amt = isTargetMonth ? totalMonth : 0;
      return {
        month: monthNum,
        monthLabel: `Tháng ${monthNum}`,
        amount: amt,
        amountMillions: amt > 0 ? Number((amt / 1000000).toFixed(3)) : 0,
        hasData: isTargetMonth && amt > 0,
        amountFormatted: isTargetMonth && amt > 0 ? `${formatVND(amt)}đ` : 'Chưa có dữ liệu',
      };
    });

    const daysInMonth = calendarData.daysInMonth || 30;
    const dailyAvg = daysInMonth > 0 && totalMonth > 0 ? Math.round(totalMonth / daysInMonth) : 0;
    const chartMaxMillions = Math.max(3, Math.ceil(totalMonth / 1000000));
    const recordedMonthsCount = months.filter((m) => m.hasData).length;

    const computedData: YearAnalyticsData = {
      yearTitle: 'Bức tranh cả năm',
      yearSubtitle: 'Bắt đầu từ những tháng đã ghi lại.',
      selectedYear: targetYear,
      totalYearExpense: totalMonth,
      totalYearExpenseFormatted: formatVND(totalMonth),
      expenseNote: `Gồm sinh hoạt (${formatVND(livingTotal)}đ) + cố định (${formatVND(fixedTotal)}đ)`,
      recordedMonthsBadge: `${recordedMonthsCount}/12 tháng có dữ liệu`,
      recordedMonthsCount,

      livingExpenseTotal: livingTotal,
      livingExpenseFormatted: `${formatVND(livingTotal)}đ`,
      fixedExpenseTotal: fixedTotal,
      fixedExpenseFormatted: `${formatVND(fixedTotal)}đ`,

      monthlyAverage: totalMonth,
      monthlyAverageFormatted: `${formatVND(totalMonth)}đ`,
      monthlyAverageSub: `${formatVND(totalMonth)}đ ÷ ${Math.max(1, recordedMonthsCount)} tháng`,

      dailyAverage: dailyAvg,
      dailyAverageFormatted: `${formatVND(dailyAvg)}đ`,
      dailyAverageSub: `${formatVND(totalMonth)}đ ÷ ${daysInMonth} ngày lịch của tháng ${month}`,

      chartUnitText: 'Triệu đồng',
      chartMaxMillions,
      chartNote: 'Chưa có dữ liệu, không phải chi tiêu 0đ',

      months,
      warningNote:
        targetYear === 'Năm chưa xác định'
          ? 'Năm chưa đủ dữ liệu. Trung bình chỉ tính trên kỳ đã có; không chia tổng cho 12 tháng.'
          : `${targetYear} đang cập nhật dữ liệu chi tiêu thực tế.`,

      categorySection,
      calendarData,
    };

    await setScopedItem(
      `${ANALYTICS_STORAGE_KEY}_${targetYear}_${month}`,
      computedData
    );

    return computedData;
  }
}

export const analyticsRepository: IAnalyticsRepository = new AnalyticsRepository();
