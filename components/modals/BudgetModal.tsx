
import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { Budget } from '../../types';
import { Trash2 } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget?: Budget | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ isOpen, onClose, budget }) => {
  const { categories, addBudget, updateBudget, deleteBudget } = useFinance();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (budget) {
      setCategory(budget.category);
      setAmount(budget.amount.toString());
    } else {
      setCategory('');
      setAmount('');
    }
  }, [budget, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) return;

    if (budget) {
      updateBudget({
        ...budget,
        category,
        amount: parseFloat(amount)
      });
    } else {
      addBudget({
        category,
        amount: parseFloat(amount)
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (budget) {
      deleteBudget(budget.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={budget ? "Edit Budget" : "Set Budget"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!!budget} 
            className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
            required
          >
            <option value="">Select Category</option>
            {expenseCategories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Monthly Limit</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="1"
              min="0"
              className="w-full p-4 pl-8 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 mt-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
        >
          {budget ? 'Update Budget' : 'Set Budget'}
        </button>
        
        {budget && (
           <button
             type="button"
             onClick={handleDelete}
             className="w-full py-4 flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
           >
             <Trash2 size={18} />
             Remove Budget
           </button>
        )}
      </form>
    </Modal>
  );
};
