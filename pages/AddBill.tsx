
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bill, Language } from '../types';

const BILL_ICONS = [
  { name: 'Home', icon: 'home' },
  { name: 'Media', icon: 'subscriptions' },
  { name: 'Health', icon: 'health_and_safety' },
  { name: 'Utils', icon: 'bolt' },
];

interface AddBillProps {
  language: Language;
  onSave: (bill: Bill) => void;
}

const AddBill: React.FC<AddBillProps> = ({ language, onSave }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const editBill = location.state?.editBill as Bill | undefined;

  const [amount, setAmount] = useState('0');
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('home');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (editBill) {
      setAmount(editBill.amount.toString());
      setName(editBill.name);
      setSelectedIcon(editBill.icon);
      if (editBill.timestamp) {
        setSelectedDate(new Date(editBill.timestamp).toISOString().split('T')[0]);
      }
    }
  }, [editBill]);

  const handleKeyClick = (key: string) => {
    if (key === 'backspace') {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (key === '.') {
      if (!amount.includes('.')) setAmount(prev => prev + '.');
    } else {
      setAmount(prev => prev === '0' ? key : prev + key);
    }
  };

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    if (numAmount <= 0 || !name.trim()) return;

    const dateObj = new Date(selectedDate);
    const month = dateObj.toLocaleString('default', { month: 'short' });
    const day = dateObj.getDate();
    
    const diffTime = dateObj.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let timeLeft = '';
    if (diffDays === 0) timeLeft = language === 'zh' ? '今天截止' : 'Due Today';
    else if (diffDays === 1) timeLeft = language === 'zh' ? '明天' : 'Tomorrow';
    else if (diffDays < 0) timeLeft = language === 'zh' ? '已逾期' : 'Overdue';
    else timeLeft = language === 'zh' ? `剩余 ${diffDays}天` : `${diffDays}d left`;

    const billData: Bill = {
      id: editBill?.id || crypto.randomUUID(),
      name: name,
      amount: numAmount,
      date: `${month} ${day}`,
      timeLeft: timeLeft,
      icon: selectedIcon,
      timestamp: dateObj.getTime(),
    };

    onSave(billData);
    navigate('/wallet');
  };

  const t = {
    wallet: language === 'zh' ? '钱包' : 'Wallet',
    header: language === 'zh' ? (editBill ? '编辑账单' : '新增账单') : (editBill ? 'Edit Bill' : 'New Bill'),
    namePlaceholder: language === 'zh' ? '账单名称 (例如：房租)' : 'Bill Name (e.g. Rent)',
    dueDateLabel: language === 'zh' ? '截止日期' : 'Due Date',
    iconLabel: language === 'zh' ? '图标' : 'Icon',
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
            <input 
              type="text"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-0 border-b-2 border-lavender-accent/30 text-3xl font-bold text-center focus:ring-0 focus:border-lavender-accent transition-colors placeholder:text-gray-300 dark:text-white"
              autoFocus
            />

            <div className="flex flex-col items-center justify-center w-full">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-light text-[#656586]">¥</span>
                <h1 className="text-[56px] font-light tracking-tight leading-none">
                  {amount.split('.')[0]}<span className="text-3xl text-[#656586]">.{amount.split('.')[1] || '00'}</span>
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-3xl p-5 bg-white/40 dark:bg-gray-800/40">
                <p className="text-[10px] font-bold text-[#656586] uppercase tracking-[0.2em] mb-3">{t.dueDateLabel}</p>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm font-bold dark:text-white focus:ring-0"
                />
              </div>
              <div className="glass-panel rounded-3xl p-5 bg-white/40 dark:bg-gray-800/40 flex flex-col justify-between">
                <p className="text-[10px] font-bold text-[#656586] uppercase tracking-[0.2em] mb-3">{t.iconLabel}</p>
                <div className="flex gap-2">
                  {BILL_ICONS.map(i => (
                    <button 
                      key={i.icon}
                      onClick={() => setSelectedIcon(i.icon)}
                      className={`size-7 flex items-center justify-center rounded-xl transition-all ${selectedIcon === i.icon ? 'bg-lavender-accent text-white scale-110 shadow-lg' : 'bg-white/40 dark:bg-gray-700 text-gray-400'}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{i.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        <section className="grid grid-cols-4 gap-y-2 px-2 pb-8 pt-2">
          {[1,2,3,'clear',4,5,6,'none',7,8,9,'backspace','.',0,'confirm'].map((key, idx) => {
            if (key === 'clear') {
              return (
                <button key={idx} onClick={() => setAmount('0')} className="keypad-btn col-span-1 h-14 flex items-center justify-center dark:text-white">
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
                  disabled={!name.trim() || parseFloat(amount) <= 0}
                  className="col-span-2 h-14 ml-2 rounded-2xl bg-[#121217] dark:bg-lavender-accent text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-30"
                >
                  <span className="text-lg font-bold mr-2">{editBill ? t.update : t.confirm}</span>
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

export default AddBill;
