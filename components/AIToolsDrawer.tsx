import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, TrendingDown, CreditCard, Zap } from 'lucide-react';

interface AIToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTool?: 'spending' | 'debt';
}

export const AIToolsDrawer: React.FC<AIToolsDrawerProps> = ({ isOpen, onClose, initialTool = 'spending' }) => {
  const { transactions, debts, categories } = useFinance();
  const [activeTool, setActiveTool] = useState<'spending' | 'debt'>(initialTool);
  const [extraPayment, setExtraPayment] = useState(0);

  // --- Spending Data Logic ---
  const spendingBreakdown = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
    });

    const totalsByCat = monthlyExpenses.reduce((acc, t) => {
      const cat = t.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const total = (Object.values(totalsByCat) as number[]).reduce((a: number, b: number) => a + b, 0);
    return (Object.entries(totalsByCat) as [string, number][])
      .sort(([, a], [, b]) => b - a)
      .map(([name, val]) => ({
        name,
        val,
        percent: total > 0 ? Math.round((val / total) * 100) : 0,
        color: categories.find(c => c.name === name)?.color || '#a3a3a3'
      }));
  }, [transactions, categories]);

  // --- Debt Payoff Simulator Logic ---
  const debtStats = useMemo(() => {
    const activeDebts = debts.filter(d => d.amount > 0);
    const totalBalance = activeDebts.reduce((sum, d) => sum + d.amount, 0);
    const totalMinPayment = activeDebts.reduce((sum, d) => sum + (d.minimumPayment || 0), 0);
    
    // Simple projection
    const monthsToPayoff = totalBalance / (totalMinPayment + extraPayment);
    const monthsSaved = extraPayment > 0 
      ? (totalBalance / totalMinPayment) - monthsToPayoff 
      : 0;

    return { activeDebts, totalBalance, totalMinPayment, monthsToPayoff, monthsSaved };
  }, [debts, extraPayment]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-100 dark:border-neutral-800 pointer-events-auto animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <LayoutGridIcon size={20} className="text-indigo-500" />
              AI Assistant Tools
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
              <X size={20} />
            </button>
          </div>

          <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <button 
              onClick={() => setActiveTool('spending')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTool === 'spending' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Spending
            </button>
            <button 
              onClick={() => setActiveTool('debt')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTool === 'debt' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Debt Sim
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {activeTool === 'spending' ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Monthly Breakdown</h3>
                <p className="text-[11px] text-neutral-500">Expenditure data by category</p>
              </div>

              <div className="space-y-4">
                {spendingBreakdown.length === 0 ? (
                  <div className="text-center py-10 text-neutral-400 text-xs">No active records</div>
                ) : (
                  spendingBreakdown.map(cat => (
                    <div key={cat.name} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </span>
                        <span className="text-neutral-900 dark:text-white">${cat.val.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
                  <Zap size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Tip</span>
                </div>
                <p className="text-xs leading-relaxed text-indigo-900 dark:text-indigo-200">
                  Primary expenditure: <strong>{spendingBreakdown[0]?.name || '...'}</strong>. Implement category limits to reduce future liabilities.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Debt Simulator</h3>
                <p className="text-[11px] text-neutral-500">Projection based on surplus allocation</p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-3xl border border-orange-100 dark:border-orange-900/30 space-y-4">
                <div>
                  <div className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.2em] mb-3">Surplus Payment</div>
                  <div className="text-3xl font-black text-orange-600 dark:text-orange-500 mb-4">${extraPayment}</div>
                  <input 
                    type="range" 
                    min="0" 
                    max="2000" 
                    step="50" 
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(parseInt(e.target.value))}
                    className="w-full h-2 bg-orange-200 dark:bg-orange-900 rounded-full appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-orange-100 dark:border-orange-800">
                  <div>
                    <div className="text-[9px] font-black uppercase opacity-60 text-orange-900 dark:text-orange-100">Settlement in</div>
                    <div className="text-lg font-bold text-orange-900 dark:text-white">
                      {debtStats.monthsToPayoff === Infinity ? '∞' : Math.ceil(debtStats.monthsToPayoff)} <span className="text-[10px]">Months</span>
                    </div>
                  </div>
                  {extraPayment > 0 && (
                    <div>
                      <div className="text-[9px] font-black uppercase opacity-60 text-emerald-600">Reduction</div>
                      <div className="text-lg font-bold text-emerald-600">
                        {Math.floor(debtStats.monthsSaved)} <span className="text-[10px]">Months</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Liability Balances</h4>
                {debtStats.activeDebts.map(d => (
                  <div key={d.id} className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{d.name}</span>
                    <span className="text-xs font-black text-neutral-900 dark:text-white">${d.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const LayoutGridIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);