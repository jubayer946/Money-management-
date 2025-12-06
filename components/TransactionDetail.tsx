

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { ArrowUp, ArrowDown, ChevronLeft, Edit2, Trash2 } from 'lucide-react';
import { EditTransactionModal } from './modals/EditTransactionModal';

export const TransactionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, deleteTransaction } = useFinance();
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Compare as string since Firebase IDs are strings
  const transaction = transactions.find(t => t.id === id);

  if (!transaction) {
    return (
      <div className="p-6 text-center">
        <div className="text-neutral-500 mb-4">Transaction not found</div>
        <button onClick={() => navigate('/')} className="text-neutral-900 dark:text-white font-medium hover:underline">Go Home</button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    navigate(-1);
  };

  return (
    <div className="pb-24 pt-6 px-5 max-w-md mx-auto min-h-screen flex flex-col">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors mb-6 text-sm font-medium self-start"
      >
        <ChevronLeft size={18} />
        Back
      </button>

      <div className="flex-1 flex flex-col items-center pt-8">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl ${
            transaction.type === 'income' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-500 shadow-green-100 dark:shadow-none' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-500 shadow-red-100 dark:shadow-none'
        }`}>
          {transaction.type === 'income' ? <ArrowUp size={32} strokeWidth={2.5} /> : <ArrowDown size={32} strokeWidth={2.5} />}
        </div>
        
        <div className={`text-5xl font-light tracking-tighter mb-2 ${
            transaction.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'
        }`}>
          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
        </div>
        
        <div className="text-sm font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-10">
          {transaction.type}
        </div>

        <div className="w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden mb-8">
          <div className="flex justify-between items-center p-4 border-b border-neutral-50 dark:border-neutral-800">
            <span className="text-sm text-neutral-500 font-medium">Description</span>
            <span className="text-sm text-neutral-900 dark:text-white font-medium text-right">{transaction.desc}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 border-b border-neutral-50 dark:border-neutral-800">
            <span className="text-sm text-neutral-500 font-medium">Category</span>
            <span className="text-sm text-neutral-900 dark:text-white font-medium">{transaction.category || '-'}</span>
          </div>

          <div className="flex justify-between items-center p-4">
            <span className="text-sm text-neutral-500 font-medium">Date</span>
            <span className="text-sm text-neutral-900 dark:text-white font-medium">
              {new Date(transaction.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex gap-4 w-full mt-auto">
          <button 
            onClick={() => setIsEditOpen(true)}
            className="flex-1 py-4 flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
          >
            <Edit2 size={18} />
            Edit
          </button>
          <button 
            onClick={handleDelete}
            className="flex-1 py-4 flex items-center justify-center gap-2 bg-white dark:bg-neutral-900 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl font-medium shadow-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>

      <EditTransactionModal 
        transaction={transaction}
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)}
        onDelete={handleDelete}
      />
    </div>
  );
};