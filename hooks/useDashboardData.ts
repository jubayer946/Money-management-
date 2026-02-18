import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, RecurringTransaction } from '../types';

export interface ComparisonMetrics {
  percent: number;
  trend: 'up' | 'down' | 'flat';
  isGood: boolean;
}

export interface UpcomingRecurring extends RecurringTransaction {
  nextDue: Date;
  diffDays: number;
}

export interface DashboardData {
  income: number;
  expenses: number;
  recentTransactions: Transaction[];
  monthLabel: string;
  net: number;
  spentPercent: number;
  mainBalance: number;
  comparison: {
    income: ComparisonMetrics;
    expenses: ComparisonMetrics;
    net: ComparisonMetrics;
  };
  forecast: {
    projected: number;
    dailyAverage: number;
    daysRemaining: number;
    isOverIncome: boolean;
    progress: number; // 0-100 current vs projected
  };
  upcomingRecurring: UpcomingRecurring[];
}

const calculateComparison = (current: number, previous: number, lowerIsBetter: boolean = false): ComparisonMetrics => {
  if (previous === 0) {
    return {
      percent: current > 0 ? 100 : 0,
      trend: current > 0 ? 'up' : 'flat',
      isGood: current > 0 ? !lowerIsBetter : true,
    };
  }

  const diff = current - previous;
  const percent = Math.abs(Math.round((diff / previous) * 100));
  const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
  
  // For income: up is good. For expenses: down is good.
  const isGood = lowerIsBetter ? diff <= 0 : diff >= 0;

  return { percent, trend, isGood };
};

export const useDashboardData = (): DashboardData => {
  const { getBalance, transactions, recurringTransactions } = useFinance();
  const mainBalance = getBalance();

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Total days in current month
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = totalDays - currentDay;

    // Previous Month
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();

    // Shortened label like "2 MAR 24"
    const day = now.getDate();
    const month = now.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    const year = now.getFullYear().toString().slice(-2);
    const label = `${day} ${month} ${year}`;

    // Current Month Filter
    const monthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    // Previous Month Filter
    const prevMonthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });

    const inc = monthTx
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const exp = monthTx
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    // Forecast Logic
    const dailyAverage = exp / Math.max(1, currentDay);
    const projected = dailyAverage * totalDays;
    const isOverIncome = projected > inc && inc > 0;
    const forecastProgress = projected > 0 ? (exp / projected) * 100 : 0;

    const prevInc = prevMonthTx
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const prevExp = prevMonthTx
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const netValue = inc - exp;
    const prevNetValue = prevInc - prevExp;

    const spentPercentValue = inc > 0 ? Math.round((exp / inc) * 100) : (exp > 0 ? 100 : 0);

    const recent = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Upcoming Recurring Payments Logic
    const upcoming = (recurringTransactions || []).map(rt => {
      const [startYear, startMonth, startDay] = rt.startDate.split('-').map(Number);
      const startDate = new Date(startYear, startMonth - 1, startDay);
      
      let nextDue: Date;
      if (!rt.lastProcessed) {
        nextDue = new Date(startDate);
        while (nextDue < today) {
          if (rt.frequency === 'daily') nextDue.setDate(nextDue.getDate() + 1);
          else if (rt.frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
          else if (rt.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
          else if (rt.frequency === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);
        }
      } else {
        const [lastYear, lastMonth, lastDay] = rt.lastProcessed.split('-').map(Number);
        nextDue = new Date(lastYear, lastMonth - 1, lastDay);
        if (rt.frequency === 'daily') nextDue.setDate(nextDue.getDate() + 1);
        else if (rt.frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
        else if (rt.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
        else if (rt.frequency === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);
      }

      const diffTime = nextDue.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return { ...rt, nextDue, diffDays };
    })
    .filter(item => item.diffDays >= 0 && item.diffDays <= 7) // Next 7 days
    .sort((a, b) => a.diffDays - b.diffDays);

    return { 
      income: inc, 
      expenses: exp, 
      recentTransactions: recent,
      monthLabel: label,
      net: netValue,
      spentPercent: spentPercentValue,
      comparison: {
        income: calculateComparison(inc, prevInc, false),
        expenses: calculateComparison(exp, prevExp, true),
        net: calculateComparison(netValue, prevNetValue, false),
      },
      forecast: {
        projected,
        dailyAverage,
        daysRemaining,
        isOverIncome,
        progress: forecastProgress
      },
      upcomingRecurring: upcoming as UpcomingRecurring[]
    };
  }, [transactions, recurringTransactions]);

  return {
    ...metrics,
    mainBalance
  };
};