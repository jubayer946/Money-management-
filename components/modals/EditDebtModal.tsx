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

export const EditDebtModal = ({ debt, isOpen, onClose, onDelete }: EditDebtModalProps) => {
  const { updateDebt, addTransaction, addDebtPayment, debtPayments, categories } = useFinance();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [date, setDate] = useState('');
  
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [recordTransaction, setRecordTransaction] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

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
      setPaymentAmount('');
      setActiveTab('details');
    }
  }, [debt, isOpen]);

  const handleQuickPayment = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!debt || !paymentAmount) return;
    const payAmt = parseFloat(paymentAmount);
    if (isNaN(payAmt) || payAmt <= 0) return;

    const newAmount = Math.max(0, debt.amount - payAmt);
    const actualPayAmt = debt.amount - newAmount;

    if (actualPayAmt > 0) {
      addTransaction({ type: 'expense', desc: `Repayment: ${debt.name}`, amount: actualPayAmt, category: 'Debt', date: new Date().toISOString().split('T')[0] });
      addDebtPayment({ debtId: debt.id, amount: actualPayAmt, date: new Date().toISOString().split('T')[0] });
      updateDebt({ ...debt, amount: newAmount });
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debt || !name || !amount) return;

    const currentAmount = parseFloat(amount);
    if (isNaN(currentAmount)) return;
    let initAmt = parseFloat(initialAmount);
    if (isNaN(initAmt) || initAmt < currentAmount) initAmt = currentAmount;

    const intRate = parseFloat(interestRate);
    const minPay = parseFloat(minimumPayment);
    const pVal = parseInt(priority);

    updateDebt({
      ...debt, name, amount: currentAmount, initialAmount: initAmt,
      interestRate: !isNaN(intRate) ? intRate : undefined,
      minimumPayment: !isNaN(minPay) ? minPay : undefined,
      dueDate: dueDate || undefined, notes: notes || undefined,
      category: category || undefined, date: date || undefined,
      priority: !isNaN(pVal) ? pVal : (debt.priority ?? 0)
    } as Debt);
    onClose();
  };

  const currentHistory = debtPayments.filter(p => p.debtId === debt?.id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Debt">
      {debt && debt.amount > 0 && (
        <div className="mb-8 bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[32px] border border-emerald-100 dark:border-emerald-800/50 shadow-sm transition-colors">
          <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <DollarSign size={14} strokeWidth={3} /> Quick Payment
          </h3>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input 
                type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                placeholder="0.00" step="0.01" min="0.01" max={debt?.amount}
                className="w-full p-4 bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-700/50 rounded-2xl outline-none font-bold text-emerald-900 dark:text-white placeholder:text-emerald-200"
              />
            </div>
            <button onClick={handleQuickPayment} className="px-8 py-4 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-200/50 dark:shadow-none active:scale-95 transition-all">Pay</button>
          </div>
        </div>
      )}

      <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl mb-8">
        <button onClick={() => setActiveTab('details')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'details' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-600' : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700'}`}><Settings size={14} />Details</button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${activeTab === 'history' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-600' : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700'}`}><History size={14} />History</button>
      </div>

      {activeTab === 'details' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-1">Debt Identity</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl outline-none focus:border-neutral-900 dark:focus:border-neutral-500 font-bold text-neutral-900 dark:text-white" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-1">Remaining</label>
                  <div className="relative">
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.01" min="0" className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl font-bold text-neutral-900 dark:text-white" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-1">Original</label>
                  <div className="relative">
                    <input type="number" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} step="0.01" min="0" className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl font-bold text-neutral-900 dark:text-white" />
                  </div>
                </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl font-bold text-neutral-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 px-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context..." rows={3} className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl font-bold resize-none text-neutral-900 dark:text-white" />
            </div>
          </div>
          <div className="pt-4 space-y-3">
            <button type="submit" className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-xl hover:opacity-90 active:scale-95 transition-all">Update Debt</button>
            <button type="button" onClick={() => { if(window.confirm('Delete records?')) { onDelete(); onClose(); } }} className="w-full py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-[24px] hover:bg-red-100 transition-all"><Trash2 size={16} />Delete Records</button>
          </div>
        </form>
      ) : (
        <div className="min-h-[300px] max-h-[500px] overflow-y-auto no-scrollbar pb-10">
          {currentHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-300 dark:text-neutral-700 border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-[32px]"><History size={40} strokeWidth={1} className="mb-4" /><div className="text-[10px] font-black uppercase tracking-widest">Empty History</div></div>
          ) : (
            <div className="space-y-3">
              {currentHistory.map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-5 bg-white dark:bg-neutral-800/50 border border-neutral-50 dark:border-neutral-800 rounded-3xl shadow-sm">
                   <div className="flex items-center gap-4">
                     <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><DollarSign size={20} strokeWidth={2.5} /></div>
                     <div>
                       <div className="text-sm font-bold text-neutral-900 dark:text-white">Payment Made</div>
                       <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-widest"><Calendar size={10} />{new Date(payment.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                     </div>
                   </div>
                   <div className="font-black text-neutral-900 dark:text-emerald-400">{payment.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};