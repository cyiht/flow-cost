
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DurableGood, Language, Account, Transaction } from '../types';

interface DurableGoodsProps {
  gear: DurableGood[];
  accounts: Account[];
  transactions: Transaction[];
  language: Language;
  onDelete: (id: string) => void;
}

const DurableGoods: React.FC<DurableGoodsProps> = ({ gear, accounts, transactions, language, onDelete }) => {
  const navigate = useNavigate();
  const [isInventoryCollapsed, setIsInventoryCollapsed] = useState(false);
  const [trendingPeriod, setTrendingPeriod] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const totalVaultValue = gear.reduce((acc, item) => acc + item.originalPrice, 0);
  const avgDailyCost = gear.reduce((acc, item) => acc + item.dailyCost, 0);

  const totalAssets = useMemo(() => 
    accounts.filter(a => a.type === 'Asset').reduce((acc, a) => acc + a.balance, 0), 
  [accounts]);

  const totalLiabilities = useMemo(() => 
    accounts.filter(a => a.type === 'Liability').reduce((acc, a) => acc + a.balance, 0), 
  [accounts]);

  const totalBalance = useMemo(() => Math.max(0, totalAssets - totalLiabilities), [totalAssets, totalLiabilities]);

  // Pie chart calculation
  const liabilityPercent = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  const balancePercent = 100 - liabilityPercent;

  const bjDate = useMemo(() => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  }, []);

  // Shared logic for both Stacked Chart and Line Chart
  const trendData = useMemo(() => {
    const dayMs = 86400000;
    let data: { label: string, expense: number, income: number, surplus: number }[] = [];

    if (trendingPeriod === 'Day') {
      for (let i = 0; i < 8; i++) {
        const start = bjDate.getTime() - (24 - i * 3) * 3600000;
        const end = start + 3 * 3600000;
        const expense = transactions
          .filter(tx => tx.timestamp >= start && tx.timestamp < end && (tx.type === 'debit' || tx.type === 'recurring'))
          .reduce((acc, tx) => acc + tx.amount, 0);
        const income = transactions
          .filter(tx => tx.timestamp >= start && tx.timestamp < end && tx.type === 'credit')
          .reduce((acc, tx) => acc + tx.amount, 0);
        data.push({ 
          label: `${new Date(start).getHours()}h`, 
          expense, 
          income, 
          surplus: Math.max(0, income - expense)
        });
      }
    } else if (trendingPeriod === 'Week') {
      const dayNames = language === 'zh' ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const currentDay = bjDate.getDay(); 
      const daysToMon = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(bjDate);
      monday.setDate(bjDate.getDate() - daysToMon);
      monday.setHours(0,0,0,0);

      for (let i = 0; i < 7; i++) {
        const start = monday.getTime() + i * dayMs;
        const end = start + dayMs;
        const expense = transactions
          .filter(tx => tx.timestamp >= start && tx.timestamp < end && (tx.type === 'debit' || tx.type === 'recurring'))
          .reduce((acc, tx) => acc + tx.amount, 0);
        const income = transactions
          .filter(tx => tx.timestamp >= start && tx.timestamp < end && tx.type === 'credit')
          .reduce((acc, tx) => acc + tx.amount, 0);
        data.push({ 
          label: dayNames[i], 
          expense, 
          income, 
          surplus: Math.max(0, income - expense) 
        });
      }
    } else if (trendingPeriod === 'Month') {
      const startOfMonth = new Date(bjDate.getFullYear(), bjDate.getMonth(), 1).getTime();
      for (let i = 0; i < 4; i++) {
        const start = startOfMonth + i * 7 * dayMs;
        const end = start + 7 * dayMs;
        const expense = transactions
          .filter(tx => tx.timestamp >= start && tx.timestamp < end && (tx.type === 'debit' || tx.type === 'recurring'))
          .reduce((acc, tx) => acc + tx.amount, 0);
        const income = transactions
          .filter(tx => tx.timestamp >= start && tx.timestamp < end && tx.type === 'credit')
          .reduce((acc, tx) => acc + tx.amount, 0);
        data.push({ 
          label: `W${i + 1}`, 
          expense, 
          income, 
          surplus: Math.max(0, income - expense) 
        });
      }
    } else {
      const currentYear = bjDate.getFullYear();
      const monthNames = language === 'zh' ? ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let m = 0; m < 12; m++) {
        const d = new Date(currentYear, m, 1);
        const nextD = new Date(currentYear, m + 1, 1);
        const expense = transactions
          .filter(tx => tx.timestamp >= d.getTime() && tx.timestamp < nextD.getTime() && (tx.type === 'debit' || tx.type === 'recurring'))
          .reduce((acc, tx) => acc + tx.amount, 0);
        const income = transactions
          .filter(tx => tx.timestamp >= d.getTime() && tx.timestamp < nextD.getTime() && tx.type === 'credit')
          .reduce((acc, tx) => acc + tx.amount, 0);
        data.push({ 
          label: monthNames[m], 
          expense, 
          income, 
          surplus: Math.max(0, income - expense) 
        });
      }
    }
    return data;
  }, [trendingPeriod, transactions, bjDate, language]);

  // Line Chart Helper Functions
  const generateLinePath = (dataPoints: number[], maxVal: number) => {
    if (dataPoints.length === 0) return '';
    const width = 200;
    const height = 60;
    const step = width / (dataPoints.length - 1);
    
    let path = `M0,${height - (dataPoints[0] / maxVal) * height}`;
    for (let i = 1; i < dataPoints.length; i++) {
      const x = i * step;
      const y = height - (dataPoints[i] / maxVal) * height;
      const prevX = (i - 1) * step;
      const prevY = height - (dataPoints[i - 1] / maxVal) * height;
      const cp1x = prevX + (step * 0.4);
      const cp2x = x - (step * 0.4);
      path += ` C${cp1x},${prevY} ${cp2x},${y} ${x},${y}`;
    }
    return path;
  };

  const maxVal = useMemo(() => {
    const vals = trendData.flatMap(d => [d.income, d.expense]);
    return Math.max(...vals, 100);
  }, [trendData]);

  const expensePath = useMemo(() => generateLinePath(trendData.map(d => d.expense), maxVal), [trendData, maxVal]);
  const incomePath = useMemo(() => generateLinePath(trendData.map(d => d.income), maxVal), [trendData, maxVal]);

  const handleEdit = (item: DurableGood) => {
    navigate('/add-durable', { state: { editItem: item } });
  };

  const t = {
    header: language === 'zh' ? '洞察' : 'insight',
    board: language === 'zh' ? '看板' : 'Board',
    vault: language === 'zh' ? '资产库' : 'Asset Vault',
    totalValue: language === 'zh' ? '总价值' : 'Total Value',
    dailyBurn: language === 'zh' ? '每日折旧' : 'Daily Burn',
    inventory: language === 'zh' ? '装备清单' : 'Gear Inventory',
    itemsCount: language === 'zh' ? '个项目' : 'Items',
    dayCost: language === 'zh' ? '/ 天折旧' : '/ day cost',
    used: language === 'zh' ? '已用' : 'Used',
    target: language === 'zh' ? '目标' : 'Target',
    value: language === 'zh' ? '价值' : 'Value',
    decayed: language === 'zh' ? '已折旧' : 'Decayed',
    empty: language === 'zh' ? '资产库空空如也。添加资产以跟踪价值。' : 'Your gear vault is empty. Add assets to track value.',
    totalAssets: language === 'zh' ? '总资产' : 'Total Assets',
    totalLiabilities: language === 'zh' ? '总负债' : 'Total Liabilities',
    totalBalance: language === 'zh' ? '总余额' : 'Total Balance',
    expense: language === 'zh' ? '支出' : 'Expense',
    income: language === 'zh' ? '收入' : 'Income',
    surplus: language === 'zh' ? '余额' : 'Surplus',
    thisPeriod: language === 'zh' ? '当前周期' : 'This Period',
    cashFlowTrend: language === 'zh' ? '收支趋势' : 'Cash Flow Trending',
    distribution: language === 'zh' ? '收支分布' : 'Cash Distribution',
  };

  const periodLabels = {
    Day: language === 'zh' ? '日' : 'D',
    Week: language === 'zh' ? '周' : 'W',
    Month: language === 'zh' ? '月' : 'M',
    Year: language === 'zh' ? '年' : 'Y',
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-24 flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 pt-12 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-lavender-accent/5">
        <button onClick={() => navigate('/')} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 dark:text-white transition-colors">
          <span className="material-symbols-outlined font-bold">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-black tracking-[0.15em] uppercase text-lavender-accent">{t.header}</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        {/* Board Section */}
        <div className="px-6 py-4 mt-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lavender-accent filled text-[24px]">grid_view</span>
            <h2 className="text-xl font-bold tracking-tight text-lavender-accent uppercase">{t.board}</h2>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-soft border border-white/50 flex flex-col items-center">
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle className="stroke-lavender-accent" cx="18" cy="18" r="15.915" fill="none" strokeWidth="3" strokeDasharray={`${balancePercent} ${liabilityPercent}`} strokeDashoffset="0" />
                <circle className="stroke-orange-400" cx="18" cy="18" r="15.915" fill="none" strokeWidth="3" strokeDasharray={`${liabilityPercent} ${balancePercent}`} strokeDashoffset={-balancePercent} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.totalAssets}</span>
                <span className="text-xl font-black text-lavender-accent">¥{totalAssets.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="w-full flex justify-center gap-8 px-4">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.totalLiabilities}</span>
                </div>
                <span className="text-sm font-bold text-orange-500">¥{totalLiabilities.toLocaleString()}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-lavender-accent"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.totalBalance}</span>
                </div>
                <span className="text-sm font-bold text-lavender-accent">¥{totalBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* New Line Trend Chart Card */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 shadow-soft border border-white/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold dark:text-white uppercase tracking-tight text-lavender-accent">{t.cashFlowTrend}</h3>
              <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl gap-1">
                {(['Day', 'Week', 'Month', 'Year'] as const).map(p => (
                  <button key={p} onClick={() => { setTrendingPeriod(p); setSelectedIndex(null); }} className={`size-8 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${trendingPeriod === p ? 'bg-white dark:bg-gray-700 text-lavender-accent shadow-sm' : 'text-slate-400'}`}>
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-lavender-accent"></div>
                <span className="text-gray-400">{t.expense}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <span className="text-gray-400">{t.income}</span>
              </div>
            </div>

            <div className="h-36 w-full relative pt-2">
              <svg 
                className="w-full h-full overflow-visible cursor-crosshair" 
                preserveAspectRatio="none" 
                viewBox="0 0 200 60"
                onMouseLeave={() => setSelectedIndex(null)}
              >
                <defs>
                  <linearGradient id="expenseGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7C71C6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#7C71C6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="incomeGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="30" x2="200" y2="30" stroke="currentColor" className="text-lavender-accent/5" strokeWidth="1" strokeDasharray="4 4" />
                
                {/* Income Line */}
                <path d={`${incomePath} L200,60 L0,60 Z`} fill="url(#incomeGradient)" className="transition-all duration-700" />
                <path d={incomePath} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-700" />

                {/* Expense Line */}
                <path d={`${expensePath} L200,60 L0,60 Z`} fill="url(#expenseGradient)" className="transition-all duration-700" />
                <path d={expensePath} fill="none" stroke="#7C71C6" strokeWidth="2.5" strokeLinecap="round" className="transition-all duration-700" />

                {/* Touch Detectors */}
                {trendData.map((d, i) => (
                   <rect
                    key={i}
                    x={i * (200 / (trendData.length - 1)) - 10}
                    y="0"
                    width="20"
                    height="60"
                    fill="transparent"
                    onMouseEnter={() => setSelectedIndex(i)}
                    onTouchStart={() => setSelectedIndex(i)}
                   />
                ))}
                
                {selectedIndex !== null && (
                  <g className="animate-fade-in pointer-events-none">
                    <line x1={selectedIndex * (200 / (trendData.length - 1))} y1="0" x2={selectedIndex * (200 / (trendData.length - 1))} y2="60" stroke="#7C71C6" strokeWidth="0.5" strokeDasharray="2 2" />
                    
                    <circle cx={selectedIndex * (200 / (trendData.length - 1))} cy={60 - (trendData[selectedIndex].expense / maxVal) * 60} r="4" fill="#7C71C6" stroke="white" strokeWidth="1.5" />
                    <circle cx={selectedIndex * (200 / (trendData.length - 1))} cy={60 - (trendData[selectedIndex].income / maxVal) * 60} r="4" fill="#34d399" stroke="white" strokeWidth="1.5" />

                    <foreignObject 
                      x={selectedIndex * (200 / (trendData.length - 1)) > 140 ? selectedIndex * (200 / (trendData.length - 1)) - 70 : selectedIndex * (200 / (trendData.length - 1)) - 35} 
                      y="-10" 
                      width="70" 
                      height="40"
                    >
                      <div className="bg-[#121217] text-white text-[7px] font-black rounded-lg py-1.5 px-2 shadow-xl border border-white/10 flex flex-col gap-0.5 scale-90">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-400">EXP:</span>
                          <span>¥{trendData[selectedIndex].expense.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-emerald-400">INC:</span>
                          <span>¥{trendData[selectedIndex].income.toFixed(0)}</span>
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                )}
              </svg>
              <div className="absolute bottom-[-18px] w-full flex justify-between text-[8px] text-lavender-light font-black px-0.5 uppercase tracking-tighter">
                {trendData.map((d, i) => (
                  <span key={i} className={selectedIndex === i ? 'text-lavender-accent scale-110' : ''}>{d.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Stacked Bar Distribution Chart Card */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 shadow-soft border border-white/50 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold dark:text-white leading-tight">{t.distribution}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">¥{totalAssets.toLocaleString()} <span className="text-[10px] ml-1 opacity-70">Total</span></p>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#121217] dark:bg-lavender-accent"></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t.expense}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full overflow-hidden border border-gray-200 bg-white relative">
                  <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg, #e5e5fa, #e5e5fa 2px, transparent 2px, transparent 5px)' }}></div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t.surplus}</span>
              </div>
            </div>

            <div className="relative h-48 w-full mt-6 flex items-end justify-between px-2 gap-2">
              {trendData.map((d, i) => {
                const effectiveIncome = Math.max(d.income, d.expense, 50); // Visual minimum
                const totalHeight = (effectiveIncome / maxVal) * 100;
                const expenseHeight = (d.expense / effectiveIncome) * 100;
                const surplusHeight = 100 - expenseHeight;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer" onMouseEnter={() => setSelectedIndex(i)} onMouseLeave={() => setSelectedIndex(null)}>
                    <div className="w-full max-w-[40px] rounded-2xl overflow-hidden relative transition-all duration-500 ease-out flex flex-col justify-end bg-gray-50 dark:bg-gray-700/30" style={{ height: `${totalHeight}%` }}>
                      <div className="w-full absolute top-0" style={{ height: `${surplusHeight}%`, background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(124,113,198,0.15) 4px, rgba(124,113,198,0.15) 8px)', backgroundColor: 'rgba(255,255,255,0.8)' }}></div>
                      <div className="w-full bg-[#121217] dark:bg-lavender-accent rounded-t-2xl absolute bottom-0" style={{ height: `${expenseHeight}%` }}></div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-tighter mt-3 ${selectedIndex === i ? 'text-lavender-accent' : 'text-gray-400'}`}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Vault Section */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lavender-accent filled text-[24px]">account_balance</span>
              <h2 className="text-xl font-bold tracking-tight text-lavender-accent uppercase">{t.vault}</h2>
            </div>
            <button onClick={() => navigate('/add-durable')} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#121217] dark:bg-lavender-accent text-white shadow-lg active:scale-95 transition-all">
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            <div className="flex min-w-[160px] flex-1 flex-col justify-between gap-1 rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-white/50">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/30 text-slate-700 dark:text-gray-300">
                  <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.totalValue}</p>
                <p className="text-2xl font-bold tracking-tight dark:text-white">¥{totalVaultValue.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex min-w-[160px] flex-1 flex-col justify-between gap-1 rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-white/50">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/30 text-slate-700 dark:text-gray-300">
                  <span className="material-symbols-outlined text-xl">savings</span>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.dailyBurn}</p>
                <p className="text-2xl font-bold tracking-tight dark:text-white">¥{avgDailyCost.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gear Inventory Section */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lavender-accent filled text-[24px]">inventory_2</span>
            <h2 className="text-xl font-bold tracking-tight text-lavender-accent uppercase">{t.inventory}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500 font-bold uppercase">
              <span>{gear.length} {t.itemsCount}</span>
            </div>
            <button onClick={() => setIsInventoryCollapsed(!isInventoryCollapsed)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-lavender-accent/10 text-lavender-accent transition-all">
              <span className={`material-symbols-outlined transition-transform duration-300 ${isInventoryCollapsed ? '' : 'rotate-180'}`}>expand_more</span>
            </button>
          </div>
        </div>

        {!isInventoryCollapsed && (
          <div className="flex flex-col gap-4 px-6 pb-6 mt-2 animate-fade-in">
            {gear.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-8 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <span className="material-symbols-outlined text-[48px] text-gray-200 dark:text-gray-600 mb-4">shelves</span>
                <p className="text-gray-400 font-medium">{t.empty}</p>
              </div>
            ) : (
              gear.map((item) => {
                const totalTargetDays = item.targetYears * 365.25;
                const amortization = Math.min(100, Math.round((item.usedDays / totalTargetDays) * 100));
                return (
                  <div key={item.id} className="group relative flex flex-col gap-4 rounded-3xl bg-white dark:bg-gray-800 p-5 shadow-soft border border-transparent hover:border-lavender-accent/10 transition-all border border-white/50">
                    <div className="flex gap-4">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                        {item.image ? <img alt={item.name} className="h-full w-full object-cover" src={item.image} /> : <span className="material-symbols-outlined text-gray-300">image</span>}
                      </div>
                      <div className="flex flex-1 flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-[15px] leading-tight text-lavender-accent">{item.name}</h3>
                          <div className="flex gap-1">
                            <button onClick={() => handleEdit(item)} className="p-1 text-gray-400 hover:text-lavender-accent transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
                            <button onClick={() => onDelete(item.id)} className="p-1 text-gray-400 hover:text-rose-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
                          </div>
                        </div>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-xl font-extrabold dark:text-white">¥{item.dailyCost.toFixed(2)}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.dayCost}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-slate-400">{t.used} {item.usedDays} {language === 'zh' ? '天' : 'days'}</span>
                        <span className="text-slate-500">{t.target} {item.targetYears.toFixed(1)}y</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                        <div className="h-full rounded-full bg-lavender-accent transition-all duration-700" style={{ width: `${amortization}%` }}></div>
                      </div>
                      <div className="mt-1 flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        <span>{t.value}: ¥{item.originalPrice.toLocaleString()}</span>
                        <span className="text-lavender-accent font-bold">{amortization}% {t.decayed}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DurableGoods;
