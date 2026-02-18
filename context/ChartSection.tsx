import React, { useEffect, useRef, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import ZoomPlugin from 'chartjs-plugin-zoom';
import { useFinance } from '../context/FinanceContext';
import { useChartData } from './useChartData';
import { ChartPeriod, ChartDataPoint } from '../types';
import { RotateCcw, Plus, Minus, Search, X } from 'lucide-react';

// Register the Zoom plugin globally for this component
Chart.register(ZoomPlugin);

interface ChartSectionProps {
  period: ChartPeriod;
  currentDate: Date;
  onPointSelect?: (point: ChartDataPoint | null) => void;
}

export const ChartSection: React.FC<ChartSectionProps> = ({ period, currentDate, onPointSelect }) => {
  const { transactions } = useFinance();
  const [hoverData, setHoverData] = useState<{ income: number; expense: number; balance: number } | null>(null);
  const [showControls, setShowControls] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const data = useChartData(transactions, period, currentDate);

  // --- Metrics ---
  const totalIncome = useMemo(() => data.reduce((acc, curr) => acc + curr.income, 0), [data]);
  const totalExpense = useMemo(() => data.reduce((acc, curr) => acc + curr.expense, 0), [data]);
  const currentBalance = useMemo(() => data.length > 0 ? data[data.length - 1].balance : 0, [data]);

  const displayIncome = hoverData ? hoverData.income : totalIncome;
  const displayExpense = hoverData ? hoverData.expense : totalExpense;
  const displayBalance = hoverData ? hoverData.balance : currentBalance;

  // --- Handlers ---
  const handleResetZoom = () => {
    if (chartInstance.current) chartInstance.current.resetZoom();
  };

  const handleZoomIn = () => {
    if (chartInstance.current) {
      (chartInstance.current as any).zoom(1.1);
    }
  };

  const handleZoomOut = () => {
    if (chartInstance.current) {
      (chartInstance.current as any).zoom(0.9);
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
    if (canvasRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.map(d => d.label),
            datasets: [
              {
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
              {
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
              {
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
            ]
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
                grid: { display: false, drawBorder: false },
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
                setHoverData({
                  income: data[index].income,
                  expense: data[index].expense,
                  balance: data[index].balance
                });
                if (event.native && event.native.target) (event.native.target as HTMLElement).style.cursor = 'pointer';
              } else {
                setHoverData(null);
                if (event.native && event.native.target) (event.native.target as HTMLElement).style.cursor = 'default';
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [data, onPointSelect]);


  return (
    <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-[32px] p-8 pb-6 shadow-xl shadow-neutral-100 dark:shadow-none border border-neutral-50 dark:border-neutral-800 relative overflow-hidden group">
      {/* Background Gradient Blob */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-neutral-50/50 dark:from-neutral-800/20 to-transparent pointer-events-none" />

      {/* Expandable Chart Controls (Bottom Right) */}
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

      {/* Header Metrics */}
      <div className="relative z-10 flex flex-col items-center mb-2">
        <h3 className="text-neutral-400 dark:text-neutral-500 font-medium text-xs uppercase tracking-widest mb-3">Financial Overview</h3>
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
            <div className="flex items-center gap-2 opacity-60">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">${displayIncome.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700"></div>
            <div className="flex items-center gap-2 opacity-60">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">${displayExpense.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700"></div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                <span className={`text-xl font-bold tracking-tight ${displayBalance < 0 ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
                    ${displayBalance.toLocaleString()}
                </span>
            </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative h-[240px] w-full cursor-pointer z-10 flex items-center">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
