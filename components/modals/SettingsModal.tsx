
import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { Modal } from '../ui/Modal';
import { Trash2, Edit2, Check, X, Plus, Moon, Sun, Monitor, Circle, Repeat, ArrowUp, ArrowDown, Settings, List, Save } from 'lucide-react';
import { TransactionType, RecurringTransaction } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  '#ef4444', // Red
  '#dc2626', // Red 600
  '#f97316', // Orange
  '#ea580c', // Orange 600
  '#f59e0b', // Amber
  '#d97706', // Amber 600
  '#eab308', // Yellow
  '#ca8a04', // Yellow 600
  '#84cc16', // Lime
  '#65a30d', // Lime 600
  '#22c55e', // Green
  '#16a34a', // Green 600
  '#10b981', // Emerald
  '#059669', // Emerald 600
  '#14b8a6', // Teal
  '#0d9488', // Teal 600
  '#06b6d4', // Cyan
  '#0891b2', // Cyan 600
  '#0ea5e9', // Sky
  '#0284c7', // Sky 600
  '#3b82f6', // Blue
  '#2563eb', // Blue 600
  '#6366f1', // Indigo
  '#4f46e5', // Indigo 600
  '#8b5cf6', // Violet
  '#7c3aed', // Violet 600
  '#a855f7', // Purple
  '#9333ea', // Purple 600
  '#d946ef', // Fuchsia
  '#c026d3', // Fuchsia 600
  '#ec4899', // Pink
  '#db2777', // Pink 600
  '#f43f5e', // Rose
  '#e11d48', // Rose 600
  '#64748b', // Slate
  '#475569', // Slate 600
  '#78716c', // Stone
  '#57534e', // Stone 600
  '#404040', // Neutral 700
  '#171717', // Neutral 900
];

type SettingsTab = 'general' | 'categories' | 'recurring';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory, recurringTransactions, updateRecurringTransaction, deleteRecurringTransaction } = useFinance();
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Category State
  const [activeCategoryType, setActiveCategoryType] = useState<TransactionType>('expense');
  const [newCategory, setNewCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  // Recurring Edit State
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [recDesc, setRecDesc] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recFrequency, setRecFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recCategory, setRecCategory] = useState('');


  // --- Categories Logic ---
  const handleAddCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCategory.trim()) return;
    addCategory(newCategory.trim(), activeCategoryType, selectedColor);
    setNewCategory('');
    setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
  };

  const startEditCategory = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color);
  };

  const saveEditCategory = () => {
    if (editingId && editName.trim()) {
      const originalCat = categories.find(c => c.id === editingId);
      if (originalCat) {
          updateCategory({ ...originalCat, name: editName.trim(), color: editColor });
      }
      setEditingId(null);
      setEditName('');
      setEditColor('');
    }
  };

  const cancelEditCategory = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const filteredCategories = categories.filter(c => c.type === activeCategoryType);

  // --- Recurring Logic ---
  const startEditRecurring = (rt: RecurringTransaction) => {
    setEditingRecurring(rt);
    setRecDesc(rt.desc);
    setRecAmount(rt.amount.toString());
    setRecFrequency(rt.frequency);
    setRecCategory(rt.category);
  };

  const saveEditRecurring = () => {
      if (!editingRecurring || !recAmount) return;
      
      updateRecurringTransaction({
          ...editingRecurring,
          desc: recDesc,
          amount: parseFloat(recAmount),
          frequency: recFrequency,
          category: recCategory
      });
      setEditingRecurring(null);
  };

  const cancelEditRecurring = () => {
      setEditingRecurring(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      
      {/* Top Navigation Tabs */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
            activeTab === 'general' 
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <Settings size={14} />
          General
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
            activeTab === 'categories' 
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <List size={14} />
          Cats
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
            activeTab === 'recurring' 
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <Repeat size={14} />
          Repeat
        </button>
      </div>

      {/* --- GENERAL TAB --- */}
      {activeTab === 'general' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">Appearance</h3>
            <div className="grid grid-cols-3 gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg text-xs font-medium transition-all ${
                    theme === 'light' 
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
                >
                <Sun size={18} />
                <span>Light</span>
                </button>
                <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg text-xs font-medium transition-all ${
                    theme === 'dark' 
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
                >
                <Moon size={18} />
                <span>Dark</span>
                </button>
                <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg text-xs font-medium transition-all ${
                    theme === 'system' 
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
                >
                <Monitor size={18} />
                <span>Auto</span>
                </button>
            </div>
            
            <div className="mt-8 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Money v1.0.0</p>
                <p className="text-[10px] text-neutral-300 dark:text-neutral-600 mt-1">Simple Finance Tracker</p>
            </div>
        </div>
      )}

      {/* --- CATEGORIES TAB --- */}
      {activeTab === 'categories' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Category Type Toggle */}
            <div className="flex gap-2 mb-4 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <button
                onClick={() => setActiveCategoryType('expense')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeCategoryType === 'expense' 
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
            >
                Expenses
            </button>
            <button
                onClick={() => setActiveCategoryType('income')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeCategoryType === 'income' 
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
            >
                Income
            </button>
            </div>

            {/* Add Category Input */}
            <div className="mb-4 space-y-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder={`New ${activeCategoryType} category`}
                        className="flex-1 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-500 rounded-xl outline-none text-sm transition-all text-neutral-900 dark:text-white placeholder:text-neutral-400"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                    <button
                        onClick={() => handleAddCategory()}
                        className="w-12 flex items-center justify-center bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
                    >
                        <Plus size={20} />
                    </button>
                </div>
                
                {/* Color Picker for New Category */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-6 h-6 rounded-full flex-shrink-0 transition-transform ${selectedColor === color ? 'scale-110 ring-2 ring-neutral-900 dark:ring-white ring-offset-2 dark:ring-offset-neutral-900' : 'hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

            {/* Categories List */}
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                {filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-sm">No {activeCategoryType} categories found</div>
                ) : (
                filteredCategories.map(c => (
                    <div key={c.id} className="flex items-center gap-2 p-3 bg-white dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-sm">
                    {editingId === c.id ? (
                        <div className="flex-1 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="flex-1 p-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:border-neutral-900 dark:focus:border-white text-neutral-900 dark:text-white"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditCategory();
                                        if (e.key === 'Escape') cancelEditCategory();
                                    }}
                                />
                                <button onClick={saveEditCategory} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                                    <Check size={16} />
                                </button>
                                <button onClick={cancelEditCategory} className="p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setEditColor(color)}
                                        className={`w-5 h-5 rounded-full flex-shrink-0 transition-transform ${editColor === color ? 'scale-110 ring-1 ring-neutral-900 dark:ring-white ring-offset-1 dark:ring-offset-neutral-900' : ''}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="flex-1 font-medium text-neutral-900 dark:text-neutral-200 text-sm">{c.name}</span>
                        <button 
                            onClick={() => startEditCategory(c.id, c.name, c.color)}
                            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={() => deleteCategory(c.id)}
                            className="p-2 text-neutral-300 dark:text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                        </>
                    )}
                    </div>
                ))
                )}
            </div>
        </div>
      )}

      {/* --- RECURRING TAB --- */}
      {activeTab === 'recurring' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             {editingRecurring ? (
                 <div className="space-y-4">
                     <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Edit Recurring Rule</h3>
                     
                     <div>
                        <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Description</label>
                        <input
                            type="text"
                            value={recDesc}
                            onChange={(e) => setRecDesc(e.target.value)}
                            className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                        />
                     </div>

                     <div>
                        <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Amount</label>
                        <input
                            type="number"
                            value={recAmount}
                            onChange={(e) => setRecAmount(e.target.value)}
                            className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                        />
                     </div>

                     <div>
                        <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Frequency</label>
                        <select
                            value={recFrequency}
                            onChange={(e) => setRecFrequency(e.target.value as any)}
                            className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                     </div>

                     <div>
                        <label className="block text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Category</label>
                        <select
                            value={recCategory}
                            onChange={(e) => setRecCategory(e.target.value)}
                            className="w-full p-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-900 dark:focus:border-neutral-200 focus:bg-white dark:focus:bg-neutral-900 rounded-xl outline-none transition-all font-medium text-neutral-900 dark:text-white"
                        >
                            <option value="">Uncategorized</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                     </div>

                     <div className="flex gap-2 mt-4">
                        <button onClick={saveEditRecurring} className="flex-1 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold flex items-center justify-center gap-2">
                            <Save size={18} /> Save
                        </button>
                        <button onClick={cancelEditRecurring} className="flex-1 py-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl font-bold">
                            Cancel
                        </button>
                     </div>
                 </div>
             ) : (
                 <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                     {recurringTransactions.length === 0 ? (
                         <div className="text-center py-12 text-neutral-400">
                             <Repeat size={32} className="mx-auto mb-2 opacity-20" />
                             <p className="text-sm">No recurring transactions found.</p>
                             <p className="text-xs mt-1">Add one via the "+" button on dashboard.</p>
                         </div>
                     ) : (
                         recurringTransactions.map(rt => (
                             <div key={rt.id} className="p-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-sm flex flex-col gap-3">
                                 <div className="flex justify-between items-start">
                                     <div className="flex items-center gap-3">
                                         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                            rt.type === 'income' 
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                                         }`}>
                                            {rt.type === 'income' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                                         </div>
                                         <div>
                                             <div className="font-semibold text-neutral-900 dark:text-white">{rt.desc}</div>
                                             <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                                                 <Repeat size={10} />
                                                 <span className="capitalize">{rt.frequency}</span>
                                                 {rt.category && <span className="opacity-50">• {rt.category}</span>}
                                             </div>
                                         </div>
                                     </div>
                                     <div className={`font-bold ${rt.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-neutral-900 dark:text-white'}`}>
                                        ${rt.amount.toLocaleString()}
                                     </div>
                                 </div>
                                 
                                 <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                     <button 
                                        onClick={() => startEditRecurring(rt)}
                                        className="flex-1 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
                                     >
                                         <Edit2 size={14} /> Edit
                                     </button>
                                     <button 
                                        onClick={() => deleteRecurringTransaction(rt.id)}
                                        className="flex-1 py-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
                                     >
                                         <Trash2 size={14} /> Delete
                                     </button>
                                 </div>
                             </div>
                         ))
                     )}
                 </div>
             )}
          </div>
      )}
    </Modal>
  );
};
