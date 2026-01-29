
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Language } from '../types';
import { signInWithEmail, signUpWithEmail } from '../api';
import { hasAnonKey } from '../supabaseClient';

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
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        // Auto login after signup or show message
        alert(
          language === 'zh' 
            ? '注册成功！请前往您的邮箱（包括垃圾邮件文件夹）点击确认链接激活账号，然后登录。' 
            : 'Sign up successful! Please check your email (including spam folder) to confirm your account before signing in.'
        );
        setIsSignUp(false);
      } else {
        await signInWithEmail(email, password);
        onLogin();
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login/Signup error:', err);
      const msg = err?.message || 'Unknown error';
      // Enhance error message for common issues
      let displayMsg = msg;
      if (msg.includes('Load failed') || msg.includes('Failed to fetch')) {
        displayMsg += ' (Check your network or Supabase URL in .env.local)';
      } else if (msg.includes('apikey')) {
        displayMsg += ' (Check VITE_SUPABASE_ANON_KEY in .env.local)';
      } else if (msg.includes('Email not confirmed')) {
        displayMsg = language === 'zh' 
          ? '邮箱未确认。请检查您的邮箱（含垃圾箱）并点击确认链接。' 
          : 'Email not confirmed. Please check your inbox (and spam) for the confirmation link.';
      }
      
      setError(
        language === 'zh'
          ? (isSignUp ? '注册失败：' : '登录失败：') + displayMsg
          : (isSignUp ? 'Sign up failed: ' : 'Login failed: ') + displayMsg
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
    signUp: language === 'zh' ? '注册' : 'Sign Up',
    switchSignUp: language === 'zh' ? '没有账号？去注册' : "Don't have an account? Sign Up",
    switchSignIn: language === 'zh' ? '已有账号？去登录' : 'Already have an account? Sign In',
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
              className="block w-full px-0 py-3 text-lg bg-transparent border-0 border-b-[1.5px] border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-[#4a4a6a] peer transition-colors text-[#1a1a2e] placeholder-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || (!hasAnonKey && !isSignUp)}
            />
            <label className="absolute text-lg text-gray-400 duration-300 transform -translate-y-8 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#4a4a6a] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-8" htmlFor="email">
              {t.emailLabel}
            </label>
          </div>
          <div className="group relative">
            <input
              className="block w-full px-0 py-3 text-lg bg-transparent border-0 border-b-[1.5px] border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-[#4a4a6a] peer transition-colors text-[#1a1a2e] placeholder-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || (!hasAnonKey && !isSignUp)}
            />
            <label className="absolute text-lg text-gray-400 duration-300 transform -translate-y-8 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#4a4a6a] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-8" htmlFor="password">
              {t.passwordLabel}
            </label>
          </div>
          {error && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-100 animate-fade-in">
              <p className="text-xs text-red-600 font-medium whitespace-pre-line leading-relaxed">
                {error}
              </p>
            </div>
          )}
          <button
            className={`w-full h-14 mt-4 text-white text-lg font-medium rounded-2xl shadow-btn-glow hover:shadow-lg active:scale-[0.98] transition-all duration-300 flex items-center justify-center relative overflow-hidden group disabled:opacity-60 disabled:shadow-none ${!hasAnonKey ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1a1a2e] hover:bg-[#252540]'}`}
            type="submit"
            disabled={loading || !hasAnonKey}
          >
            {loading 
              ? (isSignUp ? (language === 'zh' ? '注册中...' : 'Signing up...') : (language === 'zh' ? '登录中...' : 'Signing in...'))
              : (!hasAnonKey 
                  ? (language === 'zh' ? '云端服务未配置' : 'Cloud Service Not Configured') 
                  : (isSignUp ? t.signUp : t.signIn))
            }
          </button>
        </form>

        <div className="flex flex-col items-center gap-4 mb-12">
          {hasAnonKey && (
            <button 
              type="button"
              className="text-sm font-medium text-[#1a1a2e] hover:underline"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
            >
              {isSignUp ? t.switchSignIn : t.switchSignUp}
            </button>
          )}

          {!hasAnonKey && (
            <div className="w-full bg-amber-50 border border-amber-100 rounded-xl p-4 mb-2">
              <p className="text-[11px] text-amber-700 font-medium text-center leading-relaxed">
                {language === 'zh' 
                  ? '检测到未配置 Supabase 密钥，无法使用云端账户功能。您可以直接使用“本地模式登录”体验完整功能，数据将保存在您的设备上。' 
                  : 'Supabase keys not detected. Cloud features are unavailable. You can use "Local Mode Login" to experience all features with data saved on your device.'}
              </p>
            </div>
          )}
          <button
            type="button"
            className={`w-full h-12 text-[#1a1a2e] text-sm font-bold rounded-xl active:scale-[0.98] transition-all ${!hasAnonKey ? 'bg-[#1a1a2e] text-white shadow-lg scale-105 my-2' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => {
              setError(null);
              onLogin();
              navigate('/');
            }}
          >
            {language === 'zh' ? '本地模式登录' : 'Login (Local Mode)'}
          </button>

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
