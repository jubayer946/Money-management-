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

const FloatingActionButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  // Hide FAB on detail page if desired
  if (location.pathname.startsWith('/transaction/')) {
    return null;
  }
  
  return (
    <>
      <div className="fixed bottom-24 left-0 right-0 flex justify-end px-5 pointer-events-none z-40 max-w-md mx-auto">
        <button
          onClick={() => setIsModalOpen(true)}
          className="pointer-events-auto w-14 h-14 bg-neutral-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>
      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

const AppContent: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/transactions" element={<TransactionList />} />
        <Route path="/debts" element={<Debts />} />
        <Route path="/transaction/:id" element={<TransactionDetail />} />
      </Routes>
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