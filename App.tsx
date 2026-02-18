import React, { useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionDetail } from './components/TransactionDetail';
import { Debts } from './components/Debts';
import { AddTransactionModal } from './components/modals/AddTransactionModal';
import { Analytics } from './components/Analytics';
import { NavBar } from './components/NavBar';
import { Plus } from 'lucide-react';

const FloatingActionButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  // Hide FAB on detail page
  if (location.pathname.startsWith('/transaction/')) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-[44px] z-[60] flex justify-center pointer-events-none max-w-md mx-auto">
        <button
          onClick={() => setIsModalOpen(true)}
          className="
            pointer-events-auto
            h-14 w-14 rounded-full
            bg-white/50 dark:bg-neutral-900/50
            backdrop-blur-md
            text-neutral-900 dark:text-white
            flex items-center justify-center
            hover:scale-110 active:scale-95
            transition-all duration-300
            border border-neutral-200 dark:border-neutral-800
            shadow-xl shadow-neutral-200/30 dark:shadow-black/40
          "
          aria-label="Add transaction"
        >
          <Plus size={32} strokeWidth={3} className="opacity-80" />
        </button>
      </div>
      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

const AppContent = () => {
  return (
    <>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/transactions" element={<TransactionList />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/transaction/:id" element={<TransactionDetail />} />
        </Routes>
      </div>
      <NavBar />
      <FloatingActionButton />
    </>
  );
};

function App() {
  return (
    <FinanceProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </FinanceProvider>
  );
}

export default App;