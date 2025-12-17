
import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ArrowUp, ArrowDown, ChevronRight, Search, X, Filter, CheckSquare, Square, Trash2, FolderInput, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './ui/Modal';
import { TransactionType } from '../types';

export const TransactionList: React.FC = () => {
  const { transactions, categories, deleteTransaction, updateTransaction } = useFinance();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Bulk Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);

  const hasAdvancedFilters = startDate !== '' || endDate !== '' || selectedCategory !== 'all';

  const resetAdvancedFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCategory('all');
  };

  // Toggle Selection Mode
  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    } else {
      setIsSelectionMode(true);
    }
  };

  // Toggle individual item
  const toggleItemSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Select All / Deselect All
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = filtered.map(t => t.id);
      setSelectedIds(new Set(allIds));
    }
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} transactions?`)) {
      selectedIds.forEach(id => deleteTransaction(id));
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  const handleBulkCategorize = (categoryName: string) => {
    selectedIds.forEach(id => {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        updateTransaction({ ...tx, category: categoryName });
      }
    });
    setIsBulkCategoryModalOpen(false);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const filtered = transactions.filter(t => {
    // Type Filter
    const matchesType = filterType === 'all' || t.type === filterType;
    
    // Search Filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = t.desc.toLowerCase().includes(searchLower) || 
                          (t.category && t.category.toLowerCase().includes(searchLower));
    
    // Date Range Filter
    let matchesDate = true;
    if (startDate) matchesDate = matchesDate && t.date >= startDate;
    if (endDate) matchesDate = matchesDate && t.date <= endDate;

    // Category Filter
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;

    return matchesType && matchesSearch && matchesDate && matchesCategory;
  });

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="h-[100dvh] flex flex-col relative max-w-md mx-auto bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      {/* Header Section - Fixed at top */}
      <div className="shrink-0 z-20 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-transparent transition-all px-5 pt-6 pb-2">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-medium tracking-tight text-neutral-900 dark:text-white">Transactions</h1>
            
            <button 
              onClick={toggleSelectionMode}
              className={`text-sm font-medium transition-colors ${isSelectionMode ? 'text-neutral-900 bg-neutral-100 dark:bg-neutral-800 dark:text-white px-3 py-1.5 rounded-lg' : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
            >
              {isSelectionMode ? 'Cancel' : 'Select'}
            </button>
          </div>

          {/* Search and Filter Trigger Row */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-8 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-neutral-900 dark:focus:border-neutral-600 focus:outline-none transition-colors shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded-full p-1">
                    <X size={12} />
                  </div>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center w-12 rounded-xl border transition-all ${
                showFilters || hasAdvancedFilters
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
              }`}
            >
              <Filter size={18} />
            </button>
          </div>

          {/* Type Toggle - Always Visible */}
          <div className="flex gap-2 mb-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-x-auto no-scrollbar">
            {['all', 'income', 'expense'].map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f as any)}
                className={`flex-1 min-w-[60px] py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                  filterType === f 
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
              >
                {f === 'all' ? 'All' : f + 's'}
              </button>
            ))}
          </div>

          {/* Collapsible Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 mb-2 p-5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm space-y-5 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Start Date</label>
                        <input 
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium focus:border-neutral-900 dark:focus:border-neutral-500 outline-none text-neutral-900 dark:text-white" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">End Date</label>
                        <input 
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium focus:border-neutral-900 dark:focus:border-neutral-500 outline-none text-neutral-900 dark:text-white" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Category</label>
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium focus:border-neutral-900 dark:focus:border-neutral-500 outline-none appearance-none text-neutral-900 dark:text-white"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-500">
                            <ChevronRight size={14} className="rotate-90" />
                        </div>
                    </div>
                </div>

                {hasAdvancedFilters && (
                    <button 
                        onClick={resetAdvancedFilters}
                        className="w-full py-3 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                    >
                        Reset Filters
                    </button>
                )}
            </div>
          )}

          {/* Selection Mode Header */}
          {isSelectionMode && (
            <div className="mt-4 flex items-center justify-between bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 p-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2">
              <div className="text-sm font-medium ml-2">
                {selectedIds.size} selected
              </div>
              <button 
                onClick={toggleSelectAll}
                className="text-xs font-bold uppercase tracking-wider bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                {selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}
      </div>

      {/* Scrollable List Section */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-32 scroll-smooth">
        <div className="space-y-px bg-neutral-100 dark:bg-neutral-800 rounded-2xl overflow-hidden shadow-sm border border-neutral-100 dark:border-neutral-800">
          {filtered.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-neutral-900 text-neutral-400 text-sm flex flex-col items-center gap-2">
              <Search size={24} className="opacity-20" />
              <span>
                {searchQuery || hasAdvancedFilters ? 'No matches found' : 'No transactions found'}
              </span>
              {(hasAdvancedFilters || searchQuery) && (
                  <button onClick={() => {resetAdvancedFilters(); setSearchQuery('');}} className="text-neutral-900 dark:text-white underline text-xs mt-2 font-medium">Clear all filters</button>
              )}
            </div>
          ) : (
            filtered.map(t => {
              const isSelected = selectedIds.has(t.id);

              return (
                <div 
                  key={t.id} 
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleItemSelection(t.id);
                    } else {
                      navigate(`/transaction/${t.id}`);
                    }
                  }}
                  className={`flex items-center justify-between p-4 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer group ${isSelected ? 'bg-neutral-50 dark:bg-neutral-800' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {isSelectionMode ? (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-300 dark:text-neutral-600'}`}>
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          t.type === 'income' 
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                              : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                      }`}>
                        {t.type === 'income' ? <ArrowUp size={18} strokeWidth={2.5} /> : <ArrowDown size={18} strokeWidth={2.5} />}
                      </div>
                    )}
                    
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-white text-sm mb-0.5">{t.desc}</div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500 font-medium flex items-center gap-1">
                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        
                        {t.category && (
                            <>
                              <span className="opacity-50">•</span>
                              {t.category}
                            </>
                        )}
                        {t.isRecurring && (
                             <>
                               <span className="opacity-50">•</span>
                               <Repeat size={10} className="text-neutral-400 dark:text-neutral-500" />
                             </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`font-medium ${
                        t.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-red-500 dark:text-red-400'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </div>
                    {!isSelectionMode && <ChevronRight size={16} className="text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-400 dark:group-hover:text-neutral-500" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-5 right-5 z-50 max-w-md mx-auto">
          <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl p-2 shadow-2xl flex gap-2 animate-in slide-in-from-bottom-4">
             <button 
                onClick={() => setIsBulkCategoryModalOpen(true)}
                className="flex-1 py-3 flex items-center justify-center gap-2 bg-neutral-800 dark:bg-neutral-200/50 rounded-xl hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors font-medium text-sm"
             >
                <FolderInput size={18} />
                Categorize
             </button>
             <button 
                onClick={handleBulkDelete}
                className="flex-1 py-3 flex items-center justify-center gap-2 bg-red-600 rounded-xl hover:bg-red-700 transition-colors font-medium text-sm text-white"
             >
                <Trash2 size={18} />
                Delete ({selectedIds.size})
             </button>
          </div>
        </div>
      )}

      {/* Bulk Categorize Modal */}
      <Modal 
        isOpen={isBulkCategoryModalOpen} 
        onClose={() => setIsBulkCategoryModalOpen(false)} 
        title={`Move ${selectedIds.size} items`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <button
               onClick={() => handleBulkCategorize('')}
               className="w-full text-left p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm font-medium text-neutral-500 flex items-center gap-2 border border-dashed border-neutral-300 dark:border-neutral-700"
            >
               <X size={16} />
               Uncategorized / Clear
            </button>
            
            {expenseCategories.length > 0 && (
                <div>
                     <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-2">Expense</div>
                     {expenseCategories.map(c => (
                        <button
                            key={c.id}
                            onClick={() => handleBulkCategorize(c.name)}
                            className="w-full text-left p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm font-medium text-neutral-900 dark:text-white flex items-center gap-2"
                        >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                            {c.name}
                        </button>
                    ))}
                </div>
            )}

            {incomeCategories.length > 0 && (
                <div>
                     <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-2">Income</div>
                     {incomeCategories.map(c => (
                        <button
                            key={c.id}
                            onClick={() => handleBulkCategorize(c.name)}
                            className="w-full text-left p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm font-medium text-neutral-900 dark:text-white flex items-center gap-2"
                        >
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                            {c.name}
                        </button>
                    ))}
                </div>
            )}

            {categories.length === 0 && (
                <div className="text-center py-4 text-neutral-400 text-sm">No categories created yet.</div>
            )}
        </div>
      </Modal>
    </div>
  );
};
