

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Saving, Debt, Category, RecurringTransaction, DebtPayment, FinanceContextType, TransactionType, Wallet, Budget } from '../types';
import { db } from '../firebaseConfig';
import { ref, onValue, push, set, remove, update } from 'firebase/database';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Salary', type: 'income', color: '#10b981' },
  { id: '2', name: 'Freelance', type: 'income', color: '#3b82f6' },
  { id: '3', name: 'Investments', type: 'income', color: '#8b5cf6' },
  { id: '4', name: 'Food', type: 'expense', color: '#f59e0b' },
  { id: '5', name: 'Transport', type: 'expense', color: '#6366f1' },
  { id: '6', name: 'Shopping', type: 'expense', color: '#ec4899' },
  { id: '7', name: 'Bills', type: 'expense', color: '#ef4444' },
  { id: '8', name: 'Entertainment', type: 'expense', color: '#06b6d4' },
  { id: '9', name: 'Transfer', type: 'transfer', color: '#64748b' },
];

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize data listeners
  useEffect(() => {
    const txRef = ref(db, 'transactions');
    const savingsRef = ref(db, 'savings');
    const debtsRef = ref(db, 'debts');
    const debtPaymentsRef = ref(db, 'debtPayments');
    const catsRef = ref(db, 'categories');
    const recurringRef = ref(db, 'recurringTransactions');
    const walletsRef = ref(db, 'wallets');
    const budgetsRef = ref(db, 'budgets');

    const unsubTx = onValue(txRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      // Sort by date descending
      setTransactions(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    const unsubSavings = onValue(savingsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setSavings(list);
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
        const list = Object.keys(data).map(key => {
            const cat = data[key];
            return { 
                id: key, 
                name: cat.name,
                // Backwards compatibility for old categories
                type: cat.type || 'expense', 
                color: cat.color || '#64748b' 
            };
        });
        setCategories(list);
      } else {
        // Initialize default categories if none exist
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

    const unsubWallets = onValue(walletsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setWallets(list);
    });

    const unsubBudgets = onValue(budgetsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setBudgets(list);
    });

    return () => {
      unsubTx();
      unsubSavings();
      unsubDebts();
      unsubDebtPayments();
      unsubCats();
      unsubRecurring();
      unsubWallets();
      unsubBudgets();
    };
  }, []);

  // Check for recurring transactions
  useEffect(() => {
    if (loading) return;

    const checkRecurring = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      recurringTransactions.forEach(rt => {
        const start = new Date(rt.startDate);
        const last = rt.lastProcessed ? new Date(rt.lastProcessed) : new Date(start.getTime() - 86400000); 
        
        let nextDue = new Date(last);
        
        // Calculate next due date
        if (rt.frequency === 'daily') nextDue.setDate(nextDue.getDate() + 1);
        if (rt.frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
        if (rt.frequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
        if (rt.frequency === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);

        // If next due date is today or in the past
        if (nextDue <= today) {
          // Add to Firebase
          push(ref(db, 'transactions'), {
            type: rt.type,
            desc: rt.desc,
            amount: rt.amount,
            category: rt.category,
            date: nextDue.toISOString().split('T')[0]
          });
          
          // Update last processed
          update(ref(db, `recurringTransactions/${rt.id}`), {
            lastProcessed: nextDue.toISOString().split('T')[0]
          });
        }
      });
    };

    checkRecurring();
  }, [recurringTransactions, loading]);


  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    push(ref(db, 'transactions'), t);
  };

  const updateTransaction = (t: Transaction) => {
    const { id, ...data } = t;
    update(ref(db, `transactions/${id}`), data);
  };

  const deleteTransaction = (id: string) => {
    remove(ref(db, `transactions/${id}`));
  };

  const addSaving = (s: Omit<Saving, 'id'>) => {
    push(ref(db, 'savings'), s);
  };

  const deleteSaving = (id: string) => {
    remove(ref(db, `savings/${id}`));
  };

  const addDebt = (d: Omit<Debt, 'id'>) => {
    push(ref(db, 'debts'), d);
  };

  const updateDebt = (d: Debt) => {
    const { id, ...data } = d;
    update(ref(db, `debts/${id}`), data);
  };

  const deleteDebt = (id: string) => {
    remove(ref(db, `debts/${id}`));
  };
  
  const addDebtPayment = (dp: Omit<DebtPayment, 'id'>) => {
    push(ref(db, 'debtPayments'), dp);
  };

  const addCategory = (name: string, type: TransactionType, color: string) => {
    push(ref(db, 'categories'), { name, type, color });
  };

  const updateCategory = (c: Category) => {
    const { id, ...data } = c;
    update(ref(db, `categories/${id}`), data);
  };

  const deleteCategory = (id: string) => {
    remove(ref(db, `categories/${id}`));
  };

  const addRecurringTransaction = (t: Omit<RecurringTransaction, 'id'>) => {
    push(ref(db, 'recurringTransactions'), t);
  };

  const deleteRecurringTransaction = (id: string) => {
    remove(ref(db, `recurringTransactions/${id}`));
  };

  const addWallet = (w: Omit<Wallet, 'id'>) => {
    push(ref(db, 'wallets'), w);
  };

  const deleteWallet = (id: string) => {
    remove(ref(db, `wallets/${id}`));
  };

  const addBudget = (b: Omit<Budget, 'id'>) => {
    push(ref(db, 'budgets'), b);
  };

  const updateBudget = (b: Budget) => {
    const { id, ...data } = b;
    update(ref(db, `budgets/${id}`), data);
  };

  const deleteBudget = (id: string) => {
    remove(ref(db, `budgets/${id}`));
  };

  const getWalletBalance = (walletId?: string) => {
    return transactions.reduce((acc, t) => {
        if (walletId) {
            // Specific Wallet Logic
            if (t.type === 'income' && t.walletId === walletId) return acc + t.amount;
            if (t.type === 'expense' && t.walletId === walletId) return acc - t.amount;
            
            if (t.type === 'transfer') {
                if (t.targetWalletId === walletId) return acc + t.amount;
                if (t.walletId === walletId) return acc - t.amount;
            }
        } else {
            // Main Balance Logic (transactions with no walletId)
            if (t.type === 'income' && !t.walletId) return acc + t.amount;
            if (t.type === 'expense' && !t.walletId) return acc - t.amount;
            
            if (t.type === 'transfer') {
                // If source is main
                if (!t.walletId) return acc - t.amount;
                // If destination is main (target is empty/undefined and source is a wallet)
                if (!t.targetWalletId && t.walletId) return acc + t.amount;
            }
        }
        return acc;
    }, 0);
  };

  // Global Net Worth
  const getBalance = () => {
    return transactions.reduce((acc, t) => {
      // Transfers don't change net worth if logic is single-wallet, 
      // but conceptually they are ignored in net worth anyway.
      if (t.type === 'transfer') return acc;
      
      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expense') return acc - t.amount;
      return acc;
    }, 0);
  };

  const getIncome = () => {
    return transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  };

  const getExpenses = () => {
    return transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  };

  return (
    <FinanceContext.Provider value={{
      transactions,
      savings,
      debts,
      debtPayments,
      categories,
      recurringTransactions,
      wallets,
      budgets,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addSaving,
      deleteSaving,
      addDebt,
      updateDebt,
      deleteDebt,
      addDebtPayment,
      addCategory,
      updateCategory,
      deleteCategory,
      addRecurringTransaction,
      deleteRecurringTransaction,
      addWallet,
      deleteWallet,
      addBudget,
      updateBudget,
      deleteBudget,
      getWalletBalance,
      getBalance,
      getIncome,
      getExpenses,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};