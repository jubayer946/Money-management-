import { useCallback, useMemo } from 'react';
import type { Debt } from '../types';

interface DebtStats {
  activeDebts: Debt[];
  totalDebt: number;
  totalOriginal: number;
  totalPaid: number;
  totalProgress: number; // 0–100
  getProgress: (d: Debt) => number; // 0–100
}

export function useDebtStats(debts: Debt[]): DebtStats {
  const getProgress = useCallback((d: Debt) => {
    const init = d.initialAmount ?? d.amount;
    if (init <= 0) return d.amount <= 0 ? 100 : 0;
    const progress = ((init - d.amount) / init) * 100;
    return Math.min(100, Math.max(0, progress));
  }, []);

  return useMemo(() => {
    const activeDebts = debts.filter(d => d.amount > 0);

    const totalDebt = activeDebts.reduce((sum, d) => sum + d.amount, 0);

    const totalOriginal = debts.reduce(
      (sum, d) => sum + (d.initialAmount ?? d.amount),
      0
    );

    const totalPaid = totalOriginal - totalDebt;

    const totalProgress =
      totalOriginal > 0
        ? Math.min(
            100,
            Math.max(
              0,
              Math.round(((totalOriginal - totalDebt) / totalOriginal) * 100)
            )
          )
        : 0;

    return {
      activeDebts,
      totalDebt,
      totalOriginal,
      totalPaid,
      totalProgress,
      getProgress,
    };
  }, [debts, getProgress]);
}
