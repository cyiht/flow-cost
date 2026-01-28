
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Account, Bill, Language } from '../types';

interface WalletProps {
  accounts: Account[];
  bills: Bill[];
  language: Language;
  onDeleteAccount: (id: string) => void;
  onDeleteBill: (id: string) => void;
}

const Wallet: React.FC<WalletProps> = ({ accounts, bills, language, onDeleteAccount, onDeleteBill }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Assets' | 'Liabilities'>('Assets');

  const totalAssets = useMemo(() => 
    accounts.filter(a => a.type === 'Asset').reduce((acc, a) => acc + a.balance, 0), 
  [accounts]);

  const totalLiabilities = useMemo(() => 
    accounts.filter(a => a.type === 'Liability').reduce((acc, a) => acc + a.balance, 0), 
  [accounts]);

  const totalBalance = useMemo(() => totalAssets - totalLiabilities, [totalAssets, totalLiabilities]);

  const totalBillsAmount = useMemo(() => 
    bills.reduce((acc, b) => acc + b.amount, 0),
  [bills]);

  const filteredAccounts = useMemo(() => 
    accounts.filter(a => a.type === (activeTab === 'Assets' ? 'Asset' : 'Liability')),
  [accounts, activeTab]);

  const translateBillName = (name: string) => {
    if (language !== 'zh') return name;
    const translations: Record<string, string> = {
      'Rent': '房租',
      'Netflix': '网飞订阅',
      'Insurance': '保险费用',
      'Gym': '健身房',
      'Electricity': '电费',
      'Water': '水费',
      'Gas': '燃气费',
      'Internet': '宽带费',
      'Gym Membership': '健身会员'
    };
    return translations[name] || name;
  };

  const translateTimeLeft = (timeLeft: string) => {
    if (language !== 'zh') return timeLeft;
    if (timeLeft.toLowerCase().includes('left')) {
      const days = timeLeft.split(' ')[0].replace('d', '');
      return `剩余 ${days}天`;
    }
    if (timeLeft.toLowerCase() === 'tomorrow') return '明天';
    if (timeLeft.toLowerCase().includes('today')) return '今天截止';
    if (timeLeft.toLowerCase() === 'overdue') return '已逾期';
    return timeLeft;
  };

  const translateDate = (dateStr: string) => {
    if (language !== 'zh') return dateStr;
    const parts = dateStr.split(' ');
    if (parts.length === 2) {
      const months: Record<string, string> = {
        'Jan': '1月', 'Feb': '2月', 'Mar': '3月', 'Apr': '4月',
        'May': '5月', 'Jun': '6月', 'Jul': '7月', 'Aug': '8月',
        'Sep': '9月', 'Oct': '10月', 'Nov': '11月', 'Dec': '12月'
      };
      return `${months[parts[0]] || parts[0]}${parts[1]}日`;
    }
    return dateStr;
  };

  const t = {
    title: language === 'zh' ? '我的钱包' : 'My Wallet',
    totalAssets: language === 'zh' ? '总资产' : 'Total Assets',
    totalLiabilities: language === 'zh' ? '总负债' : 'Total Liabilities',
    totalBalance: language === 'zh' ? '总余额' : 'Total Balance',
    assets: language === 'zh' ? '资产' : 'Assets',
    liabilities: language === 'zh' ? '负债' : 'Liabilities',
    noData: language === 'zh' ? `暂无${activeTab === 'Assets' ? '资产' : '负债'}` : `No ${activeTab} yet`,
    upcomingBills: language === 'zh' ? '待付账单' : 'Upcoming Bills',
    expectedTotal: language === 'zh' ? '预计总额' : 'Expected Total',
    noBills: language === 'zh' ? '暂无待付账单' : 'No upcoming bills',
    steady: language === 'zh' ? '稳定' : 'Steady',
  };

  return (
    <div className="bg-transparent min-h-screen pb-32 flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 pt-12 bg-transparent backdrop-blur-xl border-b border-lavender-accent/5">
        <button onClick={() => navigate('/')} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-lavender-accent/5 text-lavender-accent">
          <span className="material-symbols-outlined font-bold">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-black tracking-widest uppercase text-lavender-accent dark:text-white">{t.title}</h1>
        <button 
          onClick={() => navigate('/add-account')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender-accent text-white shadow-btn-glow active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-8 mt-4 pb-12">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-3 rounded-2xl bg-card-gradient p-4 shadow-btn-glow text-white transition-all hover:scale-[1.02]">
            <div className="flex items-start justify-between">
              <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">account_balance</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-white/70 font-black uppercase tracking-widest">{t.totalAssets}</p>
              <p className="text-sm font-black truncate">¥{totalAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 rounded-2xl bg-card-gradient p-4 shadow-btn-glow text-white transition-all hover:scale-[1.02]">
            <div className="flex items-start justify-between">
              <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">credit_card</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-white/70 font-black uppercase tracking-widest">{t.totalLiabilities}</p>
              <p className="text-sm font-black truncate">¥{totalLiabilities.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-card-gradient p-4 shadow-btn-glow text-white transition-all hover:scale-[1.02]">
            <div className="flex items-start justify-between">
              <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] text-white/70 font-black uppercase tracking-widest">{t.totalBalance}</p>
              <p className="text-sm font-black truncate">¥{totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>

        <section className="space-y-6">
          <div className="bg-lavender-accent/10 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl p-1 flex border border-lavender-accent/5">
            {(['Assets', 'Liabilities'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 shadow-soft text-lavender-accent' : 'text-slate-400'}`}
              >
                {tab === 'Assets' ? t.assets : t.liabilities}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredAccounts.length === 0 ? (
              <div className="py-20 text-center text-lavender-accent/30">
                <span className="material-symbols-outlined text-6xl animate-float">inventory_2</span>
                <p className="text-xs font-black uppercase tracking-[0.2em] mt-4">{t.noData}</p>
              </div>
            ) : (
              filteredAccounts.map((acc) => (
                <div 
                  key={acc.id} 
                  onClick={() => navigate('/add-account', { state: { editAccount: acc } })}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-5 shadow-soft flex items-center justify-between group transition-all active:scale-[0.98] border border-white/50 hover:border-lavender-accent/20 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-lavender-accent/10 text-lavender-accent flex items-center justify-center group-hover:shadow-glow transition-all">
                      <span className="material-symbols-outlined text-2xl">{acc.icon}</span>
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-slate-900 dark:text-white">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{acc.lastFour ? `**** ${acc.lastFour}` : acc.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-base font-black dark:text-white">¥{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      {acc.changePercent !== 0 ? (
                        <p className={`text-[10px] font-bold ${acc.changePercent > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {acc.changePercent > 0 ? '+' : ''}{acc.changePercent}%
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold text-slate-300">{t.steady}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-lavender-accent dark:text-white uppercase tracking-wider">{t.upcomingBills}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.expectedTotal}: <span className="text-lavender-accent">¥{totalBillsAmount.toLocaleString()}</span></p>
            </div>
            <button 
              onClick={() => navigate('/add-bill')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft text-lavender-accent hover:bg-lavender-accent/5 active:scale-90 transition-all border border-lavender-accent/10"
            >
              <span className="material-symbols-outlined text-2xl">add</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pb-12">
            {bills.length === 0 ? (
              <div className="col-span-2 py-12 text-center bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-3xl border border-dashed border-lavender-accent/20">
                <p className="text-xs font-bold uppercase text-lavender-accent/40">{t.noBills}</p>
              </div>
            ) : (
              bills.map((bill) => (
                <div 
                  key={bill.id} 
                  onClick={() => navigate('/add-bill', { state: { editBill: bill } })}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-3xl p-4 shadow-soft flex flex-col justify-between hover:border-lavender-accent/30 transition-all cursor-pointer border border-white/50 h-36"
                >
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 rounded-xl bg-lavender-accent/10 text-lavender-accent flex items-center justify-center shadow-inner-light">
                      <span className="material-symbols-outlined text-[20px]">{bill.icon}</span>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${bill.timeLeft.toLowerCase().includes('tomorrow') || bill.timeLeft.toLowerCase().includes('today') || bill.timeLeft.includes('明天') || bill.timeLeft.includes('今天') ? 'bg-rose-50 text-rose-500' : 'bg-lavender-accent/5 text-lavender-accent'}`}>
                      {translateTimeLeft(bill.timeLeft)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{translateDate(bill.date)}</p>
                    <p className="text-xs font-black dark:text-white truncate mb-1">{translateBillName(bill.name)}</p>
                    <p className="text-lg font-black text-lavender-accent">¥{bill.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Wallet;
