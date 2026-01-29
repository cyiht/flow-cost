
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, Language } from '../types';
// Import Type from @google/genai instead of ../types
import { GoogleGenAI, Type } from "@google/genai";

const CATEGORIES = [
  { name: 'Clothing', zhName: '服饰', icon: 'checkroom' },
  { name: 'Food', zhName: '餐饮', icon: 'restaurant' },
  { name: 'Transport', zhName: '交通', icon: 'directions_car' },
  { name: 'Shopping', zhName: '购物', icon: 'shopping_bag' },
  { name: 'Entertainment', zhName: '娱乐', icon: 'movie' },
  { name: 'Health', zhName: '健康', icon: 'medical_services' },
  { name: 'Other', zhName: '其他', icon: 'more_horiz' },
];

const INCOME_CATEGORIES = [
  { name: 'Salary', zhName: '工资', icon: 'payments' },
  { name: 'Bonus', zhName: '奖金', icon: 'redeem' },
  { name: 'Gift', zhName: '礼物', icon: 'card_giftcard' },
  { name: 'Other', zhName: '其他', icon: 'more_horiz' },
];

interface EntryProps {
  onAddTransaction: (tx: Transaction, durableInfo?: { lifespanMonths: number }) => void;
  language: Language;
}

const Entry: React.FC<EntryProps> = ({ onAddTransaction, language }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [entryType, setEntryType] = useState<'Expense' | 'Income'>('Expense');
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [isDurable, setIsDurable] = useState(false);
  const [lifespan, setLifespan] = useState(12); // Months
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [customNote, setCustomNote] = useState('');

  const handleKeyClick = (key: string) => {
    if (key === 'backspace') {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (key === '.') {
      if (!amount.includes('.')) setAmount(prev => prev + '.');
    } else {
      setAmount(prev => prev === '0' ? key : prev + key);
    }
  };

  const getDailyRate = () => {
    const total = parseFloat(amount);
    if (isNaN(total) || total === 0) return 0;
    return total / (lifespan * 30.41);
  };

  const processWithAI = async (imageB64?: string, textInput?: string) => {
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Extract transaction details. Return JSON. 
      Keys: amount (number), category (one of: Food, Transport, Shopping, Clothing, Entertainment, Health for expense, or Salary, Bonus, Gift, Other for income), merchant (string), title (string), type ('Income' or 'Expense'). 
      Current language: ${language === 'zh' ? 'Chinese' : 'English'}.
      If specific data is missing, guess logically based on context.`;

      const contents: any[] = [{ text: prompt }];
      if (imageB64) {
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imageB64.split(',')[1] || imageB64
          }
        });
      }
      if (textInput) {
        contents.push({ text: `User input: ${textInput}` });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: contents },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              merchant: { type: Type.STRING },
              title: { type: Type.STRING },
              type: { type: Type.STRING }
            },
            required: ["amount", "category", "merchant", "title", "type"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.amount) setAmount(result.amount.toString());
      if (result.type) setEntryType(result.type === 'Income' ? 'Income' : 'Expense');
      
      const currentCats = result.type === 'Income' ? INCOME_CATEGORIES : CATEGORIES;
      if (result.category) {
        const matched = currentCats.find(c => c.name.toLowerCase() === result.category.toLowerCase());
        if (matched) setSelectedCategory(matched.name);
      }
    } catch (error) {
      console.error("AI Processing failed", error);
    } finally {
      setIsProcessing(false);
      setShowAiModal(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      processWithAI(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) return;

    const dateTime = new Date(`${selectedDate}T${selectedTime}`);
    const currentCats = entryType === 'Income' ? INCOME_CATEGORIES : CATEGORIES;
    const cat = currentCats.find(c => c.name === selectedCategory) || currentCats[0];

    let finalTitle = language === 'zh' ? `${cat.zhName}${entryType === 'Income' ? '录入' : '购买'}` : `${cat.name} ${entryType === 'Income' ? 'Entry' : 'Purchase'}`;
    let finalMerchant = entryType === 'Income' ? (language === 'zh' ? '个人收入' : 'Income') : (isDurable ? (language === 'zh' ? '耐用品' : 'Durable Good') : selectedCategory);

    if (selectedCategory === 'Other' && customNote.trim()) {
      finalTitle = customNote;
    }

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      title: finalTitle,
      amount: numericAmount,
      category: selectedCategory,
      date: dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: dateTime.getTime(),
      type: entryType === 'Income' ? 'credit' : (isDurable ? 'recurring' : 'debit'),
      merchant: finalMerchant
    };

    onAddTransaction(newTx, isDurable && entryType === 'Expense' ? { lifespanMonths: lifespan } : undefined);
    navigate('/');
  };

  const t = {
    header: language === 'zh' ? '新记账' : 'New Entry',
    transaction: language === 'zh' ? '交易' : 'Transaction',
    income: language === 'zh' ? '收入' : 'Income',
    expense: language === 'zh' ? '支出' : 'Expense',
    durableMode: language === 'zh' ? '耐用品模式' : 'Durable Mode',
    dayCost: language === 'zh' ? '≈ ¥{rate} / 天费用' : '≈ ¥{rate} / day cost',
    lifespan: language === 'zh' ? '预计寿命' : 'Estimated Lifespan',
    month: language === 'zh' ? '个月' : 'Month',
    year: language === 'zh' ? '年' : 'Year',
    confirm: language === 'zh' ? '确认' : 'Confirm',
    date: language === 'zh' ? '日期' : 'Date',
    time: language === 'zh' ? '时间' : 'Time',
    aiLoading: language === 'zh' ? '正在智能分析...' : 'Analyzing with AI...',
    aiInputTitle: language === 'zh' ? '智能记账' : 'Smart Entry',
    aiInputPlaceholder: language === 'zh' ? '例：中午在星巴克花了35元' : 'e.g., spent 35 at Starbucks for lunch',
    scanLabel: language === 'zh' ? '扫描小票' : 'Scan Receipt',
  };

  const categoriesToRender = entryType === 'Income' ? INCOME_CATEGORIES : CATEGORIES;

  return (
    <div className="flex flex-col h-full w-full bg-[#e3e8e8] text-[#121217] relative overflow-hidden dark:bg-background-dark dark:text-white font-display">
      {/* Soft gradient background effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[60%] bg-emerald-100/40 rounded-full blur-[100px] mix-blend-multiply dark:bg-emerald-900/20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-100/40 rounded-full blur-[80px] mix-blend-multiply dark:bg-blue-900/20"></div>
        <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-purple-100/30 rounded-full blur-[60px] mix-blend-multiply dark:bg-purple-900/20"></div>
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[20px] dark:bg-black/20"></div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xl animate-fade-in">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-lavender-accent/20 border-t-lavender-accent rounded-full animate-spin"></div>
              <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-lavender-accent filled animate-pulse">auto_awesome</span>
            </div>
            <p className="text-white font-bold tracking-widest uppercase text-xs animate-bounce">{t.aiLoading}</p>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full w-full">
        <header className="flex items-center justify-between px-6 pt-12 pb-2">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold tracking-wider uppercase text-[#656586]">{t.transaction}</span>
            <span className="text-sm font-bold">{t.header}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAiModal(true)}
              className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-lavender-accent"
            >
              <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
            </button>
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${showDatePicker ? 'text-lavender-accent' : ''}`}
            >
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-full p-1 flex mb-8 w-full max-w-[240px] shadow-sm">
            {(['Expense', 'Income'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setEntryType(type);
                  setSelectedCategory(type === 'Income' ? 'Salary' : 'Food');
                }}
                className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${entryType === type ? 'bg-white dark:bg-gray-700 shadow-sm text-[#121217] dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
              >
                {type === 'Expense' ? t.expense : t.income}
              </button>
            ))}
          </div>

          {showDatePicker && (
            <div className="w-full glass-panel rounded-2xl p-4 mb-4 flex flex-col gap-4 animate-fade-in bg-white/20 dark:bg-gray-800/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] font-bold uppercase text-gray-400 mb-1">{t.date}</span>
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="bg-transparent border-0 border-b border-gray-200 dark:border-gray-700 p-0 text-sm font-bold focus:ring-0"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] font-bold uppercase text-gray-400 mb-1">{t.time}</span>
                  <input 
                    type="time" 
                    value={selectedTime} 
                    onChange={(e) => setSelectedTime(e.target.value)} 
                    className="bg-transparent border-0 border-b border-gray-200 dark:border-gray-700 p-0 text-sm font-bold focus:ring-0"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center justify-center mb-8 w-full animate-fade-in">
            <div className="flex items-center justify-center gap-4 w-full">
              <div className="flex items-baseline justify-center gap-1">
                <span className={`text-3xl font-light ${entryType === 'Income' ? 'text-emerald-500' : 'text-[#656586]'}`}>
                  ¥
                </span>
                <h1 className="text-[56px] font-light tracking-tight leading-none">
                  {amount.split('.')[0]}<span className="text-3xl text-[#656586]">.{amount.split('.')[1] || '00'}</span>
                </h1>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="size-12 rounded-2xl bg-white/50 dark:bg-white/10 backdrop-blur-md flex items-center justify-center shadow-soft hover:scale-110 active:scale-95 transition-all text-lavender-accent"
              >
                <span className="material-symbols-outlined text-2xl">photo_camera</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="mt-4 flex flex-col items-center gap-1">
              {entryType === 'Expense' && (
                <>
                  <button 
                    onClick={() => setIsDurable(!isDurable)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                      isDurable 
                      ? 'bg-lavender-accent/10 border-lavender-accent text-lavender-accent' 
                      : 'bg-white/50 dark:bg-white/10 border-white/20 text-[#656586]'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isDurable ? 'filled' : ''}`}>hourglass_top</span>
                    <span className="text-xs font-bold uppercase tracking-wide">{t.durableMode}</span>
                  </button>
                  {isDurable && (
                    <p className="text-lavender-accent text-sm font-medium leading-normal mt-1 animate-fade-in">
                      {t.dayCost.replace('{rate}', getDailyRate().toFixed(2))}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {isDurable && entryType === 'Expense' && (
            <div className="w-full glass-panel rounded-2xl p-5 mb-6 transition-all duration-300 animate-slide-up bg-white/20 dark:bg-gray-800/20">
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-[#656586] font-medium">{t.lifespan}</span>
                <span className="text-[#121217] dark:text-white font-bold">
                  {lifespan >= 12 ? `${(lifespan/12).toFixed(1)} ${t.year}` : `${lifespan} ${t.month}`}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="120"
                value={lifespan}
                onChange={(e) => setLifespan(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#dcdce5] rounded-full appearance-none cursor-pointer accent-lavender-accent"
              />
              <div className="flex justify-between text-[10px] text-[#9ca3af] mt-2 font-bold uppercase tracking-widest">
                <span>1 {t.month}</span>
                <span>10 {t.year}</span>
              </div>
            </div>
          )}

          <div className="w-full overflow-hidden mb-2">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
              {categoriesToRender.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`shrink-0 flex items-center justify-between pl-3 pr-4 h-10 rounded-full transition-all active:scale-95 ${
                    selectedCategory === cat.name
                      ? 'bg-[#121217] dark:bg-white text-white dark:text-[#121217] shadow-lg'
                      : 'bg-white/60 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-gray-700 text-[#121217] dark:text-white hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                    <span className="text-sm font-semibold">{language === 'zh' ? cat.zhName : cat.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedCategory === 'Other' && (
            <div className="w-full px-1 mb-4 animate-fade-in">
              <input
                type="text"
                placeholder={language === 'zh' ? "请输入备注..." : "Enter note..."}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full bg-white/40 dark:bg-white/10 border-0 rounded-xl p-3 text-sm font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-lavender-accent text-[#121217] dark:text-white text-center"
                autoFocus
              />
            </div>
          )}
        </main>

        <section className="grid grid-cols-4 gap-y-2 px-2 pb-8 pt-2 bg-gradient-to-t from-white/20 to-transparent">
          {[1,2,3,'mode',4,5,6,'calendar',7,8,9,'backspace','.',0,'confirm'].map((key, idx) => {
            if (key === 'mode') {
              return (
                <button key={idx} onClick={() => setEntryType(entryType === 'Expense' ? 'Income' : 'Expense')} className={`keypad-btn col-span-1 h-16 flex flex-col items-center justify-center gap-1 ${entryType === 'Income' ? 'text-emerald-500' : 'text-lavender-accent'}`}>
                  <span className="material-symbols-outlined text-[24px]">{entryType === 'Income' ? 'add_box' : 'payments'}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{language === 'zh' ? (entryType === 'Income' ? '收入' : '支出') : entryType}</span>
                </button>
              );
            }
            if (key === 'calendar') {
              return (
                <button 
                  key={idx} 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`keypad-btn col-span-1 h-16 flex items-center justify-center ${showDatePicker ? 'text-lavender-accent' : ''}`}
                >
                  <span className="material-symbols-outlined text-[28px]">calendar_today</span>
                </button>
              );
            }
            if (key === 'backspace') {
              return (
                <button key={idx} onClick={() => handleKeyClick('backspace')} className="keypad-btn col-span-1 h-16 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">backspace</span>
                </button>
              );
            }
            if (key === 'confirm') {
              return (
                <button 
                  key={idx} 
                  onClick={handleConfirm}
                  className="col-span-2 h-16 ml-2 rounded-2xl bg-[#121217] dark:bg-lavender-accent text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                >
                  <span className="text-lg font-bold mr-2">{t.confirm}</span>
                  <span className="material-symbols-outlined text-[24px]">check</span>
                </button>
              );
            }
            return (
              <button key={idx} onClick={() => handleKeyClick(key.toString())} className="keypad-btn col-span-1 h-16 flex items-center justify-center text-2xl font-bold">
                {key}
              </button>
            );
          })}
        </section>

        {/* AI Smart Input Modal */}
        {showAiModal && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAiModal(false)}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-lavender-accent/10 flex items-center justify-center text-lavender-accent">
                    <span className="material-symbols-outlined filled">auto_awesome</span>
                  </div>
                  <h3 className="text-xl font-bold dark:text-white">{t.aiInputTitle}</h3>
                </div>
                <button onClick={() => setShowAiModal(false)} className="size-8 flex items-center justify-center text-gray-400">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <textarea 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder={t.aiInputPlaceholder}
                autoFocus
                className="w-full h-32 bg-gray-50 dark:bg-gray-700/50 rounded-3xl border-none focus:ring-2 focus:ring-lavender-accent p-6 text-sm dark:text-white placeholder:text-gray-400"
              />
              <button 
                onClick={() => processWithAI(undefined, aiInput)}
                disabled={!aiInput.trim()}
                className="w-full mt-6 py-4 bg-lavender-accent text-white rounded-2xl font-bold shadow-lg shadow-lavender-accent/30 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>{language === 'zh' ? '智能分析' : 'Smart Analyze'}</span>
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Entry;
