

import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { Trash2, Plus, Wallet as WalletIcon, Smartphone, Building2, Circle } from 'lucide-react';
import { Wallet } from '../../types';

interface WalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#0ea5e9', // Sky
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#f97316', // Orange
    '#ef4444', // Red
    '#ec4899', // Pink
];

export const WalletsModal: React.FC<WalletsModalProps> = ({ isOpen, onClose }) => {
  const { wallets, addWallet, deleteWallet, getWalletBalance } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<Wallet['type']>('digital');
  const [color, setColor] = useState(COLORS[0]);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    addWallet({ name, type, color });
    setName('');
    setShowAddForm(false);
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
  };

  const getIcon = (type: Wallet['type']) => {
      switch(type) {
          case 'digital': return <Smartphone size={18} />;
          case 'bank': return <Building2 size={18} />;
          default: return <WalletIcon size={18} />;
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Wallets">
      <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto pr-2">
        {/* Main Balance Card - Always visible */}
        <div className="flex justify-between items-center p-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border border-neutral-800 dark:border-neutral-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 dark:bg-black/10">
                    <WalletIcon size={18} />
                </div>
                <div>
                    <div className="font-medium">Main Balance</div>
                    <div className="text-xs font-medium opacity-60">Cash / Bank</div>
                </div>
            </div>
            <div className="font-bold">
                ${getWalletBalance(undefined).toLocaleString()}
            </div>
        </div>

        {wallets.length === 0 && !showAddForm ? (
            <div className="text-center py-6 text-neutral-400 text-sm border-2 border-dashed border-neutral-100 dark:border-neutral-800 rounded-2xl">
                No extra wallets added
            </div>
        ) : (
            wallets.map(w => {
                const balance = getWalletBalance(w.id);
                return (
                    <div key={w.id} className="flex justify-between items-center p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-4">
                            <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm"
                                style={{ backgroundColor: w.color }}
                            >
                                {getIcon(w.type)}
                            </div>
                            <div>
                                <div className="font-medium text-neutral-900 dark:text-white">{w.name}</div>
                                <div className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 capitalize">{w.type} Wallet</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="font-bold text-neutral-900 dark:text-white">
                                    ${balance.toLocaleString()}
                                </div>
                            </div>
                            <button 
                                onClick={() => deleteWallet(w.id)}
                                className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {showAddForm ? (
        <form onSubmit={handleAdd} className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">New Wallet</h3>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-neutral-400 text-xs">Cancel</button>
            </div>
            
            <div className="space-y-3">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Wallet Name (e.g. PayPal)"
                    className="w-full p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-white rounded-xl outline-none text-sm transition-all text-neutral-900 dark:text-white"
                    autoFocus
                />
                
                <div className="flex gap-2">
                    {['digital', 'bank', 'cash'].map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setType(t as any)}
                            className={`flex-1 py-2 text-xs font-medium capitalize rounded-lg border transition-all ${
                                type === t 
                                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white' 
                                    : 'bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar pt-1">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setColor(c)}
                            className={`w-6 h-6 rounded-full flex-shrink-0 transition-transform ${color === c ? 'scale-110 ring-2 ring-neutral-900 dark:ring-white ring-offset-2 dark:ring-offset-neutral-800' : ''}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <button
                    type="submit"
                    className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all text-sm"
                >
                    Create Wallet
                </button>
            </div>
        </form>
      ) : (
        <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
        >
            <Plus size={18} />
            Add New Wallet
        </button>
      )}
    </Modal>
  );
};
