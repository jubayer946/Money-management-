import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { Trash2 } from 'lucide-react';

interface SavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavingsModal: React.FC<SavingsModalProps> = ({ isOpen, onClose }) => {
  const { savings, addSaving, deleteSaving } = useFinance();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);

  const handleAdd = () => {
    if (!name || !amount) return;
    addSaving({ name, amount: parseFloat(amount) });
    setName('');
    setAmount('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Savings">
      <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-2xl text-center mb-6 border border-neutral-100 dark:border-neutral-700">
        <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium mb-1">Total Saved</div>
        <div className="text-4xl font-light tracking-tighter text-neutral-900 dark:text-white">${totalSavings.toLocaleString()}</div>
      </div>

      <div className="max-h-60 overflow-y-auto mb-6 pr-2">
        {savings.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-sm">No savings goals yet</div>
        ) : (
          <div className="space-y-3">
            {savings.map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-sm">
                <div>
                  <div className="font-medium text-neutral-900 dark:text-white">{s.name}</div>
                  <div className="text-green-600 dark:text-green-500 font-medium text-sm">${s.amount.toLocaleString()}</div>
                </div>
                <button 
                  onClick={() => deleteSaving(s.id)}
                  className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Goal name"
          className="flex-1 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white rounded-xl outline-none text-sm transition-all text-neutral-900 dark:text-white"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          step="0.01"
          className="w-24 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white rounded-xl outline-none text-sm transition-all text-neutral-900 dark:text-white"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all text-sm"
        >
          Add
        </button>
      </div>
    </Modal>
  );
};