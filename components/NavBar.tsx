import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PieChart, List, CreditCard } from 'lucide-react';

export const NavBar = () => {
  const getLinkClassName = ({ isActive }: { isActive: boolean }) => {
    return [
      "flex flex-col items-center justify-center flex-1 py-3 px-1 mx-0.5 rounded-2xl",
      "transition-all duration-150",
      isActive ? "scale-110 opacity-100" : "hover:scale-110 opacity-50",
      isActive
        ? "text-neutral-900 dark:text-white"
        : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300"
    ].join(" ");
  };

  const iconProps = {
    size: 24,
    strokeWidth: 2.2,
  };

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center pointer-events-none px-4">
      <nav className="
        w-full max-w-md
        rounded-[32px]
        bg-white/50 dark:bg-neutral-900/50
        backdrop-blur-md
        border border-neutral-200 dark:border-neutral-800
        px-3 py-1
        flex items-center justify-between
        pointer-events-auto
        shadow-lg shadow-neutral-200/20 dark:shadow-black/20
      ">
        <NavLink 
          to="/" 
          end
          className={getLinkClassName}
        >
          <Home {...iconProps} />
        </NavLink>
        
        <NavLink 
          to="/analytics" 
          className={getLinkClassName}
        >
          <PieChart {...iconProps} />
        </NavLink>

        {/* Central Gap for standalone FAB */}
        <div className="w-16 flex-shrink-0" />

        <NavLink 
          to="/transactions" 
          className={getLinkClassName}
        >
          <List {...iconProps} />
        </NavLink>

        <NavLink 
          to="/debts" 
          className={getLinkClassName}
        >
          <CreditCard {...iconProps} />
        </NavLink>
      </nav>
    </div>
  );
};