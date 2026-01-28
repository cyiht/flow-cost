
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
import { supabase } from './supabaseClient';
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
  { id: '1', title: 'Morning Coffee', amount: 5.40, category: 'Food', date: '08:30 AM', timestamp: Date.now(), type: 'debit', merchant: 'Starbucks' },
  { id: '2', title: 'Weekly Groceries', amount: 124.50, category: 'Food', date: 'Yesterday', timestamp: Date.now() - 86400000, type: 'credit', merchant: 'Whole Foods' },
  { id: '3', title: 'Netflix Sub', amount: 14.99, category: 'Entertainment', date: 'May 22', timestamp: Date.now() - 172800000, type: 'recurring', merchant: 'Netflix' },
  { id: '4', title: 'Gym Membership', amount: 45.00, category: 'Health', date: 'May 20', timestamp: Date.now() - 345600000, type: 'recurring', merchant: 'Gold Gym' },
];

const INITIAL_BUDGET: BudgetSettings = {
  daily: 50,
  weekly: 300,
  monthly: 1200,
  yearly: 14000
};

const INITIAL_GEAR: DurableGood[] = [
  { id: '1', name: 'Sony A7IV Camera', originalPrice: 2500, dailyCost: 1.37, usedDays: 1000, targetYears: 5, status: 'Active', image: 'https://picsum.photos/seed/camera/200' },
  { id: '2', name: 'MacBook Pro M2', originalPrice: 2000, dailyCost: 1.37, usedDays: 365, targetYears: 4, status: 'Active', image: 'https://picsum.photos/seed/laptop/200' },
  { id: '3', name: 'Herman Miller Aeron', originalPrice: 1000, dailyCost: 0.55, usedDays: 1200, targetYears: 5, status: 'Review', image: 'https://picsum.photos/seed/chair/200' },
];

const INITIAL_ACCOUNTS: Account[] = [
  { id: '1', name: 'Chase Checking', balance: 8450.00, changePercent: 2.5, icon: 'account_balance', type: 'Asset', lastFour: '4582' },
  { id: '2', name: 'Savings Pot', balance: 24000.00, changePercent: 0.0, icon: 'savings', type: 'Asset', details: 'APY 4.5%' },
  { id: '3', name: 'Investment', balance: 12781.89, changePercent: 1.2, icon: 'trending_up', type: 'Asset', details: 'Robinhood' },
  { id: '4', name: 'Credit Card', balance: 2450.00, changePercent: 1.2, icon: 'credit_card', type: 'Liability', details: 'Amex' },
];

const INITIAL_BILLS: Bill[] = [
  { id: '1', name: 'Rent', amount: 2400, date: 'Oct 24', timeLeft: '2d left', icon: 'home', timestamp: Date.now() + 172800000 },
  { id: '2', name: 'Netflix', amount: 15.99, date: 'Oct 23', timeLeft: 'Tomorrow', icon: 'subscriptions', timestamp: Date.now() + 86400000 },
  { id: '3', name: 'Insurance', amount: 120.00, date: 'Oct 27', timeLeft: '5d left', icon: 'health_and_safety', timestamp: Date.now() + 432000000 },
];

const INITIAL_MESSAGES: Message[] = [
  { id: 'm1', title: 'Welcome', content: 'Welcome to FlowCost! Start tracking your assets.', time: 'Now', icon: 'waving_hand', color: 'text-blue-500 bg-blue-50', timestamp: Date.now() }
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
  const showNav = isAuthenticated && 
    location.pathname !== '/login' && 
    !location.pathname.startsWith('/entry') && 
    !location.pathname.startsWith('/add-durable') && 
    !location.pathname.startsWith('/messages') &&
    !location.pathname.startsWith('/add-bill') &&
    !location.pathname.startsWith('/add-account');

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
        await bootstrapData();
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
      if (budgetRemote) setBudget(budgetRemote);
      if (txs.length) setTransactions(txs);
      if (durables.length) setDurableGoods(durables);
      if (accountsRemote.length) setAccounts(accountsRemote);
      if (billsRemote.length) setBills(billsRemote);
      if (msgs.length) setMessages(msgs);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Bootstrap data failed', e);
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
    void insertMessageRemote(msg).catch(err =>
      // eslint-disable-next-line no-console
      console.error('insertMessageRemote error', err),
    );
  };

  const addTransaction = (newTx: Transaction, durableInfo?: { lifespanMonths: number }) => {
    setTransactions(prev => [newTx, ...prev]);
    void insertTransactionRemote(newTx).catch(err =>
      // eslint-disable-next-line no-console
      console.error('insertTransactionRemote error', err),
    );

    if (durableInfo) {
      const dailyCost = newTx.amount / (durableInfo.lifespanMonths * 30.41);
      const newDurable: DurableGood = {
        id: `d-${newTx.id}`,
        name: newTx.title,
        originalPrice: newTx.amount,
        dailyCost: dailyCost,
        usedDays: 0,
        targetYears: durableInfo.lifespanMonths / 12,
        status: 'New',
        image: `https://picsum.photos/seed/${newTx.id}/200`
      };
      setDurableGoods(prev => [newDurable, ...prev]);
      void upsertDurableRemote(newDurable).catch(err =>
        // eslint-disable-next-line no-console
        console.error('upsertDurableRemote error', err),
      );
    }
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(tx => tx.id === updatedTx.id ? updatedTx : tx));
    void updateTransactionRemote(updatedTx).catch(err =>
      // eslint-disable-next-line no-console
      console.error('updateTransactionRemote error', err),
    );
  };

  const saveDurableGood = (durable: DurableGood) => {
    setDurableGoods(prev => {
      const exists = prev.find(item => item.id === durable.id);
      if (exists) return prev.map(item => item.id === durable.id ? durable : item);
      return [durable, ...prev];
    });
    void upsertDurableRemote(durable).catch(err =>
      // eslint-disable-next-line no-console
      console.error('upsertDurableRemote error', err),
    );
  };

  const deleteDurableGood = (id: string) => {
    setDurableGoods(prev => prev.filter(item => item.id !== id));
    void deleteDurableRemote(id).catch(err =>
      // eslint-disable-next-line no-console
      console.error('deleteDurableRemote error', err),
    );
  };

  const saveBill = (bill: Bill) => {
    setBills(prev => {
      const exists = prev.find(b => b.id === bill.id);
      if (exists) return prev.map(b => b.id === bill.id ? bill : b);
      return [bill, ...prev];
    });
    void upsertBillRemote(bill).catch(err =>
      // eslint-disable-next-line no-console
      console.error('upsertBillRemote error', err),
    );
  };

  const deleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
    void deleteBillRemote(id).catch(err =>
      // eslint-disable-next-line no-console
      console.error('deleteBillRemote error', err),
    );
  };

  const saveAccount = (acc: Account) => {
    setAccounts(prev => {
      const exists = prev.find(a => a.id === acc.id);
      if (exists) return prev.map(a => a.id === acc.id ? acc : a);
      return [acc, ...prev];
    });
    void upsertAccountRemote(acc).catch(err =>
      // eslint-disable-next-line no-console
      console.error('upsertAccountRemote error', err),
    );
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    void deleteAccountRemote(id).catch(err =>
      // eslint-disable-next-line no-console
      console.error('deleteAccountRemote error', err),
    );
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleUpdateBudget = (b: BudgetSettings) => {
    setBudget(b);
    void upsertBudgetRemote(b).catch(err =>
      // eslint-disable-next-line no-console
      console.error('upsertBudgetRemote error', err),
    );
  };

  const handleUpdateUser = (u: UserProfile) => {
    setUser(u);
    void updateProfileRemote(u).catch(err =>
      // eslint-disable-next-line no-console
      console.error('updateProfileRemote error', err),
    );
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
          <Route path="/transactions" element={<AllTransactions language={language} transactions={transactions} onUpdateTransaction={updateTransaction} />} />
          <Route path="/profile" element={<Profile language={language} user={user} theme={theme} onUpdateUser={handleUpdateUser} onToggleTheme={toggleTheme} onToggleLanguage={() => setLanguage(l => l === 'en' ? 'zh' : 'en')} />} />
          <Route path="/durable" element={<DurableGoods language={language} gear={durableGoods} accounts={accounts} transactions={transactions} onDelete={deleteDurableGood} />} />
          <Route path="/add-durable" element={<AddDurable language={language} onAddDurable={saveDurableGood} />} />
          <Route path="/messages" element={<Messages language={language} messages={messages} />} />
          <Route path="/wallet" element={<Wallet language={language} accounts={accounts} bills={bills} onDeleteAccount={deleteAccount} onDeleteBill={deleteBill} />} />
          <Route path="/add-bill" element={<AddBill language={language} onSave={saveBill} />} />
          <Route path="/add-account" element={<AddAssetLiability language={language} onSave={saveAccount} />} />
        </Routes>
      </div>
      {showNav && <BottomNav language={language} />}
    </div>
  );
};

export default App;
