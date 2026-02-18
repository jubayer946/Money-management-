import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { GoogleGenAI } from '@google/genai';
import { Send, Sparkles, Loader2, ChevronDown, LayoutGrid, TrendingDown, CreditCard, List, ExternalLink, Bot, User } from 'lucide-react';
import { marked } from 'marked';
import { AIToolsDrawer } from './AIToolsDrawer';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatShortDate } from '../utils/format';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: AssistantMeta;
}

type PeriodKey = 'this_month' | 'last_month' | 'all';

interface TransactionFilter {
  category?: string;
  period?: PeriodKey;
}

interface AssistantMeta {
  canShowDetails?: boolean;
  attachedFilter?: TransactionFilter | null;
}

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

marked.setOptions({ gfm: true, breaks: true });

const buildSystemInstruction = (dataContext: string, history: Message[], lastUserMessage: string): string => {
  const lastMessages = history.slice(-6);
  const historyText = lastMessages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  return `You are a professional, friendly personal finance assistant.
You have access to the user's financial data snapshot: ${dataContext}.
Answer questions based ONLY on this data. Be concise but clear.
If you mention a specific category or large transaction, emphasize it.
Use Markdown for formatting. 
Conversation history:
${historyText || 'No previous conversation.'}
User prompt: ${lastUserMessage}`;
};

export const AIAssistant = () => {
  const { transactions, debts, categories, getBalance } = useFinance();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([{
    id: createMessageId(),
    role: 'assistant',
    content: "Hello! I'm your AI financial assistant. I've analyzed your latest data—how can I help you optimize your money today?",
  }]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTool, setDrawerTool] = useState<'spending' | 'debt'>('spending');
  const [expandedDetailsIds, setExpandedDetailsIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const generateContext = () => {
    const sorted = [...transactions].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return JSON.stringify({
      balance: getBalance(),
      totalTransactions: sorted.length,
      recentTransactions: sorted.slice(-15).reverse().map((t: any) => `${t.date}: ${t.desc} (${t.amount}) [${t.type}] cat: ${t.category}`),
      debts: debts.map((d: any) => `${d.name}: ${d.amount} remaining`),
      categories: categories.map((c: any) => c.name),
    });
  };

  const handleSend = async (override?: string) => {
    const rawInput = override ?? input;
    const userMessageText = rawInput.trim();
    if (!userMessageText || isLoading) return;
    if (!override) setInput('');
    setMessages((prev) => [...prev, { id: createMessageId(), role: 'user', content: userMessageText }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: buildSystemInstruction(generateContext(), messages, userMessageText),
      });
      const fullResponse = response.text || "I couldn't generate a response.";
      let drillDownFilter: TransactionFilter | null = null;
      const lowerUser = userMessageText.toLowerCase();
      let period: PeriodKey = lowerUser.includes('last month') ? 'last_month' : lowerUser.includes('this month') ? 'this_month' : 'all';
      const matchedCategory = categories.find(c => lowerUser.includes(c.name.toLowerCase()));
      if (matchedCategory) drillDownFilter = { category: matchedCategory.name, period };
      else if (lowerUser.includes('spending') || lowerUser.includes('transactions')) drillDownFilter = { period };

      setMessages((prev) => [...prev, { 
        id: createMessageId(), role: 'assistant', content: fullResponse,
        meta: { canShowDetails: true, attachedFilter: drillDownFilter }
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: createMessageId(), role: 'assistant', content: 'I encountered an error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const DrillDownTransactions = ({ filter }: { filter: TransactionFilter }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const filtered = useMemo(() => {
      let list = [...transactions];
      if (filter.category) list = list.filter(t => t.category === filter.category);
      if (filter.period === 'this_month') list = list.filter(t => new Date(t.date).getMonth() === new Date().getMonth());
      return list.slice(0, 5);
    }, [transactions, filter]);
    if (filtered.length === 0) return null;
    return (
      <div className="mt-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm overflow-hidden">
        <button type="button" onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-3.5 text-[10px] font-black uppercase tracking-widest text-neutral-500"><span className="flex items-center gap-2"><List size={14} className="text-indigo-500" /> {filter.category || 'Matches'}</span><ChevronDown size={14} className={isExpanded ? 'rotate-180' : ''} /></button>
        {isExpanded && <div className="divide-y divide-neutral-50 dark:divide-neutral-800 border-t border-neutral-100 dark:border-neutral-800">
          {filtered.map(t => (
            <div key={t.id} onClick={() => navigate(`/transaction/${t.id}`)} className="flex justify-between items-center p-3 hover:bg-white transition-colors cursor-pointer group">
              <div className="overflow-hidden"><div className="text-[11px] font-bold truncate group-hover:text-indigo-500 transition-colors">{t.desc}</div><div className="text-[9px] text-neutral-400 font-bold">{formatShortDate(t.date)}</div></div>
              <div className="flex items-center gap-2"><div className={`text-[11px] font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-neutral-900 dark:text-white'}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}</div><ExternalLink size={10} className="text-neutral-300" /></div>
            </div>
          ))}
        </div>}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-neutral-50 dark:bg-neutral-950 overflow-hidden relative">
      <header className="shrink-0 z-20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-100 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white"><Sparkles size={20} /></div><div><h1 className="text-sm font-bold text-neutral-900 dark:text-white">AI Co-pilot</h1><p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Intelligence</p></div></div>
        <button type="button" onClick={() => setIsDrawerOpen(!isDrawerOpen)} className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-600"><LayoutGridIcon size={20} /></button>
      </header>
      <div className="shrink-0 px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar border-b border-neutral-100 dark:border-neutral-800">
        <button type="button" onClick={() => { setDrawerTool('spending'); setIsDrawerOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-500"><TrendingDown size={12} /> Spending</button>
        <button type="button" onClick={() => { setDrawerTool('debt'); setIsDrawerOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-500"><CreditCard size={12} /> Debt Simulator</button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
        {messages.map((msg, i) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600' : 'bg-indigo-500 text-white'}`}>{msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}</div>
              <div className="flex-1 space-y-2">
                <div className={`p-4 rounded-3xl text-sm shadow-sm relative ${msg.role === 'user' ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-tr-none' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-100 dark:border-neutral-800 rounded-tl-none'}`}>
                  {msg.content ? <div className="prose-ai" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }} /> : isLoading && i === messages.length - 1 ? <Loader2 size={16} className="animate-spin opacity-50" /> : null}
                </div>
                {msg.role === 'assistant' && msg.meta?.attachedFilter && <DrillDownTransactions filter={msg.meta.attachedFilter} />}
                {msg.role === 'assistant' && msg.meta?.canShowDetails && (
                  <div className="px-1">
                    <button type="button" onClick={() => setExpandedDetailsIds(prev => { const next = new Set(prev); if (next.has(msg.id)) next.delete(msg.id); else next.add(msg.id); return next; })} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 transition-colors">{expandedDetailsIds.has(msg.id) ? 'Hide Snapshot' : 'Show Snapshot'} <ChevronDown size={12} className={expandedDetailsIds.has(msg.id) ? 'rotate-180' : ''} /></button>
                    {expandedDetailsIds.has(msg.id) && <div className="mt-3 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-medium space-y-2"><div className="flex justify-between text-neutral-500">Net Balance <span className="text-neutral-900 dark:text-white font-bold">{formatCurrency(getBalance())}</span></div></div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="shrink-0 p-6 pb-28 bg-gradient-to-t from-neutral-50 dark:from-neutral-950 to-transparent">
        <div className="relative group">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Analyze my finances..." className="w-full pl-6 pr-14 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[24px] text-sm font-semibold focus:outline-none focus:border-indigo-500 shadow-xl transition-all" />
          <button type="button" onClick={() => handleSend()} disabled={!input.trim() || isLoading} className={`absolute right-2 top-2 w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${input.trim() && !isLoading ? 'bg-indigo-500 text-white shadow-lg' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-300'}`}><Send size={18} /></button>
        </div>
      </div>
      <AIToolsDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} initialTool={drawerTool} />
    </div>
  );
};

const LayoutGridIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);