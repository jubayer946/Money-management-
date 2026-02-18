import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { TransactionType, ChartPeriod } from '../../types';
import { Calendar, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TransactionRow } from '../ui/TransactionRow';
import { formatCurrency, formatShortDate } from '../../utils/format';

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
  const { transactions, categories } = useFinance();
  const navigate = useNavigate();

  const filteredTransactions = useMemo(() => {
    if (!isOpen) return [];

    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);

    if (period === 'day') {
        startDate.setHours(0,0,0,0);
        endDate.setHours(23,59,59,999);
    } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - startDate.getDay());
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
      if (t.type !== type) return false;
      const tCat = t.category || 'Uncategorized';
      const targetCat = category || 'Uncategorized';
      if (tCat !== targetCat) return false;
      const tDate = new Date(t.date);
      const userTimezoneOffset = tDate.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(tDate.getTime() + userTimezoneOffset);
      return adjustedDate >= startDate && adjustedDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [transactions, category, type, period, currentDate, isOpen]);

  const totalAmount = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category || 'Uncategorized'}>
        <div className="flex justify-between items-end mb-6 bg-neutral-50 dark:bg-neutral-800 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
            <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">
                    <Calendar size={10} />
                    {period === 'day' ? formatShortDate(currentDate) : 'Selected Period'}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    Total {type}
                </div>
            </div>
            <div className={`text-3xl font-bold tracking-tight ${type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-neutral-900 dark:text-white'}`}>
                {formatCurrency(totalAmount)}
            </div>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 pb-4 no-scrollbar">
            {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-dashed border-neutral-200">
                    <Tag size={20} className="text-neutral-300 mb-2" />
                    <div className="text-neutral-400 text-sm">No transactions found</div>
                </div>
            ) : (
                filteredTransactions.map(t => (
                    <TransactionRow 
                        key={t.id} 
                        transaction={t}
                        onClick={() => { onClose(); navigate(`/transaction/${t.id}`); }}
                        catColor={categories.find(c => c.name === t.category)?.color}
                    />
                ))
            )}
        </div>
    </Modal>
  );
};
