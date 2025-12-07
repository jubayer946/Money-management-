
import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { TransactionType, ChartPeriod } from '../../types';
import { ArrowUp, ArrowDown, Calendar, ChevronRight } from 'lucide-react';
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

    if (period === 'day') {
        startDate.setHours(0,0,0,0);
        endDate.setHours(23,59,59,999);
    } else if (period === 'week') {
        const day = startDate.getDay();
        const diff = startDate.getDate() - day;
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
      // Basic match
      if (t.type !== type) return false;
      if (t.category !== category) return false;

      // Date match
      const tDate = new Date(t.date);
      const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);

      return adjustedDate >= startDate && adjustedDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [transactions, category, type, period, currentDate, isOpen]);

  const getDateRangeLabel = () => {
    if (period === 'day') return currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (period === 'month') return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (period === 'year') return currentDate.getFullYear().toString();
    return 'Selected Period';
  };

  const totalAmount = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category}>
        <div className="flex justify-between items-end mb-6 bg-neutral-50 dark:bg-neutral-800 p-4 rounded-2xl">
            <div>
                <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">{getDateRangeLabel()}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total {type}</div>
            </div>
            <div className={`text-2xl font-bold tracking-tight ${type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-neutral-900 dark:text-white'}`}>
                ${totalAmount.toLocaleString()}
            </div>
        </div>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-sm">No transactions found for this period</div>
            ) : (
                filteredTransactions.map(t => (
                    <div 
                        key={t.id} 
                        onClick={() => {
                            onClose();
                            navigate(`/transaction/${t.id}`);
                        }}
                        className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                             <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                                t.type === 'income' 
                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                                    : 'bg-red-50 dark:bg-red-900/20 text-neutral-500 dark:text-neutral-400'
                             }`}>
                                {t.type === 'income' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                             </div>
                             <div>
                                <div className="font-medium text-sm text-neutral-900 dark:text-white mb-0.5">{t.desc}</div>
                                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1 font-medium">
                                    <Calendar size={10} />
                                    {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                             </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`font-semibold text-sm ${
                                t.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-neutral-900 dark:text-white'
                            }`}>
                                {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                            </div>
                            <ChevronRight size={14} className="text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-400" />
                        </div>
                    </div>
                ))
            )}
        </div>
    </Modal>
  );
};
