import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { ChevronDown, ChevronRight, ListOrdered } from 'lucide-react';
import { Debt } from '../../types';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDebtModal = ({ isOpen, onClose }: AddDebtModalProps) => {
  const { debts, addDebt, categories } = useFinance();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Optional Details
  const [showDetails, setShowDetails] = useState(false);
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');

  const expenseCategories = categories ? categories.filter(c => c.type === 'expense') : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    const currentAmt = parseFloat(amount);
    if (isNaN(currentAmt)) return;

    let initAmt = parseFloat(initialAmount);
    if (isNaN(initAmt)) initAmt = currentAmt;
    if (initAmt < currentAmt) initAmt = currentAmt;

    const intRate = parseFloat(interestRate);
    const minPay = parseFloat(minimumPayment);
    const customPriority = parseInt(priority);

    // Default priority is end of list
    const finalPriority = !isNaN(customPriority) ? customPriority : debts.length;

    const debtData: Omit<Debt, 'id'> = {
        name,
        amount: currentAmt,
        initialAmount: initAmt,
        date: date,
        priority: finalPriority,
        interestRate: !isNaN(intRate) ? intRate : undefined,
        minimumPayment: !isNaN(minPay) ? minPay : undefined,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        category: category || undefined
    };

    addDebt(debtData);
    
    setName('');
    setAmount('');
    setInitialAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setInterestRate('');
    setMinimumPayment('');
    setDueDate('');
    setNotes('');
    setCategory('');
    setPriority('');
    setShowDetails(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Debt">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Debt Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Credit Card, Loan"
            className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium placeholder:text-neutral-400 text-neutral-900 dark:text-white"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Current Balance</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium placeholder:text-neutral-400 text-neutral-900 dark:text-white"
              required
            />
          </div>
        </div>

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

        {/* Collapsible Details Section */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors py-2"
            >
                {showDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                Advanced Details
            </button>

            {showDetails && (
                <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-200">
                    <div>
                        <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Original Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={initialAmount}
                                onChange={(e) => setInitialAmount(e.target.value)}
                                placeholder="Leave blank if same as current"
                                step="0.01"
                                className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
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
                                <input
                                    type="number"
                                    value={minimumPayment}
                                    onChange={(e) => setMinimumPayment(e.target.value)}
                                    placeholder="0"
                                    step="0.01"
                                    className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                                />
                            </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
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
                            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Priority Order</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                                    <ListOrdered size={16} />
                                </div>
                                <input
                                    type="number"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    placeholder={debts.length.toString()}
                                    className="w-full p-4 pl-10 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                                />
                            </div>
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Due Date</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
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

        <button
          type="submit"
          className="w-full py-4 mt-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
        >
          Add Debt
        </button>
      </form>
    </Modal>
  );
};