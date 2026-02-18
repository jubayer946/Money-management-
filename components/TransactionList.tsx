import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Search, X, Filter, LayoutList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './ui/Modal';
import { TransactionType, Transaction } from '../types';
import { TransactionRow } from './ui/TransactionRow';

export const TransactionList = () => {
  const { transactions, categories, deleteTransaction, updateTransaction } = useFinance();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasAdvancedFilters = startDate !== '' || endDate !== '' || selectedCategory !== 'all';

  const resetAdvancedFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCategory('all');
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    } else {
      setIsSelectionMode(true);
    }
  };

  const toggleItemSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = (filteredIds: string[]) => {
    const allSelected = filteredIds.every(id => selectedIds.has(id));
    const newSet = new Set(selectedIds);
    if (allSelected) {
      filteredIds.forEach(id => newSet.delete(id));
    } else {
      filteredIds.forEach(id => newSet.add(id));
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const ok = window.confirm(`Are you sure you want to delete ${ids.length} transactions?`);
    if (!ok) return;

    setIsProcessing(true);
    try {
      await Promise.all(ids.map(id => deleteTransaction(id)));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCategorize = async (categoryName: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsProcessing(true);
    try {
      const updates = transactions
        .filter(t => selectedIds.has(t.id))
        .map(t => ({ ...t, category: categoryName }));
      await Promise.all(updates.map(tx => updateTransaction(tx)));
      setIsBulkCategoryModalOpen(false);
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = t.desc.toLowerCase().includes(searchLower) || 
                            (t.category && t.category.toLowerCase().includes(searchLower));
      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && t.date >= startDate;
      if (endDate) matchesDate = matchesDate && t.date <= endDate;
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      return matchesType && matchesSearch && matchesDate && matchesCategory;
    });
  }, [transactions, filterType, searchQuery, startDate, endDate, selectedCategory]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const getGroupLabel = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yesterday.getTime()) return 'Yesterday';
    
    const day = date.getDate();
    const month = date.toLocaleDateString(undefined, { month: 'short' });
    const yearStr = date.getFullYear().toString().slice(-2);

    return `${day} ${month} ${yearStr}`;
  };

  const filteredIds = useMemo(() => filtered.map(t => t.id), [filtered]);
  const isAllVisibleSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));

  return (
    <div className="h-[100dvh] flex flex-col relative max-w-md mx-auto bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300 overflow-hidden">
      <div className="shrink-0 z-20 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50 px-5 pt-6 pb-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Transactions</h1>
            <button 
              type="button"
              onClick={toggleSelectionMode}
              disabled={isProcessing}
              className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all px-4 py-2 rounded-full ${
                isSelectionMode 
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'text-neutral-500 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm'
              }`}
            >
              {isSelectionMode ? 'Cancel' : 'Select'}
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1 group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description..."
                className="w-full pl-10 pr-10 py-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none shadow-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400"><Search size={16} /></div>
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400">
                  <X size={12} />
                </button>
              )}
            </div>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className={`w-12 h-[46px] flex items-center justify-center rounded-2xl border transition-all ${showFilters || hasAdvancedFilters ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-lg' : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800'}`}><Filter size={18} /></button>
          </div>

          {showFilters && (
            <div className="mt-4 p-5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl shadow-xl space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">From</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border-0 rounded-xl text-xs font-bold text-neutral-900 dark:text-white" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">To</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border-0 rounded-xl text-xs font-bold text-neutral-900 dark:text-white" />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1 mb-1 block">Category</label>
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-3.5 bg-neutral-50 dark:bg-neutral-800 border-0 rounded-xl text-sm font-bold text-neutral-900 dark:text-white">
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                {hasAdvancedFilters && <button type="button" onClick={resetAdvancedFilters} className="w-full py-3.5 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-900/10 rounded-2xl">Clear Filters</button>}
            </div>
          )}

          {isSelectionMode && (
            <div className="mt-4 flex items-center justify-between bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 p-3 pl-5 rounded-2xl shadow-xl">
              <div className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[9px] text-white">{selectedIds.size}</div> Selected
              </div>
              <button type="button" onClick={() => toggleSelectAll(filteredIds)} className="text-[9px] font-black uppercase tracking-widest bg-white/10 dark:bg-neutral-100 px-4 py-2 rounded-xl">{isAllVisibleSelected ? 'Deselect Visible' : 'Select Visible'}</button>
            </div>
          )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-48 no-scrollbar">
        {groupedTransactions.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-100 dark:border-neutral-800 shadow-sm flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-200 dark:text-neutral-700">
              <LayoutList size={32} strokeWidth={1} />
            </div>
            <div className="space-y-1">
                <div className="text-neutral-900 dark:text-white font-bold text-base">No matches found</div>
                <div className="text-neutral-400 text-xs font-medium max-w-[180px] mx-auto leading-relaxed">
                  We couldn't find any transactions matching your filters.
                </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedTransactions.map(([dateStr, items]) => (
              <div key={dateStr} className="space-y-3">
                <div className="sticky top-0 z-10 py-1 bg-neutral-50/90 dark:bg-neutral-950/90 backdrop-blur-sm flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] px-1">
                    {getGroupLabel(dateStr)}
                  </h3>
                  <div className="h-px flex-1 bg-neutral-100 dark:bg-neutral-900 ml-4" />
                </div>
                <div className="space-y-2">
                  {items.map((t, idx) => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedIds.has(t.id)}
                      onClick={() => isSelectionMode ? toggleItemSelection(t.id) : navigate(`/transaction/${t.id}`)}
                      catColor={categories.find(c => c.name === t.category)?.color}
                      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-36 left-5 right-5 z-50 max-w-md mx-auto">
          <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-[28px] p-2.5 shadow-2xl flex gap-2">
             <button type="button" onClick={() => setIsBulkCategoryModalOpen(true)} className="flex-1 py-3.5 bg-neutral-800 dark:bg-neutral-100 rounded-2xl font-bold text-[11px] uppercase tracking-widest">Category</button>
             <button type="button" onClick={handleBulkDelete} className="flex-1 py-3.5 bg-red-500 rounded-2xl font-bold text-[11px] uppercase tracking-widest text-white shadow-lg shadow-red-500/20">Delete ({selectedIds.size})</button>
          </div>
        </div>
      )}

      <Modal isOpen={isBulkCategoryModalOpen} onClose={() => setIsBulkCategoryModalOpen(false)} title="Categorize Selected">
        <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar pb-6">
            <button type="button" onClick={() => handleBulkCategorize('')} className="w-full text-left p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-400 border border-dashed border-neutral-200">No Category</button>
            {categories.map(c => (
                <button key={c.id} type="button" onClick={() => handleBulkCategorize(c.name)} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all border border-neutral-100 dark:border-neutral-800 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">{c.name}</span>
                    </div>
                </button>
            ))}
        </div>
      </Modal>
    </div>
  );
};