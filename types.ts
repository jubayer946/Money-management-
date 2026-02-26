export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  desc: string;
  amount: number;
  category: string;
  date: string;
  isRecurring?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
}

export interface Savings {
  id: string;
  name: string;
  amount: number;
  goal?: number;
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
  priority?: number;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  desc: string;
  amount: number;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  lastProcessed?: string | null;
  interval?: number;
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

export interface FinanceContextType {
  transactions: Transaction[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  categories: Category[];
  recurringTransactions: RecurringTransaction[];
  budgets: Budget[];
  savings: Savings[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  bulkDeleteTransactions: (ids: string[]) => Promise<void>;
  bulkUpdateTransactions: (updates: Transaction[]) => Promise<void>;
  addDebt: (d: Omit<Debt, 'id'>) => void;
  updateDebt: (d: Debt) => void;
  deleteDebt: (id: string) => void;
  addDebtPayment: (dp: Omit<DebtPayment, 'id'>) => void;
  addCategory: (name: string, type: TransactionType, color: string) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addRecurringTransaction: (t: Omit<RecurringTransaction, 'id'>) => void;
  updateRecurringTransaction: (t: RecurringTransaction) => void;
  deleteRecurringTransaction: (id: string) => void;
  addBudget: (b: Omit<Budget, 'id'>) => void;
  updateBudget: (b: Budget) => void;
  deleteBudget: (id: string) => void;
  addSavings: (s: Omit<Savings, 'id'>) => void;
  updateSavings: (s: Savings) => void;
  deleteSavings: (id: string) => void;
  getBalance: () => number;
  getIncome: () => number;
  getExpenses: () => number;
}