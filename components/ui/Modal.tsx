
import React, { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  // Make children optional to avoid 'missing property' errors in some TS environments
  children?: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to allow render before animation starts
      const frame = requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
      
      return () => {
        cancelAnimationFrame(frame);
      };
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300); // Match transition duration
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
      return () => clearTimeout(timer);
    }
  }, [isOpen, handleEscape]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center transition-all duration-300 ${
        isAnimating ? 'bg-black/60 backdrop-blur-[2px]' : 'bg-black/0 backdrop-blur-none'
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`w-full max-w-md bg-white dark:bg-neutral-900 rounded-t-[32px] sm:rounded-[32px] p-6 pt-2 sm:pt-6 shadow-2xl transform transition-all duration-300 ease-out max-h-[92vh] overflow-y-auto no-scrollbar border-t border-neutral-100 dark:border-neutral-800 ${
          isAnimating ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-full sm:translate-y-12 sm:scale-95 opacity-0'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="flex justify-center sm:hidden mb-4">
          <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 
            id="modal-title"
            className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white"
          >
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
};
