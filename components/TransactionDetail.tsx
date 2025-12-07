
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { ChevronLeft, Edit2, Trash2, Calendar, Tag, CreditCard, Wallet, DollarSign } from 'lucide-react';
import { EditTransactionModal } from './modals/EditTransactionModal';

export const TransactionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, deleteTransaction, wallets } = useFinance();
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

  const walletName = transaction.walletId 
    ? (wallets.find(w => w.id === transaction.walletId)?.name || 'Unknown Wallet') 
    : 'Main Balance';

  return (
    <div className="pb-10 pt-6 px-6 max-w-md mx-auto min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <div className="flex justify-between items-center mb-8">
        <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-sm"
        >
            <ChevronLeft size={20} />
        </button>
        
        <div className="flex gap-3">
             <button 
                onClick={() => setIsEditOpen(true)}
                className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-sm"
            >
                <Edit2 size={18} />
            </button>
             <button 
                onClick={handleDelete}
                className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm"
            >
                <Trash2 size={18} />
            </button>
        </div>
      </div>

      <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Description - Top Priority */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white leading-tight mb-2 break-words">
                {transaction.desc}
            </h1>
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 font-medium text-sm">
                <Calendar size={16} className="opacity-70" />
                {new Date(transaction.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>

        {/* Details Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
             
             {/* Amount Row */}
             <div className="p-5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                        <DollarSign size={20} />
                    </div>
                    <span className="font-medium text-neutral-500 dark:text-neutral-400">Amount</span>
                </div>
                <div className={`text-xl font-bold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-neutral-900 dark:text-white'}`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
             </div>

             {/* Category Row */}
             <div className="p-5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                        <Tag size={18} />
                    </div>
                    <span className="font-medium text-neutral-500 dark:text-neutral-400">Category</span>
                </div>
                <div className="font-semibold text-neutral-900 dark:text-white">
                    {transaction.category || 'Uncategorized'}
                </div>
             </div>

             {/* Type Row */}
             <div className="p-5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                        <CreditCard size={18} />
                    </div>
                    <span className="font-medium text-neutral-500 dark:text-neutral-400">Type</span>
                </div>
                <div className="font-semibold text-neutral-900 dark:text-white capitalize">
                    {transaction.type}
                </div>
             </div>
             
             {/* Wallet Row */}
             <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                        <Wallet size={18} />
                    </div>
                    <span className="font-medium text-neutral-500 dark:text-neutral-400">Wallet</span>
                </div>
                <div className="font-semibold text-neutral-900 dark:text-white">
                    {walletName}
                </div>
             </div>
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
