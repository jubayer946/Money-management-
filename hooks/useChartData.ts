

import { useMemo } from 'react';
import { Transaction, ChartPeriod, ChartDataPoint } from '../types';

export const useChartData = (transactions: Transaction[], period: ChartPeriod) => {
  return useMemo(() => {
    const now = new Date();
    const data: ChartDataPoint[] = [];
    
    // Filter out transfers for Income/Expense charts to avoid skewing data
    const relevantTransactions = transactions.filter(t => t.type !== 'transfer');
    
    // Determine the cutoff date for the chart period to calculate initial balance
    let cutoffDate = new Date(now);
    
    if (period === 'day') {
      cutoffDate.setHours(0,0,0,0);
    } else if (period === 'week') {
      cutoffDate.setDate(cutoffDate.getDate() - 6);
      cutoffDate.setHours(0,0,0,0);
    } else if (period === 'month') {
      cutoffDate.setDate(cutoffDate.getDate() - 29);
      cutoffDate.setHours(0,0,0,0);
    } else if (period === 'year') {
      cutoffDate.setMonth(cutoffDate.getMonth() - 11);
      cutoffDate.setDate(1); // Start of that month
      cutoffDate.setHours(0,0,0,0);
    }

    // Calculate initial balance (sum of all transactions BEFORE the chart period)
    // Note: For Balance history, we DO want to include transfers if we were tracking specific wallet,
    // but this chart usually shows Net Worth, so transfers cancel out.
    let initialBalance = 0;
    
    // For net worth calculation, we use ALL transactions (excluding transfers as they don't change net worth)
    transactions.forEach(t => {
      if (t.type === 'transfer') return;

      const tDate = new Date(t.date);
      const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);
      
      if (adjustedDate < cutoffDate) {
        if (t.type === 'income') {
          initialBalance += t.amount;
        } else if (t.type === 'expense') {
          initialBalance -= t.amount;
        }
      }
    });

    if (period === 'day') {
      // Last 24 hours (simplified to 0-23 hours of current day)
      for (let i = 0; i < 24; i++) {
        data.push({ label: `${i}:00`, income: 0, expense: 0, balance: 0 });
      }
      relevantTransactions.forEach(t => {
        const tDate = new Date(t.date);
        const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);
        
        if (adjustedDate.toDateString() === now.toDateString()) {
           // We'll just put it at 12:00 for visualization since we lack time precision
           if (t.type === 'income') data[12].income += t.amount;
           else if (t.type === 'expense') data[12].expense += t.amount;
        }
      });
      
    } else if (period === 'week') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        data.push({ 
          label: dayNames[d.getDay()], 
          income: 0, 
          expense: 0, 
          balance: 0,
          date: d.toDateString() 
        });
      }
      relevantTransactions.forEach(t => {
        const tDate = new Date(t.date);
        const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);
        const dateStr = adjustedDate.toDateString();
        
        const point = data.find(p => p.date === dateStr);
        if (point) {
          if (t.type === 'income') point.income += t.amount;
          else if (t.type === 'expense') point.expense += t.amount;
        }
      });

    } else if (period === 'month') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        data.push({
          label: `${d.getDate()}`,
          income: 0,
          expense: 0,
          balance: 0,
          date: d.toDateString()
        });
      }
      relevantTransactions.forEach(t => {
        const tDate = new Date(t.date);
        const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);
        const dateStr = adjustedDate.toDateString();
        
        const point = data.find(p => p.date === dateStr);
        if (point) {
          if (t.type === 'income') point.income += t.amount;
          else if (t.type === 'expense') point.expense += t.amount;
        }
      });

    } else if (period === 'year') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        data.push({
          label: monthNames[d.getMonth()],
          income: 0,
          expense: 0,
          balance: 0,
          month: d.getMonth(),
          year: d.getFullYear()
        });
      }
      relevantTransactions.forEach(t => {
        const tDate = new Date(t.date);
        const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);

        const point = data.find(p => p.month === adjustedDate.getMonth() && p.year === adjustedDate.getFullYear());
        if (point) {
          if (t.type === 'income') point.income += t.amount;
          else if (t.type === 'expense') point.expense += t.amount;
        }
      });
    }

    // Calculate Running Balance for each data point
    let currentBalance = initialBalance;
    data.forEach(point => {
        currentBalance += (point.income - point.expense);
        point.balance = currentBalance;
    });

    return data;
  }, [transactions, period]);
};