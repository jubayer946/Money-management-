import React from 'react';

interface IconCircleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'danger' | 'ghost';
}

export const IconCircleButton: React.FC<IconCircleButtonProps> = ({ 
  children, 
  variant = 'default',
  className = '',
  ...props 
}) => {
  const variants = {
    default: 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white shadow-sm',
    danger: 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 shadow-sm',
    ghost: 'bg-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
  };

  return (
    <button
      type="button"
      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
