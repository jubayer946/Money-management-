
import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { TransactionType } from '../../types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'expense' | 'debt' | 'income';

const TABS: TabType[] = ['expense', 'debt', 'income'];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, addDebt, categories } = useFinance();
  const [activeTab, setActiveTab] = useState<TabType>('expense');
  
  // Transaction State
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Debt State
  const [initialAmount, setInitialAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showDebtDetails, setShowDebtDetails] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset Transaction Fields
      setDesc('');
      setAmount('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      
      // Reset Debt Fields
      setInitialAmount('');
      setInterestRate('');
      setMinimumPayment('');
      setDueDate('');
      setNotes('');
      setShowDebtDetails(false);
      
      // Default to expense
      setActiveTab('expense');
    }
  }, [isOpen]);

  // Safe access to categories
  const safeCategories = categories || [];
  const expenseCategories = safeCategories.filter(c => c.type === 'expense');
  const filteredCategories = activeTab === 'income' 
    ? safeCategories.filter(c => c.type === 'income')
    : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    if (activeTab === 'debt') {
        // Debt Submission
        if (!desc) return; // Name is required for debt

        // Parse optional numeric fields safely
        let initAmt = parseFloat(initialAmount);
        if (isNaN(initAmt)) initAmt = numAmount;
        
        // If initial amount is less than current amount (illogical for debt creation usually), default to current
        if (initAmt < numAmount) initAmt = numAmount;

        const intRate = parseFloat(interestRate);
        const minPay = parseFloat(minimumPayment);

        // Construct object dynamically to avoid undefined values which break Firebase
        const debtData: any = {
            name: desc,
            amount: numAmount,
            initialAmount: initAmt,
            date: date // Add date to debt
        };

        if (!isNaN(intRate)) debtData.interestRate = intRate;
        if (!isNaN(minPay)) debtData.minimumPayment = minPay;
        if (dueDate) debtData.dueDate = dueDate;
        if (notes) debtData.notes = notes;
        if (category) debtData.category = category;

        addDebt(debtData);

    } else {
        // Transaction Submission
        // Fallback logic: Description -> Category -> Type
        const finalDesc = desc.trim() || category || (activeTab === 'income' ? 'Income' : 'Expense');

        addTransaction({
            type: activeTab as TransactionType,
            desc: finalDesc,
            amount: numAmount,
            category,
            date
        });
    }
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New">
      <div className="flex gap-2 mb-6 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
             <button
             key={t}
             onClick={() => {
                setActiveTab(t);
                setCategory('');
             }}
             className={`flex-1 min-w-[80px] py-3 text-sm font-medium rounded-lg transition-all capitalize ${
               activeTab === t 
                 ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md' 
                 : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
             }`}
           >
             {t}
           </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Amount Field (Shared) */}
        <div>
          <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
            {activeTab === 'debt' ? 'Current Balance' : 'Amount'}
          </label>
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">$</span>
             <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="w-full p-4 pl-8 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
                required
                autoFocus
            />
          </div>
        </div>

        {/* Description / Name Field (Shared logic, different label) */}
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

        {/* Transaction Specific Fields */}
        {activeTab !== 'debt' && (
            <div>
                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Category</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                >
                    <option value="">Select...</option>
                    {filteredCategories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                </select>
            </div>
        )}

        {/* Date Field - Shared for all including Debt */}
        <div>
            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Date</label>
            <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                required
            />
        </div>

        {/* Debt Specific Fields (Collapsible) */}
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
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">$</span>
                                <input
                                    type="number"
                                    value={initialAmount}
                                    onChange={(e) => setInitialAmount(e.target.value)}
                                    placeholder="Leave blank if same as current"
                                    step="0.01"
                                    min="0.01"
                                    className="w-full p-4 pl-8 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium placeholder:text-neutral-400 text-neutral-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Interest Rate (%)</label>
                                <input
                                    type="number"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(e.target.value)}
                                    placeholder="0%"
                                    step="0.01"
                                    className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Min Payment</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">$</span>
                                    <input
                                        type="number"
                                        value={minimumPayment}
                                        onChange={(e) => setMinimumPayment(e.target.value)}
                                        placeholder="0"
                                        step="0.01"
                                        className="w-full p-4 pl-8 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                            >
                                <option value="">Select...</option>
                                {expenseCategories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Due Date</label>
                            <input
                                type="text"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                placeholder="e.g., 5th of month"
                                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Account number, login info, etc."
                                rows={3}
                                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium resize-none text-neutral-900 dark:text-white"
                            />
                        </div>
                    </div>
                )}
             </div>
        )}

        <button
          type="submit"
          className="w-full py-4 mt-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
        >
          {activeTab === 'debt' ? 'Add Debt' : 'Add Transaction'}
        </button>
      </form>
    </Modal>
  );
};
