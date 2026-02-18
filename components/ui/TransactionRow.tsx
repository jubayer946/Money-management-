import React from 'react';
import { ArrowUp, ArrowDown, ChevronRight, Repeat, CheckSquare, Square } from 'lucide-react';
import { Transaction } from '../../types';
import { formatCurrency, formatShortDate } from '../../utils/format';

interface TransactionRowProps {
  transaction: Transaction;
  onClick: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  catColor?: string;
  className?: string;
  showChevron?: boolean;
  style?: React.CSSProperties;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onClick,
  isSelectionMode = false,
  isSelected = false,
  catColor = '#a3a3a3',
  className = '',
  showChevron = true,
  style = {}
}) => {
  const isIncome = transaction.type === 'income';

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={`w-full flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border rounded-2xl transition-all cursor-pointer group text-left ${
        isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-neutral-50 dark:border-neutral-800 shadow-sm hover:border-neutral-200 dark:hover:border-neutral-700'
      } ${className}`}
    >
      <div className="flex items-center gap-4">
        {isSelectionMode ? (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200/50' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600'}`}>
            {isSelected ? <CheckSquare size={20} strokeWidth={2.5} /> : <Square size={20} strokeWidth={2.5} />}
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
            isIncome 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
          }`}>
            {isIncome ? <ArrowUp size={18} strokeWidth={2.5} /> : <ArrowDown size={18} strokeWidth={2.5} />}
          </div>
        )}
        
        <div className="overflow-hidden">
          <div className="font-semibold text-neutral-900 dark:text-white text-sm truncate max-w-[150px] mb-1">{transaction.desc}</div>
          <div className="flex items-center gap-2 flex-wrap">
            {transaction.category && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-50 dark:bg-neutral-800/80 rounded-full border border-neutral-100 dark:border-neutral-700/50">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                <span className="text-[9px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">{transaction.category}</span>
              </div>
            )}
            <div className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1 font-bold uppercase tracking-tight">
              {formatShortDate(transaction.date)}
            </div>
            {transaction.isRecurring && <Repeat size={10} className="text-indigo-400" />}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-2">
        <div className={`font-black text-sm tracking-tight ${
          isIncome ? 'text-green-600 dark:text-green-500' : 'text-neutral-900 dark:text-white'
        }`}>
          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
        </div>
        {showChevron && !isSelectionMode && (
          <ChevronRight size={16} className="text-neutral-200 dark:text-neutral-600 transition-transform group-hover:translate-x-1" />
        )}
      </div>
    </button>
  );
};