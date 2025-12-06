import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PieChart, List, CreditCard } from 'lucide-react';

export const NavBar: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-t border-neutral-100 dark:border-neutral-800 px-6 pb-6 pt-4 z-30 flex justify-between items-center text-xs font-medium text-neutral-400 dark:text-neutral-500 max-w-md mx-auto">
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-colors w-14 ${isActive ? 'text-neutral-900 dark:text-white' : 'hover:text-neutral-600 dark:hover:text-neutral-300'}`}
      >
        <Home size={22} strokeWidth={2} />
        <span>Home</span>
      </NavLink>
      
      <NavLink 
        to="/analytics" 
        className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-colors w-14 ${isActive ? 'text-neutral-900 dark:text-white' : 'hover:text-neutral-600 dark:hover:text-neutral-300'}`}
      >
        <PieChart size={22} strokeWidth={2} />
        <span>Analytics</span>
      </NavLink>

      <NavLink 
        to="/transactions" 
        className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-colors w-14 ${isActive ? 'text-neutral-900 dark:text-white' : 'hover:text-neutral-600 dark:hover:text-neutral-300'}`}
      >
        <List size={22} strokeWidth={2} />
        <span>List</span>
      </NavLink>

      <NavLink 
        to="/debts" 
        className={({ isActive }) => `flex flex-col items-center gap-1.5 transition-colors w-14 ${isActive ? 'text-neutral-900 dark:text-white' : 'hover:text-neutral-600 dark:hover:text-neutral-300'}`}
      >
        <CreditCard size={22} strokeWidth={2} />
        <span>Debts</span>
      </NavLink>
    </nav>
  );
};