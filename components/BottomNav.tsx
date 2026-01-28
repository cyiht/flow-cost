
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Language } from '../types';

interface BottomNavProps {
  language: Language;
}

const BottomNav: React.FC<BottomNavProps> = ({ language }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const labels = {
    Home: language === 'zh' ? '主页' : 'Home',
    Insight: language === 'zh' ? '洞察' : 'Insight',
    Wallet: language === 'zh' ? '钱包' : 'Wallet',
    Profile: language === 'zh' ? '我的' : 'Profile',
  };

  const navItems = [
    { label: labels.Home, icon: 'home', path: '/' },
    { label: labels.Insight, icon: 'pie_chart', path: '/durable' },
    { label: labels.Wallet, icon: 'account_balance_wallet', path: '/wallet' },
    { label: labels.Profile, icon: 'person', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around pb-6 pt-4 px-4 bg-white/80 dark:bg-[#121220]/80 backdrop-blur-md border-t border-gray-100 dark:border-[#2f2f45] max-w-md mx-auto">
      {navItems.slice(0, 2).map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className="flex flex-col items-center justify-center gap-1 group w-12"
        >
          <span className={`material-symbols-outlined transition-colors ${location.pathname === item.path ? 'text-lavender-accent font-bold filled' : 'text-[#656586]'}`}>
            {item.icon}
          </span>
          <span className={`text-[10px] font-medium transition-colors ${location.pathname === item.path ? 'text-lavender-accent' : 'text-[#656586]'}`}>
            {item.label}
          </span>
        </button>
      ))}

      <button
        onClick={() => navigate('/entry')}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-[#121217] dark:bg-primary shadow-lg hover:scale-105 transition-transform -mt-10 ring-4 ring-background-light dark:ring-background-dark"
      >
        <span className="material-symbols-outlined text-white dark:text-[#121220]">add</span>
      </button>

      {navItems.slice(2).map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className="flex flex-col items-center justify-center gap-1 group w-12"
        >
          <span className={`material-symbols-outlined transition-colors ${location.pathname === item.path ? 'text-lavender-accent font-bold filled' : 'text-[#656586]'}`}>
            {item.icon}
          </span>
          <span className={`text-[10px] font-medium transition-colors ${location.pathname === item.path ? 'text-lavender-accent' : 'text-[#656586]'}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
