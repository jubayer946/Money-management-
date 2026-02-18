import React from 'react';
import { CreditCard } from 'lucide-react';

interface Props {
  totalDebt: number;
  totalOriginal: number;
  totalPaid: number;
  totalProgress: number;
  formatter: Intl.NumberFormat;
}

export const DebtSummaryCard: React.FC<Props> = ({
  totalDebt,
  totalOriginal,
  totalPaid,
  totalProgress,
  formatter,
}) => {
  return (
    <div className="mb-8">
      <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-[32px] p-7 shadow-xl shadow-orange-100 dark:shadow-none relative overflow-hidden text-white h-[210px] flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="text-[10px] font-black text-orange-100 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <CreditCard size={14} /> Current Debt
            </div>
            <div className="text-5xl font-light tracking-tighter">
              {formatter.format(totalDebt)}
            </div>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                className="text-orange-700/30"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                className="text-white transition-all duration-1000"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeDasharray={`${totalProgress}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-black">
              {totalProgress}%
            </div>
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
          <div>
            <div className="text-[10px] font-black text-orange-100 uppercase tracking-widest mb-1 opacity-70">
              Total Liability
            </div>
            <div className="text-xl font-bold">
              {formatter.format(totalOriginal)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-orange-100 uppercase tracking-widest mb-1 opacity-70">
              Amount Repaid
            </div>
            <div className="text-xl font-bold">
              {formatter.format(totalPaid)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};