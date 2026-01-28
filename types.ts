
export type Language = 'en' | 'zh';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  timestamp: number;
  type: 'debit' | 'credit' | 'recurring';
  merchant?: string;
}

export interface BudgetSettings {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

export interface DurableGood {
  id: string;
  name: string;
  originalPrice: number;
  dailyCost: number;
  usedDays: number;
  targetYears: number;
  status: 'Active' | 'Review' | 'New';
  image?: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  email: string;
  income: number;
}

export interface Message {
  id: string;
  title: string;
  content: string;
  time: string;
  icon: string;
  color: string;
  timestamp: number;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  date: string;
  timeLeft: string;
  icon: string;
  timestamp: number;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  changePercent: number;
  icon: string;
  type: 'Asset' | 'Liability';
  lastFour?: string;
  details?: string;
}

export type Category = 'Clothing' | 'Food' | 'Transport' | 'Shopping' | 'Entertainment' | 'Health';
