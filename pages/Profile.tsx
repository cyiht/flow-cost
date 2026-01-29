
import React, { useState, useRef } from 'react';
import { UserProfile, Language, Transaction, DurableGood, Bill, Account } from '../types';
import ExportDataModal from '../components/ExportDataModal';

interface ProfileProps {
  user: UserProfile;
  theme: 'light' | 'dark';
  language: Language;
  onUpdateUser: (u: UserProfile) => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onLogout: () => void;
  transactions?: Transaction[];
  durableGoods?: DurableGood[];
  bills?: Bill[];
  accounts?: Account[];
}

const Profile: React.FC<ProfileProps> = ({ 
  user, 
  theme, 
  language, 
  onUpdateUser, 
  onToggleTheme, 
  onToggleLanguage, 
  onLogout,
  transactions = [],
  durableGoods = [],
  bills = [],
  accounts = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateUser({ ...user, name: editedName });
    setIsEditing(false);
  };

  const changeAvatarRandom = () => {
    const newSeed = Math.floor(Math.random() * 1000);
    onUpdateUser({ ...user, avatar: `https://picsum.photos/seed/${newSeed}/200` });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ ...user, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const exportData = () => {
    setIsExportModalOpen(true);
  };

  const t = {
    title: language === 'zh' ? '个人资料' : 'Profile',
    premium: language === 'zh' ? '高级会员' : 'Premium Member',
    account: language === 'zh' ? '我的账户' : 'My Account',
    appearance: language === 'zh' ? `外观 (${theme === 'light' ? '浅色' : '深色'})` : `Appearance (${theme === 'light' ? 'Light' : 'Dark'})`,
    languageLabel: language === 'zh' ? '语言 (简体中文)' : 'Language (English)',
    security: language === 'zh' ? '安全设置' : 'Security',
    export: language === 'zh' ? '导出数据' : 'Export Data',
    support: language === 'zh' ? '客户支持' : 'Support',
    version: language === 'zh' ? '版本' : 'FlowCost v',
    uploadAvatar: language === 'zh' ? '上传头像' : 'Upload Avatar',
    randomAvatar: language === 'zh' ? '随机头像' : 'Random Avatar',
    logout: language === 'zh' ? '退出登录' : 'Log Out',
  };

  return (
    <div className="bg-transparent min-h-screen pb-28">
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 pt-12 pb-2 bg-transparent backdrop-blur-xl">
        <h1 className="text-2xl font-black tracking-tight text-lavender-accent dark:text-white uppercase">{t.title}</h1>
        <button className="p-2.5 rounded-full bg-white/50 backdrop-blur-md shadow-soft text-lavender-accent border border-white/50">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <main className="flex flex-col w-full max-w-md mx-auto">
        <section className="flex flex-col items-center justify-center pt-8 pb-10">
          <div className="relative group animate-float">
            <div className="w-32 h-32 rounded-3xl p-1 bg-white/50 dark:bg-gray-800 shadow-glow overflow-hidden border border-white/50 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <img alt="Profile" className="w-full h-full rounded-2xl object-cover" src={user.avatar} />
            </div>
            
            <div className="absolute -bottom-2 -right-4 flex flex-col gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                title={t.uploadAvatar}
                className="bg-lavender-accent text-white p-2 rounded-xl border-2 border-white dark:border-gray-800 shadow-btn-glow hover:scale-110 active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-[18px] leading-none">photo_camera</span>
              </button>
              <button 
                onClick={changeAvatarRandom}
                title={t.randomAvatar}
                className="bg-white dark:bg-gray-700 text-lavender-accent p-2 rounded-xl border-2 border-white dark:border-gray-800 shadow-soft hover:scale-110 active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined text-[18px] leading-none">refresh</span>
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          
          {isEditing ? (
            <div className="mt-6 flex items-center gap-3 px-6 w-full max-w-xs">
              <input 
                type="text" 
                value={editedName} 
                onChange={(e) => setEditedName(e.target.value)}
                className="flex-1 bg-white/50 backdrop-blur-md dark:bg-gray-800 border-b-2 border-lavender-accent rounded-xl px-4 py-2 text-center font-black text-xl text-lavender-accent outline-none"
                autoFocus
              />
              <button onClick={handleSave} className="bg-lavender-accent text-white size-10 flex items-center justify-center rounded-xl shadow-btn-glow">
                <span className="material-symbols-outlined">check</span>
              </button>
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-2 group">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h2>
              <button onClick={() => setIsEditing(true)} className="text-lavender-light hover:text-lavender-accent transition-colors">
                <span className="material-symbols-outlined text-xl">edit</span>
              </button>
            </div>
          )}
          
          <div className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-lavender-accent/10 border border-lavender-accent/20">
            <span className="material-symbols-outlined text-sm text-lavender-accent filled">workspace_premium</span>
            <span className="text-[10px] font-black text-lavender-accent uppercase tracking-widest">{t.premium}</span>
          </div>
        </section>

        <section className="px-6 flex flex-col gap-4">
          <button className="group flex items-center justify-between w-full p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-soft border border-white/50 hover:bg-white transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 group-hover:scale-110 transition-transform shadow-inner-light">
                <span className="material-symbols-outlined text-2xl">account_circle</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-black text-slate-900 dark:text-white text-[15px]">{t.account}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user.email}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </button>

          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-3xl p-2 border border-white/30 space-y-2">
            <button 
              onClick={onToggleTheme}
              className="group flex items-center justify-between w-full p-4 bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-sm border border-white/20 hover:bg-white transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 text-slate-600 group-hover:rotate-12 transition-transform shadow-inner-light">
                  <span className="material-symbols-outlined">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white text-[14px] uppercase tracking-wider">{t.appearance}</span>
              </div>
              <span className="material-symbols-outlined text-lavender-light">sync</span>
            </button>

            <button 
              onClick={onToggleLanguage}
              className="group flex items-center justify-between w-full p-4 bg-white/60 dark:bg-gray-800/60 rounded-2xl shadow-sm border border-white/20 hover:bg-white transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-orange-50 text-orange-500 group-hover:scale-110 transition-transform shadow-inner-light">
                  <span className="material-symbols-outlined">translate</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white text-[14px] uppercase tracking-wider">{t.languageLabel}</span>
              </div>
              <span className="material-symbols-outlined text-lavender-light">sync</span>
            </button>
          </div>

          <button 
            onClick={exportData}
            className="group flex items-center justify-between w-full p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-soft border border-white/50 hover:bg-white transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 group-hover:-translate-y-1 transition-transform shadow-inner-light">
                <span className="material-symbols-outlined">file_download</span>
              </div>
              <span className="font-black text-slate-900 dark:text-white text-[15px] uppercase tracking-wider">{t.export}</span>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </button>

          <button className="group flex items-center justify-between w-full p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-soft border border-white/50 hover:bg-white transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 group-hover:scale-110 transition-transform shadow-inner-light">
                <span className="material-symbols-outlined">help</span>
              </div>
              <span className="font-black text-slate-900 dark:text-white text-[15px] uppercase tracking-wider">{t.support}</span>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </button>
          
          <button 
            onClick={onLogout}
            className="group flex items-center justify-between w-full p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-soft border border-white/50 hover:bg-white transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 group-hover:scale-110 transition-transform shadow-inner-light">
                <span className="material-symbols-outlined">logout</span>
              </div>
              <span className="font-black text-slate-900 dark:text-white text-[15px] uppercase tracking-wider">{t.logout}</span>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </button>
        </section>

        <section className="mt-12 text-center pb-12">
          <p className="text-[10px] font-black text-lavender-light uppercase tracking-[0.4em]">{t.version}2.5.0</p>
        </section>
      </main>

      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        language={language}
        data={{
          transactions,
          durableGoods,
          bills,
          accounts
        }}
      />
    </div>
  );
};

export default Profile;
