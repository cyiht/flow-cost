import { createClient } from '@supabase/supabase-js';

// Supabase 项目地址（更新后的 URL）
const DEFAULT_SUPABASE_URL = 'https://ehorwpgqmkmioyazwcdc.supabase.co';

// 建议把 anon key 放在 .env.local 中：VITE_SUPABASE_ANON_KEY=...
const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Debug logs to help troubleshoot connection issues
console.log('[Supabase] Initializing client...');
console.log('[Supabase] URL:', supabaseUrl);
console.log('[Supabase] Key present:', !!supabaseAnonKey);
if (supabaseAnonKey && supabaseAnonKey.startsWith('sb_publishable_')) {
  console.log('[Supabase] Using new Publishable Key format.');
}

if (!supabaseAnonKey) {
  // 在开发环境里给出明显提示，避免忘记配置 anon key
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] 缺少 VITE_SUPABASE_ANON_KEY，请在 .env.local 中配置 Supabase 匿名密钥。'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
export const hasAnonKey = !!supabaseAnonKey;

console.log('[Supabase] Auth options set: persistSession=true, autoRefreshToken=true, detectSessionInUrl=true');
