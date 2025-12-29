
import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { Debt } from '../../types';
import { Trash2, DollarSign, History, Settings, Calendar, ListOrdered } from 'lucide-react';

interface EditDebtModalProps {
  debt: Debt | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export const EditDebtModal: React.FC<EditDebtModalProps> = ({ debt, isOpen, onClose, onDelete }) => {
  const { updateDebt, addTransaction, addDebtPayment, debtPayments, categories } = useFinance();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [date, setDate] = useState('');
  
  // Optional Details
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  
  // Payment specific state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [recordTransaction, setRecordTransaction] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  const expenseCategories = categories ? categories.filter(c => c.type === 'expense') : [];

  useEffect(() => {
    if (debt) {
      setName(debt.name);
      setAmount(debt.amount.toString());
      setInitialAmount(debt.initialAmount?.toString() || debt.amount.toString());
      setDate(debt.date || '');
      
      setInterestRate(debt.interestRate ? debt.interestRate.toString() : '');
      setMinimumPayment(debt.minimumPayment ? debt.minimumPayment.toString() : '');
      setDueDate(debt.dueDate || '');
      setNotes(debt.notes || '');
      setCategory(debt.category || '');
      setPriority(debt.priority?.toString() || '');

      setRecordTransaction(true);
      setPaymentAmount('');
      setActiveTab('details');
    }
  }, [debt, isOpen]);

  const handleQuickPayment = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!debt || !paymentAmount) return;
    
    const payAmt = parseFloat(paymentAmount);
    if (isNaN(payAmt) || payAmt <= 0) return;

    // Prevent negative debt
    const newAmount = Math.max(0, debt.amount - payAmt);
    const actualPayAmt = debt.amount - newAmount;

    if (actualPayAmt > 0) {
      // 1. Add Transaction
      addTransaction({
        type: 'expense',
        desc: `Debt Repayment: ${debt.name}`,
        amount: actualPayAmt,
        category: 'Debt',
        date: new Date().toISOString().split('T')[0]
      });

      // 2. Track Payment History
      addDebtPayment({
        debtId: debt.id,
        amount: actualPayAmt,
        date: new Date().toISOString().split('T')[0]
      });

      // 3. Update Debt
      updateDebt({
        ...debt,
        amount: newAmount
      });
    }

    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debt || !name || !amount) return;

    const currentAmount = parseFloat(amount);
    if (isNaN(currentAmount)) return;

    let initAmt = parseFloat(initialAmount);
    
    if (isNaN(initAmt) || initAmt < currentAmount) {
        initAmt = currentAmount;
    }

    if (currentAmount < debt.amount && recordTransaction) {
      const diff = debt.amount - currentAmount;
      if (diff > 0) {
        addTransaction({
            type: 'expense',
            desc: `Debt Repayment: ${name}`,
            amount: diff,
            category: 'Debt',
            date: new Date().toISOString().split('T')[0]
        });
        
        addDebtPayment({
            debtId: debt.id,
            amount: diff,
            date: new Date().toISOString().split('T')[0]
        });
      }
    }

    const intRate = parseFloat(interestRate);
    const minPay = parseFloat(minimumPayment);
    const pVal = parseInt(priority);

    // Dynamic object construction to avoid undefined values, using null to clear fields
    const debtData: any = {
      ...debt,
      name,
      amount: currentAmount,
      initialAmount: initAmt,
      interestRate: !isNaN(intRate) ? intRate : null,
      minimumPayment: !isNaN(minPay) ? minPay : null,
      dueDate: dueDate || null,
      notes: notes || null,
      category: category || null,
      date: date || null,
      priority: !isNaN(pVal) ? pVal : (debt.priority ?? 0)
    };

    updateDebt(debtData);
    onClose();
  };

  const isReducingBalance = debt && parseFloat(amount) < debt.amount;
  const currentHistory = debtPayments.filter(p => p.debtId === debt?.id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Debt">
      {/* Quick Payment Section - Only show if not fully paid */}
      {debt && debt.amount > 0 && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-900/30">
          <h3 className="text-xs font-bold text-green-800 dark:text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <DollarSign size={14} />
            Make a Payment
          </h3>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-medium">$</span>
              <input 
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="Amount"
                step="0.01"
                min="0.01"
                max={debt?.amount}
                className="w-full p-3 pl-8 bg-white dark:bg-neutral-900 border border-green-200 dark:border-green-800 focus:border-green-600 dark:focus:border-green-500 focus:ring-1 focus:ring-green-600 rounded-xl outline-none transition-all font-medium text-green-900 dark:text-green-400 placeholder:text-green-300 dark:placeholder:text-green-800"
              />
            </div>
            <button 
              onClick={handleQuickPayment}
              className="px-6 py-3 bg-green-600 dark:bg-green-500 text-white rounded-xl font-medium shadow-md hover:bg-green-700 dark:hover:bg-green-600 active:scale-95 transition-all"
            >
              Pay
            </button>
          </div>
          <p className="text-[10px] text-green-600/70 dark:text-green-400/70 mt-2 font-medium">
            Deducts from debt and records to history automatically.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
            activeTab === 'details' 
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <Settings size={14} />
          Details
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
            activeTab === 'history' 
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <History size={14} />
          History
        </button>
      </div>

      {activeTab === 'details' ? (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Debt Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Current</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full p-4 pl-8 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Original</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">$</span>
                  <input
                    type="number"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full p-4 pl-8 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                />
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
                        className="w-full p-4 pl-10 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                    />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Interest (%)</label>
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

          {isReducingBalance && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700">
              <input 
                type="checkbox" 
                id="recordTx"
                checked={recordTransaction}
                onChange={e => setRecordTransaction(e.target.checked)}
                className="w-5 h-5 rounded-md border-neutral-300 text-neutral-900 focus:ring-neutral-900" 
              />
              <label htmlFor="recordTx" className="text-xs font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                Record as payment in history
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 mt-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium shadow-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
          >
            Save Changes
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="w-full py-4 flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
          >
            <Trash2 size={18} />
            Delete Debt
          </button>
        </form>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[250px] max-h-[400px] overflow-y-auto pr-1">
          {currentHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-400 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-2xl">
              <History size={32} className="mb-2 opacity-20" />
              <div className="text-sm font-medium">No payments recorded</div>
            </div>
          ) : (
            <div className="space-y-3">
              {currentHistory.map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-sm">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-500">
                        <DollarSign size={18} />
                     </div>
                     <div>
                       <div className="text-sm font-bold text-neutral-900 dark:text-white">Payment</div>
                       <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                          <Calendar size={10} />
                          {new Date(payment.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                       </div>
                     </div>
                   </div>
                   <div className="font-bold text-green-600 dark:text-green-500">
                     -${payment.amount.toLocaleString()}
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};