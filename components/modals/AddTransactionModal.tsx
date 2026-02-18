import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { TransactionType, Debt } from '../../types';
import { ChevronDown, ChevronRight, Plus, Layers, Trash2, ArrowUp, ArrowDown, Repeat, Calendar, AlertCircle, Edit2, Check, X, RotateCcw } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'expense' | 'debt' | 'income' | 'multiple';
type IncomeExpense = Extract<TabType, 'income' | 'expense'>;

const TABS: TabType[] = ['multiple', 'expense', 'debt', 'income'];

interface BatchItem {
  id: string;
  type: TransactionType;
  amount: number;
  desc: string;
  category: string;
  date: string;
}

interface LastAction {
  type: 'add' | 'delete';
  item: BatchItem;
}

interface BatchItemRowProps {
  item: BatchItem;
  categories: any[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<BatchItem>) => void;
}

const BatchItemRow: React.FC<BatchItemRowProps> = ({ 
    item, 
    categories,
    onRemove, 
    onUpdate 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editDesc, setEditDesc] = useState(item.desc);
    const [editAmount, setEditAmount] = useState(item.amount.toString());
    const [editCategory, setEditCategory] = useState(item.category);
    const [quickAdd, setQuickAdd] = useState('');
    const [rowError, setRowError] = useState(false);

    const filteredCats = categories.filter(c => c.type === item.type);

    const handleQuickAdd = () => {
        const val = parseFloat(quickAdd);
        if (!isNaN(val) && val !== 0) {
            if (item.amount + val <= 0) {
                setRowError(true);
                setTimeout(() => setRowError(false), 2000);
                return;
            }
            onUpdate(item.id, { amount: item.amount + val });
            setQuickAdd('');
        }
    };

    const handleSaveEdit = () => {
        const amt = parseFloat(editAmount);
        if (isNaN(amt) || amt <= 0 || !editDesc.trim()) {
            setRowError(true);
            setTimeout(() => setRowError(false), 2000);
            return;
        }
        onUpdate(item.id, {
            desc: editDesc,
            amount: amt,
            category: editCategory
        });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex flex-col p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-2xl shadow-sm animate-in zoom-in-95 duration-200">
                <div className="space-y-3">
                    <input 
                        type="text" 
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        placeholder="Description"
                        className="w-full h-9 px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold outline-none text-neutral-900 dark:text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input 
                            type="number" 
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                            placeholder="Amount"
                            step="0.01"
                            className="w-full h-9 px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold outline-none text-neutral-900 dark:text-white"
                        />
                        <select 
                            value={editCategory}
                            onChange={e => setEditCategory(e.target.value)}
                            className="w-full h-9 px-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-bold outline-none text-neutral-900 dark:text-white"
                        >
                            <option value="">No Category</option>
                            {filteredCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={handleSaveEdit} className="flex-1 h-9 flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                            <Check size={14} strokeWidth={3} /> Save
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} className="w-12 h-9 flex items-center justify-center bg-white dark:bg-neutral-800 text-neutral-400 rounded-xl border border-neutral-100 dark:border-neutral-700">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-sm animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {item.type === 'income' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate max-w-[150px]">{item.desc}</div>
                        <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">
                            {item.category || 'No Category'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm whitespace-nowrap transition-colors ${rowError ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
                        {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1 ml-2">
                        <button 
                            type="button" 
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 text-neutral-300 hover:text-indigo-500 transition-colors"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button 
                            type="button" 
                            onClick={() => onRemove(item.id)}
                            className="p-1.5 text-neutral-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 pl-11">
                <div className="relative flex-1">
                   <div className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px] font-bold">+</div>
                   <input 
                      type="number" 
                      value={quickAdd}
                      onChange={(e) => {
                          setQuickAdd(e.target.value);
                          setRowError(false);
                      }}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                              e.preventDefault();
                              handleQuickAdd();
                          }
                      }}
                      placeholder="Adjust..."
                      className={`w-full h-8 pl-6 pr-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-xs outline-none transition-all text-neutral-900 dark:text-white placeholder:text-neutral-400 ${rowError ? 'border-red-300 dark:border-red-900' : 'border-neutral-200 dark:border-neutral-700 focus:border-neutral-400 dark:focus:border-neutral-500'}`}
                   />
                </div>
                {quickAdd && (
                    <button
                        type="button"
                        onClick={handleQuickAdd}
                        className="h-8 px-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm hover:opacity-90 transition-opacity"
                    >
                        {parseFloat(quickAdd) < 0 ? 'Sub' : 'Add'}
                    </button>
                )}
            </div>
        </div>
    );
};

export const AddTransactionModal = ({ isOpen, onClose }: AddTransactionModalProps) => {
  const { addTransaction, addDebt, addRecurringTransaction, categories } = useFinance();
  const [activeTab, setActiveTab] = useState<TabType>('multiple');
  
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [date, setDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  
  const [calcAmount, setCalcAmount] = useState('');

  const [initialAmount, setInitialAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showDebtDetails, setShowDebtDetails] = useState(false);

  // Batch Specific State
  const [batchList, setBatchList] = useState<BatchItem[]>([]);
  const [batchType, setBatchType] = useState<TransactionType>('expense');
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDesc('');
      setAmount('');
      setCategory('');
      setError(null);
      
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      setDate(`${y}-${m}-${d}`);

      setCalcAmount('');
      setIsRecurring(false);
      setFrequency('monthly');
      setInitialAmount('');
      setInterestRate('');
      setMinimumPayment('');
      setDueDate('');
      setNotes('');
      setShowDebtDetails(false);
      setBatchList([]);
      setBatchType('expense');
      setActiveTab('multiple'); 
      setLastAction(null);
    }
  }, [isOpen]);

  // Clean up timer on unmount
  useEffect(() => {
      return () => {
          if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      };
  }, []);

  const triggerUndoFeedback = (action: LastAction) => {
      setLastAction(action);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
          setLastAction(null);
      }, 6000); // 6 seconds undo window
  };

  const currentType: TransactionType = 
    activeTab === 'multiple' 
      ? batchType 
      : activeTab === 'debt' 
        ? 'expense' 
        : (activeTab as IncomeExpense);
  
  const filteredCategories = (categories || []).filter(c => c.type === currentType);

  const handleCalcAdd = () => {
    if (!calcAmount) return;
    const val = parseFloat(calcAmount);
    if (isNaN(val)) return;
    
    const current = parseFloat(amount) || 0;
    const newVal = current + val;
    setAmount(Number.isInteger(newVal) ? newVal.toString() : newVal.toFixed(2));
    setCalcAmount('');
    setError(null);
  };

  const handleCalcKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalcAdd();
    }
  };

  const handleAddToBatch = (e: React.FormEvent) => {
      e.preventDefault();
      let finalAmount = parseFloat(amount);
      if (isNaN(finalAmount)) finalAmount = 0;
      if (calcAmount) {
          const addVal = parseFloat(calcAmount);
          if (!isNaN(addVal)) finalAmount += addVal;
      }
      
      if (finalAmount <= 0) {
          setError('Amount must be greater than zero.');
          return;
      }

      const finalDesc = desc.trim() || category || (batchType === 'income' ? 'Income' : 'Expense');
      
      const newItem: BatchItem = {
          id: Math.random().toString(36).slice(2, 11),
          type: batchType,
          amount: finalAmount,
          desc: finalDesc,
          category,
          date
      };

      setBatchList(prev => [...prev, newItem]);
      triggerUndoFeedback({ type: 'add', item: newItem });
      
      setAmount('');
      setCalcAmount('');
      setDesc('');
      setCategory('');
      setError(null);
  };

  const removeBatchItem = (id: string) => {
      const item = batchList.find(i => i.id === id);
      if (item) {
          setBatchList(prev => prev.filter(i => i.id !== id));
          triggerUndoFeedback({ type: 'delete', item });
      }
  };

  const updateBatchItem = (id: string, updates: Partial<BatchItem>) => {
    setBatchList(prev => prev.map(item => {
        if (item.id === id) {
            return { ...item, ...updates };
        }
        return item;
    }));
  };

  const handleUndo = () => {
      if (!lastAction) return;
      if (lastAction.type === 'add') {
          // Remove the added item
          setBatchList(prev => prev.filter(i => i.id !== lastAction.item.id));
      } else if (lastAction.type === 'delete') {
          // Put the deleted item back
          setBatchList(prev => [...prev, lastAction.item]);
      }
      setLastAction(null);
  };

  const batchTotals = useMemo(() => {
    const totalIncome = batchList
        .filter(i => i.type === 'income')
        .reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = batchList
        .filter(i => i.type === 'expense')
        .reduce((sum, i) => sum + i.amount, 0);
    const net = totalIncome - totalExpense;
    return { totalIncome, totalExpense, net };
  }, [batchList]);

  const handleBatchSave = () => {
      if (batchList.length === 0) return;
      batchList.forEach(item => {
          addTransaction({
              type: item.type,
              desc: item.desc,
              amount: item.amount,
              category: item.category,
              date: item.date
          });
      });
      onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalAmount = parseFloat(amount);
    if (isNaN(finalAmount)) finalAmount = 0;
    
    if (calcAmount) {
        const addVal = parseFloat(calcAmount);
        if (!isNaN(addVal)) {
            finalAmount += addVal;
        }
    }

    if (finalAmount <= 0) {
        setError('Please enter a valid amount.');
        return;
    }
    const numAmount = finalAmount;

    if (activeTab === 'debt') {
        if (!desc) {
            setError('Debt name is required.');
            return;
        }

        let initAmt = parseFloat(initialAmount);
        if (isNaN(initAmt)) initAmt = numAmount;
        if (initAmt < numAmount) initAmt = numAmount;

        const intRate = parseFloat(interestRate);
        const minPay = parseFloat(minimumPayment);

        const debtData: Omit<Debt, 'id'> = {
            name: desc,
            amount: numAmount,
            initialAmount: initAmt,
            date: date,
            interestRate: !isNaN(intRate) ? intRate : undefined,
            minimumPayment: !isNaN(minPay) ? minPay : undefined,
            dueDate: dueDate || undefined,
            notes: notes || undefined,
            category: category || undefined
        };

        addDebt(debtData);
    } else {
        const transactionTab: IncomeExpense | null = 
            activeTab === 'income' || activeTab === 'expense' ? activeTab : null;
        
        if (!transactionTab) return;

        const finalDesc = desc.trim() || category || (transactionTab === 'income' ? 'Income' : 'Expense');

        if (isRecurring) {
            addRecurringTransaction({
                type: transactionTab,
                desc: finalDesc,
                amount: numAmount,
                category,
                startDate: date,
                frequency,
            });
        } else {
            addTransaction({
                type: transactionTab,
                desc: finalDesc,
                amount: numAmount,
                category,
                date
            });
        }
    }
    
    onClose();
  };

  const isBatchMode = activeTab === 'multiple';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isBatchMode ? "Add Multiple" : "Add New"}>
      <div className="flex gap-2 mb-6 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
             <button
             key={t}
             onClick={() => {
                setActiveTab(t);
                setCategory('');
                setError(null);
                setLastAction(null);
             }}
             className={`flex-1 min-w-[80px] py-3 text-xs sm:text-sm font-medium rounded-lg transition-all capitalize ${
               activeTab === t 
                 ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md' 
                 : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
             }`}
           >
             {t === 'multiple' ? 'Multiple' : t}
           </button>
        ))}
      </div>

      <form onSubmit={isBatchMode ? handleAddToBatch : handleSubmit} className="space-y-4 pb-20 sm:pb-0">
        
        {isBatchMode && (
            <div className="flex gap-2 mb-2">
                <button
                    type="button"
                    onClick={() => { setBatchType('expense'); setError(null); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${batchType === 'expense' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800' : 'bg-transparent border-transparent text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                >
                    Expense
                </button>
                <button
                    type="button"
                    onClick={() => { setBatchType('income'); setError(null); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${batchType === 'income' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800' : 'bg-transparent border-transparent text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                >
                    Income
                </button>
            </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
            {activeTab === 'debt' ? 'Current Balance' : 'Amount'}
          </label>
          <div className="flex gap-3">
              <div className="relative flex-1">
                 <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(null); }}
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className={`w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 ${error ? 'border-red-200 dark:border-red-900/50' : 'border-transparent'}`}
                    required={!isBatchMode && !calcAmount && !amount} 
                    autoFocus
                />
              </div>
              
              <div className="relative w-24 sm:w-28">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Plus size={16} />
                 </div>
                 <input 
                    type="number"
                    value={calcAmount}
                    onChange={(e) => { setCalcAmount(e.target.value); setError(null); }}
                    onKeyDown={handleCalcKeyDown}
                    placeholder="Add"
                    className="w-full p-4 pl-9 bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm"
                 />
              </div>
          </div>
        </div>

        <div>
            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                {activeTab === 'debt' ? 'Debt Name' : 'Description'} 
                {activeTab !== 'debt' && <span className="text-neutral-300 dark:text-neutral-600 font-normal normal-case"> (optional)</span>}
            </label>
            <input
                type="text"
                value={desc}
                onChange={(e) => { setDesc(e.target.value); setError(null); }}
                placeholder={activeTab === 'debt' ? "e.g. Credit Card" : (category ? `Defaults to: ${category}` : "What is this for?")}
                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
                required={activeTab === 'debt'}
            />
        </div>

        <div>
            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                {activeTab === 'debt' ? 'Debt Category (optional)' : 'Category'}
            </label>
            <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setError(null); }}
                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white text-sm"
            >
                <option value="">{activeTab === 'debt' ? 'No category' : 'Select...'}</option>
                {filteredCategories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
                ))}
            </select>
        </div>

        <div>
            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Calendar size={10} /> Date
            </label>
            <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setError(null); }}
                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                required
            />
        </div>

        {!isBatchMode && activeTab !== 'debt' && (
             <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                        <Repeat size={16} />
                        <span className="text-sm font-medium">Repeat this transaction?</span>
                    </div>
                    <div 
                        onClick={() => setIsRecurring(!isRecurring)}
                        className={`w-11 h-6 rounded-full flex items-center transition-colors cursor-pointer p-1 ${isRecurring ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white dark:bg-neutral-900 shadow-sm transition-transform ${isRecurring ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </div>
                
                {isRecurring && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Frequency</label>
                        <div className="flex gap-2">
                             {['daily', 'weekly', 'monthly', 'yearly'].map(freq => (
                                 <button
                                    key={freq}
                                    type="button"
                                    onClick={() => setFrequency(freq as any)}
                                    className={`flex-1 py-2 text-xs font-semibold capitalize rounded-lg border transition-all ${
                                        frequency === freq 
                                            ? 'bg-white dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-white shadow-sm' 
                                            : 'border-transparent text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                    }`}
                                 >
                                    {freq}
                                 </button>
                             ))}
                        </div>
                    </div>
                )}
             </div>
        )}

        {activeTab === 'debt' && (
             <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2">
                <button
                    type="button"
                    onClick={() => setShowDebtDetails(!showDebtDetails)}
                    className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors py-2"
                >
                    {showDebtDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    Optional Details
                </button>

                {showDebtDetails && (
                    <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-200">
                         <div>
                            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Original Amount</label>
                            <input
                                type="number"
                                value={initialAmount}
                                onChange={(e) => setInitialAmount(e.target.value)}
                                placeholder="Leave blank if same as current"
                                step="0.01"
                                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent rounded-xl outline-none text-neutral-900 dark:text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="Interest %" className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl outline-none text-neutral-900 dark:text-white" />
                            <input type="number" value={minimumPayment} onChange={e => setMinimumPayment(e.target.value)} placeholder="Min Payment" className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl outline-none text-neutral-900 dark:text-white" />
                        </div>
                         <div>
                            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Due Date</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl outline-none text-neutral-900 dark:text-white" />
                         </div>
                         <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" rows={3} className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl outline-none resize-none text-neutral-900 dark:text-white" />
                    </div>
                )}
             </div>
        )}

        {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 animate-in slide-in-from-top-1">
                <AlertCircle size={14} />
                {error}
            </div>
        )}

        {isBatchMode ? (
            <div className="space-y-4">
                <button
                    type="submit"
                    className="w-full py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-bold shadow-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    Add to Batch
                </button>

                {batchList.length > 0 && (
                    <div className="space-y-2 mt-4 relative">
                        <div className="flex justify-between items-center px-1 mb-2">
                             <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                                Staged ({batchList.length})
                            </div>
                            {lastAction && (
                                <button 
                                    type="button" 
                                    onClick={handleUndo}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-right-4 transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                >
                                    <RotateCcw size={10} strokeWidth={3} />
                                    Undo {lastAction.type === 'add' ? 'Add' : 'Delete'}
                                </button>
                            )}
                        </div>
                        
                        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 no-scrollbar pb-2">
                            {batchList.map(item => (
                                <BatchItemRow 
                                    key={item.id} 
                                    item={item} 
                                    categories={categories}
                                    onRemove={removeBatchItem} 
                                    onUpdate={updateBatchItem} 
                                />
                            ))}
                        </div>

                        {/* Batch Totals Summary */}
                        <div className="mt-1 p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-2xl animate-in fade-in duration-300">
                             <div className="grid grid-cols-3 gap-2">
                                <div className="text-center">
                                    <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Income</div>
                                    <div className="text-xs font-black text-green-600 dark:text-green-500">
                                        +{batchTotals.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="text-center border-x border-neutral-200 dark:border-neutral-700">
                                    <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Expense</div>
                                    <div className="text-xs font-black text-red-500">
                                        -{batchTotals.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Net</div>
                                    <div className={`text-xs font-black ${batchTotals.net >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>
                                        {batchTotals.net >= 0 ? '+' : ''}{batchTotals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                             </div>
                        </div>
                        
                        <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent">
                            <button
                                type="button"
                                onClick={handleBatchSave}
                                className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium shadow-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Layers size={18} />
                                Save All ({batchList.length})
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <button
            type="submit"
            className={`w-full py-4 mt-4 text-white dark:text-neutral-900 rounded-xl font-medium shadow-lg transition-all ${error ? 'bg-neutral-400 dark:bg-neutral-600 cursor-not-allowed' : 'bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200'}`}
            >
            {activeTab === 'debt' ? 'Add Debt' : 'Add Transaction'}
            </button>
        )}
      </form>
    </Modal>
  );
};