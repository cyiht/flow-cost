
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DurableGood, Language } from '../types';

interface AddDurableProps {
  language: Language;
  onAddDurable: (good: DurableGood) => void;
}

const AddDurable: React.FC<AddDurableProps> = ({ language, onAddDurable }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const editItem = location.state?.editItem as DurableGood | undefined;

  const [amount, setAmount] = useState('0');
  const [name, setName] = useState('');
  const [lifespan, setLifespan] = useState(24);

  useEffect(() => {
    if (editItem) {
      setAmount(editItem.originalPrice.toString());
      setName(editItem.name);
      setLifespan(Math.round(editItem.targetYears * 12));
    }
  }, [editItem]);

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
    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0 || !name.trim()) return;

    const dailyCost = numericAmount / (lifespan * 30.41);
    const newGood: DurableGood = {
      id: editItem?.id || Math.random().toString(36).substr(2, 9),
      name: name,
      originalPrice: numericAmount,
      dailyCost: dailyCost,
      usedDays: editItem?.usedDays || 0,
      targetYears: lifespan / 12,
      status: editItem?.status || 'New',
      image: editItem?.image || `https://picsum.photos/seed/${name}/200`
    };

    onAddDurable(newGood);
    navigate('/durable');
  };

  const t = {
    header: language === 'zh' ? '洞察' : 'Insight',
    title: language === 'zh' ? (editItem ? '编辑资产' : '新增资产') : (editItem ? 'Edit Vault Item' : 'New Vault Item'),
    itemNamePlaceholder: language === 'zh' ? '项目名称 (例如：相机)' : 'Item Name (e.g. Camera)',
    valueLabel: language === 'zh' ? '人民币价值' : 'Value in RMB',
    lifespanLabel: language === 'zh' ? '预期寿命' : 'Expected Lifespan',
    years: language === 'zh' ? '年' : 'Years',
    months: language === 'zh' ? '个月' : 'Months',
    mo: language === 'zh' ? '月' : 'Mo',
    yrs: language === 'zh' ? '年' : 'Yrs',
    burnLabel: language === 'zh' ? '计算折旧' : 'Calculated Burn',
    day: language === 'zh' ? '天' : 'DAY',
    save: language === 'zh' ? '保存' : 'Save',
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f6f6f8] text-[#121217] relative overflow-hidden dark:bg-background-dark dark:text-white">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=800')" }}></div>
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[40px]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full w-full">
        <header className="flex items-center justify-between px-6 pt-12 pb-2">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs font-extrabold tracking-[0.2em] uppercase text-[#656586]">{t.header}</span>
            <span className="text-sm font-bold">{t.title}</span>
          </div>
          <div className="size-10"></div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full flex flex-col gap-6 animate-fade-in">
            <div className="relative w-full">
              <input 
                type="text"
                placeholder={t.itemNamePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-0 border-b-2 border-lavender-accent/30 text-2xl font-bold text-center focus:ring-0 focus:border-lavender-accent transition-colors placeholder:text-gray-300 dark:text-white"
              />
            </div>

            <div className="flex flex-col items-center justify-center w-full">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-light text-[#656586]">¥</span>
                <h1 className="text-[56px] font-light tracking-tight leading-none">
                  {amount.split('.')[0]}<span className="text-3xl text-[#656586]">.{amount.split('.')[1] || '00'}</span>
                </h1>
              </div>
              <p className="text-[10px] font-bold text-[#656586] uppercase tracking-[0.2em] mt-2">{t.valueLabel}</p>
            </div>

            <div className="w-full glass-panel rounded-3xl p-6 shadow-soft animate-slide-up bg-white/40 dark:bg-gray-800/40">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#656586]">{t.lifespanLabel}</span>
                <div className="bg-[#121217] dark:bg-lavender-accent text-white px-3 py-1 rounded-xl text-sm font-bold">
                  {lifespan >= 12 ? `${(lifespan/12).toFixed(1)} ${t.years}` : `${lifespan} ${t.months}`}
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="120"
                value={lifespan}
                onChange={(e) => setLifespan(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#dcdce5] dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-[#121217] dark:accent-lavender-accent"
              />
              <div className="flex justify-between text-[9px] text-[#9ca3af] mt-3 font-extrabold uppercase tracking-widest">
                <span>1 {t.mo}</span>
                <span>10 {t.yrs}</span>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-[#656586]">{t.burnLabel}</p>
                <p className="text-lg font-extrabold dark:text-white">
                  ¥{(parseFloat(amount) / (lifespan * 30.41)).toFixed(2)} <span className="text-[10px] text-gray-400">/ {t.day}</span>
                </p>
              </div>
            </div>
          </div>
        </main>

        <section className="grid grid-cols-4 gap-y-2 px-2 pb-8 pt-2">
          {[1,2,3,'clear',4,5,6,'none',7,8,9,'backspace','.',0,'confirm'].map((key, idx) => {
            if (key === 'clear') {
              return (
                <button key={idx} onClick={() => setAmount('0')} className="keypad-btn col-span-1 h-16 flex items-center justify-center dark:text-white">
                  <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
                </button>
              );
            }
            if (key === 'none') return <div key={idx} className="col-span-1"></div>;
            if (key === 'backspace') {
              return (
                <button key={idx} onClick={() => handleKeyClick('backspace')} className="keypad-btn col-span-1 h-16 flex items-center justify-center dark:text-white">
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
                  className="col-span-2 h-16 ml-2 rounded-2xl bg-[#121217] dark:bg-lavender-accent text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-30"
                >
                  <span className="text-lg font-bold mr-2">{t.save}</span>
                  <span className="material-symbols-outlined text-[24px]">check</span>
                </button>
              );
            }
            return (
              <button key={idx} onClick={() => handleKeyClick(key.toString())} className="keypad-btn col-span-1 h-16 flex items-center justify-center text-2xl font-bold dark:text-white">
                {key}
              </button>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default AddDurable;
