import React, { useEffect, useRef, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { useFinance } from '../context/FinanceContext';
import { ChartPeriod } from '../types';

interface AssetVisualizerProps {
  type: 'digital' | 'physical';
  period: ChartPeriod;
  currentDate: Date;
}

export const AssetVisualizer: React.FC<AssetVisualizerProps> = ({ type, period, currentDate }) => {
  const { transactions, wallets } = useFinance();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const endDate = new Date(currentDate);

    // Set endDate to the end of the selected period
    if (period === 'day') {
        endDate.setHours(23,59,59,999);
    } else if (period === 'week') {
        const day = endDate.getDay();
        const diff = endDate.getDate() - day + 6;
        endDate.setDate(diff);
        endDate.setHours(23,59,59,999);
    } else if (period === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23,59,59,999);
    } else if (period === 'year') {
        endDate.setMonth(11, 31);
        endDate.setHours(23,59,59,999);
    }

    const relevantWallets = type === 'digital' 
        ? wallets.filter(w => w.type === 'digital' || w.type === 'bank')
        : wallets.filter(w => w.type === 'cash');

    const calcBalance = (walletId: string | undefined) => {
        return transactions.reduce((acc, t) => {
            const tDate = new Date(t.date);
            if (tDate > endDate) return acc;

            if (walletId) {
                if (t.type === 'income' && t.walletId === walletId) return acc + t.amount;
                if (t.type === 'expense' && t.walletId === walletId) return acc - t.amount;
                if (t.type === 'transfer') {
                    if (t.targetWalletId === walletId) return acc + t.amount;
                    if (t.walletId === walletId) return acc - t.amount;
                }
            } else {
                // Main Balance
                if (t.type === 'income' && !t.walletId) return acc + t.amount;
                if (t.type === 'expense' && !t.walletId) return acc - t.amount;
                if (t.type === 'transfer') {
                    if (!t.walletId) return acc - t.amount;
                    if (!t.targetWalletId && t.walletId) return acc + t.amount;
                }
            }
            return acc;
        }, 0);
    };

    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColors: string[] = [];

    relevantWallets.forEach(w => {
        const bal = calcBalance(w.id);
        if (bal > 0) {
            labels.push(w.name);
            data.push(bal);
            backgroundColors.push(w.color);
        }
    });

    if (type === 'physical') {
        const mainBal = calcBalance(undefined);
        if (mainBal > 0) {
            labels.push('Main Balance');
            data.push(mainBal);
            backgroundColors.push('#64748b');
        }
    }

    return { labels, data, backgroundColors };
  }, [transactions, wallets, type, period, currentDate]);

  const total = useMemo(() => chartData.data.reduce((a, b) => a + b, 0), [chartData]);

  const activeItem = useMemo(() => {
    if (activeIndex === null || !chartData.data[activeIndex]) return null;
    const value = chartData.data[activeIndex];
    return {
      label: chartData.labels[activeIndex],
      value: value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      color: chartData.backgroundColors[activeIndex]
    };
  }, [activeIndex, chartData, total]);

  useEffect(() => {
    if (canvasRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: chartData.labels,
            datasets: [{
              data: chartData.data,
              backgroundColor: chartData.backgroundColors,
              borderWidth: 0,
              hoverOffset: 15,
              borderRadius: 20,
              spacing: 5,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            layout: { padding: 20 },
            animation: { animateScale: true, animateRotate: true },
            onHover: (event: any, elements: any) => {
                if (elements && elements.length > 0) {
                    setActiveIndex(elements[0].index);
                    if (event.native?.target) (event.native.target as HTMLElement).style.cursor = 'pointer';
                } else {
                    setActiveIndex(null);
                    if (event.native?.target) (event.native.target as HTMLElement).style.cursor = 'default';
                }
            },
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
          }
        });
      }
    }
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [chartData]);

  return (
    <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-[32px] p-6 shadow-xl shadow-neutral-100 dark:shadow-none border border-neutral-50 dark:border-neutral-800 relative flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium tracking-tight text-neutral-900 dark:text-white capitalize">{type} Assets</h2>
      </div>

      <div className="relative flex-1 w-full min-h-[260px]">
        {chartData.data.length === 0 ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-300 dark:text-neutral-600">
                <div className="w-24 h-24 rounded-full border-4 border-neutral-100 dark:border-neutral-800 flex items-center justify-center mb-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider">Empty</span>
                </div>
             </div>
        ) : (
             <canvas ref={canvasRef} />
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
           {activeItem ? (
              <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                 <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1 px-4 text-center truncate max-w-[150px]">
                    {activeItem.label}
                 </div>
                 <div className="text-3xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-1">
                    {activeItem.percentage}%
                 </div>
                 <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                    ${activeItem.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                 </div>
              </div>
           ) : (
              <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                 <div className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Total</div>
                 <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
