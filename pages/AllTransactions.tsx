
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, Language } from '../types';

interface AllTransactionsProps {
  language: Language;
  transactions: Transaction[];
  onUpdateTransaction: (tx: Transaction) => void;
}

const AllTransactions: React.FC<AllTransactionsProps> = ({ language, transactions, onUpdateTransaction }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'Custom' | 'Day' | 'Month' | 'Year'>('Custom');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const filteredTransactions = useMemo(() => {
    let result = [...transactions].filter(tx => 
      tx.title.toLowerCase().includes(search.toLowerCase()) || 
      tx.merchant?.toLowerCase().includes(search.toLowerCase())
    );

    if (periodFilter === 'Day') {
      const today = new Date().setHours(0,0,0,0);
      result = result.filter(tx => tx.timestamp >= today);
    } else if (periodFilter === 'Month') {
      const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      result = result.filter(tx => tx.timestamp >= start);
    } else if (periodFilter === 'Year') {
      const start = new Date(new Date().getFullYear(), 0, 1).getTime();
      result = result.filter(tx => tx.timestamp >= start);
    } else if (startDate || endDate) {
      if (startDate) {
        const start = new Date(startDate).getTime();
        result = result.filter(tx => tx.timestamp >= start);
      }
      if (endDate) {
        const end = new Date(endDate).getTime() + 86400000;
        result = result.filter(tx => tx.timestamp <= end);
      }
    }

    result.sort((a, b) => {
      if (sortOrder === 'desc') return b.amount - a.amount;
      return a.amount - b.amount;
    });

    return result;
  }, [transactions, search, sortOrder, startDate, endDate, periodFilter]);

  const stats = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
      if (tx.type === 'credit') {
        acc.income += tx.amount;
      } else {
        acc.expense += tx.amount;
      }
      return acc;
    }, { income: 0, expense: 0 });
  }, [filteredTransactions]);

  const totalSurplus = stats.income - stats.expense;

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditForm({ ...tx, date: new Date(tx.timestamp).toISOString().split('T')[0] });
  };

  const handleSaveEdit = () => {
    if (!editingId || !editForm.title || editForm.amount === undefined) return;
    
    const originalTx = transactions.find(t => t.id === editingId);
    if (!originalTx) return;

    const updatedTx: Transaction = {
      ...originalTx,
      title: editForm.title,
      amount: editForm.amount,
      timestamp: editForm.date ? new Date(editForm.date).getTime() : originalTx.timestamp,
    };
    
    onUpdateTransaction(updatedTx);
    setEditingId(null);
  };

  const t = {
    title: language === 'zh' ? '交易记录' : 'Transactions',
    highLow: language === 'zh' ? '从高到低' : 'High-Low',
    lowHigh: language === 'zh' ? '从低到高' : 'Low-High',
    searchPlaceholder: language === 'zh' ? '搜索交易...' : 'Search transactions...',
    totalIncome: language === 'zh' ? '总收入' : 'Total Income',
    totalExpense: language === 'zh' ? '总支出' : 'Total Expense',
    totalSurplus: language === 'zh' ? '总盈余' : 'Total Surplus',
    resultsLabel: language === 'zh' ? '个匹配结果' : 'results matching filter',
    noMatches: language === 'zh' ? '未找到匹配项' : 'No matches found',
    cancel: language === 'zh' ? '取消' : 'Cancel',
    save: language === 'zh' ? '保存' : 'Save',
    amountLabel: language === 'zh' ? '金额' : 'Amount',
    titleLabel: language === 'zh' ? '标题' : 'Title',
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark pb-6">
      <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-6 pt-12 pb-4 flex flex-col gap-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 dark:text-white">
            <span className="material-symbols-outlined font-bold">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold dark:text-white uppercase tracking-widest">{t.title}</h1>
          <button 
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="p-2 flex items-center gap-1 text-gray-500 dark:text-gray-400"
          >
            <span className="text-[10px] font-bold uppercase">{sortOrder === 'desc' ? t.highLow : t.lowHigh}</span>
            <span className="material-symbols-outlined text-xl">swap_vert</span>
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
            <input 
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 rounded-2xl pl-10 pr-4 py-3 text-sm border-none focus:ring-2 focus:ring-lavender-accent shadow-sm dark:text-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {['Custom', 'Day', 'Month', 'Year'].map(p => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p as any)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  periodFilter === p 
                    ? 'bg-lavender-accent text-white' 
                    : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {periodFilter === 'Custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-[10px] border-none focus:ring-1 focus:ring-lavender-accent dark:text-white"
              />
              <span className="text-gray-400 text-xs">{language === 'zh' ? '至' : 'to'}</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-[10px] border-none focus:ring-1 focus:ring-lavender-accent dark:text-white"
              />
            </div>
          )}
        </div>
      </header>

      <div className="px-6 py-5 bg-lavender-accent/5 dark:bg-lavender-accent/10 border-b border-lavender-accent/10">
        <div className="grid grid-cols-3 gap-4 mb-2">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.totalIncome}</p>
            <h2 className="text-sm font-black text-emerald-500">¥{stats.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.totalExpense}</p>
            <h2 className="text-sm font-black text-rose-500">¥{stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.totalSurplus}</p>
            <h2 className={`text-sm font-black ${totalSurplus >= 0 ? 'text-lavender-accent' : 'text-rose-600'}`}>¥{totalSurplus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest border-t border-gray-200/20 pt-2 mt-2">{filteredTransactions.length} {t.resultsLabel}</p>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4">
        <div className="space-y-4 pb-12">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p className="italic text-sm">{t.noMatches}</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div key={tx.id} className="relative group p-4 bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-transparent hover:border-lavender-accent/20 transition-all">
                {editingId === tx.id ? (
                  <div className="flex flex-col gap-4 animate-fade-in py-2">
                    <input 
                      type="text" 
                      value={editForm.title} 
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl py-3 px-4 text-sm font-bold dark:text-white"
                      placeholder={t.titleLabel}
                    />
                    <div className="flex gap-4">
                      <input 
                        type="date" 
                        value={editForm.date} 
                        onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                        className="flex-1 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl py-3 px-4 text-xs dark:text-white"
                      />
                      <input 
                        type="number" 
                        value={editForm.amount} 
                        onChange={(e) => setEditForm({...editForm, amount: parseFloat(e.target.value)})}
                        className="flex-1 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl py-3 px-4 text-xs font-bold dark:text-white"
                        placeholder={t.amountLabel}
                      />
                    </div>
                    <div className="flex gap-3 items-center mt-2">
                      <button onClick={() => setEditingId(null)} className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-gray-600">{t.cancel}</button>
                      <button onClick={handleSaveEdit} className="flex-[2] py-3 bg-lavender-accent text-white rounded-2xl text-sm font-bold shadow-lg shadow-lavender-accent/20 active:scale-[0.98] transition-transform">{t.save}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        tx.type === 'credit' ? 'bg-emerald-50 text-emerald-500' :
                        tx.category === 'Food' ? 'bg-orange-50 text-orange-500' :
                        tx.category === 'Entertainment' ? 'bg-blue-50 text-blue-500' :
                        tx.category === 'Transport' ? 'bg-green-50 text-green-500' :
                        tx.category === 'Clothing' ? 'bg-purple-50 text-purple-500' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        <span className="material-symbols-outlined text-xl">
                          {tx.type === 'credit' ? 'add_card' :
                           tx.category === 'Food' ? 'local_cafe' : 
                           tx.category === 'Entertainment' ? 'subscriptions' : 
                           tx.category === 'Transport' ? 'directions_car' :
                           tx.category === 'Clothing' ? 'checkroom' : 'receipt_long'}
                        </span>
                      </div>
                      <div onClick={() => startEdit(tx)} className="cursor-pointer max-w-[140px]">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1 group-hover:text-lavender-accent transition-colors truncate">
                          {tx.title}
                          <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100">edit</span>
                        </h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight truncate">
                          {new Date(tx.timestamp).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })} {tx.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-extrabold text-sm ${tx.type === 'credit' ? 'text-emerald-500' : 'text-gray-900 dark:text-gray-100'}`}>
                        {tx.type === 'credit' ? '+' : '-'}¥{tx.amount.toFixed(2)}
                      </p>
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest truncate block max-w-[80px] ml-auto">
                        {tx.merchant || tx.category || tx.type}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AllTransactions;
