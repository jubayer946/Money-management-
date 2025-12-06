

import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowUp, ArrowDown, PiggyBank, Settings, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SavingsModal } from './modals/SavingsModal';
import { SettingsModal } from './modals/SettingsModal';

export const Dashboard: React.FC = () => {
  const { getBalance, getIncome, getExpenses, transactions } = useFinance();
  const navigate = useNavigate();
  const [isSavingsOpen, setIsSavingsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const balance = getBalance(); 
  const income = getIncome();
  const expenses = getExpenses();

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="pb-32 pt-6 px-5 max-w-md mx-auto min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-lg font-medium tracking-tight text-neutral-900 dark:text-white">Money</h1>
        <div className="flex gap-2">
          <button onClick={() => setIsSavingsOpen(true)} className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-sm">
            <PiggyBank size={18} />
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white transition-colors shadow-sm">
            <Settings size={18} />
          </button>
        </div>
      </header>

      <div className="text-center mb-10">
        <div className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Net Worth</div>
        <div className={`text-5xl font-light tracking-tighter mb-6 ${balance < 0 ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
          ${Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
        
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="text-lg font-medium text-green-600 dark:text-green-500 mb-0.5">${income.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Income</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium text-red-500 dark:text-red-400 mb-0.5">${expenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Expenses</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 px-1">
        <div className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Recent</div>
        <button 
          onClick={() => navigate('/transactions')}
          className="text-xs font-medium text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
        >
          View all
        </button>
      </div>

      <div className="space-y-px bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-sm border border-neutral-100 dark:border-neutral-800">
        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-neutral-900 text-neutral-400 text-sm">No transactions yet</div>
        ) : (
          recentTransactions.map(t => {
            return (
              <div 
                key={t.id} 
                onClick={() => navigate(`/transaction/${t.id}`)}
                className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      t.type === 'income' 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                        : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                  }`}>
                    {t.type === 'income' ? <ArrowUp size={18} strokeWidth={2.5} /> : <ArrowDown size={18} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-white text-sm mb-0.5">{t.desc}</div>
                    <div className="text-xs text-neutral-400 dark:text-neutral-500 font-medium flex items-center gap-1">
                      {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {t.category && (
                          <>
                             <span className="opacity-50">•</span>
                             {t.category}
                          </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`font-medium ${
                      t.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                  </div>
                  <ChevronRight size={16} className="text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-400 dark:group-hover:text-neutral-500" />
                </div>
              </div>
            );
          })
        )}
      </div>

      <SavingsModal isOpen={isSavingsOpen} onClose={() => setIsSavingsOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};