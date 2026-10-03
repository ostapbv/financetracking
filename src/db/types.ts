export type AccountType = 'cash' | 'bank' | 'credit' | 'savings' | 'other';
export type TransactionKind = 'expense' | 'income';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'all' | 'custom';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  icon: string;                 // Lucide icon name, e.g. 'Wallet', 'Landmark', 'CreditCard'
  color: string;                // Hex color code, e.g. '#3B82F6'
  currency: string;             // ISO 4217, e.g. 'USD', 'EUR', 'UAH', 'PLN'
  initialBalanceMinor: number;  // Integer minor units (negative allowed for credit cards)
  initialBalanceDate: string;   // 'YYYY-MM-DD'
  includeInTotal: boolean;      // Whether to include in net worth and total balance
  archived: boolean;
  order: number;
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // ISO timestamp
}

export interface Category {
  id: string;
  name: string;
  icon: string;                 // Lucide icon name
  color: string;                // Hex color
  kind: TransactionKind;        // 'expense' | 'income'
  order: number;
  archived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  kind: TransactionKind;
  amountMinor: number;          // Strictly positive integer minor units
  note?: string;
  date: string;                 // 'YYYY-MM-DD'
  recurringRuleId?: string;
  transferId?: string;          // Linked transfer ID if created by a transfer
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amountFromMinor: number;      // Minor units in fromAccount's currency
  amountToMinor: number;        // Minor units in toAccount's currency
  rate: number;                 // Implied exchange rate (amountTo / amountFrom in major units)
  note?: string;
  date: string;                 // 'YYYY-MM-DD'
  fromTransactionId: string;    // Outflow ledger entry ID
  toTransactionId: string;      // Inflow ledger entry ID
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  code: string;                 // ISO 4217, e.g. 'USD'
  name: string;                 // 'US Dollar'
  symbol: string;               // '$'
  precision: number;            // 0, 2, 3 decimals
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;                 // Multiplier: 1 fromCurrency = rate toCurrency
  effectiveDate: string;        // 'YYYY-MM-DD'
  createdAt?: string;
}

export interface RecurringRule {
  id: string;
  template: {
    accountId: string;
    categoryId: string;
    kind: TransactionKind;
    amountMinor: number;
    note?: string;
  };
  frequency: RecurringFrequency;
  interval: number;             // 1 = every period, 2 = every 2 periods, etc.
  startDate: string;            // 'YYYY-MM-DD'
  endDate?: string;             // Optional cutoff 'YYYY-MM-DD'
  lastProcessedDate?: string;   // 'YYYY-MM-DD'
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: string;                   // Singleton ID: 'global_settings'
  mainCurrency: string;         // 'USD'
  firstDayOfWeek: 0 | 1;        // 0 = Sunday, 1 = Monday
  theme: 'system' | 'light' | 'dark';
  dateFormat: string;           // 'yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy'
  hasSampleDataLoaded: boolean;
  updatedAt: string;
}

export interface PeriodFilter {
  type: PeriodType;
  startDate: string;            // 'YYYY-MM-DD'
  endDate: string;              // 'YYYY-MM-DD'
  label: string;
}

export interface TransactionFilter {
  period?: PeriodFilter;
  accountId?: string;           // 'all' or specific accountId
  categoryId?: string;          // 'all' or specific categoryId
  kind?: TransactionKind | 'all';
  searchQuery?: string;
  minAmountMinor?: number;
  maxAmountMinor?: number;
}

export interface ExportData {
  version: number;
  exportDate: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  transfers: Transfer[];
  currencies: Currency[];
  exchangeRates: ExchangeRate[];
  recurringRules: RecurringRule[];
  settings: AppSettings;
}
