import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, CheckCircle2, History, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { AddDebtModal } from './modals/AddDebtModal';
import { EditDebtModal } from './modals/EditDebtModal';
import { Debt } from '../types';

type SortOption = 'amount' | 'progress' | 'date' | 'priority';

export const Debts = () => {
  const { debts, deleteDebt } = useFinance();
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [isHistoryMinimized, setIsHistoryMinimized] = useState(true);
  
  // --- Debt Calculations ---
  const activeDebts = debts.filter(d => d.amount > 0);
  const paidDebts = debts.filter(d => d.amount === 0);

  const totalDebt = activeDebts.reduce((sum, d) => sum + d.amount, 0);
  const totalOriginal = debts.reduce((sum, d) => sum + (d.initialAmount || d.amount), 0);
  const totalPaid = totalOriginal - totalDebt;
  
  const totalProgress = totalOriginal > 0 
    ? Math.round(((totalOriginal - totalDebt) / totalOriginal) * 100) 
    : 0;

  const getProgress = (d: Debt) => {
    const init = d.initialAmount || d.amount;
    if (init === 0) return 0;
    return ((init - d.amount) / init) * 100;
  };

  const sortedActiveDebts = useMemo(() => {
    return [...activeDebts].sort((a, b) => {
      if (sortBy === 'amount') {
        return b.amount - a.amount; 
      } else if (sortBy === 'progress') {
        return getProgress(b) - getProgress(a); 
      } else if (sortBy === 'date') {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      } else {
        const pA = a.priority ?? 999;
        const pB = b.priority ?? 999;
        return pA - pB;
      }
    });
  }, [activeDebts, sortBy]);

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
  };

  const handleDelete = () => {
    if (editingDebt) {
        deleteDebt(editingDebt.id);
        setEditingDebt(null);
    }
  };

  return (
    <div className="pb-32 pt-6 px-5 max-w-md mx-auto min-h-screen relative">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-white">
            Debts
        </h1>
        <button 
          onClick={() => setIsAddDebtOpen(true)}
          className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Debt Summary Card */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-6 shadow-xl text-white h-[180px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div>
                    <div className="text-xs font-semibold text-orange-100 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <DollarSign size={14} />
                        Total Balance
                    </div>
                    <div className="text-4xl font-light tracking-tighter">
                        ${totalDebt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                </div>

                <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                        className="text-orange-700/30"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="text-white transition-all duration-1000 ease-out"
                        strokeDasharray={`${totalProgress}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                    {totalProgress}%
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div>
                    <div className="text-[10px] font-semibold text-orange-100 uppercase tracking-widest mb-1">Lifetime</div>
                    <div className="text-lg font-medium">${totalOriginal.toLocaleString()}</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-semibold text-orange-100 uppercase tracking-widest mb-1">Paid</div>
                    <div className="text-lg font-medium">${totalPaid.toLocaleString()}</div>
                </div>
            </div>
        </div>
      </div>

      {/* Sorting Controls */}
      {activeDebts.length > 0 && (
        <div className="flex gap-1 mb-6 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-x-auto no-scrollbar">
          {['priority', 'amount', 'progress', 'date'].map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt as SortOption)}
              className={`flex-1 min-w-[80px] py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${
              sortBy === opt 
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Debt List */}
      <div className="space-y-4 mb-8">
          {sortedActiveDebts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl">
              <div className="text-neutral-400 text-sm font-medium">
                  No active debts found
              </div>
          </div>
          ) : (
          sortedActiveDebts.map((d) => {
              const progress = getProgress(d);
              return (
              <div 
                  key={d.id} 
                  onClick={() => handleEdit(d)}
                  className="p-5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                  <div className="flex justify-between items-center mb-3">
                      <div>
                          <div className="font-semibold text-neutral-900 dark:text-white">{d.name}</div>
                          {d.dueDate && <div className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-0.5">Due: {d.dueDate}</div>}
                      </div>
                      <div className="text-right">
                          <div className="font-bold text-lg text-orange-600 dark:text-orange-500">
                          ${d.amount.toLocaleString()}
                          </div>
                      </div>
                  </div>

                  <div>
                      <div className="flex justify-between items-end mb-1">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Progress</span>
                          <span className="text-xs font-bold text-neutral-700 dark:text-white">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                              className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                              style={{ width: `${progress}%` }}
                          ></div>
                      </div>
                  </div>
              </div>
              );
          })
          )}
      </div>

      {/* Paid History */}
      {paidDebts.length > 0 && (
          <div className="mb-8">
              <button 
                  onClick={() => setIsHistoryMinimized(!isHistoryMinimized)}
                  className="flex items-center justify-between w-full gap-2 mb-4 px-1"
              >
                  <div className="flex items-center gap-2">
                      <History size={14} className="text-neutral-400" />
                      <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                          Paid History ({paidDebts.length})
                      </h2>
                  </div>
                  {isHistoryMinimized ? <ChevronRight size={18} className="text-neutral-300" /> : <ChevronDown size={18} className="text-neutral-300" />}
              </button>
              
              {!isHistoryMinimized && (
                  <div className="space-y-3">
                      {paidDebts.map(d => (
                          <div 
                              key={d.id} 
                              onClick={() => handleEdit(d)}
                              className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex justify-between items-center cursor-pointer"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                      <CheckCircle2 size={16} />
                                  </div>
                                  <div className="font-medium text-neutral-900 dark:text-white text-sm line-through decoration-neutral-300">{d.name}</div>
                              </div>
                              <div className="text-right text-xs font-medium text-neutral-400">
                                  Paid off
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      <AddDebtModal isOpen={isAddDebtOpen} onClose={() => setIsAddDebtOpen(false)} />
      <EditDebtModal 
        debt={editingDebt} 
        isOpen={!!editingDebt} 
        onClose={() => setEditingDebt(null)} 
        onDelete={handleDelete}
      />
    </div>
  );
};