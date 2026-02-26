import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Debt, Category, RecurringTransaction, DebtPayment, FinanceContextType, TransactionType, Budget, Savings } from '../types';
import { db } from './firebaseConfig';
import { ref, onValue, push, set, remove, update } from 'firebase/database';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const stripUndefined = <T extends Record<string, any>>(obj: T): T => {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Salary', type: 'income', color: '#10b981' },
  { id: '2', name: 'Freelance', type: 'income', color: '#3b82f6' },
  { id: '3', name: 'Investments', type: 'income', color: '#8b5cf6' },
  { id: '4', name: 'Food', type: 'expense', color: '#f59e0b' },
  { id: '5', name: 'Transport', type: 'expense', color: '#6366f1' },
  { id: '6', name: 'Shopping', type: 'expense', color: '#ec4899' },
  { id: '7', name: 'Bills', type: 'expense', color: '#ef4444' },
  { id: '8', name: 'Entertainment', type: 'expense', color: '#06b6d4' },
];

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savings, setSavings] = useState<Savings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const txRef = ref(db, 'transactions');
    const debtsRef = ref(db, 'debts');
    const debtPaymentsRef = ref(db, 'debtPayments');
    const catsRef = ref(db, 'categories');
    const recurringRef = ref(db, 'recurringTransactions');
    const budgetsRef = ref(db, 'budgets');
    const savingsRef = ref(db, 'savings');

    const unsubTx = onValue(txRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setTransactions(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    const unsubDebts = onValue(debtsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setDebts(list);
    });

    const unsubDebtPayments = onValue(debtPaymentsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setDebtPayments(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    const unsubCats = onValue(catsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setCategories(list);
      } else {
        DEFAULT_CATEGORIES.forEach(c => {
           set(push(ref(db, 'categories')), { name: c.name, type: c.type, color: c.color });
        });
      }
    });

    const unsubRecurring = onValue(recurringRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setRecurringTransactions(list);
      setLoading(false);
    });

    const unsubBudgets = onValue(budgetsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setBudgets(list);
    });

    const unsubSavings = onValue(savingsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setSavings(list);
    });

    return () => {
      unsubTx(); unsubDebts(); unsubDebtPayments(); unsubCats(); unsubRecurring(); unsubBudgets(); unsubSavings();
    };
  }, []);

  /* 
  useEffect(() => {
    if (loading) return;
    const checkRecurring = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      recurringTransactions.forEach(rt => {
        const [startYear, startMonth, startDay] = rt.startDate.split('-').map(Number);
        const startDate = new Date(startYear, startMonth - 1, startDay);
        const step = rt.interval && rt.interval > 0 ? rt.interval : 1;
        let nextDue: Date;
        if (!rt.lastProcessed) {
            nextDue = startDate;
        } else {
            const [lastYear, lastMonth, lastDay] = rt.lastProcessed.split('-').map(Number);
            const lastProcessed = new Date(lastYear, lastMonth - 1, lastDay);
            nextDue = new Date(lastProcessed);
            if (rt.frequency === 'daily') nextDue.setDate(nextDue.getDate() + step);
            if (rt.frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7 * step);
            if (rt.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + step);
            if (rt.frequency === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + step);
        }
        if (nextDue.getTime() <= today.getTime()) {
          const y = nextDue.getFullYear();
          const m = String(nextDue.getMonth() + 1).padStart(2, '0');
          const d = String(nextDue.getDate()).padStart(2, '0');
          const dueString = `${y}-${m}-${d}`;
          push(ref(db, 'transactions'), {
            type: rt.type, desc: rt.desc, amount: rt.amount, category: rt.category, date: dueString, isRecurring: true
          });
          update(ref(db, `recurringTransactions/${rt.id}`), { lastProcessed: dueString });
        }
      });
    };
    checkRecurring();
  }, [recurringTransactions, loading]);
  */

  const addTransaction = (t: Omit<Transaction, 'id'>) => push(ref(db, 'transactions'), stripUndefined(t));
  
  const updateTransaction = async (t: Transaction) => {
    const { id, ...data } = t;
    console.log('Updating transaction', id);
    return update(ref(db, `transactions/${id}`), stripUndefined(data));
  };

  const deleteTransaction = (id: string) => {
    console.log('Deleting transaction', id);
    return remove(ref(db, `transactions/${id}`));
  };

  const bulkDeleteTransactions = async (ids: string[]) => {
    console.log('Bulk deleting IDs:', ids);
    await Promise.all(ids.map(id => deleteTransaction(id)));
    console.log('Bulk delete complete');
  };

  const bulkUpdateTransactions = async (updatesList: Transaction[]) => {
    console.log('Bulk updating transactions:', updatesList.length);
    await Promise.all(updatesList.map(t => updateTransaction(t)));
    console.log('Bulk update complete');
  };

  const addDebt = (d: Omit<Debt, 'id'>) => push(ref(db, 'debts'), stripUndefined(d));
  const updateDebt = (d: Debt) => {
    const { id, ...data } = d;
    update(ref(db, `debts/${id}`), stripUndefined(data));
  };
  const deleteDebt = (id: string) => remove(ref(db, `debts/${id}`));
  const addDebtPayment = (dp: Omit<DebtPayment, 'id'>) => push(ref(db, 'debtPayments'), stripUndefined(dp));

  const addCategory = (name: string, type: TransactionType, color: string) => push(ref(db, 'categories'), stripUndefined({ name, type, color }));
  const updateCategory = (c: Category) => {
    const { id, ...data } = c;
    update(ref(db, `categories/${id}`), stripUndefined(data));
  };
  const deleteCategory = (id: string) => remove(ref(db, `categories/${id}`));

  const addRecurringTransaction = (t: Omit<RecurringTransaction, 'id'>) => push(ref(db, 'recurringTransactions'), stripUndefined(t));
  const updateRecurringTransaction = (t: RecurringTransaction) => {
    const { id, ...data } = t;
    update(ref(db, `recurringTransactions/${id}`), stripUndefined(data));
  };
  const deleteRecurringTransaction = (id: string) => remove(ref(db, `recurringTransactions/${id}`));

  const addBudget = (b: Omit<Budget, 'id'>) => push(ref(db, 'budgets'), stripUndefined(b));
  const updateBudget = (b: Budget) => {
    const { id, ...data } = b;
    update(ref(db, `budgets/${id}`), stripUndefined(data));
  };
  const deleteBudget = (id: string) => remove(ref(db, `budgets/${id}`));

  const addSavings = (s: Omit<Savings, 'id'>) => push(ref(db, 'savings'), stripUndefined(s));
  const updateSavings = (s: Savings) => {
    const { id, ...data } = s;
    update(ref(db, `savings/${id}`), stripUndefined(data));
  };
  const deleteSavings = (id: string) => remove(ref(db, `savings/${id}`));

  const getBalance = () => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expense') return acc - t.amount;
      return acc;
    }, 0);
  };

  const getIncome = () => transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const getExpenses = () => transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  return (
    <FinanceContext.Provider value={{
      transactions, debts, debtPayments, categories, recurringTransactions, budgets, savings,
      addTransaction, updateTransaction, deleteTransaction, bulkDeleteTransactions, bulkUpdateTransactions,
      addDebt, updateDebt, deleteDebt, addDebtPayment,
      addCategory, updateCategory, deleteCategory,
      addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction,
      addBudget, updateBudget, deleteBudget,
      addSavings, updateSavings, deleteSavings,
      getBalance, getIncome, getExpenses,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};