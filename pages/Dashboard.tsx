import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, BudgetSettings, UserProfile, Language } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  budget: BudgetSettings;
  user: UserProfile;
  language: Language;
  onUpdateUser: (u: UserProfile) => void;
  onUpdateBudget: (newBudget: BudgetSettings) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, budget, user, language, onUpdateUser, onUpdateBudget }) => {
  const navigate = useNavigate();
  const [trendingPeriod, setTrendingPeriod] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Weekly');
  const [budgetPeriod, setBudgetPeriod] = useState<keyof BudgetSettings>('monthly');
  const [recentTab, setRecentTab] = useState<'Expense' | 'Income'>('Expense');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [tempBudgetValue, setTempBudgetValue] = useState('');
  const [tempIncomeValue, setTempIncomeValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const bjDate = useMemo(() => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  }, []);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedDate = `${monthNames[bjDate.getMonth()]} ${bjDate.getDate()}`;

  const greeting = useMemo(() => {
    const hours = bjDate.getHours();
    if (hours >= 5 && hours < 12) return language === 'zh' ? '早上好' : 'Good Morning';
    if (hours >= 12 && hours < 18) return language === 'zh' ? '下午好' : 'Good Afternoon';
    return language === 'zh' ? '晚上好' : 'Good Evening';
  }, [bjDate, language]);

  const monthlyExpenses = useMemo(() => {
    const startOfMonth = new Date(bjDate.getFullYear(), bjDate.getMonth(), 1).getTime();
    return transactions
      .filter(tx => tx.timestamp >= startOfMonth && (tx.type === 'debit' || tx.type === 'recurring'))
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions, bjDate]);

  const monthlyIncome = useMemo(() => {
    const startOfMonth = new Date(bjDate.getFullYear(), bjDate.getMonth(), 1).getTime();
    return transactions
      .filter(tx => tx.timestamp >= startOfMonth && tx.type === 'credit')
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions, bjDate]);

  const spentInPeriod = useMemo(() => {
    const nowTs = Date.now();
    let startTs = 0;
    
    if (budgetPeriod === 'daily') startTs = new Date().setHours(0,0,0,0);
    else if (budgetPeriod === 'weekly') startTs = nowTs - 7 * 86400000;
    else if (budgetPeriod === 'monthly') startTs = new Date(bjDate.getFullYear(), bjDate.getMonth(), 1).getTime();
    else if (budgetPeriod === 'yearly') startTs = new Date(bjDate.getFullYear(), 0, 1).getTime();

    return transactions
      .filter(tx => tx.timestamp >= startTs && (tx.type === 'debit' || tx.type === 'recurring'))
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions, budgetPeriod, bjDate]);

  const budgetProgress = Math.min(100, Math.round((spentInPeriod / budget[budgetPeriod]) * 100)) || 0;

  const toggleTrending = () => {
    setSelectedIndex(null);
    setTrendingPeriod(prev => 
      prev === 'Weekly' ? 'Monthly' : 
      prev === 'Monthly' ? 'Yearly' : 'Weekly'
    );
  };

  const handleUpdateBudget = () => {
    const val = parseFloat(tempBudgetValue);
    if (!isNaN(val) && val > 0) {
      onUpdateBudget({ ...budget, [budgetPeriod]: val });
      setIsEditingBudget(false);
    }
  };

  const handleUpdateIncome = () => {
    const val = parseFloat(tempIncomeValue);
    if (!isNaN(val) && val >= 0) {
      onUpdateUser({ ...user, income: val });
      setIsEditingIncome(false);
    }
  };

  const chartData = useMemo(() => {
    const dayMs = 86400000;
    let dataPoints: number[] = [];
    let labels: string[] = [];

    if (trendingPeriod === 'Weekly') {
      const currentDay = bjDate.getDay(); 
      const daysToMon = currentDay === 0 ? 6 : currentDay - 1;
      const monday = new Date(bjDate);
      monday.setDate(bjDate.getDate() - daysToMon);
      monday.setHours(0,0,0,0);

      const dayNames = ['1', '2', '3', '4', '5', '6', '7'];
      for (let i = 0; i < 7; i++) {
        const start = monday.getTime() + i * dayMs;
        const end = start + dayMs;
        const sum = transactions
          .filter(tx => tx.timestamp >= start && tx.timestamp < end && (tx.type === 'debit' || tx.type === 'recurring'))
          .reduce((acc, tx) => acc + tx.amount, 0);
        dataPoints.push(sum);
        labels.push(dayNames[i]);
      }
    } else if (trendingPeriod === 'Monthly') {
      const startOfMonth = new Date(bjDate.getFullYear(), bjDate.getMonth(), 1).getTime();
      for (let i = 0; i < 4; i++) {
        const start = startOfMonth + i * 7 * dayMs;
        const end = start + 7 * dayMs;
        const sum = transactions
          .filter(tx => tx.timestamp >= start && tx.timestamp < end && (tx.type === 'debit' || tx.type === 'recurring'))
          .reduce((acc, tx) => acc + tx.amount, 0);
        dataPoints.push(sum);
        labels.push(`w${i + 1}`);
      }
    } else {
      const currentYear = bjDate.getFullYear();
      for (let m = 0; m < 12; m++) {
        const d = new Date(currentYear, m, 1);
        const nextD = new Date(currentYear, m + 1, 1);
        const sum = transactions
          .filter(tx => tx.timestamp >= d.getTime() && tx.timestamp < nextD.getTime() && (tx.type === 'debit' || tx.type === 'recurring'))
          .reduce((acc, tx) => acc + tx.amount, 0);
        dataPoints.push(sum);
        labels.push((m + 1).toString());
      }
    }

    const maxVal = Math.max(...dataPoints, 50); 
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

    const points = dataPoints.map((val, i) => ({
      x: i * step,
      y: height - (val / maxVal) * height,
      value: val,
      label: labels[i]
    }));

    return { path, labels, dataPoints, maxVal, points, step };
  }, [trendingPeriod, transactions, bjDate]);

  const handleChartInteraction = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX : e.clientX;
    const relativeX = ((x - rect.left) / rect.width) * 200;
    
    const index = Math.round(relativeX / chartData.step);
    if (index >= 0 && index < chartData.dataPoints.length) {
      setSelectedIndex(index);
    }
  };

  const t = {
    totalBalance: language === 'zh' ? '本月总余额' : 'Total Monthly Balance',
    income: language === 'zh' ? '收入' : 'INCOME',
    expense: language === 'zh' ? '支出' : 'EXPENSE',
    budgetLimit: language === 'zh' ? '预算限制' : 'BUDGET LIMIT',
    recentTransactions: language === 'zh' ? '最近记录' : 'Recent Records',
    recentIncome: language === 'zh' ? '最近收入' : 'Recent Income',
    recentExpense: language === 'zh' ? '最近消费' : 'Recent Expenses',
    seeAll: language === 'zh' ? '查看全部' : 'SEE ALL',
    trendingTitle: language === 'zh' ? `${trendingPeriod === 'Weekly' ? '周' : trendingPeriod === 'Monthly' ? '月' : '年'}度支出趋势` : `${trendingPeriod} EXPENSE TRENDING`,
    setLimit: language === 'zh' ? '设置限制' : 'Set Limit',
    updateIncome: language === 'zh' ? '更新月收入' : 'Update Monthly Income',
    amount: language === 'zh' ? '数额' : 'Amount',
    periods: {
      daily: language === 'zh' ? '每日' : 'DAILY',
      weekly: language === 'zh' ? '每周' : 'WEEKLY',
      monthly: language === 'zh' ? '每月' : 'MONTHLY',
      yearly: language === 'zh' ? '每年' : 'YEARLY',
    }
  };

  const filteredRecent = transactions.filter(tx => {
    if (recentTab === 'Income') return tx.type === 'credit';
    return tx.type === 'debit' || tx.type === 'recurring';
  }).slice(0, 4);

  return (
    <div className="flex flex-col h-full bg-transparent pb-24 overflow-hidden">
      <header className="pt-12 pb-6 px-6 flex items-center justify-between sticky top-0 z-50 bg-transparent backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-lavender-accent to-lavender-light p-[2px] shadow-glow">
            <img alt="User" className="h-full w-full rounded-full border-2 border-white dark:border-background-dark object-cover" src={user.avatar} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{greeting},</p>
            <h1 className="text-xl font-extrabold dark:text-white">{user.name.split(' ')[0]}!</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/messages')} className="p-2 rounded-full glass-panel shadow-soft text-lavender-accent">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
        </div>
      </header>

      <main className="px-5 space-y-6 flex-1 overflow-y-auto no-scrollbar">
        <div className="bg-card-gradient rounded-3xl p-8 text-white shadow-btn-glow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-700"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-12 -mb-12"></div>
          
          <div className="absolute top-6 right-6 flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-inner-light">
            <span className="material-symbols-outlined text-sm text-lime-accent filled">trending_up</span>
            <span className="text-xs font-bold">+2.4%</span>
          </div>
          
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium mb-1 tracking-wide">{t.totalBalance}</p>
            <h2 className="text-4xl font-bold tracking-tight mb-10 flex items-baseline">
              <span className="text-2xl mr-1">¥</span>
              {(monthlyIncome + user.income - monthlyExpenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            
            <div className="flex justify-between items-end">
              <div className="flex gap-6">
                <div 
                  className="cursor-pointer group/item transition-opacity hover:opacity-80"
                  onClick={() => {
                    setTempIncomeValue(user.income.toString());
                    setIsEditingIncome(true);
                  }}
                >
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1">{t.income}</p>
                  <p className="font-bold text-[15px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-lime-accent">arrow_downward</span> ¥{(user.income + monthlyIncome).toLocaleString()}
                  </p>
                </div>
                <div 
                  className="cursor-pointer group/item transition-opacity hover:opacity-80"
                  onClick={() => navigate('/transactions')}
                >
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1">{t.expense}</p>
                  <p className="font-bold text-[15px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-rose-300">arrow_upward</span> ¥{monthlyExpenses.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-lg px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-inner-light">
                <span className="material-symbols-outlined text-lg">calendar_month</span>
                <span className="text-sm font-bold">{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-3xl p-5 shadow-soft flex flex-col items-center justify-between border border-white/40">
            <div className="flex items-center justify-between w-full">
              <div 
                className="flex items-center gap-0.5 cursor-pointer hover:bg-lavender-accent/5 rounded-lg px-2 py-1 transition-colors"
                onClick={() => {
                  const options: (keyof BudgetSettings)[] = ['daily', 'weekly', 'monthly', 'yearly'];
                  const idx = options.indexOf(budgetPeriod);
                  setBudgetPeriod(options[(idx + 1) % options.length]);
                }}
              >
                <h3 className="text-[10px] font-bold uppercase text-lavender-accent leading-none tracking-tight">{t.periods[budgetPeriod]}</h3>
                <span className="material-symbols-outlined text-[16px] text-lavender-accent">arrow_drop_down</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setTempBudgetValue(budget[budgetPeriod].toString());
                  setIsEditingBudget(true);
                }}
                className="material-symbols-outlined text-[18px] text-lavender-light hover:text-lavender-accent transition-colors"
              >
                edit
              </button>
            </div>

            <div className="relative w-24 h-24 my-2 group">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle className="stroke-lavender-accent/10 dark:stroke-gray-700" cx="18" cy="18" r="16" fill="none" strokeWidth="4" />
                <circle 
                  className="stroke-lavender-accent transition-all duration-1000" 
                  cx="18" cy="18" r="16" fill="none" strokeWidth="4" 
                  strokeDasharray={`${budgetProgress}, 100`} 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col group-hover:scale-110 transition-transform">
                <span className="text-xl font-black text-lavender-accent dark:text-white">{budgetProgress}%</span>
              </div>
            </div>
            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter text-center whitespace-nowrap overflow-hidden">
              {t.budgetLimit}: ¥{budget[budgetPeriod]}
            </p>
          </div>

          <div className="col-span-7 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-3xl p-5 shadow-soft border border-white/40 overflow-hidden">
            <div 
              className="flex justify-between items-center mb-4 cursor-pointer group"
              onClick={toggleTrending}
            >
              <div className="flex items-center gap-1 w-full overflow-hidden">
                <h3 className="text-[9px] font-extrabold dark:text-white uppercase tracking-tighter text-lavender-accent whitespace-nowrap overflow-hidden">
                  {t.trendingTitle}
                </h3>
                <span className="material-symbols-outlined text-lavender-light text-sm group-hover:text-lavender-accent transition-colors flex-shrink-0">arrow_drop_down</span>
              </div>
            </div>
            <div className="h-28 w-full relative pt-2">
              <svg 
                className="w-full h-full overflow-visible cursor-crosshair" 
                preserveAspectRatio="none" 
                viewBox="0 0 200 60"
                onClick={handleChartInteraction}
                onTouchStart={handleChartInteraction}
                onMouseLeave={() => setSelectedIndex(null)}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7C71C6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#7C71C6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="30" x2="200" y2="30" stroke="currentColor" className="text-lavender-accent/10" strokeWidth="1" strokeDasharray="4 4" />
                
                <path d={`${chartData.path} L200,60 L0,60 Z`} fill="url(#chartGradient)" className="transition-all duration-700" />
                <path d={chartData.path} fill="none" stroke="#7C71C6" strokeWidth="4.0" strokeLinecap="round" className="transition-all duration-700" />
                
                {selectedIndex !== null && (
                  <g className="animate-fade-in">
                    <line 
                      x1={chartData.points[selectedIndex].x} 
                      y1="0" 
                      x2={chartData.points[selectedIndex].x} 
                      y2="60" 
                      stroke="#7C71C6" 
                      strokeWidth="1" 
                      strokeDasharray="2 2"
                      opacity="0.5"
                    />
                    <circle 
                      cx={chartData.points[selectedIndex].x} 
                      cy={chartData.points[selectedIndex].y} 
                      r="5" 
                      fill="#7C71C6" 
                      stroke="white"
                      strokeWidth="2"
                    />
                    <foreignObject 
                      x={chartData.points[selectedIndex].x > 150 ? chartData.points[selectedIndex].x - 60 : chartData.points[selectedIndex].x - 30} 
                      y={chartData.points[selectedIndex].y - 35} 
                      width="60" 
                      height="30"
                    >
                      <div className="bg-[#121217] text-white text-[8px] font-black rounded-lg py-1 px-2 shadow-lg text-center border border-white/10 flex flex-col scale-90">
                        <span>¥{chartData.points[selectedIndex].value.toFixed(0)}</span>
                      </div>
                    </foreignObject>
                  </g>
                )}
              </svg>
              <div className="absolute bottom-[-18px] w-full flex justify-between text-[8px] text-lavender-light font-black px-0.5 uppercase tracking-tighter">
                {chartData.labels.map((l, idx) => (
                  <span key={idx} className={selectedIndex === idx ? 'text-lavender-accent scale-125 transition-transform' : 'transition-transform'}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 shadow-soft border border-white/50 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button 
                onClick={() => setRecentTab('Expense')}
                className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${recentTab === 'Expense' ? 'text-lavender-accent' : 'text-gray-400'}`}
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                {t.recentExpense}
              </button>
              <button 
                onClick={() => setRecentTab('Income')}
                className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${recentTab === 'Income' ? 'text-lavender-accent' : 'text-gray-400'}`}
              >
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                {t.recentIncome}
              </button>
            </div>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-[10px] font-black text-lavender-accent uppercase tracking-[0.2em] bg-lavender-accent/10 px-3 py-1.5 rounded-full"
            >
              {t.seeAll}
            </button>
          </div>
          
          <div className="space-y-6">
            {filteredRecent.length === 0 ? (
              <div className="py-10 text-center text-gray-400 font-medium italic text-xs">
                {language === 'zh' ? '暂无记录' : 'No records yet'}
              </div>
            ) : (
              filteredRecent.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:shadow-glow ${
                      tx.type === 'credit' ? 'bg-emerald-50 text-emerald-500' :
                      tx.category === 'Food' ? 'bg-orange-50 text-orange-500' :
                      tx.category === 'Entertainment' ? 'bg-blue-50 text-blue-500' :
                      tx.category === 'Health' ? 'bg-rose-50 text-rose-500' :
                      'bg-lavender-accent/10 text-lavender-accent'
                    }`}>
                      <span className="material-symbols-outlined text-2xl">
                        {tx.type === 'credit' ? 'add_card' :
                         tx.category === 'Food' ? 'local_cafe' : 
                         tx.category === 'Entertainment' ? 'movie' : 
                         tx.category === 'Health' ? 'medical_services' : 'receipt_long'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-lavender-accent">{tx.title}</h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">{tx.merchant} • {tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-extrabold text-sm ${tx.type === 'credit' ? 'text-emerald-500' : 'dark:text-gray-100'}`}>
                      {tx.type === 'credit' ? '+' : '-'}¥{tx.amount.toFixed(2)}
                    </p>
                    <span className="text-[9px] bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-400 font-bold uppercase tracking-widest">{tx.category || tx.type}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {isEditingBudget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-lavender-accent/20 backdrop-blur-xl" onClick={() => setIsEditingBudget(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 w-full max-w-xs rounded-3xl p-8 shadow-2xl animate-scale-in border border-white/50">
            <h4 className="text-lg font-bold mb-4 capitalize dark:text-white text-center text-lavender-accent">{t.setLimit} ({t.periods[budgetPeriod]})</h4>
            <input 
              type="number"
              autoFocus
              value={tempBudgetValue}
              onChange={(e) => setTempBudgetValue(e.target.value)}
              className="w-full bg-lavender-accent/5 dark:bg-gray-700 border-none rounded-2xl py-5 px-6 font-black text-3xl text-center focus:ring-2 focus:ring-lavender-accent dark:text-white text-lavender-accent"
              placeholder="0.00"
            />
            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsEditingBudget(false)} className="flex-1 py-4 font-bold text-gray-400">{language === 'zh' ? '取消' : 'Cancel'}</button>
              <button onClick={handleUpdateBudget} className="flex-1 bg-lavender-accent py-4 rounded-2xl font-bold text-white shadow-btn-glow active:scale-95 transition-transform">{language === 'zh' ? '保存' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {isEditingIncome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-lavender-accent/20 backdrop-blur-xl" onClick={() => setIsEditingIncome(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 w-full max-w-xs rounded-3xl p-8 shadow-2xl animate-scale-in border border-white/50">
            <h4 className="text-lg font-bold mb-4 dark:text-white text-center text-lavender-accent">{t.updateIncome}</h4>
            <input 
              type="number"
              autoFocus
              value={tempIncomeValue}
              onChange={(e) => setTempIncomeValue(e.target.value)}
              className="w-full bg-lavender-accent/5 dark:bg-gray-700 border-none rounded-2xl py-5 px-6 font-black text-3xl text-center focus:ring-2 focus:ring-lavender-accent dark:text-white text-lavender-accent"
              placeholder="0.00"
            />
            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsEditingIncome(false)} className="flex-1 py-4 font-bold text-gray-400">{language === 'zh' ? '取消' : 'Cancel'}</button>
              <button onClick={handleUpdateIncome} className="flex-1 bg-lavender-accent py-4 rounded-2xl font-bold text-white shadow-btn-glow active:scale-95 transition-transform">{language === 'zh' ? '更新' : 'Update'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;