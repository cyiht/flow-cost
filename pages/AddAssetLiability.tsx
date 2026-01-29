
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Account, Language } from '../types';

const ACCOUNT_ICONS = [
  { name: 'Bank', icon: 'account_balance' },
  { name: 'Savings', icon: 'savings' },
  { name: 'Stock', icon: 'trending_up' },
  { name: 'Card', icon: 'credit_card' },
  { name: 'Cash', icon: 'payments' },
];

interface AddAssetLiabilityProps {
  language: Language;
  onSave: (acc: Account) => void;
}

const AddAssetLiability: React.FC<AddAssetLiabilityProps> = ({ language, onSave }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const editAccount = location.state?.editAccount as Account | undefined;

  const [balance, setBalance] = useState('0');
  const [name, setName] = useState('');
  const [type, setType] = useState<'Asset' | 'Liability'>('Asset');
  const [selectedIcon, setSelectedIcon] = useState('account_balance');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (editAccount) {
      setBalance(editAccount.balance.toString());
      setName(editAccount.name);
      setType(editAccount.type);
      setSelectedIcon(editAccount.icon);
      setDetails(editAccount.details || '');
    }
  }, [editAccount]);

  const handleKeyClick = (key: string) => {
    if (key === 'backspace') {
      setBalance(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (key === '.') {
      if (!balance.includes('.')) setBalance(prev => prev + '.');
    } else {
      setBalance(prev => prev === '0' ? key : prev + key);
    }
  };

  const handleConfirm = () => {
    const numBalance = parseFloat(balance);
    if (numBalance <= 0 || !name.trim()) return;

    const accountData: Account = {
      id: editAccount?.id || crypto.randomUUID(),
      name: name,
      balance: numBalance,
      type: type,
      icon: selectedIcon,
      changePercent: editAccount?.changePercent || 0,
      details: details || (type === 'Asset' ? 'Vault Item' : 'Debt'),
    };

    onSave(accountData);
    navigate('/wallet');
  };

  const t = {
    wallet: language === 'zh' ? '钱包' : 'Wallet',
    header: language === 'zh' ? (editAccount ? '编辑账户' : '添加账户') : (editAccount ? 'Edit Account' : 'Add Account'),
    asset: language === 'zh' ? '资产' : 'Asset',
    liability: language === 'zh' ? '负债' : 'Liability',
    namePlaceholder: language === 'zh' ? '账户名称 (例如：招商银行)' : 'Account Name (e.g. Robinhood)',
    iconLabel: language === 'zh' ? '选择图标' : 'Icon Selection',
    descriptionLabel: language === 'zh' ? '备注' : 'Description',
    detailsPlaceholder: language === 'zh' ? '详情 (可选)' : 'Details (Optional)',
    update: language === 'zh' ? '更新' : 'Update',
    confirm: language === 'zh' ? '确认' : 'Confirm',
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#e3e8e8] text-[#121217] relative overflow-hidden dark:bg-background-dark dark:text-white font-display">
      {/* Soft gradient background effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] bg-emerald-100/40 rounded-full blur-[100px] mix-blend-multiply dark:bg-emerald-900/20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-100/40 rounded-full blur-[80px] mix-blend-multiply dark:bg-blue-900/20"></div>
        <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-purple-100/30 rounded-full blur-[60px] mix-blend-multiply dark:bg-purple-900/20"></div>
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[20px] dark:bg-black/20"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full w-full">
        <header className="flex items-center justify-between px-6 pt-12 pb-2">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-extrabold tracking-widest uppercase text-[#656586]">{t.wallet}</span>
            <span className="text-sm font-bold">{t.header}</span>
          </div>
          <div className="size-10"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full flex flex-col gap-6 animate-fade-in">
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-full p-1 flex mb-6 w-full max-w-[240px] shadow-sm mx-auto">
              {(['Asset', 'Liability'] as const).map(typeKey => (
                <button 
                  key={typeKey}
                  onClick={() => setType(typeKey)}
                  className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${type === typeKey ? 'bg-white dark:bg-gray-700 shadow-sm text-[#121217] dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
                >
                  {typeKey === 'Asset' ? t.asset : t.liability}
                </button>
              ))}
            </div>

            <input 
              type="text"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-0 border-b-2 border-lavender-accent/30 text-3xl font-bold text-center focus:ring-0 focus:border-lavender-accent transition-colors dark:text-white placeholder:text-gray-300"
            />

            <div className="flex flex-col items-center justify-center w-full">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-light text-[#656586]">¥</span>
                <h1 className="text-[56px] font-light tracking-tight leading-none">
                  {balance.split('.')[0]}<span className="text-3xl text-[#656586]">.{balance.split('.')[1] || '00'}</span>
                </h1>
              </div>
            </div>

            <div className="glass-panel rounded-[2.5rem] p-8 bg-white/40 dark:bg-gray-800/40 space-y-6">
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-bold text-[#656586] uppercase tracking-[0.2em]">{t.iconLabel}</p>
                <div className="flex justify-between">
                  {ACCOUNT_ICONS.map(i => (
                    <button 
                      key={i.icon}
                      onClick={() => setSelectedIcon(i.icon)}
                      className={`size-11 flex items-center justify-center rounded-2xl transition-all ${selectedIcon === i.icon ? 'bg-lavender-accent text-white scale-110 shadow-lg' : 'bg-white/40 dark:bg-gray-700 text-gray-400'}`}
                    >
                      <span className="material-symbols-outlined text-xl">{i.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-[#656586] uppercase tracking-[0.2em]">{t.descriptionLabel}</p>
                <input 
                  type="text"
                  placeholder={t.detailsPlaceholder}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-gray-200 dark:border-gray-700 text-sm font-bold focus:ring-0 focus:border-lavender-accent transition-colors dark:text-white"
                />
              </div>
            </div>
          </div>
        </main>

        <section className="grid grid-cols-4 gap-y-2 px-2 pb-8 pt-2">
          {[1,2,3,'clear',4,5,6,'none',7,8,9,'backspace','.',0,'confirm'].map((key, idx) => {
            if (key === 'clear') {
              return (
                <button key={idx} onClick={() => setBalance('0')} className="keypad-btn col-span-1 h-14 flex items-center justify-center dark:text-white">
                  <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
                </button>
              );
            }
            if (key === 'none') return <div key={idx} className="col-span-1"></div>;
            if (key === 'backspace') {
              return (
                <button key={idx} onClick={() => handleKeyClick('backspace')} className="keypad-btn col-span-1 h-14 flex items-center justify-center dark:text-white">
                  <span className="material-symbols-outlined text-[28px]">backspace</span>
                </button>
              );
            }
            if (key === 'confirm') {
              return (
                <button 
                  key={idx} 
                  onClick={handleConfirm}
                  disabled={!name.trim() || parseFloat(balance) <= 0}
                  className="col-span-2 h-14 ml-2 rounded-2xl bg-[#121217] dark:bg-lavender-accent text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-30"
                >
                  <span className="text-lg font-bold mr-2">{editAccount ? t.update : t.confirm}</span>
                  <span className="material-symbols-outlined text-[24px]">check</span>
                </button>
              );
            }
            return (
              <button key={idx} onClick={() => handleKeyClick(key.toString())} className="keypad-btn col-span-1 h-14 flex items-center justify-center text-2xl font-bold dark:text-white">
                {key}
              </button>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default AddAssetLiability;
