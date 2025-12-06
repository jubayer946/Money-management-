
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { ArrowUp, ArrowDown, ChevronLeft, Edit2, Trash2, Calendar, Tag, CreditCard } from 'lucide-react';
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
    <div className="pb-24 pt-6 px-5 max-w-md mx-auto min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <div className="flex justify-between items-center mb-6">
        <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors text-sm font-medium"
        >
            <ChevronLeft size={18} />
            Back
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center pt-4">
        
        {/* Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-xl ${
            transaction.type === 'income' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 shadow-green-200/50 dark:shadow-none' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-red-200/50 dark:shadow-none'
        }`}>
          {transaction.type === 'income' ? <ArrowUp size={28} strokeWidth={3} /> : <ArrowDown size={28} strokeWidth={3} />}
        </div>
        
        {/* Description - Prominently on Top */}
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white text-center mb-2 leading-snug px-4">
            {transaction.desc}
        </h1>

        {/* Date - Subtitle */}
        <div className="text-sm font-medium text-neutral-400 dark:text-neutral-500 mb-8 flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(transaction.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        {/* Amount & Details Card */}
        <div className="w-full bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-6 mb-6">
             <div className="text-center">
                 <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Amount</div>
                 <div className={`text-4xl font-semibold tracking-tight ${
                    transaction.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-neutral-900 dark:text-white'
                 }`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                 <div className="text-center">
                     <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
                        <Tag size={12} />
                        Category
                     </div>
                     <div className="font-medium text-neutral-900 dark:text-white">
                        {transaction.category || 'Uncategorized'}
                     </div>
                 </div>
                 <div className="text-center border-l border-neutral-100 dark:border-neutral-800">
                     <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">
                        <CreditCard size={12} />
                        Type
                     </div>
                     <div className="font-medium text-neutral-900 dark:text-white capitalize">
                        {transaction.type}
                     </div>
                 </div>
             </div>
        </div>

        <div className="flex gap-4 w-full mt-auto">
          <button 
            onClick={() => setIsEditOpen(true)}
            className="flex-1 py-4 flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-medium shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all active:scale-95"
          >
            <Edit2 size={18} />
            Edit
          </button>
          <button 
            onClick={handleDelete}
            className="flex-1 py-4 flex items-center justify-center gap-2 bg-white dark:bg-neutral-900 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl font-medium shadow-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all active:scale-95"
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
