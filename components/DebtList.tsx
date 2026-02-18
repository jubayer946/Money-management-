import React, { useMemo, useState } from 'react';
import {
  Edit2,
  Trash2,
  Check,
  XCircle,
  GripVertical,
} from 'lucide-react';
import type { Debt } from '../types';
import type { SortOption } from './debtTypes';

interface DebtListProps {
  debts: Debt[];                    // activeDebts from parent
  sortBy: SortOption;
  searchQuery: string;
  getProgress: (d: Debt) => number;
  formatter: Intl.NumberFormat;
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  onToggleItemSelection: (id: string) => void;
  prefersReducedMotion: boolean;

  // actions implemented in parent
  onEditDebt: (debt: Debt) => void;
  onDeleteDebt: (debt: Debt) => void;
  onSettleDebt: (debt: Debt) => void;
  onPayMinimum: (debt: Debt) => void;

  // drag reorder
  onReorder: (sourceId: string, targetId: string) => void;
}

export const DebtList: React.FC<DebtListProps> = ({
  debts,
  sortBy,
  searchQuery,
  getProgress,
  formatter,
  isSelectionMode,
  selectedIds,
  onToggleItemSelection,
  prefersReducedMotion,
  onEditDebt,
  onDeleteDebt,
  onSettleDebt,
  onPayMinimum,
  onReorder,
}) => {
  const [revealedHandleId, setRevealedHandleId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sortedActiveDebts = useMemo(() => {
    let filtered = [...debts];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(d => d.name.toLowerCase().includes(q));
    }
    return filtered.sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      if (sortBy === 'progress') return getProgress(b) - getProgress(a);
      if (sortBy === 'date') {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      }
      return (a.priority ?? 999) - (b.priority ?? 999);
    });
  }, [debts, sortBy, searchQuery, getProgress]);

  const canDragGlobally =
    sortBy === 'priority' && !isSelectionMode && !searchQuery.trim();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!canDragGlobally) return;
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (!canDragGlobally) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (!canDragGlobally) return;
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetId) {
      onReorder(sourceId, targetId);
    }
    setDraggedId(null);
    setRevealedHandleId(null);
  };

  return (
    <div className="space-y-4 mb-10">
      {sortedActiveDebts.map(d => {
        const progress = getProgress(d);
        const isSelected = selectedIds.has(d.id);
        const isHandleRevealed = revealedHandleId === d.id;

        return (
          <DebtRow
            key={d.id}
            debt={d}
            progress={progress}
            formatter={formatter}
            isSelectionMode={isSelectionMode}
            isSelected={isSelected}
            canDrag={canDragGlobally}
            isHandleRevealed={isHandleRevealed}
            onToggleHandle={() =>
              setRevealedHandleId(isHandleRevealed ? null : d.id)
            }
            prefersReducedMotion={prefersReducedMotion}
            onToggleSelect={onToggleItemSelection}
            onEdit={onEditDebt}
            onDelete={onDeleteDebt}
            onSettle={onSettleDebt}
            onPayMinimum={onPayMinimum}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        );
      })}
    </div>
  );
};

// ---- Single row ----

interface DebtRowProps {
  debt: Debt;
  progress: number;
  formatter: Intl.NumberFormat;
  isSelectionMode: boolean;
  isSelected: boolean;
  canDrag: boolean;
  isHandleRevealed: boolean;
  onToggleHandle: () => void;
  prefersReducedMotion: boolean;

  onToggleSelect: (id: string) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
  onSettle: (debt: Debt) => void;
  onPayMinimum: (debt: Debt) => void;

  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
}

const SWIPE_THRESHOLD_RIGHT = 120;
const SWIPE_THRESHOLD_LEFT = -180;

const DebtRow: React.FC<DebtRowProps> = ({
  debt,
  progress,
  formatter,
  isSelectionMode,
  isSelected,
  canDrag,
  isHandleRevealed,
  onToggleHandle,
  prefersReducedMotion,
  onToggleSelect,
  onEdit,
  onDelete,
  onSettle,
  onPayMinimum,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [swipe, setSwipe] = useState({
    startX: 0,
    currentX: 0,
    isSwiping: false,
    thresholdReached: false,
  });

  const swipeOffset = swipe.currentX - swipe.startX;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSelectionMode) return;
    const x = e.touches[0].clientX;
    setSwipe({
      startX: x,
      currentX: x,
      isSwiping: true,
      thresholdReached: false,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipe.isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - swipe.startX;
    const reached =
      diff > SWIPE_THRESHOLD_RIGHT || diff < SWIPE_THRESHOLD_LEFT;

    if (reached && !swipe.thresholdReached && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }

    setSwipe(prev => ({
      ...prev,
      currentX,
      thresholdReached: reached,
    }));
  };

  const handleTouchEnd = () => {
    const diff = swipe.currentX - swipe.startX;

    if (diff > SWIPE_THRESHOLD_RIGHT) {
      onSettle(debt);
    }

    setSwipe({
      startX: 0,
      currentX: 0,
      isSwiping: false,
      thresholdReached: false,
    });
  };

  const handleRowClick = () => {
    if (isSelectionMode) {
      onToggleSelect(debt.id);
      return;
    }
    if (Math.abs(swipeOffset) < 10) {
      onEdit(debt);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(debt);
  };

  const handlePayMinimumClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPayMinimum(debt);
  };

  return (
    <div
      className="flex items-center gap-2 group/item"
      onDragOver={e => canDrag && onDragOver(e, debt.id)}
      onDrop={e => canDrag && onDrop(e, debt.id)}
    >
      {canDrag && !isSelectionMode && (
        <div
          onClick={e => {
            e.stopPropagation();
            onToggleHandle();
          }}
          className={`shrink-0 w-8 h-12 flex items-center justify-center cursor-pointer transition-all ${
            isHandleRevealed
              ? 'text-orange-500'
              : 'text-neutral-200 dark:text-neutral-800 hover:text-neutral-400 dark:hover:text-neutral-600'
          }`}
        >
          <div
            draggable
            onDragStart={e => isHandleRevealed && onDragStart(e, debt.id)}
            className={`transition-all duration-300 ${
              isHandleRevealed
                ? 'opacity-100 scale-110 pointer-events-auto'
                : 'opacity-0 scale-75 pointer-events-none'
            }`}
          >
            <GripVertical size={20} />
          </div>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden rounded-[28px]">
        <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
          <div
            className="h-full bg-emerald-500 flex items-center pl-8 transition-opacity duration-200"
            style={{ opacity: swipeOffset > 20 ? 1 : 0 }}
          >
            <div className="flex items-center gap-3 text-white">
              <Check
                size={24}
                strokeWidth={3}
                className={`transition-transform ${
                  swipeOffset > SWIPE_THRESHOLD_RIGHT
                    ? 'scale-125'
                    : 'scale-100'
                }`}
              />
              <span className="font-black text-[10px] uppercase tracking-widest">
                Settle
              </span>
            </div>
          </div>
          <div
            className="h-full bg-neutral-100 dark:bg-neutral-800 flex items-center pr-4 transition-opacity duration-200"
            style={{ opacity: swipeOffset < -20 ? 1 : 0 }}
          >
            <div className="flex gap-2 pointer-events-auto pl-4">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onEdit(debt);
                }}
                className="w-10 h-10 rounded-full bg-white dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shadow-sm"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleDeleteClick}
                className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleRowClick}
          style={{ transform: `translateX(${swipeOffset}px)` }}
          className={`p-6 bg-white dark:bg-neutral-900 border transition-all cursor-pointer relative z-10 ${
            isSelected
              ? 'border-orange-500 ring-2 ring-orange-500/20'
              : 'border-neutral-50 dark:border-neutral-800 shadow-sm'
          } ${
            swipe.isSwiping
              ? 'duration-0'
              : prefersReducedMotion
              ? 'duration-0'
              : 'duration-500'
          } rounded-[28px]`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="font-bold text-neutral-900 dark:text-white text-base truncate max-w-[180px]">
                {debt.name}
              </div>
              <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">
                Was {formatter.format(debt.initialAmount ?? debt.amount)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-xl tracking-tight text-orange-600 dark:text-orange-500">
                {formatter.format(debt.amount)}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Progress</span>
                <span className="text-xs font-black text-neutral-900 dark:text-white">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {debt.minimumPayment && debt.amount > 0 && (
                <button onClick={handlePayMinimumClick} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/50">
                    Pay Min: {formatter.format(debt.minimumPayment)}
                </button>
            )}
            {debt.dueDate && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-blue-100 dark:border-blue-900/50">
                {debt.dueDate}
              </div>
            )}
          </div>
        </div>
      </div>

      {isSelectionMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(debt.id); }}
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-orange-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-300'}`}
        >
          <Check size={18} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};
