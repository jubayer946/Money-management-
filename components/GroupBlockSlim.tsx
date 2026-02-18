import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface GroupBlockSlimProps {
  name: string;
  count: number;
  total: number;
  progress: number;
  children: React.ReactNode;
}

export const GroupBlockSlim: React.FC<GroupBlockSlimProps> = ({ 
  name, 
  count, 
  total, 
  progress, 
  children 
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  // Locale-aware formatter (no currency symbol)
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // SVG Circle Constants
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className="w-full mb-8 last:mb-0 transition-all duration-300">
      {/* Group Header Card */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm mb-3 active:scale-[0.98] transition-all group"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
            <ChevronRight size={16} className="text-neutral-300 dark:text-neutral-600" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight truncate">
            {name}
          </h3>
          <span className="shrink-0 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[9px] font-black uppercase tracking-wider rounded-md">
            {count}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <div className="text-right">
            <div className="text-[10px] font-black text-orange-500 dark:text-orange-400 uppercase tracking-widest">
              {formatter.format(total)}
            </div>
          </div>
          
          <div className="relative w-5 h-5 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 drop-shadow-sm" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r={radius}
                fill="none"
                className="text-neutral-100 dark:text-neutral-800"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <circle
                cx="12"
                cy="12"
                r={radius}
                fill="none"
                className="text-orange-500 transition-all motion-reduce:transition-none duration-1000 ease-out"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </button>

      {/* Children Container with Guide Line and Animation */}
      {isOpen && (
        <div className="relative flex gap-4 pl-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Vertical Guide Line */}
          <div className="w-px bg-neutral-100 dark:bg-neutral-800 absolute left-[18px] top-0 bottom-4 rounded-full" />
          
          {/* Content Area */}
          <div className="flex-1 space-y-3 pt-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};