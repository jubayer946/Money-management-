
import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { TransactionType, ChartPeriod } from '../../types';
import { ArrowUp, ArrowDown, Calendar, ChevronRight, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CategoryTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  type: TransactionType;
  period: ChartPeriod;
  currentDate: Date;
}

export const CategoryTransactionsModal: React.FC<CategoryTransactionsModalProps> = ({
  isOpen,
  onClose,
  category,
  type,
  period,
  currentDate
}) => {
  const { transactions } = useFinance();
  const navigate = useNavigate();

  const filteredTransactions = useMemo(() => {
    if (!isOpen) return [];

    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);

    // Precise date range calculation to match Analytics
    if (period === 'day') {
        startDate.setHours(0,0,0,0);
        endDate.setHours(23,59,59,999);
    } else if (period === 'week') {
        const day = startDate.getDay();
        const diff = startDate.getDate() - day; // Sunday start
        startDate.setDate(diff);
        startDate.setHours(0,0,0,0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23,59,59,999);
    } else if (period === 'month') {
        startDate.setDate(1);
        startDate.setHours(0,0,0,0);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23,59,59,999);
    } else if (period === 'year') {
        startDate.setMonth(0, 1);
        startDate.setHours(0,0,0,0);
        endDate.setMonth(11, 31);
        endDate.setHours(23,59,59,999);
    }

    return transactions.filter(t => {
      // 1. Filter by Type
      if (t.type !== type) return false;
      
      // 2. Filter by Category (Handle Uncategorized/Empty/Null)
      const tCat = t.category || 'Uncategorized';
      const targetCat = category || 'Uncategorized';
      if (tCat !== targetCat) return false;

      // 3. Filter by Date
      const tDate = new Date(t.date);
      // Adjust timezone to ensure strict date matching relative to local start/end dates
      const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);

      return adjustedDate >= startDate && adjustedDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [transactions, category, type, period, currentDate, isOpen]);

  const getDateRangeLabel = () => {
    if (period === 'day') return currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (period === 'month') return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (period === 'year') return currentDate.getFullYear().toString();
    if (period === 'week') {
         const start = new Date(currentDate);
         const day = start.getDay();
         start.setDate(start.getDate() - day);
         const end = new Date(start);
         end.setDate(end.getDate() + 6);
         return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
    return 'Selected Period';
  };

  const totalAmount = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  const displayCategory = category || 'Uncategorized';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={displayCategory}>
        {/* Header Summary Card */}
        <div className="flex justify-between items-end mb-6 bg-neutral-50 dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
            <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">
                    <Calendar size={10} />
                    {getDateRangeLabel()}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    Total {type === 'income' ? 'Income' : 'Expense'}
                </div>
            </div>
            <div className={`text-3xl font-bold tracking-tight ${type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-neutral-900 dark:text-white'}`}>
                ${totalAmount.toLocaleString()}
            </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 pb-4">
            {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700">
                    <div className="bg-white dark:bg-neutral-900 p-3 rounded-full mb-3">
                        <Tag size={20} className="text-neutral-300 dark:text-neutral-600" />
                    </div>
                    <div className="text-neutral-400 text-sm font-medium">No transactions found</div>
                    <div className="text-neutral-300 text-xs mt-1">Try changing the date period</div>
                </div>
            ) : (
                filteredTransactions.map(t => (
                    <div 
                        key={t.id} 
                        onClick={() => {
                            onClose();
                            navigate(`/transaction/${t.id}`);
                        }}
                        className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:shadow-sm transition-all active:scale-[0.98] group"
                    >
                        <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                t.type === 'income' 
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 group-hover:bg-green-100 dark:group-hover:bg-green-900/30' 
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/30'
                             }`}>
                                {t.type === 'income' ? <ArrowUp size={18} strokeWidth={2.5} /> : <ArrowDown size={18} strokeWidth={2.5} />}
                             </div>
                             <div>
                                <div className="font-semibold text-sm text-neutral-900 dark:text-white mb-0.5">{t.desc}</div>
                                <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1 font-medium">
                                    <Calendar size={12} />
                                    {new Date(t.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                             </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`font-bold text-sm ${
                                t.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-neutral-900 dark:text-white'
                            }`}>
                                {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                            </div>
                            <ChevronRight size={16} className="text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-400" />
                        </div>
                    </div>
                ))
            )}
        </div>
    </Modal>
  );
};
