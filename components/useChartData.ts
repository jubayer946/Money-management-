
import { useMemo } from 'react';
import { Transaction, ChartPeriod, ChartDataPoint } from '../types';

export const useChartData = (transactions: Transaction[], period: ChartPeriod, currentDate: Date) => {
  return useMemo(() => {
    const data: ChartDataPoint[] = [];
    
    // Filter out transfers for Income/Expense charts to avoid skewing data
    // Note: For pure Net Worth, transfers within own accounts cancel out, but we filter here to keep the income/expense lines clean.
    const relevantTransactions = transactions;
    
    // Determine the start (cutoff) and end date for the chart period
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);

    if (period === 'day') {
      startDate.setHours(0,0,0,0);
      endDate.setHours(23,59,59,999);
    } else if (period === 'week') {
      // Set to Sunday of this week
      const day = startDate.getDay();
      const diff = startDate.getDate() - day;
      startDate.setDate(diff);
      startDate.setHours(0,0,0,0);
      
      // End date is Saturday
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23,59,59,999);
    } else if (period === 'month') {
      startDate.setDate(1);
      startDate.setHours(0,0,0,0);
      
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of previous month (which is the current month in calculation)
      endDate.setHours(23,59,59,999);
    } else if (period === 'year') {
      startDate.setMonth(0, 1);
      startDate.setHours(0,0,0,0);
      
      endDate.setMonth(11, 31);
      endDate.setHours(23,59,59,999);
    }

    // Calculate initial balance (sum of all transactions BEFORE the start date)
    let initialBalance = 0;
    
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      // We compare purely based on the date string to avoid timezone complexity for "start of day" logic
      // essentially: if tDate < startDate
      const tTime = tDate.getTime();
      // Adjust strictly for comparison
      const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);

      if (adjustedDate < startDate) {
        if (t.type === 'income') {
          initialBalance += t.amount;
        } else if (t.type === 'expense') {
          initialBalance -= t.amount;
        }
      }
    });

    if (period === 'day') {
      // 0-23 hours
      for (let i = 0; i < 24; i++) {
        data.push({ label: `${i}:00`, income: 0, expense: 0, balance: 0 });
      }
      relevantTransactions.forEach(t => {
        const tDate = new Date(t.date);
        const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);
        
        if (adjustedDate >= startDate && adjustedDate <= endDate) {
           // Simply distribute to middle of day as we don't have time on transactions
           if (t.type === 'income') data[12].income += t.amount;
           else if (t.type === 'expense') data[12].expense += t.amount;
        }
      });
      
    } else if (period === 'week') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
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
        
        if (adjustedDate >= startDate && adjustedDate <= endDate) {
            const dateStr = adjustedDate.toDateString();
            const point = data.find(p => p.date === dateStr);
            if (point) {
            if (t.type === 'income') point.income += t.amount;
            else if (t.type === 'expense') point.expense += t.amount;
            }
        }
      });

    } else if (period === 'month') {
      // Days in month
      const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(startDate);
        d.setDate(i);
        data.push({
          label: `${i}`,
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
        
        if (adjustedDate >= startDate && adjustedDate <= endDate) {
            const dateStr = adjustedDate.toDateString();
            const point = data.find(p => p.date === dateStr);
            if (point) {
            if (t.type === 'income') point.income += t.amount;
            else if (t.type === 'expense') point.expense += t.amount;
            }
        }
      });

    } else if (period === 'year') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        data.push({
          label: monthNames[i],
          income: 0,
          expense: 0,
          balance: 0,
          month: i,
          year: startDate.getFullYear()
        });
      }
      
      relevantTransactions.forEach(t => {
        const tDate = new Date(t.date);
        const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);

        if (adjustedDate >= startDate && adjustedDate <= endDate) {
            const point = data.find(p => p.month === adjustedDate.getMonth() && p.year === adjustedDate.getFullYear());
            if (point) {
            if (t.type === 'income') point.income += t.amount;
            else if (t.type === 'expense') point.expense += t.amount;
            }
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
  }, [transactions, period, currentDate]);
};
