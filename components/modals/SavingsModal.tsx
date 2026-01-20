
import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { Trash2, Plus, Minus, ChevronLeft, Calendar, History, Wallet, ChevronRight, ArrowRightLeft } from 'lucide-react';
import { Saving } from '../../types';

interface SavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavingsModal: React.FC<SavingsModalProps> = ({ isOpen, onClose }) => {
  const { savings, addSaving, deleteSaving, savingTransactions, addSavingTransaction, addTransaction, getBalance } = useFinance();
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  
  // Create New Goal State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  // Transaction Action State
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [isTransfer, setIsTransfer] = useState(true);

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
        alert("Insufficient funds in this vault");
        return;
    }

    if (actionType === 'deposit' && isTransfer) {
        const currentMain = getBalance();
        if (val > currentMain) {
            alert("Not enough spendable balance for this transfer");
            return;
        }
        // Record as expense in main balance
        addTransaction({
            type: 'expense',
            desc: `Transfer to Vault: ${selectedSaving.name}`,
            amount: val,
            category: 'Transfer',
            date: new Date().toISOString().split('T')[0]
        });
    } else if (actionType === 'withdraw' && isTransfer) {
        // Record as income in main balance
        addTransaction({
            type: 'income',
            desc: `Transfer from Vault: ${selectedSaving.name}`,
            amount: val,
            category: 'Transfer',
            date: new Date().toISOString().split('T')[0]
        });
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
    setIsTransfer(true);
  };

  const handleDelete = () => {
      if (selectedSaving) {
          if (selectedSaving.amount > 0 && confirm("Transfer remaining balance to Main before deleting?")) {
              addTransaction({
                  type: 'income',
                  desc: `Refund from Deleted Vault: ${selectedSaving.name}`,
                  amount: selectedSaving.amount,
                  category: 'Transfer',
                  date: new Date().toISOString().split('T')[0]
              });
          }
          deleteSaving(selectedSaving.id);
          handleBack();
      }
  };

  // Render content based on state
  const renderContent = () => {
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
                    <div className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Stored Value</div>
                    <div className="text-5xl font-light tracking-tighter text-neutral-900 dark:text-white">
                        ${selectedSaving.amount.toLocaleString()}
                    </div>
                </div>

                {/* Action Buttons */}
                {!actionType && (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button 
                            onClick={() => setActionType('deposit')}
                            className="flex items-center justify-center gap-2 py-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold rounded-2xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            Deposit
                        </button>
                        <button 
                            onClick={() => setActionType('withdraw')}
                            className="flex items-center justify-center gap-2 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                        >
                            <Minus size={18} />
                            Withdraw
                        </button>
                    </div>
                )}

                {/* Transaction Input Form */}
                {actionType && (
                    <form onSubmit={handleTransaction} className="bg-neutral-50 dark:bg-neutral-800 p-5 rounded-3xl mb-8 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-4">
                            <span className={`text-xs font-bold uppercase tracking-wider ${actionType === 'deposit' ? 'text-green-600' : 'text-red-500'}`}>
                                {actionType === 'deposit' ? 'Add Funds' : 'Remove Funds'}
                            </span>
                            <button type="button" onClick={() => setActionType(null)} className="text-xs text-neutral-400 font-medium">Cancel</button>
                        </div>
                        
                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                                <input 
                                    type="number" 
                                    value={txAmount}
                                    onChange={(e) => setTxAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    className="w-full p-4 pl-8 bg-white dark:bg-neutral-900 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 rounded-xl outline-none font-bold text-neutral-900 dark:text-white"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-700 mb-4 cursor-pointer" onClick={() => setIsTransfer(!isTransfer)}>
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isTransfer ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                                    <ArrowRightLeft size={14} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Transfer Mode</div>
                                    <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        {isTransfer ? (actionType === 'deposit' ? 'Deduct from Main' : 'Return to Main') : 'Vault adjustment only'}
                                    </div>
                                </div>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${isTransfer ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isTransfer ? 'left-6' : 'left-1'}`} />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${actionType === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                            Confirm {actionType}
                        </button>
                    </form>
                )}

                {/* History List */}
                <div>
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <History size={14} className="text-neutral-400" />
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Vault Activity</h4>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                        {history.length === 0 ? (
                            <div className="text-center py-10 text-neutral-400 text-xs italic border-2 border-dashed border-neutral-50 dark:border-neutral-800 rounded-2xl">No history found</div>
                        ) : (
                            history.map(tx => (
                                <div key={tx.id} className="flex justify-between items-center p-4 bg-white dark:bg-neutral-900 border border-neutral-50 dark:border-neutral-800 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                                            {tx.type === 'deposit' ? <Plus size={16} /> : <Minus size={16} />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-neutral-900 dark:text-white capitalize">{tx.type}</div>
                                            <div className="text-[10px] text-neutral-400 font-medium">{new Date(tx.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
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
             <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-3xl text-center mb-8 shadow-xl shadow-indigo-100 dark:shadow-none text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <Wallet className="w-full h-full rotate-12 scale-150" />
                </div>
                <div className="relative z-10">
                    <div className="text-xs opacity-70 uppercase tracking-widest font-bold mb-2">Secondary Wallets Total</div>
                    <div className="text-5xl font-light tracking-tighter">${totalSavings.toLocaleString()}</div>
                </div>
             </div>

             <div className="max-h-72 overflow-y-auto mb-8 pr-1 space-y-3 no-scrollbar">
                {savings.length === 0 ? (
                    <div className="text-center py-12 text-neutral-400 text-sm border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-3xl">
                        Create a secondary vault to store money safely
                    </div>
                ) : (
                    savings.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => setSelectedSaving(s)}
                            className="flex justify-between items-center p-5 bg-white dark:bg-neutral-900 border border-neutral-50 dark:border-neutral-800 rounded-3xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                                    <Wallet size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-neutral-900 dark:text-white text-sm">{s.name}</div>
                                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Vault Wallet</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">${s.amount.toLocaleString()}</div>
                                <ChevronRight size={18} className="text-neutral-300 dark:text-neutral-700" />
                            </div>
                        </div>
                    ))
                )}
             </div>

             <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-2xl space-y-2">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="New vault name"
                        className="flex-1 p-4 bg-white dark:bg-neutral-900 border-2 border-transparent focus:border-indigo-600 dark:focus:border-indigo-400 rounded-xl outline-none text-sm transition-all text-neutral-900 dark:text-white font-medium"
                    />
                    <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">$</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Initial"
                            step="0.01"
                            className="w-full p-4 pl-7 bg-white dark:bg-neutral-900 border-2 border-transparent focus:border-indigo-600 dark:focus:border-indigo-400 rounded-xl outline-none text-sm transition-all text-neutral-900 dark:text-white font-medium"
                        />
                    </div>
                </div>
                <button
                    onClick={handleAddGoal}
                    disabled={!name || !amount}
                    className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <Plus size={18} />
                    Create Vault
                </button>
             </div>
        </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setSelectedSaving(null); }} title={selectedSaving ? "Vault Management" : "Vaults & Wallets"}>
      {renderContent()}
    </Modal>
  );
};
