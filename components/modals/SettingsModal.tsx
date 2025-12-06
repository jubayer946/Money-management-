
import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { Modal } from '../ui/Modal';
import { Trash2, Edit2, Check, X, Plus, Moon, Sun, Monitor, Circle } from 'lucide-react';
import { TransactionType } from '../../types';

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

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [newCategory, setNewCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCategory.trim()) return;
    addCategory(newCategory.trim(), activeTab, selectedColor);
    setNewCategory('');
    // Pick a random next color for variety
    setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
  };

  const startEdit = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color);
  };

  const saveEdit = () => {
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

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const filteredCategories = categories.filter(c => c.type === activeTab);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      
      {/* Theme Section */}
      <div className="mb-8">
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
      </div>

      {/* Categories Section */}
      <div>
        <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">Categories</h3>
        
        {/* Category Type Toggle */}
        <div className="flex gap-2 mb-4 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'expense' 
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' 
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'income' 
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
                    placeholder={`New ${activeTab} category`}
                    className="flex-1 p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:border-neutral-900 dark:focus:border-neutral-500 rounded-xl outline-none text-sm transition-all text-neutral-900 dark:text-white placeholder:text-neutral-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button
                    onClick={() => handleAdd()}
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
            <div className="text-center py-8 text-neutral-400 text-sm">No {activeTab} categories found</div>
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
                                    if (e.key === 'Enter') saveEdit();
                                    if (e.key === 'Escape') cancelEdit();
                                }}
                            />
                            <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                                <Check size={16} />
                            </button>
                            <button onClick={cancelEdit} className="p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
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
                        onClick={() => startEdit(c.id, c.name, c.color)}
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
    </Modal>
  );
};
