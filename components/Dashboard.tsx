import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { Settings, Tag, TrendingUp, TrendingDown, Clock, Trash2, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SettingsModal } from './modals/SettingsModal';
import { CategoriesModal } from './modals/CategoriesModal';
import { AddTransactionModal } from './modals/AddTransactionModal';
import { formatCurrency } from '../utils/format';
import { TransactionRow } from './ui/TransactionRow';
import { IconCircleButton } from './ui/IconCircleButton';
import { Transaction } from '../types';

type Note = {
  id: string;
  content: string;
  createdAt: string;
};

const NOTES_STORAGE_KEY = 'money_journal_notes';

const ComparisonBadge = ({ percent, trend, isGood }: { percent: number; trend: 'up' | 'down' | 'flat'; isGood: boolean }) => {
  if (trend === 'flat' || percent === 0) return null;
  
  const colorClass = isGood ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  const Icon = trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <div className={`flex items-center gap-0.5 text-[9px] font-black uppercase tracking-tighter ${colorClass}`}>
      <Icon size={10} />
      {percent}%
    </div>
  );
};

export const Dashboard = () => {
  const { categories } = useFinance();
  const { 
    mainBalance, 
    income, 
    expenses, 
    recentTransactions, 
    monthLabel, 
    net, 
    spentPercent,
    comparison,
    forecast,
    upcomingRecurring
  } = useDashboardData();
  
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Money Journal State
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState('');

  // Load notes from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      if (raw) {
        setNotes(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to load journal notes', e);
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = noteInput.trim();
    if (!trimmed) return;

    const newNote: Note = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setNotes(prev => [newNote, ...prev]);
    setNoteInput('');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const netStatus = net > 0 ? 'POSITIVE' : net < 0 ? 'NEGATIVE' : 'NEUTRAL';
  const statusColor = net > 0 ? 'text-green-600 dark:text-green-400' : 
                      net < 0 ? 'text-red-500 dark:text-red-400' : 
                      'text-neutral-400';

  const groupedRecentTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    recentTransactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [recentTransactions]);

  const getGroupLabel = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yesterday.getTime()) return 'Yesterday';
    
    const day = date.getDate();
    const month = date.toLocaleDateString(undefined, { month: 'short' });
    const yearStr = date.getFullYear().toString().slice(-2);
    
    return `${day} ${month} ${yearStr}`.toUpperCase();
  };

  return (
    <div className="pb-32 pt-6 px-5 max-w-md mx-auto min-h-screen">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-lg font-medium tracking-tight text-neutral-900 dark:text-white">Money</h1>
        <div className="flex gap-2">
          <IconCircleButton onClick={() => setIsCategoriesOpen(true)} aria-label="Manage Categories">
            <Tag size={18} />
          </IconCircleButton>
          <IconCircleButton onClick={() => setIsSettingsOpen(true)} aria-label="Settings">
            <Settings size={18} />
          </IconCircleButton>
        </div>
      </header>

      <main>
        <div className="text-center mb-14">
          <div 
            className={`text-6xl font-light tracking-tighter mb-12 ${mainBalance < 0 ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}
            aria-label={`Current Total Balance: ${mainBalance < 0 ? 'minus' : ''} ${formatCurrency(Math.abs(mainBalance))}`}
            role="status"
          >
            {mainBalance < 0 && '-'}{formatCurrency(Math.abs(mainBalance))}
          </div>

          <div className="flex flex-col items-center">
            <div className="text-[10px] font-black text-neutral-300 dark:text-neutral-600 uppercase tracking-[0.3em] mb-6" aria-hidden="true">
              {monthLabel}
            </div>
            
            <div className="flex justify-center gap-12 mb-10">
              <div className="flex flex-col items-center">
                <div className="text-xl font-medium text-green-600 dark:text-green-500 mb-0.5">
                  {formatCurrency(income)}
                </div>
                <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest opacity-60">
                  Income
                </div>
                <div className="mt-1">
                  <ComparisonBadge {...comparison.income} />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-xl font-medium text-red-500 dark:text-red-400 mb-0.5">
                  {formatCurrency(expenses)}
                </div>
                <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest opacity-60">
                  Expenses
                </div>
                <div className="mt-1">
                  <ComparisonBadge {...comparison.expenses} />
                </div>
              </div>
            </div>

            <div className="w-full max-w-[300px] space-y-8 mt-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Net Flow</span>
                    <span className={`text-2xl font-black tracking-tight ${net < 0 ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
                      {net < 0 && '-'}{formatCurrency(Math.abs(net))}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[9px] font-black tracking-[0.2em] mb-1 ${statusColor}`}>
                      {netStatus}
                    </span>
                    <ComparisonBadge {...comparison.net} />
                  </div>
                </div>
                <div className="w-full h-px bg-neutral-100 dark:bg-neutral-800" />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Pace & Forecast</span>
                    </div>
                    <span className={`text-2xl font-black tracking-tight ${forecast.isOverIncome ? 'text-red-500' : 'text-neutral-900 dark:text-white'}`}>
                      {formatCurrency(forecast.projected)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mb-1">
                      {forecast.daysRemaining}d Left
                    </span>
                    <span className={`text-[9px] font-black tracking-widest uppercase ${forecast.isOverIncome ? 'text-red-500' : 'text-neutral-400'}`}>
                      {forecast.isOverIncome ? 'Warning' : 'On Track'}
                    </span>
                  </div>
                </div>
                <div className="w-full h-[2px] bg-neutral-200 dark:bg-neutral-800 rounded-full relative overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${forecast.isOverIncome ? 'bg-red-500' : 'bg-neutral-900 dark:bg-white'}`}
                    style={{ width: `${forecast.progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[8px] font-black text-neutral-400 uppercase tracking-widest opacity-60">
                  <span>{formatCurrency(forecast.dailyAverage)}/day avg</span>
                  <span>{spentPercent}% spent</span>
                </div>
              </div>

              {upcomingRecurring.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-neutral-300 dark:text-neutral-600" />
                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Upcoming</span>
                  </div>
                  <div className="space-y-2.5">
                    {upcomingRecurring.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex flex-col items-start">
                          <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">{item.desc}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                           <span className="text-[11px] font-black text-neutral-900 dark:text-white">{formatCurrency(item.amount)}</span>
                           <span className="text-neutral-300 dark:text-neutral-700 font-light text-[11px]">·</span>
                           <span className={`text-[9px] font-black uppercase tracking-widest ${item.diffDays <= 2 ? 'text-red-500' : 'text-neutral-400'}`}>
                              {item.diffDays === 0 ? 'Today' : `in ${item.diffDays}d`}
                           </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="w-full h-px bg-neutral-100 dark:bg-neutral-800" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em]">Recent Activity</h2>
          <button 
            type="button"
            onClick={() => navigate('/transactions')}
            aria-label="View all transactions"
            className="text-[10px] font-black text-neutral-300 hover:text-neutral-900 dark:text-neutral-600 dark:hover:text-neutral-300 uppercase tracking-widest transition-colors"
          >
            View all
          </button>
        </div>

        <div className="space-y-6" role="list" aria-label="Recent transaction list">
          {recentTransactions.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-neutral-50 dark:border-neutral-800 rounded-[32px] text-neutral-400 text-sm flex flex-col items-center">
              No transactions yet.
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="mt-4 inline-flex items-center px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                Add Transaction
              </button>
            </div>
          ) : (
            groupedRecentTransactions.map(([dateStr, items]) => (
              <div key={dateStr} className="space-y-2">
                <h3 className="text-[8px] font-black text-neutral-300 dark:text-neutral-600 uppercase tracking-[0.2em] px-1">
                  {getGroupLabel(dateStr)}
                </h3>
                <div className="space-y-2">
                  {items.map(t => (
                    <div role="listitem" key={t.id}>
                      <TransactionRow
                        transaction={t}
                        onClick={() => navigate(`/transaction/${t.id}`)}
                        catColor={categories.find(c => c.name === t.category)?.color}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Money Journal Section */}
        <section className="mt-14 pb-10">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em]">Money Journal</h2>
            {notes.length > 0 && (
              <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">
                {notes.length} note{notes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <form onSubmit={handleAddNote} className="mb-6 relative group">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="What's on your mind? Savings goals, thoughts..."
              className="w-full pl-6 pr-12 py-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none shadow-sm transition-all focus:border-neutral-200 dark:focus:border-neutral-700"
            />
            <button 
              type="submit" 
              disabled={!noteInput.trim()}
              className="absolute right-2 top-2 w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:scale-100"
            >
              <Send size={16} />
            </button>
          </form>

          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="p-8 text-center bg-white/50 dark:bg-neutral-900/50 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-[24px]">
                <p className="text-[10px] font-black text-neutral-300 dark:text-neutral-600 uppercase tracking-widest">Your thoughts are private</p>
              </div>
            ) : (
              notes.map(note => (
                <div 
                  key={note.id} 
                  className="group relative bg-white dark:bg-neutral-900 border border-neutral-50 dark:border-neutral-800 p-5 rounded-2xl shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {note.content}
                    </p>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-3 text-[9px] font-black text-neutral-300 dark:text-neutral-700 uppercase tracking-widest">
                    {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <CategoriesModal isOpen={isCategoriesOpen} onClose={() => setIsCategoriesOpen(false)} />
      <AddTransactionModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
};