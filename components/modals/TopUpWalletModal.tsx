import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { Wallet } from 'lucide-react';
import { db } from '../../firebaseConfig';
import { ref, push } from 'firebase/database';

interface TopUpWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopUpWalletModal: React.FC<TopUpWalletModalProps> = ({ isOpen, onClose }) => {
  const { wallets, addTransaction } = useFinance();
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    let targetId = wallets.length > 0 ? wallets[0].id : null;

    // If no wallet exists, create a default one
    if (!targetId) {
       const newRef = push(ref(db, 'wallets'), { 
          name: 'Digital Wallet', 
          type: 'digital', 
          color: '#6366f1' 
       });
       targetId = newRef.key;
    }

    if (targetId) {
        addTransaction({
            type: 'transfer',
            desc: 'Top up Digital Wallet',
            amount: parseFloat(amount),
            category: 'Transfer',
            date: new Date().toISOString().split('T')[0],
            walletId: undefined, // undefined implies From Main Balance
            targetWalletId: targetId
        });
    }

    setAmount('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Digital Wallet">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 dark:text-neutral-500">
                <Wallet size={32} strokeWidth={1.5} />
            </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 text-center">Amount to Add</label>
          <div className="relative max-w-[200px] mx-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium text-lg">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="w-full p-4 pl-8 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-2xl outline-none transition-all font-bold text-2xl text-center text-neutral-900 dark:text-white"
              required
              autoFocus
            />
          </div>
          <p className="text-[10px] text-neutral-400 mt-4 text-center">
             This will deduct money from your Main Balance and add it to your Digital Wallet.
          </p>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
        >
          Add Money
        </button>
      </form>
    </Modal>
  );
};