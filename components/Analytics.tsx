
import React, { useState, useRef, useEffect } from 'react';
import { FinanceVisualizer } from './ExpenseVisualizer';
import { useFinance } from '../context/FinanceContext';
import { PieChart as PieIcon, ChevronDown, Plus, AlertCircle } from 'lucide-react';
import { ChartPeriod, TransactionType, Budget } from '../types';
import { ChartSection } from './ChartSection';
import { BudgetModal } from './modals/BudgetModal';

export const Analytics: React.FC = () => {
  const { transactions, categories, budgets } = useFinance();
  const [period, setPeriod] = useState<ChartPeriod>('week');
  const [slideIndex, setSlideIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Budget State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // --- Cycle Period Helper ---
  const cyclePeriod = () => {
    const periods: ChartPeriod[] = ['week', 'month', 'year'];
    const currentIndex = periods.indexOf(period);
    const nextIndex = (currentIndex + 1) % periods.length;
    setPeriod(periods[nextIndex]);
  };

  // --- Slider Scroll Handling ---
  const handleScroll = () => {
    if (sliderRef.current) {
      const scrollLeft = sliderRef.current.scrollLeft;
      const width = sliderRef.current.offsetWidth;
      // Calculate current index based on scroll position
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== slideIndex) {
        setSlideIndex(newIndex);
      }
    }
  };

  const scrollToSlide = (index: number) => {
    if (sliderRef.current) {
      const width = sliderRef.current.offsetWidth;
      sliderRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
      setSlideIndex(index);
    }
  };

  // --- Budget Handlers ---
  const handleAddBudget = () => {
    setEditingBudget(null);
    setIsBudgetModalOpen(true);
  };

  const handleEditBudget = (b: Budget) => {
    setEditingBudget(b);
    setIsBudgetModalOpen(true);
  };

  // Calculate budget progress (Current Month)
  const currentMonthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
  });

  const getCategorySpent = (categoryName: string) => {
      return currentMonthTransactions
        .filter(t => t.category === categoryName)
        .reduce((sum, t) => sum + t.amount, 0);
  };

  // --- Category List Data Logic ---
  const activeType: TransactionType | null = slideIndex === 1 ? 'income' : slideIndex === 2 ? 'expense' : null;

  // Calculate category totals based on the selected view type and period
  const categoryTotals: Record<string, number> = activeType ? transactions
    .filter(t => {
        if (t.type !== activeType) return false;
        
        const now = new Date();
        const tDate = new Date(t.date);

        if (period === 'day') {
            return tDate.toDateString() === now.toDateString();
        }
        if (period === 'week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            return tDate >= oneWeekAgo;
        }
        if (period === 'month') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            return tDate >= thirtyDaysAgo;
        }
        if (period === 'year') {
            return tDate.getFullYear() === now.getFullYear();
        }
        return true;
    })
    .reduce<Record<string, number>>((acc, t) => {
      const cat = t.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {}) 
    : {};

  const totalAmount = activeType ? Object.values(categoryTotals).reduce((a: number, b: number) => a + b, 0) : 0;

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => (b as number) - (a as number));

  return (
    <div className="pb-32 pt-6 px-5 w-full max-w-md mx-auto min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-white">Analytics</h1>
        
        <button 
          onClick={cyclePeriod}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
        >
          {period}
          <ChevronDown size={14} className="text-neutral-400 dark:text-neutral-500" />
        </button>
      </div>

      {/* Slider Container */}
      <div className="relative w-full mb-8">
        <div 
            ref={sliderRef}
            onScroll={handleScroll}
            className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth gap-4"
        >
            {/* Slide 1: Overview */}
            <div className="min-w-full snap-center h-[400px]">
                <ChartSection period={period} />
            </div>

            {/* Slide 2: Income */}
            <div className="min-w-full snap-center h-[400px]">
                <FinanceVisualizer type="income" period={period} />
            </div>

            {/* Slide 3: Expense */}
            <div className="min-w-full snap-center h-[400px]">
                <FinanceVisualizer type="expense" period={period} />
            </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2].map((idx) => (
                <button
                    key={idx}
                    onClick={() => scrollToSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                        slideIndex === idx 
                            ? 'w-6 bg-neutral-900 dark:bg-white' 
                            : 'w-2 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600'
                    }`}
                />
            ))}
        </div>
      </div>

      {/* Category List - Shows only for Income or Expense slides */}
      {activeType && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
            <h3 className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-4 px-1 flex items-center justify-between">
              <span>{activeType} Breakdown ({period})</span>
              <span className="text-neutral-900 dark:text-white font-bold">${totalAmount.toLocaleString()}</span>
            </h3>
            
            <div className="space-y-3">
              {sortedCategories.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 text-sm">
                  No {activeType} data for this {period}
                </div>
              ) : (
                sortedCategories.map(([catName, amount]) => {
                  const val = amount as number;
                  const percentage = totalAmount ? Math.round((val / totalAmount) * 100) : 0;
                  const catColor = categories.find(c => c.name === catName)?.color || '#a3a3a3';
                  
                  return (
                    <div key={catName} className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div 
                             className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                             style={{ backgroundColor: catColor }}
                          >
                            <PieIcon size={14} />
                          </div>
                          <span className="font-medium text-neutral-900 dark:text-white text-sm">{catName}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-neutral-900 dark:text-white">${val.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pl-11">
                        <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ width: `${percentage}%`, backgroundColor: catColor }}
                          ></div>
                        </div>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium w-8 text-right">{percentage}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
      )}

      {/* Budget Section - Only visible on Overview slide */}
      {slideIndex === 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Monthly Budgets</h2>
                <button 
                  onClick={handleAddBudget}
                  className="text-xs font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:opacity-90 transition-opacity shadow-sm"
                >
                    <Plus size={14} />
                    Set Limit
                </button>
            </div>

            <div className="space-y-4">
                {budgets.length === 0 ? (
                    <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-center">
                        <div className="text-neutral-400 dark:text-neutral-500 text-sm mb-2">No budgets set</div>
                        <button onClick={handleAddBudget} className="text-neutral-900 dark:text-white text-sm font-medium underline">Set a spending limit</button>
                    </div>
                ) : (
                    budgets.map(budget => {
                        const spent = getCategorySpent(budget.category);
                        const percentage = Math.min(100, Math.round((spent / budget.amount) * 100));
                        const isOver = spent > budget.amount;
                        const categoryColor = categories.find(c => c.name === budget.category)?.color || '#a3a3a3';

                        return (
                            <div 
                              key={budget.id} 
                              onClick={() => handleEditBudget(budget)}
                              className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm cursor-pointer hover:border-neutral-200 dark:hover:border-neutral-700 transition-all group"
                            >
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColor }} />
                                            <span className="font-medium text-neutral-900 dark:text-white text-sm">{budget.category}</span>
                                        </div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                            <span className={isOver ? 'text-red-500 font-bold' : ''}>${spent.toLocaleString()}</span> 
                                            <span className="mx-1 opacity-50">/</span> 
                                            ${budget.amount.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {isOver && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5 justify-end">
                                                <AlertCircle size={10} />
                                                Over Budget
                                            </div>
                                        )}
                                        <div className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
                                            {Math.round((spent / budget.amount) * 100)}%
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-neutral-900 dark:bg-white'}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
      )}

      <BudgetModal 
          isOpen={isBudgetModalOpen} 
          onClose={() => setIsBudgetModalOpen(false)} 
          budget={editingBudget} 
      />
    </div>
  );
};
