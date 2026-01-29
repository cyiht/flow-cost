
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Entry from './pages/Entry';
import Profile from './pages/Profile';
import DurableGoods from './pages/DurableGoods';
import Wallet from './pages/Wallet';
import AllTransactions from './pages/AllTransactions';
import AddDurable from './pages/AddDurable';
import Messages from './pages/Messages';
import AddBill from './pages/AddBill';
import AddAssetLiability from './pages/AddAssetLiability';
import BottomNav from './components/BottomNav';
import { Transaction, BudgetSettings, DurableGood, UserProfile, Message, Bill, Account, Language } from './types';
import { supabase, hasAnonKey } from './supabaseClient';
import {
  getCurrentProfile,
  getBudget,
  fetchTransactionsRemote,
  fetchDurablesRemote,
  fetchAccountsRemote,
  fetchBillsRemote,
  fetchMessagesRemote,
  upsertBudgetRemote,
  updateProfileRemote,
  insertTransactionRemote,
  updateTransactionRemote,
  upsertDurableRemote,
  deleteDurableRemote,
  upsertBillRemote,
  deleteBillRemote,
  upsertAccountRemote,
  deleteAccountRemote,
  insertMessageRemote,
} from './api';

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'Starbucks Coffee', amount: 35.00, category: 'Food', date: 'Today, 9:41 AM', timestamp: Date.now(), type: 'debit' },
  { id: '2', title: 'Apple Music', amount: 10.00, category: 'Entertainment', date: 'Yesterday', timestamp: Date.now() - 86400000, type: 'recurring', merchant: 'Apple Services' },
  { id: '3', title: 'Freelance Project', amount: 1500.00, category: 'Salary', date: 'Oct 24', timestamp: Date.now() - 172800000, type: 'credit' },
  { id: '4', title: 'Grocery Run', amount: 245.50, category: 'Food', date: 'Oct 23', timestamp: Date.now() - 259200000, type: 'debit' },
  { id: '5', title: 'Subway', amount: 4.00, category: 'Transport', date: 'Oct 23', timestamp: Date.now() - 260000000, type: 'debit' },
];

const INITIAL_BUDGET: BudgetSettings = {
  daily: 400,
  weekly: 2800,
  monthly: 12000,
  yearly: 144000
};

const INITIAL_GEAR: DurableGood[] = [
  { id: '1', name: 'MacBook Pro M3', originalPrice: 12999, dailyCost: 11.87, usedDays: 45, targetYears: 3, status: 'Active', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200' },
  { id: '2', name: 'iPhone 15 Pro', originalPrice: 8999, dailyCost: 12.32, usedDays: 12, targetYears: 2, status: 'New', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200' },
  { id: '3', name: 'Sony WH-1000XM5', originalPrice: 2499, dailyCost: 3.42, usedDays: 180, targetYears: 2, status: 'Review', image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=200' },
];

const INITIAL_ACCOUNTS: Account[] = [
  { id: '1', name: 'Chase Sapphire', balance: 2450.50, changePercent: 12.5, icon: 'credit_card', type: 'Asset', lastFour: '4582' },
  { id: '2', name: 'Amex Gold', balance: -450.00, changePercent: -2.4, icon: 'payments', type: 'Liability', lastFour: '1029', details: 'Payment due in 5 days' },
  { id: '3', name: 'Coinbase', balance: 1240.20, changePercent: 5.8, icon: 'currency_bitcoin', type: 'Asset' },
];

const INITIAL_BILLS: Bill[] = [
  { id: '1', name: 'Rent', amount: 4500.00, date: 'Nov 1', timeLeft: '5 days left', icon: 'home', timestamp: Date.now() + 5 * 86400000 },
  { id: '2', name: 'Electricity', amount: 320.50, date: 'Nov 5', timeLeft: '9 days left', icon: 'bolt', timestamp: Date.now() + 9 * 86400000 },
  { id: '3', name: 'Internet', amount: 199.00, date: 'Nov 10', timeLeft: '14 days left', icon: 'wifi', timestamp: Date.now() + 14 * 86400000 },
];

const INITIAL_MESSAGES: Message[] = [
  { id: '1', title: 'Budget Alert', content: 'You have exceeded your daily budget for Food.', time: '10m ago', icon: 'warning', color: 'text-amber-500 bg-amber-50', timestamp: Date.now() - 600000 },
  { id: '2', title: 'Bill Reminder', content: 'Rent payment is due in 5 days.', time: '1h ago', icon: 'calendar_clock', color: 'text-blue-500 bg-blue-50', timestamp: Date.now() - 3600000 },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [budget, setBudget] = useState<BudgetSettings>(INITIAL_BUDGET);
  const [durableGoods, setDurableGoods] = useState<DurableGood[]>(INITIAL_GEAR);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [user, setUser] = useState<UserProfile>({
    name: 'Abdul Morgan',
    avatar: 'https://picsum.photos/seed/alex/200',
    email: 'abdul.m@flowcost.io',
    income: 8500
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [bootstrapping, setBootstrapping] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const showNav = isAuthenticated && 
    location.pathname !== '/login' && 
    !location.pathname.startsWith('/entry') && 
    !location.pathname.startsWith('/add-durable') && 
    !location.pathname.startsWith('/messages') &&
    !location.pathname.startsWith('/add-bill') &&
    !location.pathname.startsWith('/add-account');

  const ensureAuthAndWarn = () => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session || !hasAnonKey) {
        setIsAuthenticated(false);
        alert(language === 'zh' ? '登录状态已失效，请重新登录。' : 'Session expired, please sign in again.');
        navigate('/login', { replace: true });
      }
    }).catch(() => {
      setIsAuthenticated(false);
      alert(language === 'zh' ? '登录状态检查失败，请重新登录。' : 'Session check failed, please sign in again.');
      navigate('/login', { replace: true });
    });
  };

  useEffect(() => {
    const protectedPrefixes = ['/entry', '/add-durable', '/add-bill', '/add-account'];
    if (!isAuthenticated && protectedPrefixes.some(p => location.pathname.startsWith(p))) {
      alert(language === 'zh' ? '请先登录再进行新增操作。' : 'Please sign in before adding data.');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, location.pathname, language, navigate]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 监听 Supabase 会话，登录后加载云端数据
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsAuthenticated(true);
        await bootstrapData();
      }
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        // Only bootstrap if not already authenticated to avoid double loading
        if (!isAuthenticated) {
          await bootstrapData();
        }
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const bootstrapData = async () => {
    try {
      setBootstrapping(true);
      if (!hasAnonKey) {
        alert(language === 'zh' ? '缺少 Supabase 密钥，暂以本地数据运行。' : 'Supabase key missing, running in local-only mode.');
        return;
      }
      const [
        profile,
        budgetRemote,
        txs,
        durables,
        accountsRemote,
        billsRemote,
        msgs,
      ] = await Promise.all([
        getCurrentProfile(),
        getBudget(),
        fetchTransactionsRemote(),
        fetchDurablesRemote(),
        fetchAccountsRemote(),
        fetchBillsRemote(),
        fetchMessagesRemote(),
      ]);

      if (profile) setUser(profile);
      // Only override local demo data if cloud has meaningful data
      if (budgetRemote && (budgetRemote.daily > 0 || budgetRemote.monthly > 0)) {
        setBudget(budgetRemote);
      }
      
      if (txs && txs.length > 0) setTransactions(txs);
      if (durables && durables.length > 0) setDurableGoods(durables);
      if (accountsRemote && accountsRemote.length > 0) setAccounts(accountsRemote);
      if (billsRemote && billsRemote.length > 0) setBills(billsRemote);
      if (msgs && msgs.length > 0) setMessages(msgs);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Bootstrap data failed', e);
      const msg = String((e as any)?.message || '');
      if (msg.includes('Failed to fetch')) {
        alert(
          language === 'zh'
            ? '云端数据拉取失败：网络异常或 Supabase 配置问题，暂以本地数据运行。'
            : 'Failed to fetch cloud data: network or Supabase config issue. Running locally.'
        );
      }
    } finally {
      setBootstrapping(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const monthlyExpenses = transactions
      .filter(tx => tx.timestamp >= currentMonthStart)
      .reduce((acc, tx) => acc + tx.amount, 0);

    if (monthlyExpenses > budget.monthly) {
      const msgId = `budget-exceeded-${new Date().getMonth()}`;
      if (!messages.find(m => m.id === msgId)) {
        addMessage({
          id: msgId,
          title: language === 'zh' ? '预算警报' : 'Budget Alert',
          content: language === 'zh' ? `您已超过¥${budget.monthly}的月度预算！当前：¥${monthlyExpenses.toFixed(2)}` : `You have exceeded your monthly budget of ¥${budget.monthly}! Current: ¥${monthlyExpenses.toFixed(2)}`,
          time: language === 'zh' ? '刚刚' : 'Just now',
          icon: 'warning',
          color: 'text-amber-500 bg-amber-50',
          timestamp: Date.now()
        });
      }
    }

    durableGoods.forEach(item => {
      const totalTargetDays = item.targetYears * 365.25;
      if (item.usedDays >= totalTargetDays && item.status !== 'Review') {
        const msgId = `gear-expired-${item.id}`;
        if (!messages.find(m => m.id === msgId)) {
          addMessage({
            id: msgId,
            title: language === 'zh' ? '资产警报' : 'Asset Alert',
            content: language === 'zh' ? `${item.name}已达到目标寿命。请考虑更换。` : `${item.name} has reached its target lifespan. Please review for replacement.`,
            time: language === 'zh' ? '刚刚' : 'Just now',
            icon: 'hourglass_empty',
            color: 'text-lavender-accent bg-lavender-accent/10',
            timestamp: Date.now()
          });
        }
      }
    });
  }, [transactions, budget, durableGoods, language]);

  const addMessage = (msg: Message) => {
    setMessages(prev => [msg, ...prev]);
    if (isAuthenticated && hasAnonKey) {
      void insertMessageRemote(msg).catch(err => {
        console.error('insertMessageRemote error', err);
        if (String(err?.message || '').includes('Failed to fetch')) {
          alert(language === 'zh' ? '网络不可用，消息暂未同步到云端。' : 'Network unavailable, message not synced to cloud.');
        }
      });
    }
  };

  const addTransaction = (newTx: Transaction, durableInfo?: { lifespanMonths: number }) => {
    ensureAuthAndWarn();
    setTransactions(prev => [newTx, ...prev]);
    if (isAuthenticated && hasAnonKey) {
      void insertTransactionRemote(newTx).catch(err => {
        console.error('insertTransactionRemote error', err);
        alert(
          language === 'zh'
            ? '交易同步失败：请检查网络或 Supabase 配置。'
            : 'Transaction sync failed: check network or Supabase config.'
        );
      });
    } else {
      alert(
        language === 'zh'
          ? '注意：您未登录或缺少密钥，交易仅保存在本地。'
          : 'Note: Not signed in or missing key, transaction is local only.'
      );
    }

    if (durableInfo) {
      const dailyCost = newTx.amount / (durableInfo.lifespanMonths * 30.41);
      const newDurable: DurableGood = {
        id: crypto.randomUUID(),
        name: newTx.title,
        originalPrice: newTx.amount,
        dailyCost: dailyCost,
        usedDays: 0,
        targetYears: durableInfo.lifespanMonths / 12,
        status: 'New',
        image: `https://picsum.photos/seed/${newTx.id}/200`
      };
      setDurableGoods(prev => [newDurable, ...prev]);
      
      if (isAuthenticated && hasAnonKey) {
        void upsertDurableRemote(newDurable).catch(err => {
          console.error('upsertDurableRemote error', err);
          alert(
            language === 'zh'
              ? '耐用品数据同步失败：请检查网络或重新登录。'
              : 'Durable good sync failed: check network or re-login.'
          );
        });
      } else {
        alert(
          language === 'zh'
            ? '注意：您未登录，耐用品数据仅保存在本地。'
            : 'Note: You are not signed in, durable data is local only.'
        );
      }
    }
  };

  const updateTransaction = (updatedTx: Transaction) => {
    ensureAuthAndWarn();
    setTransactions(prev => prev.map(tx => tx.id === updatedTx.id ? updatedTx : tx));
    if (isAuthenticated && hasAnonKey) {
      void updateTransactionRemote(updatedTx).catch(err => {
        console.error('updateTransactionRemote error', err);
        alert(
          language === 'zh'
            ? '交易更新同步失败：请检查网络或 Supabase 配置。'
            : 'Transaction update sync failed: check network or Supabase config.'
        );
      });
    } else {
      alert(
        language === 'zh'
          ? '注意：您未登录或缺少密钥，交易更新仅在本地。'
          : 'Note: Not signed in or missing key, transaction update is local only.'
      );
    }
  };

  const saveDurableGood = (durable: DurableGood) => {
    ensureAuthAndWarn();
    setDurableGoods(prev => {
      const exists = prev.find(item => item.id === durable.id);
      if (exists) return prev.map(item => item.id === durable.id ? durable : item);
      return [durable, ...prev];
    });
    if (isAuthenticated && hasAnonKey) {
      void upsertDurableRemote(durable).catch(err => {
        console.error('upsertDurableRemote error', err);
        alert(
          language === 'zh'
            ? '保存失败：请先登录或检查网络/Supabase 配置。'
            : 'Save failed: please sign in first or check network/Supabase config.'
        );
      });
    } else {
      alert(
        language === 'zh'
          ? '注意：您未登录，耐用品数据仅保存在本地。'
          : 'Note: You are not signed in, durable data is local only.'
      );
    }
  };

  const deleteDurableGood = (id: string) => {
    setDurableGoods(prev => prev.filter(item => item.id !== id));
    if (isAuthenticated && hasAnonKey) {
      void deleteDurableRemote(id).catch(err => {
        console.error('deleteDurableRemote error', err);
        alert(
          language === 'zh'
            ? '删除失败：请检查网络或 Supabase 配置。'
            : 'Delete failed: check network or Supabase config.'
        );
      });
    } else {
      alert(
        language === 'zh'
            ? '注意：您未登录，删除仅在本地生效。'
            : 'Note: Not signed in, delete is local only.'
      );
    }
  };

  const saveBill = (bill: Bill) => {
    ensureAuthAndWarn();
    setBills(prev => {
      const exists = prev.find(b => b.id === bill.id);
      if (exists) return prev.map(b => b.id === bill.id ? bill : b);
      return [bill, ...prev];
    });
    if (isAuthenticated && hasAnonKey) {
      void upsertBillRemote(bill).catch(err => {
        console.error('upsertBillRemote error', err);
        alert(
          language === 'zh'
            ? '账单同步失败：请检查网络或 Supabase 配置。'
            : 'Bill sync failed: check network or Supabase config.'
        );
      });
    } else {
      alert(
        language === 'zh'
          ? '注意：您未登录或缺少密钥，账单仅保存在本地。'
          : 'Note: Not signed in or missing key, bill is local only.'
      );
    }
  };

  const deleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
    if (isAuthenticated && hasAnonKey) {
      void deleteBillRemote(id).catch(err =>
        console.error('deleteBillRemote error', err),
      );
    }
  };

  const saveAccount = (acc: Account) => {
    ensureAuthAndWarn();
    setAccounts(prev => {
      const exists = prev.find(a => a.id === acc.id);
      if (exists) return prev.map(a => a.id === acc.id ? acc : a);
      return [acc, ...prev];
    });
    if (isAuthenticated && hasAnonKey) {
      void upsertAccountRemote(acc).catch(err => {
        console.error('upsertAccountRemote error', err);
        alert(
          language === 'zh'
            ? '账户同步失败：请检查网络或 Supabase 配置。'
            : 'Account sync failed: check network or Supabase config.'
        );
      });
    } else {
      alert(
        language === 'zh'
          ? '注意：您未登录或缺少密钥，账户仅保存在本地。'
          : 'Note: Not signed in or missing key, account is local only.'
      );
    }
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (isAuthenticated && hasAnonKey) {
      void deleteAccountRemote(id).catch(err => {
        console.error('deleteAccountRemote error', err);
        alert(
          language === 'zh'
            ? '账户删除失败：请检查网络或 Supabase 配置。'
            : 'Account delete failed: check network or Supabase config.'
        );
      });
    } else {
      alert(
        language === 'zh'
            ? '注意：您未登录，账户删除仅在本地生效。'
            : 'Note: Not signed in, account delete is local only.'
      );
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleUpdateBudget = (b: BudgetSettings) => {
    ensureAuthAndWarn();
    setBudget(b);
    if (isAuthenticated && hasAnonKey) {
      void upsertBudgetRemote(b).catch(err => {
        console.error('upsertBudgetRemote error', err);
        alert(
          language === 'zh'
            ? '预算同步失败：请检查网络或 Supabase 配置。'
            : 'Budget sync failed: check network or Supabase config.'
        );
      });
    } else {
      alert(
        language === 'zh'
          ? '注意：您未登录或缺少密钥，预算更新仅在本地。'
          : 'Note: Not signed in or missing key, budget update is local only.'
      );
    }
  };

  const handleUpdateUser = (u: UserProfile) => {
    ensureAuthAndWarn();
    setUser(u);
    if (isAuthenticated && hasAnonKey) {
      void updateProfileRemote(u).catch(err => {
        console.error('updateProfileRemote error', err);
        alert(
          language === 'zh'
            ? '个人资料同步失败：请检查网络或 Supabase 配置。'
            : 'Profile sync failed: check network or Supabase config.'
        );
      });
    } else {
      alert(
        language === 'zh'
          ? '注意：您未登录或缺少密钥，资料更新仅在本地。'
          : 'Note: Not signed in or missing key, profile update is local only.'
      );
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Initiating logout...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
      }
    } catch (err) {
      console.error('Unexpected error during logout:', err);
    } finally {
      console.log('Logout cleanup...');
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(k => {
          if (k.startsWith('sb-') || k.includes('supabase')) {
            localStorage.removeItem(k);
          }
        });
        const skeys = Object.keys(sessionStorage);
        skeys.forEach(k => {
          if (k.startsWith('sb-') || k.includes('supabase')) {
            sessionStorage.removeItem(k);
          }
        });
      } catch {}
      setIsAuthenticated(false);
      navigate('/login', { replace: true });
      if (typeof window !== 'undefined') {
        const target = `${window.location.origin}/#/login`;
        try {
          window.history.replaceState(null, '', target);
        } catch {}
        window.location.hash = '#/login';
        setTimeout(() => {
          if (!window.location.hash.includes('/login')) {
            window.location.replace(target);
          }
        }, 50);
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
        <Routes>
          <Route path="/login" element={<Login language={language} onLogin={() => setIsAuthenticated(true)} />} />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Dashboard
                  language={language}
                  user={user}
                  onUpdateUser={handleUpdateUser}
                  transactions={transactions}
                  budget={budget}
                  onUpdateBudget={handleUpdateBudget}
                />
              ) : (
                <Login language={language} onLogin={() => setIsAuthenticated(true)} />
              )
            }
          />
          <Route path="/entry" element={<Entry language={language} onAddTransaction={addTransaction} />} />
          <Route
            path="/transactions"
            element={
              isAuthenticated ? (
                <AllTransactions language={language} transactions={transactions} onUpdateTransaction={updateTransaction} />
              ) : (
                <Login language={language} onLogin={() => setIsAuthenticated(true)} />
              )
            }
          />
          <Route
            path="/profile"
            element={
              isAuthenticated ? (
                <Profile
                  language={language}
                  user={user}
                  theme={theme}
                  onUpdateUser={handleUpdateUser}
                  onToggleTheme={toggleTheme}
                  onToggleLanguage={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
                  onLogout={handleLogout}
                  transactions={transactions}
                  durableGoods={durableGoods}
                  bills={bills}
                  accounts={accounts}
                />
              ) : (
                <Login language={language} onLogin={() => setIsAuthenticated(true)} />
              )
            }
          />
          <Route
            path="/durable"
            element={
              isAuthenticated ? (
                <DurableGoods language={language} gear={durableGoods} accounts={accounts} transactions={transactions} onDelete={deleteDurableGood} />
              ) : (
                <Login language={language} onLogin={() => setIsAuthenticated(true)} />
              )
            }
          />
          <Route
            path="/add-durable"
            element={<AddDurable language={language} onAddDurable={saveDurableGood} />}
          />
          <Route
            path="/messages"
            element={
              isAuthenticated ? (
                <Messages language={language} messages={messages} />
              ) : (
                <Login language={language} onLogin={() => setIsAuthenticated(true)} />
              )
            }
          />
          <Route
            path="/wallet"
            element={
              isAuthenticated ? (
                <Wallet language={language} accounts={accounts} bills={bills} onDeleteAccount={deleteAccount} onDeleteBill={deleteBill} />
              ) : (
                <Login language={language} onLogin={() => setIsAuthenticated(true)} />
              )
            }
          />
          <Route path="/add-bill" element={<AddBill language={language} onSave={saveBill} />} />
          <Route path="/add-account" element={<AddAssetLiability language={language} onSave={saveAccount} />} />
        </Routes>
      </div>
      {showNav && <BottomNav language={language} />}
    </div>
  );
};

export default App;
