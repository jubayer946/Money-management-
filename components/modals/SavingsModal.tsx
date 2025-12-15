
import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { Trash2, Plus, Minus, ChevronLeft, Calendar, History, Wallet, ChevronRight } from 'lucide-react';
import { Saving } from '../../types';

interface SavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavingsModal: React.FC<SavingsModalProps> = ({ isOpen, onClose }) => {
  const { savings, addSaving, deleteSaving, savingTransactions, addSavingTransaction } = useFinance();
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  
  // Create New Goal State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  // Transaction Action State
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | null>(null);
  const [txAmount, setTxAmount] = useState('');

  const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);

  // Filter history for selected saving
  const history = selectedSaving 
    ? savingTransactions.filter(t => t.savingId === selectedSaving.id)
    : [];

  const handleAddGoal = () => {
    if (!name || !amount) return;
    addSaving({ name, amount: parseFloat(amount) });
    setName('');
    setAmount('');
  };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaving || !actionType || !txAmount) return;
    
    const val = parseFloat(txAmount);
    if (isNaN(val) || val <= 0) return;

    if (actionType === 'withdraw' && val > selectedSaving.amount) {
        alert("Insufficient funds in this goal");
        return;
    }

    addSavingTransaction({
        savingId: selectedSaving.id,
        type: actionType,
        amount: val,
        date: new Date().toISOString().split('T')[0]
    });

    setActionType(null);
    setTxAmount('');
  };

  const handleBack = () => {
    setSelectedSaving(null);
    setActionType(null);
    setTxAmount('');
  };

  const handleDelete = () => {
      if (selectedSaving) {
          deleteSaving(selectedSaving.id);
          handleBack();
      }
  };

  // Render content based on state
  const renderContent = () => {
    // === DETAIL VIEW ===
    if (selectedSaving) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button 
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h3 className="font-bold text-lg text-neutral-900 dark:text-white">{selectedSaving.name}</h3>
                    </div>
                    <button 
                        onClick={handleDelete}
                        className="p-2 -mr-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                {/* Big Balance */}
                <div className="text-center mb-8">
                    <div className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Current Balance</div>
                    <div className="text-5xl font-light tracking-tighter text-neutral-900 dark:text-white">
                        ${selectedSaving.amount.toLocaleString()}
                    </div>
                </div>

                {/* Action Buttons */}
                {!actionType && (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button 
                            onClick={() => setActionType('deposit')}
                            className="flex items-center justify-center gap-2 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                        >
                            <Plus size={18} />
                            Deposit
                        </button>
                        <button 
                            onClick={() => setActionType('withdraw')}
                            className="flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                            <Minus size={18} />
                            Withdraw
                        </button>
                    </div>
                )}

                {/* Transaction Input Form */}
                {actionType && (
                    <form onSubmit={handleTransaction} className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-2xl mb-8 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-3">
                            <span className={`text-xs font-bold uppercase tracking-wider ${actionType === 'deposit' ? 'text-green-600' : 'text-red-500'}`}>
                                {actionType === 'deposit' ? 'Add Money' : 'Withdraw Money'}
                            </span>
                            <button type="button" onClick={() => setActionType(null)} className="text-xs text-neutral-400 underline">Cancel</button>
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                value={txAmount}
                                onChange={(e) => setTxAmount(e.target.value)}
                                placeholder="Amount"
                                step="0.01"
                                className="flex-1 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none font-medium text-neutral-900 dark:text-white"
                                autoFocus
                            />
                            <button 
                                type="submit"
                                className={`px-4 rounded-xl font-bold text-white shadow-md transition-all ${actionType === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </form>
                )}

                {/* History List */}
                <div>
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <History size={14} className="text-neutral-400" />
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">History</h4>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {history.length === 0 ? (
                            <div className="text-center py-6 text-neutral-400 text-xs italic">No transactions yet</div>
                        ) : (
                            history.map(tx => (
                                <div key={tx.id} className="flex justify-between items-center p-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'}`}>
                                            {tx.type === 'deposit' ? <Plus size={14} /> : <Minus size={14} />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-neutral-900 dark:text-white capitalize">{tx.type}</div>
                                            <div className="text-[10px] text-neutral-400 font-medium">{tx.date}</div>
                                        </div>
                                    </div>
                                    <div className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-green-600 dark:text-green-500' : 'text-neutral-900 dark:text-white'}`}>
                                        {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // === LIST VIEW ===
    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
             <div className="bg-neutral-900 dark:bg-white p-6 rounded-2xl text-center mb-6 shadow-lg shadow-neutral-200 dark:shadow-none text-white dark:text-neutral-900">
                <div className="text-xs opacity-70 uppercase tracking-wider font-medium mb-1">Total Savings</div>
                <div className="text-4xl font-light tracking-tighter">${totalSavings.toLocaleString()}</div>
             </div>

             <div className="max-h-60 overflow-y-auto mb-6 pr-1 space-y-3">
                {savings.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400 text-sm border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-2xl">
                        Create your first savings goal below
                    </div>
                ) : (
                    savings.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => setSelectedSaving(s)}
                            className="flex justify-between items-center p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                                    <Wallet size={18} />
                                </div>
                                <div className="font-medium text-neutral-900 dark:text-white">{s.name}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-green-600 dark:text-green-500 font-bold">${s.amount.toLocaleString()}</div>
                                <ChevronRight size={16} className="text-neutral-300 dark:text-neutral-700" />
                            </div>
                        </div>
                    ))
                )}
             </div>

             <div className="flex gap-2 p-1 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="New goal name"
                    className="flex-1 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-white rounded-lg outline-none text-sm transition-all text-neutral-900 dark:text-white"
                />
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="$0.00"
                    step="0.01"
                    className="w-24 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-white rounded-lg outline-none text-sm transition-all text-neutral-900 dark:text-white"
                />
                <button
                    onClick={handleAddGoal}
                    disabled={!name || !amount}
                    className="px-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium shadow-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={20} />
                </button>
             </div>
        </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setSelectedSaving(null); }} title={selectedSaving ? "Goal Details" : "Savings"}>
      {renderContent()}
    </Modal>
  );
};
