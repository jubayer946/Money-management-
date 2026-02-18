import React, { useEffect, useRef, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import ZoomPlugin from 'chartjs-plugin-zoom';
import { useFinance } from '../context/FinanceContext';
import { useChartData } from '../hooks/useChartData';
import { ChartPeriod, ChartDataPoint } from '../types';
import { RotateCcw, Plus, Minus, Search, X, TrendingUp, TrendingDown, Calendar, Activity, GitCompare } from 'lucide-react';

// Register the Zoom plugin globally for this component
Chart.register(ZoomPlugin);

interface ChartSectionProps {
  period: ChartPeriod;
  currentDate: Date;
  onPointSelect?: (point: ChartDataPoint | null) => void;
}

export const ChartSection: React.FC<ChartSectionProps> = ({ period, currentDate, onPointSelect }) => {
  const { transactions } = useFinance();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [visible, setVisible] = useState({
    balance: true,
    income: true,
    expense: true,
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  // Current Period Data
  const data = useChartData(transactions, period, currentDate);

  // Previous Period Date Calculation
  const prevDate = useMemo(() => {
    const d = new Date(currentDate);
    if (period === 'day') d.setDate(d.getDate() - 1);
    else if (period === 'week') d.setDate(d.getDate() - 7);
    else if (period === 'month') d.setMonth(d.getMonth() - 1);
    else if (period === 'year') d.setFullYear(d.getFullYear() - 1);
    return d;
  }, [currentDate, period]);

  // Previous Period Data
  const prevData = useChartData(transactions, period, prevDate);

  // --- Metrics ---
  const totalIncome = useMemo(() => data.reduce((acc, curr) => acc + curr.income, 0), [data]);
  const totalExpense = useMemo(() => data.reduce((acc, curr) => acc + curr.expense, 0), [data]);
  const currentBalance = useMemo(() => data.length > 0 ? data[data.length - 1].balance : 0, [data]);

  const hoverPoint = hoverIndex !== null ? data[hoverIndex] : null;
  const prevPeriodHoverPoint = (hoverIndex !== null && isCompareMode && prevData[hoverIndex]) ? prevData[hoverIndex] : null;
  const prevPointInTime = (hoverIndex !== null && hoverIndex > 0) ? data[hoverIndex - 1] : null;

  const balanceChange = useMemo(() => {
    if (!hoverPoint || !prevPointInTime || prevPointInTime.balance === 0) return null;
    return ((hoverPoint.balance - prevPointInTime.balance) / Math.abs(prevPointInTime.balance)) * 100;
  }, [hoverPoint, prevPointInTime]);

  const vsPrevChange = useMemo(() => {
    if (!hoverPoint || !prevPeriodHoverPoint || prevPeriodHoverPoint.balance === 0) return null;
    return ((hoverPoint.balance - prevPeriodHoverPoint.balance) / Math.abs(prevPeriodHoverPoint.balance)) * 100;
  }, [hoverPoint, prevPeriodHoverPoint]);

  const displayIncome = hoverPoint ? hoverPoint.income : totalIncome;
  const displayExpense = hoverPoint ? hoverPoint.expense : totalExpense;
  const displayBalance = hoverPoint ? hoverPoint.balance : currentBalance;

  // --- Handlers ---
  const handleResetZoom = () => {
    if (chartInstance.current) {
      chartInstance.current.resetZoom();
    }
  };

  const handleZoomIn = () => {
    if (chartInstance.current) {
      chartInstance.current.zoom(1.1);
    }
  };

  const handleZoomOut = () => {
    if (chartInstance.current) {
      chartInstance.current.zoom(0.9);
    }
  };

  const toggleVisibility = (key: keyof typeof visible) => {
    setVisible(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearHoverState = () => {
    setHoverIndex(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  };

  // --- Chart Creation Helper ---
  const createGradient = (ctx: CanvasRenderingContext2D, color: string) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color.replace('1)', '0.2)')); 
    gradient.addColorStop(1, color.replace('1)', '0)'));
    return gradient;
  };

  // --- Initialize Chart ---
  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const datasets = [
      visible.balance && {
        label: 'Balance',
        data: data.map(d => d.balance),
        borderColor: '#6366f1',
        backgroundColor: createGradient(ctx, 'rgba(99, 102, 241, 1)'),
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        order: 1
      },
      isCompareMode && {
        label: 'Prev Balance',
        data: prevData.map(d => d.balance),
        borderColor: '#9ca3af',
        borderDash: [4, 4],
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
        order: 4
      },
      visible.income && {
        label: 'Income',
        data: data.map(d => d.income),
        borderColor: '#10b981',
        backgroundColor: createGradient(ctx, 'rgba(16, 185, 129, 1)'),
        borderWidth: 1.5,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: '#10b981',
        order: 2
      },
      visible.expense && {
        label: 'Expense',
        data: data.map(d => d.expense),
        borderColor: '#ef4444',
        backgroundColor: createGradient(ctx, 'rgba(239, 68, 68, 1)'),
        borderWidth: 1.5,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: '#ef4444',
        order: 3
      }
    ].filter(Boolean) as any;

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Inter', size: 10, weight: 'bold' },
              color: '#a3a3a3',
              autoSkip: true,
              maxRotation: 0,
            },
            border: { display: false }
          },
          y: { display: false }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
            },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: 'x',
            },
            limits: {
              x: { min: 'original', max: 'original' },
            },
          }
        },
        onClick: (event: any, elements: any) => {
          if (elements && elements.length > 0) {
            const index = elements[0].index;
            onPointSelect?.(data[index]);
          } else {
            onPointSelect?.(null);
          }
        },
        onHover: (event: any, elements: any) => {
          if (elements && elements.length > 0) {
            const index = elements[0].index;
            setHoverIndex(index);
            if (event.native && event.native.target) (event.native.target as HTMLElement).style.cursor = 'pointer';
          } else {
            setHoverIndex(null);
            if (event.native && event.native.target) (event.native.target as HTMLElement).style.cursor = 'default';
          }
        }
      }
    });

    chartInstance.current = chart;

    return () => {
      chart.destroy();
      chartInstance.current = null;
    };
  }, [data, prevData, onPointSelect, visible, isCompareMode]);


  return (
    <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-[32px] p-8 pb-6 shadow-xl shadow-neutral-100 dark:shadow-none border border-neutral-50 dark:border-neutral-800 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-neutral-50/50 dark:from-neutral-800/20 to-transparent pointer-events-none" />

      {/* Top Right: Visibility & Comparison */}
      <div className="absolute top-6 right-8 z-30 flex items-center gap-3">
        <button
          onClick={() => setIsCompareMode(!isCompareMode)}
          className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all active:scale-90 ${
            isCompareMode 
              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-100 dark:shadow-none' 
              : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
          title={isCompareMode ? "Turn off comparison" : "Compare with previous period"}
        >
          <GitCompare size={14} strokeWidth={3} />
        </button>

        <div className="flex gap-1.5 p-1 bg-neutral-50 dark:bg-neutral-800 rounded-full border border-neutral-100 dark:border-neutral-700 shadow-sm">
          {(['balance', 'income', 'expense'] as const).map((key) => {
            const isActive = visible[key];
            const colorClass = key === 'income' ? 'bg-emerald-500' : key === 'expense' ? 'bg-red-500' : 'bg-indigo-500';
            return (
              <button
                key={key}
                onClick={() => toggleVisibility(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                  isActive 
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm' 
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? colorClass : 'bg-neutral-300 dark:bg-neutral-600'}`} />
                {key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-30 flex items-center justify-end">
         <div className={`flex items-center gap-1 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-neutral-100 dark:border-neutral-800 rounded-full shadow-xl mr-3 overflow-hidden transition-all duration-300 origin-right ${showControls ? 'w-auto opacity-100 p-1' : 'w-0 opacity-0 p-0 border-0 scale-90'}`}>
            <button 
              onClick={handleZoomOut}
              className="p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="Zoom Out"
            >
              <Minus size={18} />
            </button>
            <button 
              onClick={handleResetZoom}
              className="p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="Reset View"
            >
              <RotateCcw size={16} />
            </button>
            <button 
              onClick={handleZoomIn}
              className="p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="Zoom In"
            >
              <Plus size={18} />
            </button>
         </div>

         <button 
           onClick={() => setShowControls(!showControls)}
           className={`w-12 h-12 flex items-center justify-center rounded-full shadow-lg border transition-all duration-300 ${
             showControls 
               ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white rotate-90' 
               : 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md text-neutral-500 dark:text-neutral-400 border-neutral-100 dark:border-neutral-800 hover:scale-105'
           }`}
         >
           {showControls ? <X size={20} /> : <Search size={20} />}
         </button>
      </div>

      <div className="relative z-10 flex flex-col items-center mb-2 pt-2">
        <h3 className="text-neutral-400 dark:text-neutral-500 font-medium text-xs uppercase tracking-widest mb-3">
          {hoverPoint ? (
            <span className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <Calendar size={12} /> {hoverPoint.label}
            </span>
          ) : 'Financial Overview'}
        </h3>
        
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center relative mb-5">
            <div className={`flex items-center gap-2 transition-opacity duration-300 ${visible.income ? 'opacity-100' : 'opacity-20'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{displayIncome.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700"></div>
            <div className={`flex items-center gap-2 transition-opacity duration-300 ${visible.expense ? 'opacity-100' : 'opacity-20'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{displayExpense.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700"></div>
            <div className={`flex items-center gap-2 transition-opacity duration-300 ${visible.balance ? 'opacity-100' : 'opacity-20'}`}>
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                <span className={`text-xl font-bold tracking-tight ${displayBalance < 0 ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
                    {displayBalance.toLocaleString()}
                </span>
            </div>

            {/* Float Tooltip Extra */}
            {hoverPoint && balanceChange !== null && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 animate-in zoom-in-95 duration-200">
                <div className={`flex items-center gap-0.5 text-[10px] font-black uppercase tracking-widest ${balanceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                   {balanceChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                   {Math.abs(balanceChange).toFixed(1)}%
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Floating Rich Tooltip */}
      {hoverPoint && (
        <div className="absolute left-8 bottom-28 z-40 p-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-2xl animate-in slide-in-from-left-4 fade-in duration-300 pointer-events-none w-52">
           <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
             <Activity size={10} /> Snapshot
           </div>
           <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-neutral-500">Income</span>
                 <span className="text-[11px] font-black text-emerald-500">+{hoverPoint.income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-neutral-500">Expense</span>
                 <span className="text-[11px] font-black text-red-500">-{hoverPoint.expense.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                 <span className="text-[10px] font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Net Balance</span>
                 <span className="text-[12px] font-black text-indigo-500">{hoverPoint.balance.toLocaleString()}</span>
              </div>
              {isCompareMode && prevPeriodHoverPoint && (
                <div className="pt-2 border-t border-dashed border-neutral-100 dark:border-neutral-800 space-y-1">
                   <div className="flex justify-between items-center opacity-70">
                      <span className="text-[9px] font-bold text-neutral-500">Prev Period</span>
                      <span className="text-[10px] font-bold text-neutral-400">{prevPeriodHoverPoint.balance.toLocaleString()}</span>
                   </div>
                   {vsPrevChange !== null && (
                      <div className={`text-[10px] font-black text-right ${vsPrevChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                         {vsPrevChange >= 0 ? '+' : ''}{vsPrevChange.toFixed(1)}% vs Prev
                      </div>
                   )}
                </div>
              )}
           </div>
        </div>
      )}

      {/* Refined Canvas Area: Tooltip resets when pointer leaves the chart canvas specifically */}
      <div 
        className="relative h-[240px] w-full cursor-pointer z-10 flex items-center mt-4"
        onMouseLeave={clearHoverState}
        onTouchEnd={clearHoverState}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};