
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Message, Language } from '../types';

interface MessagesProps {
  language: Language;
  messages: Message[];
}

const Messages: React.FC<MessagesProps> = ({ language, messages }) => {
  const navigate = useNavigate();

  const t = {
    header: language === 'zh' ? '消息' : 'Messages',
    noMessages: language === 'zh' ? '暂无新消息' : 'No new messages',
    end: language === 'zh' ? '已加载全部通知' : 'End of Notifications',
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark pb-6">
      <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-6 pt-12 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 dark:text-white">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold dark:text-white">{t.header}</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="material-symbols-outlined text-4xl mb-2">mail</span>
              <p className="text-sm font-medium">{t.noMessages}</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-4 p-5 bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-transparent hover:border-lavender-accent/10 transition-all">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${msg.color}`}>
                  <span className="material-symbols-outlined">{msg.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-sm dark:text-white">{msg.title}</h3>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{msg.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          
          <div className="text-center py-8">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-[0.2em]">{t.end}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
