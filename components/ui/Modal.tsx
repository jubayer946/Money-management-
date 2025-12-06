import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to allow render before animation starts
      requestAnimationFrame(() => setIsAnimating(true));
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300); // Match transition duration
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-300 ${isAnimating ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'}`}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-md bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-xl transform transition-transform duration-300 ease-out max-h-[90vh] overflow-y-auto no-scrollbar border-t border-neutral-100 dark:border-neutral-800 ${isAnimating ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-10 sm:scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium tracking-tight text-neutral-900 dark:text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};