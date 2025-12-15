
import React, { useState, useRef } from 'react';
import { FinanceVisualizer } from './ExpenseVisualizer';
import { useFinance } from '../context/FinanceContext';
import { PieChart as PieIcon, ChevronDown, Plus, AlertCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { ChartPeriod, TransactionType, Budget } from '../types';
import { ChartSection } from './ChartSection';
import { BudgetModal } from './modals/BudgetModal';
import { CategoryTransactionsModal } from './modals/CategoryTransactionsModal';

export const Analytics: React.FC = () => {
  const { transactions, categories, budgets } = useFinance();
  const [period, setPeriod] = useState<ChartPeriod>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slideIndex, setSlideIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Modal States
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // --- Date Navigation ---
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (period === 'day') newDate.setDate(newDate.getDate() - 1);
    if (period === 'week') newDate.setDate(newDate.getDate() - 7);
    if (period === 'month') newDate.setMonth(newDate.getMonth() - 1);
    if (period === 'year') newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (period === 'day') newDate.setDate(newDate.getDate() + 1);
    if (period === 'week') newDate.setDate(newDate.getDate() + 7);
    if (period === 'month') newDate.setMonth(newDate.getMonth() + 1);
    if (period === 'year') newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };

  const isCurrentPeriod = () => {
      const now = new Date();
      if (period === 'month') return now.getMonth() === currentDate.getMonth() && now.getFullYear() === currentDate.getFullYear();
      if (period === 'year') return now.getFullYear() === currentDate.getFullYear();
      if (period === 'day') return now.toDateString() === currentDate.toDateString();
      if (period === 'week') {
          const getWeek = (d: Date) => {
             const date = new Date(d.getTime());
             date.setHours(0, 0, 0, 0);
             date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
             const week1 = new Date(date.getFullYear(), 0, 4);
             return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
          };
          return getWeek(now) === getWeek(currentDate) && now.getFullYear() === currentDate.getFullYear();
      }
      return false;
  };

  const getDateLabel = () => {
    if (period === 'month') return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (period === 'year') return currentDate.getFullYear().toString();
    if (period === 'day') return currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (period === 'week') {
        const start = new Date(currentDate);
        const day = start.getDay();
        start.setDate(start.getDate() - day);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return '';
  };

  const cyclePeriod = () => {
    const periods: ChartPeriod[] = ['week', 'month', 'year'];
    setPeriod(periods[(periods.indexOf(period) + 1) % periods.length]);
    setCurrentDate(new Date());
  };

  const handleScroll = () => {
    if (sliderRef.current) {
      const scrollLeft = sliderRef.current.scrollLeft;
      const width = sliderRef.current.offsetWidth;
      setSlideIndex(Math.round(scrollLeft / width));
    }
  };

  const scrollToSlide = (index: number) => {
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: sliderRef.current.offsetWidth * index, behavior: 'smooth' });
      setSlideIndex(index);
    }
  };

  // --- Data Logic ---
  const viewMode = slideIndex === 0 ? 'overview' : slideIndex === 1 ? 'income' : 'expense';
  const activeType: TransactionType | null = (viewMode === 'income' || viewMode === 'expense') ? viewMode as TransactionType : null;

  // Category Breakdown Logic
  const categoryTotals: Record<string, number> = activeType ? transactions.filter(t => {
        if (t.type !== activeType) return false;
        const tDate = new Date(t.date);
        const adjustedDate = new Date(tDate.getTime() + tDate.getTimezoneOffset() * 60000);
        const startDate = new Date(currentDate);
        const endDate = new Date(currentDate);
        
        if (period === 'day') { startDate.setHours(0,0,0,0); endDate.setHours(23,59,59,999); }
        else if (period === 'week') { 
            startDate.setDate(startDate.getDate() - startDate.getDay()); startDate.setHours(0,0,0,0);
            endDate.setDate(startDate.getDate() + 6); endDate.setHours(23,59,59,999); 
        }
        else if (period === 'month') { startDate.setDate(1); startDate.setHours(0,0,0,0); endDate.setMonth(endDate.getMonth() + 1); endDate.setDate(0); endDate.setHours(23,59,59,999); }
        else if (period === 'year') { startDate.setMonth(0, 1); startDate.setHours(0,0,0,0); endDate.setMonth(11, 31); endDate.setHours(23,59,59,999); }
        
        return adjustedDate >= startDate && adjustedDate <= endDate;
    }).reduce<Record<string, number>>((acc, t) => {
      const cat = t.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {}) : {};

  const totalAmount = activeType ? Object.values(categoryTotals).reduce((a, b) => a + b, 0) : 0;
  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);

  return (
    <div className="pb-32 pt-6 px-5 w-full max-w-md mx-auto min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-white">Analytics</h1>
        <button onClick={cyclePeriod} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-full shadow-sm text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider hover:scale-105 transition-all">
          {period} <ChevronDown size={14} />
        </button>
      </div>

      {/* Date Nav */}
      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 p-2 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm mb-6">
          <button onClick={handlePrev} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"><ChevronLeft size={20} /></button>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-neutral-400" />
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">{getDateLabel()}</span>
            {!isCurrentPeriod() && <button onClick={() => setCurrentDate(new Date())} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md ml-1">TODAY</button>}
          </div>
          <button onClick={handleNext} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"><ChevronRight size={20} /></button>
      </div>

      {/* Slider */}
      <div className="relative w-full mb-8">
        <div ref={sliderRef} onScroll={handleScroll} className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth gap-4">
            <div className="min-w-full snap-center h-[400px]"><ChartSection period={period} currentDate={currentDate} /></div>
            <div className="min-w-full snap-center h-[400px]"><FinanceVisualizer type="income" period={period} currentDate={currentDate} /></div>
            <div className="min-w-full snap-center h-[400px]"><FinanceVisualizer type="expense" period={period} currentDate={currentDate} /></div>
        </div>
        <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2].map((idx) => (
                <button key={idx} onClick={() => scrollToSlide(idx)} className={`h-2 rounded-full transition-all duration-300 ${slideIndex === idx ? 'w-6 bg-neutral-900 dark:bg-white' : 'w-2 bg-neutral-300 dark:bg-neutral-700'}`} />
            ))}
        </div>
      </div>

      {/* Details List */}
      {activeType && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
            <h3 className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-4 px-1 flex items-center justify-between">
              <span>{activeType} Breakdown</span>
              <span className="text-neutral-900 dark:text-white font-bold">${totalAmount.toLocaleString()}</span>
            </h3>
            <div className="space-y-3">
              {sortedCategories.length === 0 ? <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-900 rounded-2xl text-neutral-400 text-sm">No {activeType} data</div> : 
                sortedCategories.map(([catName, amount]) => {
                  const percentage = totalAmount ? Math.round((amount / totalAmount) * 100) : 0;
                  const catColor = categories.find(c => c.name === catName)?.color || '#a3a3a3';
                  return (
                    <div key={catName} onClick={() => setSelectedCategory(catName)} className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm flex flex-col gap-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:scale-[1.01] transition-all">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: catColor }}><PieIcon size={14} /></div>
                          <span className="font-medium text-neutral-900 dark:text-white text-sm">{catName}</span>
                        </div>
                        <div className="text-right flex items-center gap-2"><div className="font-medium text-neutral-900 dark:text-white">${amount.toLocaleString()}</div><ChevronRight size={14} className="text-neutral-300 dark:text-neutral-700" /></div>
                      </div>
                      <div className="flex items-center gap-3 pl-11">
                        <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: catColor }}></div></div>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium w-8 text-right">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
      )}

      {viewMode === 'overview' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Monthly Budgets</h2>
                <button onClick={() => { setEditingBudget(null); setIsBudgetModalOpen(true); }} className="text-xs font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:opacity-90 transition-opacity shadow-sm"><Plus size={14} />Set Limit</button>
            </div>
            <div className="space-y-4">
                {budgets.length === 0 ? <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-center"><div className="text-neutral-400 dark:text-neutral-500 text-sm mb-2">No budgets set</div></div> : 
                    budgets.map(budget => {
                        const spent = transactions.filter(t => {
                            const d = new Date(t.date); const now = new Date();
                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense' && t.category === budget.category;
                        }).reduce((sum, t) => sum + t.amount, 0);
                        const percentage = Math.min(100, Math.round((spent / budget.amount) * 100));
                        const isOver = spent > budget.amount;
                        const catColor = categories.find(c => c.name === budget.category)?.color || '#a3a3a3';
                        return (
                            <div key={budget.id} onClick={() => { setEditingBudget(budget); setIsBudgetModalOpen(true); }} className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm cursor-pointer hover:border-neutral-200 dark:hover:border-neutral-700 transition-all">
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor }} /> <span className="font-medium text-neutral-900 dark:text-white text-sm">{budget.category}</span></div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium"><span className={isOver ? 'text-red-500 font-bold' : ''}>${spent.toLocaleString()}</span> <span className="mx-1 opacity-50">/</span> ${budget.amount.toLocaleString()}</div>
                                    </div>
                                    <div className="text-right">
                                        {isOver && <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5 justify-end"><AlertCircle size={10} />Over Budget</div>}
                                        <div className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>{Math.round((spent / budget.amount) * 100)}%</div>
                                    </div>
                                </div>
                                <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-neutral-900 dark:bg-white'}`} style={{ width: `${percentage}%` }} /></div>
                            </div>
                        );
                    })
                }
            </div>
        </div>
      )}

      <BudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} budget={editingBudget} />
      <CategoryTransactionsModal isOpen={!!selectedCategory} onClose={() => setSelectedCategory(null)} category={selectedCategory || ''} type={activeType || 'expense'} period={period} currentDate={currentDate} />
    </div>
  );
};
