import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useFinance } from '../context/FinanceContext';
import { AddDebtModal } from './modals/AddDebtModal';
import { EditDebtModal } from './modals/EditDebtModal';
import { useDebtStats } from '../hooks/useDebtStats';
import { DebtSummaryCard } from './DebtSummaryCard';
import { DebtSortControls } from './DebtSortControls';
import { DebtList } from './DebtList';
import { Plus, Search, XCircle, RotateCcw } from 'lucide-react';
import type { Debt } from '../types';
import type { SortOption } from './debtTypes';

interface UndoState {
  debt: Debt;
  action: 'delete' | 'settle';
  prevAmount?: number;
}

export const Debts: React.FC = () => {
  const {
    debts,
    deleteDebt,
    updateDebt,
    addTransaction,
    addDebtPayment,
    addDebt,
  } = useFinance();

  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Manual Undo Logic with Timer Cleanup
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [undoItem, setUndoItem] = useState<UndoState | null>(null);

  const triggerUndo = (
    debt: Debt,
    action: 'delete' | 'settle',
    prevAmount?: number
  ) => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    setUndoItem({ debt, action, prevAmount });

    undoTimerRef.current = setTimeout(() => {
      setUndoItem(null);
      undoTimerRef.current = null;
    }, 8000);
  };

  const handleUndoAction = () => {
    if (!undoItem) return;

    if (undoItem.action === 'delete') {
      addDebt(undoItem.debt);
    } else if (
      undoItem.action === 'settle' &&
      undoItem.prevAmount !== undefined
    ) {
      updateDebt({ ...undoItem.debt, amount: undoItem.prevAmount });
    }

    setUndoItem(null);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  // Clear timer when component unmounts
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  // Reduced motion detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  const {
    activeDebts,
    totalDebt,
    totalOriginal,
    totalPaid,
    totalProgress,
    getProgress,
  } = useDebtStats(debts);

  const handleSettleDebt = useCallback(
    (debt: Debt) => {
      const remaining = debt.amount;
      if (remaining <= 0) return;

      triggerUndo(debt, 'settle', remaining);

      const date = new Date().toISOString().split('T')[0];

      addTransaction({
        type: 'expense',
        desc: `Paid Off: ${debt.name}`,
        amount: remaining,
        category: 'Debt',
        date,
      });

      addDebtPayment({
        debtId: debt.id,
        amount: remaining,
        date,
      });

      updateDebt({ ...debt, amount: 0 });
    },
    [addTransaction, addDebtPayment, updateDebt]
  );

  const handlePayMinimum = useCallback(
    (debt: Debt) => {
      if (!debt.minimumPayment || debt.amount <= 0) return;
      const payAmt = Math.min(debt.amount, debt.minimumPayment);
      const date = new Date().toISOString().split('T')[0];

      addTransaction({
        type: 'expense',
        desc: `Min Payment: ${debt.name}`,
        amount: payAmt,
        category: 'Debt',
        date,
      });

      addDebtPayment({
        debtId: debt.id,
        amount: payAmt,
        date,
      });

      updateDebt({ ...debt, amount: debt.amount - payAmt });
    },
    [addTransaction, addDebtPayment, updateDebt]
  );

  const handleDeleteDebt = useCallback(
    (debt: Debt) => {
      triggerUndo(debt, 'delete');
      deleteDebt(debt.id);
    },
    [deleteDebt]
  );

  const toggleItemSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReorder = (sourceId: string, targetId: string) => {
    const fullList = [...activeDebts].sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0)
    );

    const sourceIndex = fullList.findIndex(d => d.id === sourceId);
    const targetIndex = fullList.findIndex(d => d.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const [removed] = fullList.splice(sourceIndex, 1);
    fullList.splice(targetIndex, 0, removed);

    fullList.forEach((item, index) => {
      updateDebt({ ...item, priority: index });
    });
  };

  const selectedTotal = useMemo(
    () =>
      Array.from(selectedIds).reduce((sum, id) => {
        const debt = debts.find(d => d.id === id);
        return sum + (debt?.amount || 0);
      }, 0),
    [selectedIds, debts]
  );

  return (
    <div className="pb-32 pt-6 px-5 max-w-md mx-auto min-h-screen relative overflow-x-hidden">
      <header className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Debts
          </h1>
          {activeDebts.length > 0 && (
            <button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`text-[10px] font-black uppercase tracking-wider mt-1 text-left transition-colors ${
                isSelectionMode
                  ? 'text-orange-500'
                  : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
              }`}
            >
              {isSelectionMode ? 'Cancel Selection' : 'Batch Select'}
            </button>
          )}
        </div>
        <button
          onClick={() => setIsAddDebtOpen(true)}
          className="w-12 h-12 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-lg hover:scale-105 transition-all"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </header>

      <DebtSummaryCard
        totalDebt={totalDebt}
        totalOriginal={totalOriginal}
        totalPaid={totalPaid}
        totalProgress={totalProgress}
        formatter={formatter}
      />

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-11 pr-11 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400"
            >
              <XCircle size={14} />
            </button>
          )}
        </div>

        <DebtSortControls
          sortBy={sortBy}
          onChangeSort={opt => setSortBy(opt)}
          show={activeDebts.length > 0 && !isSelectionMode && !searchQuery}
        />

        <DebtList
          debts={activeDebts}
          sortBy={sortBy}
          searchQuery={searchQuery}
          getProgress={getProgress}
          formatter={formatter}
          isSelectionMode={isSelectionMode}
          selectedIds={selectedIds}
          onToggleItemSelection={toggleItemSelection}
          prefersReducedMotion={prefersReducedMotion}
          onEditDebt={setEditingDebt}
          onDeleteDebt={handleDeleteDebt}
          onSettleDebt={handleSettleDebt}
          onPayMinimum={handlePayMinimum}
          onReorder={handleReorder}
        />
      </div>

      {undoItem && (
        <div className="fixed bottom-24 left-5 right-5 z-[100] max-w-md mx-auto">
          <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 p-4 pl-6 rounded-3xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-neutral-900/10 flex items-center justify-center">
                <RotateCcw size={16} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wide">
                {undoItem.action === 'delete' ? 'Debt Deleted' : 'Debt Settled'}
              </div>
            </div>
            <button
              onClick={handleUndoAction}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-orange-500/30"
            >
              Undo
            </button>
          </div>
        </div>
      )}

      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-5 right-5 z-50 max-w-md mx-auto">
          <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-[32px] p-6 shadow-2xl flex items-center justify-between">
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                Repay {selectedIds.size} Selected
              </div>
              <div className="text-2xl font-black text-orange-500">
                {formatter.format(selectedTotal)}
              </div>
            </div>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="w-11 h-11 flex items-center justify-center bg-white/10 dark:bg-black/10 rounded-full"
            >
              <XCircle size={22} />
            </button>
          </div>
        </div>
      )}

      <AddDebtModal
        isOpen={isAddDebtOpen}
        onClose={() => setIsAddDebtOpen(false)}
      />
      <EditDebtModal
        debt={editingDebt}
        isOpen={!!editingDebt}
        onClose={() => setEditingDebt(null)}
        onDelete={() => editingDebt && handleDeleteDebt(editingDebt)}
      />
    </div>
  );
};