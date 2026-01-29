import { supabase } from './supabaseClient';
import type {
  Transaction,
  BudgetSettings,
  DurableGood,
  UserProfile,
  Message,
  Bill,
  Account,
} from './types';

// ========== Auth ==========

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

// ========== Profile ==========

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const newProfile: UserProfile & { id: string } = {
      name: user.email?.split('@')[0] || 'New User',
      avatar: 'https://picsum.photos/seed/profile/200',
      email: user.email || '',
      income: 0,
      id: user.id,
    };

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      name: newProfile.name,
      avatar_url: newProfile.avatar,
      email: newProfile.email,
      income: newProfile.income,
    });

    if (insertError) throw insertError;
    return newProfile;
  }

  return {
    name: data.name,
    avatar: data.avatar_url,
    email: data.email,
    income: Number(data.income || 0),
  };
}

export async function updateProfileRemote(updates: Partial<UserProfile>) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.avatar !== undefined) payload.avatar_url = updates.avatar;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.income !== undefined) payload.income = updates.income;

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id);

  if (error) throw error;
}

// ========== Budget ==========

export async function getBudget(): Promise<BudgetSettings | null> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    daily: Number(data.daily),
    weekly: Number(data.weekly),
    monthly: Number(data.monthly),
    yearly: Number(data.yearly),
  };
}

export async function upsertBudgetRemote(budget: BudgetSettings) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  // Check if budget exists for user
  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    // Update
    const { error } = await supabase
      .from('budgets')
      .update({
        daily: budget.daily,
        weekly: budget.weekly,
        monthly: budget.monthly,
        yearly: budget.yearly,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    // Insert
    const { error } = await supabase.from('budgets').insert({
      user_id: user.id,
      daily: budget.daily,
      weekly: budget.weekly,
      monthly: budget.monthly,
      yearly: budget.yearly,
    });
    if (error) throw error;
  }
}

// ========== Transactions ==========

export async function fetchTransactionsRemote(): Promise<Transaction[]> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('ts', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    date: row.date_str,
    timestamp: new Date(row.ts).getTime(),
    type: row.type,
    merchant: row.merchant ?? undefined,
  }));
}

export async function insertTransactionRemote(tx: Transaction) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('transactions').insert({
    id: tx.id,
    user_id: user.id,
    title: tx.title,
    amount: tx.amount,
    category: tx.category,
    date_str: tx.date,
    ts: new Date(tx.timestamp).toISOString(),
    type: tx.type,
    merchant: tx.merchant ?? null,
  });

  if (error) throw error;
}

export async function updateTransactionRemote(tx: Transaction) {
  const { error } = await supabase
    .from('transactions')
    .update({
      title: tx.title,
      amount: tx.amount,
      date_str: tx.date,
      ts: new Date(tx.timestamp).toISOString(),
    })
    .eq('id', tx.id);

  if (error) throw error;
}

// ========== Durable Goods ==========

export async function fetchDurablesRemote(): Promise<DurableGood[]> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('durable_goods')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    originalPrice: Number(row.original_price),
    dailyCost: Number(row.daily_cost),
    usedDays: row.used_days,
    targetYears: Number(row.target_years),
    status: row.status,
    image: row.image_url ?? undefined,
  }));
}

export async function upsertDurableRemote(good: DurableGood) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  const payload = {
    id: good.id,
    user_id: user.id,
    name: good.name,
    original_price: good.originalPrice,
    daily_cost: good.dailyCost,
    used_days: good.usedDays,
    target_years: good.targetYears,
    status: good.status,
    image_url: good.image ?? null,
  };

  const { error } = await supabase.from('durable_goods').upsert(payload);
  if (error) throw error;
}

export async function deleteDurableRemote(id: string) {
  const { error } = await supabase
    .from('durable_goods')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ========== Accounts ==========

export async function fetchAccountsRemote(): Promise<Account[]> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    balance: Number(row.balance),
    changePercent: Number(row.change_percent || 0),
    icon: row.icon,
    type: row.type,
    lastFour: row.last_four ?? undefined,
    details: row.details ?? undefined,
  }));
}

export async function upsertAccountRemote(acc: Account) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  const payload = {
    id: acc.id,
    user_id: user.id,
    name: acc.name,
    balance: acc.balance,
    type: acc.type,
    icon: acc.icon,
    change_percent: acc.changePercent,
    last_four: acc.lastFour ?? null,
    details: acc.details ?? null,
  };

  const { error } = await supabase.from('accounts').upsert(payload);
  if (error) throw error;
}

export async function deleteAccountRemote(id: string) {
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}

// ========== Bills ==========

export async function fetchBillsRemote(): Promise<Bill[]> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', user.id)
    .order('due_ts', { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    date: row.date_str,
    timeLeft: row.time_left,
    icon: row.icon,
    timestamp: new Date(row.due_ts).getTime(),
  }));
}

export async function upsertBillRemote(bill: Bill) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  const payload = {
    id: bill.id,
    user_id: user.id,
    name: bill.name,
    amount: bill.amount,
    date_str: bill.date,
    time_left: bill.timeLeft,
    icon: bill.icon,
    due_ts: new Date(bill.timestamp).toISOString(),
  };

  const { error } = await supabase.from('bills').upsert(payload);
  if (error) throw error;
}

export async function deleteBillRemote(id: string) {
  const { error } = await supabase.from('bills').delete().eq('id', id);
  if (error) throw error;
}

// ========== Messages ==========

export async function fetchMessagesRemote(): Promise<Message[]> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', user.id)
    .order('ts', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    time: row.time_label,
    icon: row.icon,
    color: row.color,
    timestamp: new Date(row.ts).getTime(),
  }));
}

export async function insertMessageRemote(msg: Message) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error('Not authenticated');

  const isUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  const payload: any = {
    user_id: user.id,
    title: msg.title,
    content: msg.content,
    time_label: msg.time,
    icon: msg.icon,
    color: msg.color,
    ts: new Date(msg.timestamp).toISOString(),
  };
  if (msg.id && isUuid(msg.id)) {
    payload.id = msg.id;
  }

  const { error } = await supabase.from('messages').insert(payload);

  if (error) throw error;
}
