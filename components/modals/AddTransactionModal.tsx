

import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { TransactionType } from '../../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, categories } = useFinance();
  const [type, setType] = useState<TransactionType>('expense');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDesc('');
      setAmount('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setType('expense');
    }
  }, [isOpen]);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !desc) return;
    
    addTransaction({
      type,
      desc,
      amount: parseFloat(amount),
      category,
      date
    });
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Transaction">
      <div className="flex gap-2 mb-6 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {['expense', 'income'].map((t) => (
             <button
             key={t}
             onClick={() => {
                setType(t as TransactionType);
                setCategory('');
             }}
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
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">$</span>
             <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="w-full p-4 pl-8 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
                required
                autoFocus
            />
          </div>
        </div>

        <div>
            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Description</label>
            <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What is this for?"
                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
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
                <option value="">Select...</option>
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
          Add Transaction
        </button>
      </form>
    </Modal>
  );
};
