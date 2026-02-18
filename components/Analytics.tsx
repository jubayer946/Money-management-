import React, { useState, useRef, useMemo } from 'react';
import { FinanceVisualizer } from './ExpenseVisualizer';
import { useFinance } from '../context/FinanceContext';
import { 
  PieChart as PieIcon, 
  Plus, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  X, 
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { ChartPeriod, TransactionType, Budget, ChartDataPoint } from '../types';
import { ChartSection } from './ChartSection';
import { BudgetModal } from './modals/BudgetModal';
import { CategoryTransactionsModal } from './modals/CategoryTransactionsModal';
import { useNavigate } from 'react-router-dom';

export const Analytics = () => {
  const { transactions, categories, budgets } = useFinance();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<ChartPeriod>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slideIndex, setSlideIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);
  
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
    setSelectedPoint(null);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (period === 'day') newDate.setDate(newDate.getDate() + 1);
    if (period === 'week') newDate.setDate(newDate.getDate() + 7);
    if (period === 'month') newDate.setMonth(newDate.getMonth() + 1);
    if (period === 'year') newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDate(newDate);
    setSelectedPoint(null);
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

  const handleScroll = () => {
    if (sliderRef.current) {
      const scrollLeft = sliderRef.current.scrollLeft;
      const width = sliderRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== slideIndex) {
        setSlideIndex(newIndex);
      }
    }
  };

  const scrollToSlide = (index: number) => {
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: sliderRef.current.offsetWidth * index, behavior: 'smooth' });
      setSlideIndex(index);
    }
  };

  // --- Selected Point Specific Data ---
  const selectedPointTransactions = useMemo(() => {
    if (!selectedPoint) return [];
    
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const adjustedDate = new Date(tDate.getTime() + tDate.getTimezoneOffset() * 60000);
      
      if (period === 'year' && selectedPoint.month !== undefined) {
        return adjustedDate.getMonth() === selectedPoint.month && adjustedDate.getFullYear() === selectedPoint.year;
      }
      
      if (selectedPoint.date) {
        return adjustedDate.toDateString() === new Date(selectedPoint.date).toDateString();
      }

      return false;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPoint, transactions, period]);

  const selectedPointCatBreakdown = useMemo(() => {
      if (!selectedPointTransactions.length) return { income: {}, expense: {} };
      
      return selectedPointTransactions.reduce((acc, t) => {
          const cat = t.category || 'Uncategorized';
          acc[t.type][cat] = (acc[t.type][cat] || 0) + Math.abs(t.amount);
          return acc;
      }, { income: {} as Record<string, number>, expense: {} as Record<string, number> });
  }, [selectedPointTransactions]);

  // --- Global Data Logic ---
  const viewMode = slideIndex === 0 ? 'overview' : slideIndex === 1 ? 'income' : 'expense';
  const activeType: TransactionType | null = (viewMode === 'income' || viewMode === 'expense') ? viewMode as TransactionType : null;

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
      acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
      return acc;
    }, {}) : {};

  const totalAmount = activeType ? Object.values(categoryTotals).reduce((a: number, b: number) => a + b, 0) : 0;
  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);

  // Insights Data
  const highestExpense = useMemo(() => {
    if (viewMode !== 'expense') return null;
    return sortedCategories[0] || null;
  }, [sortedCategories, viewMode]);

  return (
    <div className="pb-32 pt-6 px-5 w-full max-md mx-auto min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Analytics</h1>
        
        {/* New Period Quick Switcher in Header */}
        <div className="flex gap-1 p-1 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-full shadow-sm">
          {(['day', 'week', 'month', 'year'] as ChartPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPeriod(p);
                setCurrentDate(new Date());
                setSelectedPoint(null);
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p 
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md scale-105' 
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              {p.charAt(0)}
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 p-2 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm mb-6">
          <button 
            type="button"
            onClick={handlePrev} 
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-neutral-400" />
              <span className="text-sm font-bold text-neutral-900 dark:text-white">{getDateLabel()}</span>
            </div>
            {!isCurrentPeriod() && (
              <button 
                type="button"
                onClick={() => setCurrentDate(new Date())} 
                className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5 hover:underline"
              >
                Reset to Now
              </button>
            )}
          </div>
          <button 
            type="button"
            onClick={handleNext} 
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
      </div>

      {/* Slider Visuals */}
      <div className="relative w-full mb-8">
        <div 
          ref={sliderRef} 
          onScroll={handleScroll} 
          className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth gap-4"
        >
            {/* Trends Slide */}
            <div className="min-w-full snap-center flex flex-col gap-6">
              <div className="h-[420px]">
                <ChartSection 
                  period={period} 
                  currentDate={currentDate} 
                  onPointSelect={setSelectedPoint} 
                />
              </div>
              
              {selectedPoint && (
                <div className="animate-in slide-in-from-top-4 fade-in duration-500 pb-4">
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[32px] overflow-hidden shadow-xl shadow-neutral-200/50 dark:shadow-none">
                      <div className="flex justify-between items-center p-5 border-b border-neutral-50 dark:border-neutral-800">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                  <Activity size={18} />
                              </div>
                              <div>
                                <div className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-0.5">Details for</div>
                                <div className="text-sm font-bold text-neutral-900 dark:text-white">
                                    {selectedPoint.label} {period === 'year' ? 'Analysis' : ''}
                                </div>
                              </div>
                          </div>
                          <button 
                              type="button"
                              onClick={() => setSelectedPoint(null)}
                              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"
                          >
                              <X size={18} />
                          </button>
                      </div>

                      <div className="p-6 space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">
                                    <TrendingUp size={10} /> Income
                                  </div>
                                  <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{selectedPoint.income.toLocaleString()}</div>
                              </div>
                              <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-red-600 dark:text-red-500 uppercase tracking-widest mb-2">
                                    <TrendingDown size={10} /> Expense
                                  </div>
                                  <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">{selectedPoint.expense.toLocaleString()}</div>
                              </div>
                          </div>

                          {(selectedPoint.income > 0 || selectedPoint.expense > 0) && (
                              <div className="space-y-4">
                                  <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={12} /> Categories
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                      {Object.entries(selectedPointCatBreakdown.income).map(([cat, val]) => (
                                          <div key={cat} className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 rounded-full border border-neutral-100 dark:border-neutral-700 flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                              {cat}: <span className="text-neutral-900 dark:text-white">{val.toLocaleString()}</span>
                                          </div>
                                      ))}
                                      {Object.entries(selectedPointCatBreakdown.expense).map(([cat, val]) => (
                                          <div key={cat} className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 rounded-full border border-neutral-100 dark:border-neutral-700 flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                              {cat}: <span className="text-neutral-900 dark:text-white">{val.toLocaleString()}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}

                          <div className="space-y-2 max-h-[260px] overflow-y-auto no-scrollbar pt-4 border-t border-neutral-50 dark:border-neutral-800">
                              {selectedPointTransactions.length === 0 ? (
                                  <div className="text-center py-10 text-neutral-400 text-[10px] font-bold uppercase tracking-widest italic opacity-50">Zero transactions</div>
                              ) : (
                                  selectedPointTransactions.map(t => {
                                      const catColor = categories.find(c => c.name === t.category)?.color || '#a3a3a3';
                                      return (
                                          <button 
                                              type="button"
                                              key={t.id} 
                                              onClick={() => navigate(`/transaction/${t.id}`)}
                                              className="w-full flex items-center justify-between p-4 bg-neutral-50/50 dark:bg-neutral-800/30 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-2xl transition-all cursor-pointer group text-left"
                                          >
                                              <div className="flex items-center gap-3">
                                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                                      {t.type === 'income' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                  </div>
                                                  <div>
                                                      <div className="text-xs font-bold text-neutral-900 dark:text-white truncate max-w-[140px]">{t.desc}</div>
                                                      <div className="flex items-center gap-2 mt-1">
                                                          <div className="w-2 h-0.5 rounded-full" style={{ backgroundColor: catColor }} />
                                                          <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">{t.category || 'Other'}</div>
                                                      </div>
                                                  </div>
                                              </div>
                                              <div className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-neutral-900 dark:text-white'}`}>
                                                  {t.type === 'income' ? '+' : '-'}{Math.abs(t.amount).toLocaleString()}
                                              </div>
                                          </button>
                                      );
                                  })
                              )}
                          </div>
                      </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="min-w-full snap-center h-[380px]">
              <FinanceVisualizer type="income" period={period} currentDate={currentDate} />
            </div>
            <div className="min-w-full snap-center h-[380px]">
              <FinanceVisualizer type="expense" period={period} currentDate={currentDate} />
            </div>
        </div>
        
        <div className="flex justify-center items-center gap-3 mt-6">
            <button 
              type="button"
              onClick={() => scrollToSlide(0)}
              className={`text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${slideIndex === 0 ? 'text-neutral-900 dark:text-white underline underline-offset-4' : 'text-neutral-400 opacity-50'}`}
            >
              Trends
            </button>
            <div className="w-1 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            <button 
              type="button"
              onClick={() => scrollToSlide(1)}
              className={`text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${slideIndex === 1 ? 'text-emerald-500 underline underline-offset-4' : 'text-neutral-400 opacity-50'}`}
            >
              Income
            </button>
            <div className="w-1 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
            <button 
              type="button"
              onClick={() => scrollToSlide(2)}
              className={`text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${slideIndex === 2 ? 'text-red-500 underline underline-offset-4' : 'text-neutral-400 opacity-50'}`}
            >
              Expenses
            </button>
        </div>
      </div>

      {activeType && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
            <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">{activeType} Distribution</h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-400">Total</span>
                    <span className="text-sm font-black text-neutral-900 dark:text-white">{totalAmount.toLocaleString()}</span>
                </div>
            </div>
            
            {highestExpense && activeType === 'expense' && totalAmount > 0 && (
              <div className="mb-4 p-4 bg-indigo-600 rounded-[24px] text-white shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-between">
                <div>
                   <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Top Category</div>
                   <div className="text-sm font-bold">{highestExpense[0]}</div>
                </div>
                <div className="text-right">
                   <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Impact</div>
                   <div className="text-lg font-black">{totalAmount ? Math.round((highestExpense[1] / totalAmount) * 100) : 0}%</div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {sortedCategories.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-100 dark:border-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
                  No {activeType} data to visualize
                </div>
              ) : (
                sortedCategories.map(([catName, amount]) => {
                  const percentage = totalAmount ? Math.round((amount / totalAmount) * 100) : 0;
                  const catColor = categories.find(c => c.name === catName)?.color || '#a3a3a3';
                  return (
                    <button 
                      type="button"
                      key={catName} 
                      onClick={() => setSelectedCategory(catName)} 
                      className="w-full group bg-white dark:bg-neutral-900 p-5 rounded-[28px] border border-neutral-50 dark:border-neutral-800 shadow-sm flex flex-col gap-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:scale-[1.01] transition-all text-left"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-neutral-100 dark:shadow-none transition-transform group-hover:rotate-12" style={{ backgroundColor: catColor }}>
                            <PieIcon size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900 dark:text-white text-sm">{catName}</span>
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{percentage}% share</div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div className="font-black text-neutral-900 dark:text-white">{amount.toLocaleString()}</div>
                          <ChevronRight size={16} className="text-neutral-300 dark:text-neutral-500 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${percentage}%`, backgroundColor: catColor }} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
      )}

      {viewMode === 'overview' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <div className="flex justify-between items-center mb-5 px-1">
                <h2 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">Spending Guard</h2>
                <button 
                  type="button"
                  onClick={() => { setEditingBudget(null); setIsBudgetModalOpen(true); }} 
                  className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all active:scale-95"
                >
                  <Plus size={14} /> Add Limit
                </button>
            </div>
            <div className="space-y-4">
                {budgets.length === 0 ? (
                  <div className="p-10 bg-white dark:bg-neutral-900 rounded-[32px] border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
                    <div className="text-neutral-400 text-sm font-medium mb-1">No spending limits</div>
                    <div className="text-[10px] text-neutral-300 dark:text-neutral-600 uppercase tracking-widest">Stay disciplined by setting budgets</div>
                  </div>
                ) : (
                    budgets.map(budget => {
                        const spent = transactions.filter(t => {
                            const d = new Date(t.date); 
                            const now = new Date();
                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense' && t.category === budget.category;
                        }).reduce((sum, t) => sum + t.amount, 0);
                        const percentage = Math.min(100, Math.round((spent / budget.amount) * 100));
                        const isOver = spent > budget.amount;
                        const catColor = categories.find(c => c.name === budget.category)?.color || '#a3a3a3';
                        
                        return (
                          <button 
                            type="button"
                            key={budget.id} 
                            onClick={() => {
                              setEditingBudget(budget); 
                              setIsBudgetModalOpen(true); 
                            }} 
                            className="w-full text-left bg-white dark:bg-neutral-900 p-6 border border-neutral-50 dark:border-neutral-800 shadow-sm cursor-pointer hover:border-neutral-200 dark:hover:border-neutral-700 transition-all rounded-[32px] relative overflow-hidden"
                          >
                              <div className="flex justify-between items-start relative z-10">
                                  <div className="flex items-center gap-3">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }} />
                                      <div>
                                        <div className="font-bold text-neutral-900 dark:text-white text-sm">{budget.category}</div>
                                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Monthly Budget</div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      {isOver ? (
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-wider mb-1 justify-end animate-pulse">
                                          <AlertCircle size={12} /> Limit Exceeded
                                        </div>
                                      ) : (
                                        <div className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Available: {(budget.amount - spent).toLocaleString()}</div>
                                      )}
                                      <div className={`text-xl font-black ${isOver ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>{percentage}%</div>
                                  </div>
                              </div>
                              
                              <div className="mt-6 space-y-2 relative z-10">
                                  <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">
                                      <span>Used: {spent.toLocaleString()}</span>
                                      <span>Limit: {budget.amount.toLocaleString()}</span>
                                  </div>
                                  <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isOver ? 'bg-red-500' : 'bg-neutral-900 dark:bg-white'}`} 
                                        style={{ width: `${percentage}%` }} 
                                      />
                                  </div>
                              </div>
                              
                              <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-neutral-900 dark:text-white pointer-events-none">
                                <PieIcon size={80} />
                              </div>
                          </button>
                        );
                    })
                )}
            </div>
        </div>
      )}

      <BudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} budget={editingBudget} />
      <CategoryTransactionsModal 
        isOpen={!!selectedCategory} 
        onClose={() => setSelectedCategory(null)} 
        category={selectedCategory || ''} 
        type={activeType || 'expense'} 
        period={period} 
        currentDate={currentDate} 
      />
    </div>
  );
};