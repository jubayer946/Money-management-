import React from 'react';
import type { SortOption } from './debtTypes';

interface Props {
  sortBy: SortOption;
  onChangeSort: (opt: SortOption) => void;
  show: boolean;
}

export const DebtSortControls: React.FC<Props> = ({
  sortBy,
  onChangeSort,
  show,
}) => {
  if (!show) return null;

  const options: SortOption[] = ['priority', 'amount', 'progress', 'date'];

  return (
    <div className="flex gap-1 mb-6 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-x-auto no-scrollbar">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChangeSort(opt)}
          className={`flex-1 min-w-[85px] py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            sortBy === opt
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-600'
              : 'text-neutral-400 dark:text-neutral-500'
          }`}
        >
          {opt === 'priority' ? 'Custom' : opt}
        </button>
      ))}
    </div>
  );
};