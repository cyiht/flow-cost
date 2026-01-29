import React, { useState } from 'react';
import { Transaction, DurableGood, Bill, Account, Language } from '../types';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  data: {
    transactions: Transaction[];
    durableGoods: DurableGood[];
    bills: Bill[];
    accounts: Account[];
  };
}

const ExportDataModal: React.FC<ExportDataModalProps> = ({ isOpen, onClose, language, data }) => {
  const [selectedTypes, setSelectedTypes] = useState({
    transactions: true,
    durableGoods: true,
    bills: true,
    accounts: true,
  });

  if (!isOpen) return null;

  const t = {
    title: language === 'zh' ? '导出数据' : 'Export Data',
    subtitle: language === 'zh' ? '选择您要导出的数据内容 (CSV格式)' : 'Select data to export (CSV format)',
    types: {
      transactions: language === 'zh' ? '交易记录' : 'Transactions',
      durableGoods: language === 'zh' ? '耐用品' : 'Durable Goods',
      bills: language === 'zh' ? '账单' : 'Bills',
      accounts: language === 'zh' ? '账户' : 'Accounts',
    },
    cancel: language === 'zh' ? '取消' : 'Cancel',
    export: language === 'zh' ? '导出' : 'Export',
    count: language === 'zh' ? '条记录' : 'items',
  };

  const toggleType = (key: keyof typeof selectedTypes) => {
    setSelectedTypes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const downloadCSV = (content: string, filename: string) => {
    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processExport = () => {
    const timestamp = new Date().toISOString().slice(0, 10);

    if (selectedTypes.transactions) {
      const headers = ['Date', 'Time', 'Title', 'Amount', 'Category', 'Type', 'Merchant', 'Timestamp'];
      const rows = data.transactions.map(tx => [
        // Format date and time separately if possible, or just use the string
        `"${tx.date}"`, // Date string from data
        `"${new Date(tx.timestamp).toLocaleTimeString()}"`,
        `"${tx.title.replace(/"/g, '""')}"`, // Escape quotes
        tx.amount.toFixed(2),
        `"${tx.category}"`,
        tx.type,
        `"${tx.merchant || ''}"`,
        tx.timestamp
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadCSV(csvContent, `FlowCost_Transactions_${timestamp}.csv`);
    }

    if (selectedTypes.durableGoods) {
      const headers = ['Name', 'Original Price', 'Daily Cost', 'Used Days', 'Target Years', 'Status'];
      const rows = data.durableGoods.map(item => [
        `"${item.name.replace(/"/g, '""')}"`,
        item.originalPrice.toFixed(2),
        item.dailyCost.toFixed(4),
        item.usedDays,
        item.targetYears,
        item.status
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      // Small delay to prevent browser blocking multiple downloads
      setTimeout(() => downloadCSV(csvContent, `FlowCost_Durables_${timestamp}.csv`), 200);
    }

    if (selectedTypes.bills) {
      const headers = ['Name', 'Amount', 'Due Date', 'Time Left'];
      const rows = data.bills.map(bill => [
        `"${bill.name.replace(/"/g, '""')}"`,
        bill.amount.toFixed(2),
        `"${bill.date}"`,
        `"${bill.timeLeft}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      setTimeout(() => downloadCSV(csvContent, `FlowCost_Bills_${timestamp}.csv`), 400);
    }

    if (selectedTypes.accounts) {
      const headers = ['Name', 'Type', 'Balance', 'Change %', 'Details', 'Last 4 Digits'];
      const rows = data.accounts.map(acc => [
        `"${acc.name.replace(/"/g, '""')}"`,
        acc.type,
        acc.balance.toFixed(2),
        acc.changePercent,
        `"${acc.details || ''}"`,
        `"${acc.lastFour || ''}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      setTimeout(() => downloadCSV(csvContent, `FlowCost_Accounts_${timestamp}.csv`), 600);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-[#1a1a2e] rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{t.title}</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined text-gray-500">close</span>
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">{t.subtitle}</p>

          <div className="space-y-3">
            {(Object.keys(selectedTypes) as Array<keyof typeof selectedTypes>).map((key) => (
              <label key={key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer border border-transparent hover:border-lavender-accent/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${selectedTypes[key] ? 'bg-lavender-accent border-lavender-accent' : 'border-gray-300 dark:border-gray-600'}`}>
                    {selectedTypes[key] && <span className="material-symbols-outlined text-white text-sm">check</span>}
                  </div>
                  <span className="font-bold text-slate-700 dark:text-gray-200">{t.types[key]}</span>
                </div>
                <span className="text-xs font-bold text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-lg">
                  {data[key].length} {t.count}
                </span>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={selectedTypes[key]} 
                  onChange={() => toggleType(key)} 
                />
              </label>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button 
              onClick={processExport}
              className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-lavender-accent shadow-btn-glow hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t.export}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDataModal;
