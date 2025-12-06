
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Wallet {
  id: string;
  name: string;
  type: 'digital' | 'bank' | 'cash';
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  desc: string;
  amount: number;
  category: string;
  date: string; // ISO date string YYYY-MM-DD
  walletId?: string;
  targetWalletId?: string;
}

export interface Saving {
  id: string;
  name: string;
  amount: number;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
}

export interface Debt {
  id: string;
  name: string;
  amount: number;
  initialAmount: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string;
  notes?: string;
  category?: string;
  date?: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export type ChartPeriod = 'day' | 'week' | 'month' | 'year';

export interface ChartDataPoint {
  label: string;
  income: number;
  expense: number;
  balance: number;
  date?: string;
  month?: number;
  year?: number;
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  desc: string;
  amount: number;
  category: string;
  startDate: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastProcessed?: string;
}

export interface FinanceContextType {
  transactions: Transaction[];
  savings: Saving[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  categories: Category[];
  recurringTransactions: RecurringTransaction[];
  wallets: Wallet[];
  budgets: Budget[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addSaving: (s: Omit<Saving, 'id'>) => void;
  deleteSaving: (id: string) => void;
  addDebt: (d: Omit<Debt, 'id'>) => void;
  updateDebt: (d: Debt) => void;
  deleteDebt: (id: string) => void;
  addDebtPayment: (dp: Omit<DebtPayment, 'id'>) => void;
  addCategory: (name: string, type: TransactionType, color: string) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addRecurringTransaction: (t: Omit<RecurringTransaction, 'id'>) => void;
  deleteRecurringTransaction: (id: string) => void;
  addWallet: (w: Omit<Wallet, 'id'>) => void;
  deleteWallet: (id: string) => void;
  addBudget: (b: Omit<Budget, 'id'>) => void;
  updateBudget: (b: Budget) => void;
  deleteBudget: (id: string) => void;
  getWalletBalance: (id?: string) => number;
  getBalance: () => number;
  getIncome: () => number;
  getExpenses: () => number;
}
