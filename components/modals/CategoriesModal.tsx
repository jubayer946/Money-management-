import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { Trash2, Edit2, Check, X, Plus } from 'lucide-react';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCategory.trim()) return;
    // Default to 'expense' and a neutral color if added via this simple modal
    addCategory(newCategory.trim(), 'expense', '#64748b');
    setNewCategory('');
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = () => {
    if (editingId !== null && editName.trim()) {
      const existingCategory = categories.find(c => c.id === editingId);
      if (existingCategory) {
        updateCategory({ ...existingCategory, name: editName.trim() });
      }
      setEditingId(null);
      setEditName('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Categories">
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="flex-1 p-3 bg-neutral-50 border border-neutral-200 focus:border-neutral-900 rounded-xl outline-none text-sm transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={() => handleAdd()}
          className="w-12 flex items-center justify-center bg-neutral-900 text-white rounded-xl shadow-md hover:bg-neutral-800 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-sm">No categories found</div>
        ) : (
          categories.map(c => (
            <div key={c.id} className="flex items-center gap-2 p-3 bg-white border border-neutral-100 rounded-xl shadow-sm">
              {editingId === c.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:border-neutral-900"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                    }}
                  />
                  <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Check size={16} />
                  </button>
                  <button onClick={cancelEdit} className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-lg transition-colors">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium text-neutral-900 text-sm">{c.name}</span>
                  <button 
                    onClick={() => startEdit(c.id, c.name)}
                    className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteCategory(c.id)}
                    className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};