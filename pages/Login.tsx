
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language } from '../types';
import { signInWithEmail } from '../api';

interface LoginProps {
  onLogin: () => void;
  language: Language;
}

const Login: React.FC<LoginProps> = ({ onLogin, language }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      onLogin();
      navigate('/');
    } catch (err: any) {
      setError(
        language === 'zh'
          ? '登录失败，请检查邮箱或密码，或先在 Supabase 创建用户。'
          : err?.message || 'Login failed',
      );
    } finally {
      setLoading(false);
    }
  };

  const t = {
    subtitle: language === 'zh' ? '财源滚滚' : 'Flow into Wealth',
    emailLabel: language === 'zh' ? '电子邮箱' : 'Email Address',
    passwordLabel: language === 'zh' ? '密码' : 'Password',
    signIn: language === 'zh' ? '登录' : 'Sign In',
    faceId: language === 'zh' ? '面容 ID' : 'Face ID',
    forgot: language === 'zh' ? '忘记密码?' : 'Forgot Password?',
  };

  return (
    <div className="relative min-h-screen bg-[#fcfcfd] font-display flex flex-col px-8 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/30 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-20%] w-[400px] h-[400px] bg-primary/40 rounded-full blur-[80px]"></div>
      </div>

      <main className="relative z-10 flex-1 flex flex-col w-full max-w-md mx-auto">
        <div className="flex-1"></div>
        
        <div className="flex flex-col items-center justify-center mb-16">
          <div className="relative w-20 h-20 flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-gradient-to-tr from-white to-[#f0f0ff] rounded-[2rem] shadow-glow transform rotate-3"></div>
            <span className="material-symbols-outlined text-[40px] text-[#2d2d44] relative z-10 font-light">
              spa
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">FlowCost</h1>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-text mt-2 font-medium">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-10 mb-12">
          <div className="group relative">
            <input
              className="block w-full px-0 py-3 text-lg bg-transparent border-0 border-b-[1.5px] border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-[#4a4a6a] peer transition-colors text-[#1a1a2e] placeholder-transparent"
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="absolute text-lg text-gray-400 duration-300 transform -translate-y-8 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#4a4a6a] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-8" htmlFor="email">
              {t.emailLabel}
            </label>
          </div>
          <div className="group relative">
            <input
              className="block w-full px-0 py-3 text-lg bg-transparent border-0 border-b-[1.5px] border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-[#4a4a6a] peer transition-colors text-[#1a1a2e] placeholder-transparent"
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label className="absolute text-lg text-gray-400 duration-300 transform -translate-y-8 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#4a4a6a] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-8" htmlFor="password">
              {t.passwordLabel}
            </label>
          </div>
          {error && (
            <p className="text-xs text-red-500 mt-2 whitespace-pre-line">
              {error}
            </p>
          )}
          <button
            className="w-full h-14 mt-4 bg-[#1a1a2e] text-white text-lg font-medium rounded-2xl shadow-btn-glow hover:shadow-lg hover:bg-[#252540] active:scale-[0.98] transition-all duration-300 flex items-center justify-center relative overflow-hidden group disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? (language === 'zh' ? '登录中...' : 'Signing in...') : t.signIn}
          </button>
        </form>

        <div className="flex flex-col items-center gap-8 mb-12">
          <button className="flex flex-col items-center gap-2 group cursor-pointer" type="button">
            <div className="p-3 rounded-full hover:bg-white/50 transition-colors">
              <span className="material-symbols-outlined text-[32px] text-[#1a1a2e] font-light group-hover:scale-110 transition-transform duration-300">
                face
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">{t.faceId}</span>
          </button>
          <a className="text-sm font-medium text-gray-400 hover:text-[#1a1a2e] transition-colors" href="#">
            {t.forgot}
          </a>
        </div>
        <div className="flex-1"></div>
      </main>
    </div>
  );
};

export default Login;
