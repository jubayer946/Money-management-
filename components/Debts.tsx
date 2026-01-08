
import React, { useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, CheckCircle2, History, TrendingUp, BarChart2, Edit2, Calendar, Percent, DollarSign, ListOrdered, Check, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { AddDebtModal } from './modals/AddDebtModal';
import { EditDebtModal } from './modals/EditDebtModal';
import { Debt } from '../types';

type SortOption = 'amount' | 'progress' | 'date' | 'priority';

interface SwipeState {
  id: string | null;
  startX: number;
  currentX: number;
  isSwiping: boolean;
}

export const Debts: React.FC = () => {
  const { debts, deleteDebt, updateDebt, addTransaction, addDebtPayment } = useFinance();
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [isHistoryMinimized, setIsHistoryMinimized] = useState(true);
  
  // --- Drag and Drop State ---
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // --- Swipe State ---
  const [swipe, setSwipe] = useState<SwipeState>({ id: null, startX: 0, currentX: 0, isSwiping: false });
  const SWIPE_THRESHOLD = 120; // px to trigger action

  // --- Debt Calculations ---
  const activeDebts = debts.filter(d => d.amount > 0);
  const paidDebts = debts.filter(d => d.amount === 0);

  const totalDebt = activeDebts.reduce((sum, d) => sum + d.amount, 0);
  const totalOriginal = debts.reduce((sum, d) => sum + (d.initialAmount || d.amount), 0);
  const totalPaid = totalOriginal - totalDebt;
  
  const totalProgress = totalOriginal > 0 
    ? Math.round(((totalOriginal - totalDebt) / totalOriginal) * 100) 
    : 0;

  // --- Sorting Logic ---
  const getProgress = (d: Debt) => {
    const init = d.initialAmount || d.amount;
    if (init === 0) return 0;
    return ((init - d.amount) / init) * 100;
  };

  const sortedActiveDebts = [...activeDebts].sort((a, b) => {
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

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId === targetId) return;

    const newItems = [...sortedActiveDebts];
    const sourceIndex = newItems.findIndex(d => d.id === sourceId);
    const targetIndex = newItems.findIndex(d => d.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const [removed] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Update all priorities to match the new order
    newItems.forEach((item, index) => {
      if (item.priority !== index) {
        updateDebt({ ...item, priority: index });
      }
    });

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
  };

  const handleDelete = () => {
    if (editingDebt) {
        deleteDebt(editingDebt.id);
        setEditingDebt(null);
    }
  };

  const settleDebt = (debt: Debt) => {
    const remaining = debt.amount;
    if (remaining <= 0) return;

    // 1. Add Transaction
    addTransaction({
      type: 'expense',
      desc: `Paid Off: ${debt.name}`,
      amount: remaining,
      category: 'Debt',
      date: new Date().toISOString().split('T')[0]
    });

    // 2. Track Payment History
    addDebtPayment({
      debtId: debt.id,
      amount: remaining,
      date: new Date().toISOString().split('T')[0]
    });

    // 3. Update Debt to 0
    updateDebt({
      ...debt,
      amount: 0
    });
  };

  // --- Touch Event Handlers for Swipe ---
  const onTouchStart = (e: React.TouchEvent, id: string) => {
    setSwipe({ id, startX: e.touches[0].clientX, currentX: e.touches[0].clientX, isSwiping: true });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swipe.isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - swipe.startX;
    
    // Only allow swiping to the right
    if (diff > 0) {
      setSwipe(prev => ({ ...prev, currentX }));
    }
  };

  const onTouchEnd = () => {
    if (!swipe.id) return;
    
    const diff = swipe.currentX - swipe.startX;
    if (diff > SWIPE_THRESHOLD) {
      const debtToPay = activeDebts.find(d => d.id === swipe.id);
      if (debtToPay) settleDebt(debtToPay);
    }

    setSwipe({ id: null, startX: 0, currentX: 0, isSwiping: false });
  };

  return (
    <div className="pb-32 pt-6 px-5 max-w-md mx-auto min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-white">
            Debts & Assets
        </h1>
        <button 
          onClick={() => setIsAddDebtOpen(true)}
          className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:scale-105 transition-all"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Debt Summary Card */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl p-6 shadow-xl shadow-orange-200/50 dark:shadow-none relative overflow-hidden text-white h-[220px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <div className="text-xs font-semibold text-orange-100 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <DollarSign size={14} />
                        Total Debt
                    </div>
                    <div className="text-4xl font-light tracking-tighter">
                        ${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                        className="text-white drop-shadow-md transition-all duration-1000 ease-out"
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

            <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
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

      {/* --- DEBTS LIST --- */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sorting Controls */}
            {activeDebts.length > 0 && (
            <div className="flex gap-1 mb-6 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-x-auto no-scrollbar">
            <button
                onClick={() => setSortBy('priority')}
                className={`flex-1 min-w-[80px] py-2 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                sortBy === 'priority' 
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
            >
                <ListOrdered size={14} />
                Order
            </button>
            <button
                onClick={() => setSortBy('amount')}
                className={`flex-1 min-w-[80px] py-2 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                sortBy === 'amount' 
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
            >
                <BarChart2 size={14} />
                Bal
            </button>
            <button
                onClick={() => setSortBy('progress')}
                className={`flex-1 min-w-[80px] py-2 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                sortBy === 'progress' 
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
            >
                <TrendingUp size={14} />
                Prog
            </button>
            <button
                onClick={() => setSortBy('date')}
                className={`flex-1 min-w-[80px] py-2 text-[10px] font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                sortBy === 'date' 
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
            >
                <Calendar size={14} />
                Date
            </button>
            </div>
        )}

        {/* Active Debt List */}
        <div className="space-y-4 mb-8">
            {activeDebts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl">
                <div className="text-neutral-300 dark:text-neutral-700 mb-2">
                <CheckCircle2 size={32} className="mx-auto text-green-500" />
                </div>
                <div className="text-neutral-400 dark:text-neutral-500 text-sm font-medium">
                    {paidDebts.length > 0 ? "All debts paid off!" : "No debts tracked"}
                </div>
            </div>
            ) : (
            sortedActiveDebts.map((d, index) => {
                const progress = getProgress(d);
                const initial = d.initialAmount || d.amount;
                const isSwipingThis = swipe.id === d.id;
                const swipeOffset = isSwipingThis ? Math.max(0, swipe.currentX - swipe.startX) : 0;
                
                const isBeingDragged = draggedId === d.id;
                const isDragTarget = dragOverId === d.id;

                return (
                <div 
                    key={d.id} 
                    className={`group flex gap-3 animate-in slide-in-from-right-4 duration-300 transition-all ${isBeingDragged ? 'opacity-30' : 'opacity-100'} ${isDragTarget ? 'scale-[1.02] translate-x-1' : ''}`}
                    onDragOver={(e) => sortBy === 'priority' && handleDragOver(e, d.id)}
                    onDrop={(e) => sortBy === 'priority' && handleDrop(e, d.id)}
                    onDragEnd={handleDragEnd}
                >
                    {/* Reordering Grip Handle */}
                    {sortBy === 'priority' && (
                        <div className="flex flex-col justify-center">
                            <div 
                              draggable
                              onDragStart={(e) => handleDragStart(e, d.id)}
                              className="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl cursor-grab active:cursor-grabbing transition-colors shadow-sm"
                              title="Hold and drag to reorder"
                            >
                                <GripVertical size={20} />
                            </div>
                        </div>
                    )}

                    <div className="flex-1 relative overflow-hidden rounded-2xl touch-pan-y">
                        {/* Swipe Action Background */}
                        <div className="absolute inset-0 bg-green-500 flex items-center pl-6 transition-opacity duration-200" style={{ opacity: swipeOffset > 20 ? 1 : 0 }}>
                            <div className="flex items-center gap-2 text-white">
                                <Check size={24} strokeWidth={3} className={`transition-transform duration-200 ${swipeOffset > SWIPE_THRESHOLD ? 'scale-125' : 'scale-100'}`} />
                                <span className="font-bold text-sm uppercase tracking-wider">Paid Off</span>
                            </div>
                        </div>

                        {/* Swipeable Card */}
                        <div 
                            onTouchStart={(e) => onTouchStart(e, d.id)}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                            onClick={() => !swipe.isSwiping && handleEdit(d)}
                            style={{ transform: `translateX(${swipeOffset}px)` }}
                            className={`p-5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer relative z-10 ${swipe.isSwiping && isSwipingThis ? 'transition-none' : 'transition-transform duration-300 ease-out'}`}
                        >
                            <div className="flex justify-between items-center relative z-10 mb-3">
                                <div className="flex-1">
                                    <div className="font-semibold text-neutral-900 dark:text-white">{d.name}</div>
                                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium flex items-center gap-1.5">
                                        Original: ${initial.toLocaleString()}
                                        {sortBy === 'priority' && <span className="text-neutral-300 dark:text-neutral-700">• Order: {d.priority ?? index}</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-lg text-orange-600 dark:text-orange-500">
                                    ${d.amount.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 mb-3">
                                <div className="flex justify-between items-end mb-1.5">
                                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Paid Off</span>
                                    <span className="text-xs font-bold text-neutral-700 dark:text-white">{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {(d.interestRate || d.minimumPayment || d.dueDate) && (
                                <div className="relative z-10 flex flex-wrap gap-2 pt-1">
                                    {d.interestRate && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-[10px] font-bold border border-red-100 dark:border-red-900/30">
                                        <Percent size={10} />
                                        {d.interestRate}% APR
                                    </div>
                                    )}
                                    {d.minimumPayment && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md text-[10px] font-bold border border-neutral-200 dark:border-neutral-700">
                                        <DollarSign size={10} />
                                        Min: ${d.minimumPayment.toLocaleString()}
                                    </div>
                                    )}
                                    {d.dueDate && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-bold border border-blue-100 dark:border-blue-900/30">
                                        <Calendar size={10} />
                                        Due: {d.dueDate}
                                    </div>
                                    )}
                                </div>
                            )}
                            
                            <div className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-neutral-800/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm border border-neutral-100 dark:border-neutral-700">
                                <Edit2 size={14} className="text-neutral-500 dark:text-neutral-400" />
                            </div>
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
                    className="flex items-center justify-between w-full gap-2 mb-4 px-1 group"
                >
                    <div className="flex items-center gap-2">
                        <History size={14} className="text-neutral-400 dark:text-neutral-500" />
                        <h2 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                            Paid History ({paidDebts.length})
                        </h2>
                    </div>
                    <div className="text-neutral-300 group-hover:text-neutral-500 dark:text-neutral-700 dark:group-hover:text-neutral-400 transition-colors">
                        {isHistoryMinimized ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </div>
                </button>
                
                {!isHistoryMinimized && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                        {paidDebts.map(d => (
                            <div 
                                key={d.id} 
                                onClick={() => handleEdit(d)}
                                className="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex justify-between items-center group cursor-pointer hover:bg-white dark:hover:bg-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <CheckCircle2 size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-neutral-900 dark:text-white text-sm line-through decoration-neutral-300 dark:decoration-neutral-600">{d.name}</div>
                                        <div className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">Fully paid off</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-wider mb-0.5">Was</div>
                                    <div className="font-medium text-neutral-900 dark:text-white text-sm">${(d.initialAmount || 0).toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>

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
