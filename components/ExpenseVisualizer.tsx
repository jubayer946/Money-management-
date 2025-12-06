import React, { useEffect, useRef, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import ZoomPlugin from 'chartjs-plugin-zoom';
import { useFinance } from '../context/FinanceContext';
import { TransactionType, ChartPeriod } from '../types';

Chart.register(ZoomPlugin);

const DEFAULT_COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', 
  '#3b82f6', '#f43f5e', '#14b8a6', '#f97316', '#64748b'
];

interface FinanceVisualizerProps {
  type: TransactionType;
  period: ChartPeriod;
}

export const FinanceVisualizer: React.FC<FinanceVisualizerProps> = ({ type, period }) => {
  const { transactions, categories } = useFinance();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // --- Data Aggregation ---
  const chartData = useMemo(() => {
    const now = new Date();
    
    // Filter by type and period
    const filtered = transactions.filter(t => {
      if (t.type !== type) return false;
      
      const tDate = new Date(t.date);
      // Adjust date logic
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
    });

    // Group by category
    const grouped = filtered.reduce((acc, t) => {
      const cat = t.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(grouped);
    const data = Object.values(grouped);
    
    // Map colors
    const backgroundColors = labels.map((label, index) => {
        const cat = categories.find(c => c.name === label);
        return cat ? cat.color : DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    });

    return { labels, data, backgroundColors };
  }, [transactions, type, period, categories]);

  const total = useMemo(() => chartData.data.reduce((a, b) => a + b, 0), [chartData]);

  // Derived active data for center display
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
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

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
              hoverOffset: 20,
              borderRadius: 20,
              spacing: 6,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            layout: {
              padding: 24
            },
            animation: {
              animateScale: true,
              animateRotate: true
            },
            onHover: (event: any, elements: any) => {
                if (elements && elements.length > 0) {
                    setActiveIndex(elements[0].index);
                    if (event.native && event.native.target) {
                        (event.native.target as HTMLElement).style.cursor = 'pointer';
                    }
                } else {
                    setActiveIndex(null);
                    if (event.native && event.native.target) {
                        (event.native.target as HTMLElement).style.cursor = 'default';
                    }
                }
            },
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false } // Disable native tooltip in favor of center display
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);

  return (
    <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-[32px] p-8 shadow-xl shadow-neutral-100 dark:shadow-none border border-neutral-50 dark:border-neutral-800 relative flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium tracking-tight text-neutral-900 dark:text-white capitalize">{type} Distribution</h2>
      </div>

      <div className="relative flex-1 w-full min-h-[260px]">
        <canvas ref={canvasRef} style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.05))' }} />
        
        {/* Interactive Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2 transition-all duration-200">
           {activeItem ? (
              <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                 <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1 px-4 text-center truncate max-w-[200px]">
                    {activeItem.label}
                 </div>
                 <div className="text-4xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-1">
                    {activeItem.percentage}%
                 </div>
                 <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                    ${activeItem.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                 </div>
              </div>
           ) : (
              <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                 <div className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Total</div>
                 <div className={`text-3xl font-bold tracking-tight ${type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-neutral-900 dark:text-white'}`}>
                    ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};