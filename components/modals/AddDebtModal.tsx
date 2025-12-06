import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({ isOpen, onClose }) => {
  const { addDebt } = useFinance();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  
  // Optional Details
  const [showDetails, setShowDetails] = useState(false);
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    const currentAmt = parseFloat(amount);
    // If initial amount is not provided or is less than current amount, default to current amount
    const initAmt = initialAmount ? parseFloat(initialAmount) : currentAmt;
    const finalInitAmt = initAmt < currentAmt ? currentAmt : initAmt;

    addDebt({
      name,
      amount: currentAmt,
      initialAmount: finalInitAmt,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      minimumPayment: minimumPayment ? parseFloat(minimumPayment) : undefined,
      dueDate: dueDate || undefined,
      notes: notes || undefined
    });
    
    setName('');
    setAmount('');
    setInitialAmount('');
    setInterestRate('');
    setMinimumPayment('');
    setDueDate('');
    setNotes('');
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
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="w-full p-4 pl-8 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium placeholder:text-neutral-400 text-neutral-900 dark:text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Original Amount (Optional)</label>
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

        {/* Collapsible Details Section */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2">
            <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors py-2"
            >
                {showDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                Optional Details
            </button>

            {showDetails && (
                <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-200">
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