
import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { TransactionType } from '../../types';
import { ChevronDown, ChevronRight, Plus, Layers, Trash2, ArrowUp, ArrowDown, Repeat, Calendar } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'expense' | 'debt' | 'income' | 'multiple';

const TABS: TabType[] = ['multiple', 'expense', 'debt', 'income'];

interface BatchItem {
  id: string;
  type: TransactionType;
  amount: number;
  desc: string;
  category: string;
  date: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, addDebt, addRecurringTransaction, categories } = useFinance();
  const [activeTab, setActiveTab] = useState<TabType>('expense');
  
  // Transaction State
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  
  // Initialize date with local YYYY-MM-DD
  const [date, setDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  
  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  
  // Calculator State
  const [calcAmount, setCalcAmount] = useState('');

  // Debt State
  const [initialAmount, setInitialAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showDebtDetails, setShowDebtDetails] = useState(false);

  // Batch State
  const [batchList, setBatchList] = useState<BatchItem[]>([]);
  const [batchType, setBatchType] = useState<TransactionType>('expense');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset Transaction Fields
      setDesc('');
      setAmount('');
      setCategory('');
      
      // Reset Date to local today
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      setDate(`${y}-${m}-${d}`);

      setCalcAmount('');
      
      // Reset Recurring
      setIsRecurring(false);
      setFrequency('monthly');
      
      // Reset Debt Fields
      setInitialAmount('');
      setInterestRate('');
      setMinimumPayment('');
      setDueDate('');
      setNotes('');
      setShowDebtDetails(false);
      
      // Reset Batch
      setBatchList([]);
      setBatchType('expense');
      
      // Default to expense (or keep persistent if preferred, but user requested Multiple first usually implies reset)
      setActiveTab('multiple'); // Default to multiple as requested by order
    }
  }, [isOpen]);

  // Safe access to categories
  const safeCategories = categories || [];
  
  const currentType = activeTab === 'multiple' ? batchType : (activeTab === 'debt' ? 'expense' : activeTab as TransactionType);
  
  const filteredCategories = safeCategories.filter(c => c.type === currentType);

  const handleCalcAdd = () => {
    if (!calcAmount) return;
    const val = parseFloat(calcAmount);
    if (isNaN(val)) return;
    
    const current = parseFloat(amount) || 0;
    const newVal = current + val;
    setAmount(Number.isInteger(newVal) ? newVal.toString() : newVal.toFixed(2));
    setCalcAmount('');
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
      
      if (finalAmount <= 0) return;

      const finalDesc = desc.trim() || category || (batchType === 'income' ? 'Income' : 'Expense');
      
      const newItem: BatchItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: batchType,
          amount: finalAmount,
          desc: finalDesc,
          category,
          date
      };

      setBatchList([...batchList, newItem]);
      
      // Reset fields for next item
      setAmount('');
      setCalcAmount('');
      setDesc('');
      // Keep category and date for convenience
      setCategory('');
  };

  const removeBatchItem = (id: string) => {
      setBatchList(batchList.filter(item => item.id !== id));
  };

  const handleBatchSave = () => {
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
    
    // Calculate final amount including pending calculator value
    let finalAmount = parseFloat(amount);
    if (isNaN(finalAmount)) finalAmount = 0;
    
    if (calcAmount) {
        const addVal = parseFloat(calcAmount);
        if (!isNaN(addVal)) {
            finalAmount += addVal;
        }
    }

    if (finalAmount <= 0) return;
    const numAmount = finalAmount;

    if (activeTab === 'debt') {
        if (!desc) return; 

        let initAmt = parseFloat(initialAmount);
        if (isNaN(initAmt)) initAmt = numAmount;
        if (initAmt < numAmount) initAmt = numAmount;

        const intRate = parseFloat(interestRate);
        const minPay = parseFloat(minimumPayment);

        const debtData: any = {
            name: desc,
            amount: numAmount,
            initialAmount: initAmt,
            date: date
        };

        if (!isNaN(intRate)) debtData.interestRate = intRate;
        if (!isNaN(minPay)) debtData.minimumPayment = minPay;
        if (dueDate) debtData.dueDate = dueDate;
        if (notes) debtData.notes = notes;
        if (category) debtData.category = category;

        addDebt(debtData);

    } else {
        const finalDesc = desc.trim() || category || (activeTab === 'income' ? 'Income' : 'Expense');

        if (isRecurring) {
            addRecurringTransaction({
                type: activeTab as TransactionType,
                desc: finalDesc,
                amount: numAmount,
                category,
                startDate: date,
                frequency,
            });
        } else {
            addTransaction({
                type: activeTab as TransactionType,
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
        
        {/* Batch Type Toggle */}
        {isBatchMode && (
            <div className="flex gap-2 mb-2">
                <button
                    type="button"
                    onClick={() => setBatchType('expense')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${batchType === 'expense' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800' : 'bg-transparent border-transparent text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                >
                    Expense
                </button>
                <button
                    type="button"
                    onClick={() => setBatchType('income')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${batchType === 'income' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 dark:border-green-800' : 'bg-transparent border-transparent text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                >
                    Income
                </button>
            </div>
        )}

        {/* Amount Field (Shared) */}
        <div>
          <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
            {activeTab === 'debt' ? 'Current Balance' : 'Amount'}
          </label>
          <div className="flex gap-3">
              <div className="relative flex-1">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">$</span>
                 <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className="w-full p-4 pl-8 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
                    required={!isBatchMode && !calcAmount && !amount} 
                    autoFocus
                />
              </div>
              
              {/* Calculator Input */}
              <div className="relative w-24 sm:w-28">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Plus size={16} />
                 </div>
                 <input 
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    onKeyDown={handleCalcKeyDown}
                    placeholder="Add"
                    className="w-full p-4 pl-9 bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm"
                 />
              </div>
          </div>
        </div>

        {/* Description */}
        <div>
            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                {activeTab === 'debt' ? 'Debt Name' : 'Description'} 
                {activeTab !== 'debt' && <span className="text-neutral-300 dark:text-neutral-600 font-normal normal-case"> (optional)</span>}
            </label>
            <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={activeTab === 'debt' ? "e.g. Credit Card" : (category ? `Defaults to: ${category}` : "What is this for?")}
                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
                required={activeTab === 'debt'}
            />
        </div>

        {/* Category */}
        {activeTab !== 'debt' && (
            <div>
                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Category</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white text-sm"
                >
                    <option value="">Select...</option>
                    {filteredCategories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                </select>
            </div>
        )}

        {/* Date */}
        <div>
            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Calendar size={10} /> Date
            </label>
            <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                required
            />
        </div>

        {/* Recurring Toggle (Not for Multiple or Debt) */}
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

        {/* Debt Specifics */}
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
                         <input type="text" value={dueDate} onChange={e => setDueDate(e.target.value)} placeholder="Due Date" className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl outline-none text-neutral-900 dark:text-white" />
                         <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" rows={3} className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl outline-none resize-none text-neutral-900 dark:text-white" />
                    </div>
                )}
             </div>
        )}

        {/* Buttons */}
        {isBatchMode ? (
            <div className="space-y-4">
                <button
                    type="submit"
                    className="w-full py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-bold shadow-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    Add to Batch
                </button>

                {/* Staged Items List */}
                {batchList.length > 0 && (
                    <div className="space-y-2 mt-4">
                        <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest px-1">
                            Staged ({batchList.length})
                        </div>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                            {batchList.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-sm animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                            {item.type === 'income' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-neutral-900 dark:text-white">{item.desc}</div>
                                            <div className="text-[10px] text-neutral-500">
                                                {item.category}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-sm text-neutral-900 dark:text-white">${item.amount.toLocaleString()}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => removeBatchItem(item.id)}
                                            className="text-neutral-400 hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Floating Action Button for Saving Batch */}
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
            className="w-full py-4 mt-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
            >
            {activeTab === 'debt' ? 'Add Debt' : 'Add Transaction'}
            </button>
        )}
      </form>
    </Modal>
  );
};
