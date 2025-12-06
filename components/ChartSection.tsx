
import React, { useEffect, useRef, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import ZoomPlugin from 'chartjs-plugin-zoom';
import { useFinance } from '../context/FinanceContext';
import { useChartData } from '../hooks/useChartData';
import { ChartPeriod } from '../types';
import { RotateCcw } from 'lucide-react';

// Register the Zoom plugin globally for this component
Chart.register(ZoomPlugin);

interface ChartSectionProps {
  period: ChartPeriod;
  currentDate: Date;
}

export const ChartSection: React.FC<ChartSectionProps> = ({ period, currentDate }) => {
  const { transactions } = useFinance();
  const [hoverData, setHoverData] = useState<{ income: number; expense: number; balance: number } | null>(null);
  
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
            onHover: (event: any, elements: any) => {
              if (elements && elements.length > 0) {
                const index = elements[0].index;
                setHoverData({
                  income: data[index].income,
                  expense: data[index].expense,
                  balance: data[index].balance
                });
                if (event.native && event.native.target) (event.native.target as HTMLElement).style.cursor = 'grab';
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
  }, [data]);


  return (
    <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-[32px] p-8 pb-6 shadow-xl shadow-neutral-100 dark:shadow-none border border-neutral-50 dark:border-neutral-800 relative overflow-hidden group">
      {/* Background Gradient Blob */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-neutral-50/50 dark:from-neutral-800/20 to-transparent pointer-events-none" />

      {/* Reset Zoom Button */}
      <button 
        onClick={handleResetZoom}
        className="absolute top-6 right-6 p-2 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-100 dark:border-neutral-700 rounded-full text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white shadow-sm z-30 transition-all hover:scale-105 active:scale-95"
        title="Reset Zoom"
      >
        <RotateCcw size={16} />
      </button>

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
      <div className="relative h-[240px] w-full cursor-grab active:cursor-grabbing z-10 flex items-center">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
