export interface User {
  id: number;
  name: string;
  email: string;
  img?: string;
  settings?: string; // JSON string
}

export interface Label {
  id: number;
  name: string;
  userid?: number;
}

export interface HistoryEntry {
  action: string;
  date: number | string | Date;
}

export interface ExpressionData {
  id: number;
  expression: string;
  phrase: string;
  nextDate: string | number | Date;
  stage: number;
  labelid?: number | null;
  label?: string | null;
  note?: string | null;
  status?: 'new' | 'active' | 'paused' | 'completed';
  inQueue?: boolean;
  history?: HistoryEntry[] | string;
}

export interface ExpressionUpdate {
  id: number;
  stage?: number;
  nextDate?: number;
  history?: HistoryEntry[];
  status?: string;
  inQueue?: boolean;
  phrase?: string;
  expression?: string;
  note?: string | null;
  labelid?: number | null;
}

export type ExpressionStatus = 'new' | 'active' | 'paused' | 'completed';

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface PhrasesSettings {
  onboarded?: boolean;
  dailyQueueLimit?: number;
  lastQueueUpdate?: string;
  theme?: {
    one?: Record<string, unknown>;
    two?: Record<string, unknown>;
    three?: Record<string, unknown>;
  };
}

export interface Settings {
  langUI?: string;
  speechLangs?: string[];
  phrases?: PhrasesSettings;
  [key: string]: unknown;
}
