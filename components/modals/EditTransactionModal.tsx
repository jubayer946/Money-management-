

import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { Transaction, TransactionType } from '../../types';
import { Trash2 } from 'lucide-react';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, isOpen, onClose, onDelete }) => {
  const { updateTransaction, categories } = useFinance();
  const [type, setType] = useState<TransactionType>('income');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const filteredCategories = categories.filter(c => c.type === type);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setDesc(transaction.desc);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setDate(transaction.date);
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !amount) return;
    
    updateTransaction({
      ...transaction,
      type,
      desc,
      amount: parseFloat(amount),
      category,
      date,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaction">
       <div className="flex gap-2 mb-6 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {['income', 'expense'].map((t) => (
             <button
             key={t}
             onClick={() => setType(t as TransactionType)}
             className={`flex-1 min-w-[80px] py-3 text-sm font-medium rounded-lg transition-all capitalize ${
               type === t 
                 ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md' 
                 : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
             }`}
           >
             {t}
           </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0.01"
            className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
            required
          />
        </div>

        <div>
            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Description</label>
            <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                required
            />
        </div>

        <div>
            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Category</label>
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
            >
                <option value="">No category</option>
                {filteredCategories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
                ))}
            </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 mt-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
        >
          Save Changes
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="w-full py-4 flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
        >
          <Trash2 size={18} />
          Delete Transaction
        </button>
      </form>
    </Modal>
  );
};