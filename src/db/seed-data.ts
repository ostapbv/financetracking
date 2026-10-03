import type {
  Account,
  Category,
  Currency,
  ExchangeRate,
  Transaction,
  Transfer,
  AppSettings,
} from './types';

export const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', precision: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', precision: 2 },
  { code: 'PLN', name: 'Polish Złoty', symbol: 'zł', precision: 2 },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', precision: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', precision: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', precision: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', precision: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', precision: 0 },
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense Categories
  { id: 'cat-exp-food', name: 'Food', icon: 'ShoppingBag', color: '#10B981', kind: 'expense', order: 1, archived: false },
  { id: 'cat-exp-eating-out', name: 'Eating out', icon: 'Utensils', color: '#F59E0B', kind: 'expense', order: 2, archived: false },
  { id: 'cat-exp-bills', name: 'Bills', icon: 'Receipt', color: '#EF4444', kind: 'expense', order: 3, archived: false },
  { id: 'cat-exp-car', name: 'Car', icon: 'Car', color: '#6366F1', kind: 'expense', order: 4, archived: false },
  { id: 'cat-exp-gas', name: 'Gas', icon: 'Fuel', color: '#EC4899', kind: 'expense', order: 5, archived: false },
  { id: 'cat-exp-home', name: 'Home', icon: 'Home', color: '#8B5CF6', kind: 'expense', order: 6, archived: false },
  { id: 'cat-exp-comms', name: 'Communications', icon: 'Smartphone', color: '#06B6D4', kind: 'expense', order: 7, archived: false },
  { id: 'cat-exp-clothes', name: 'Clothes', icon: 'Shirt', color: '#14B8A6', kind: 'expense', order: 8, archived: false },
  { id: 'cat-exp-health', name: 'Health', icon: 'HeartPulse', color: '#F43F5E', kind: 'expense', order: 9, archived: false },
  { id: 'cat-exp-ent', name: 'Entertainment', icon: 'Film', color: '#3B82F6', kind: 'expense', order: 10, archived: false },
  { id: 'cat-exp-hobbies', name: 'Hobbies', icon: 'Gamepad2', color: '#84CC16', kind: 'expense', order: 11, archived: false },
  { id: 'cat-exp-gifts', name: 'Gifts', icon: 'Gift', color: '#D946EF', kind: 'expense', order: 12, archived: false },
  { id: 'cat-exp-baby', name: 'Baby', icon: 'Baby', color: '#F97316', kind: 'expense', order: 13, archived: false },

  // Income Categories
  { id: 'cat-inc-salary', name: 'Salary', icon: 'Briefcase', color: '#10B981', kind: 'income', order: 1, archived: false },
  { id: 'cat-inc-delivery', name: 'Delivery', icon: 'Truck', color: '#3B82F6', kind: 'income', order: 2, archived: false },
  { id: 'cat-inc-cashback', name: 'Cashback', icon: 'Coins', color: '#F59E0B', kind: 'income', order: 3, archived: false },
  { id: 'cat-inc-savings', name: 'Savings Interest', icon: 'PiggyBank', color: '#8B5CF6', kind: 'income', order: 4, archived: false },
  { id: 'cat-inc-other', name: 'Other', icon: 'Sparkles', color: '#64748B', kind: 'income', order: 5, archived: false },
];

export const DEFAULT_EXCHANGE_RATES: ExchangeRate[] = [
  // USD base
  { id: 'rate-usd-eur-1', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, effectiveDate: '2026-01-01' },
  { id: 'rate-eur-usd-1', fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.087, effectiveDate: '2026-01-01' },
  { id: 'rate-usd-pln-1', fromCurrency: 'USD', toCurrency: 'PLN', rate: 4.05, effectiveDate: '2026-01-01' },
  { id: 'rate-pln-usd-1', fromCurrency: 'PLN', toCurrency: 'USD', rate: 0.247, effectiveDate: '2026-01-01' },
  { id: 'rate-usd-uah-1', fromCurrency: 'USD', toCurrency: 'UAH', rate: 41.2, effectiveDate: '2026-01-01' },
  { id: 'rate-uah-usd-1', fromCurrency: 'UAH', toCurrency: 'USD', rate: 0.0243, effectiveDate: '2026-01-01' },

  // More recent rates
  { id: 'rate-usd-eur-2', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.915, effectiveDate: '2026-08-01' },
  { id: 'rate-eur-usd-2', fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.093, effectiveDate: '2026-08-01' },
  { id: 'rate-usd-pln-2', fromCurrency: 'USD', toCurrency: 'PLN', rate: 3.98, effectiveDate: '2026-08-01' },
  { id: 'rate-pln-usd-2', fromCurrency: 'PLN', toCurrency: 'USD', rate: 0.251, effectiveDate: '2026-08-01' },
  { id: 'rate-usd-uah-2', fromCurrency: 'USD', toCurrency: 'UAH', rate: 41.8, effectiveDate: '2026-08-01' },
  { id: 'rate-uah-usd-2', fromCurrency: 'UAH', toCurrency: 'USD', rate: 0.0239, effectiveDate: '2026-08-01' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'global_settings',
  mainCurrency: 'USD',
  firstDayOfWeek: 1, // Monday
  theme: 'system',
  dateFormat: 'yyyy-MM-dd',
  hasSampleDataLoaded: false,
  updatedAt: new Date().toISOString(),
};

// Rich Demo Data for initial showcase or "Load sample data"
export const SAMPLE_ACCOUNTS: Account[] = [
  {
    id: 'acc-checking',
    name: 'Chase Main Checking',
    type: 'bank',
    icon: 'Landmark',
    color: '#3B82F6',
    currency: 'USD',
    initialBalanceMinor: 450000, // $4,500.00
    initialBalanceDate: '2026-07-01',
    includeInTotal: true,
    archived: false,
    order: 1,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'acc-savings',
    name: 'Marcus High-Yield Savings',
    type: 'savings',
    icon: 'PiggyBank',
    color: '#10B981',
    currency: 'USD',
    initialBalanceMinor: 1850000, // $18,500.00
    initialBalanceDate: '2026-07-01',
    includeInTotal: true,
    archived: false,
    order: 2,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'acc-cash',
    name: 'Wallet Cash',
    type: 'cash',
    icon: 'Wallet',
    color: '#F59E0B',
    currency: 'USD',
    initialBalanceMinor: 25000, // $250.00
    initialBalanceDate: '2026-07-01',
    includeInTotal: true,
    archived: false,
    order: 3,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'acc-credit-card',
    name: 'Apple Card Mastercard',
    type: 'credit',
    icon: 'CreditCard',
    color: '#8B5CF6',
    currency: 'USD',
    initialBalanceMinor: -42050, // -$420.50 (normal for credit card balance)
    initialBalanceDate: '2026-07-01',
    includeInTotal: true,
    archived: false,
    order: 4,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'acc-euro-travel',
    name: 'Revolut Euro Card',
    type: 'bank',
    icon: 'Compass',
    color: '#06B6D4',
    currency: 'EUR',
    initialBalanceMinor: 85000, // €850.00
    initialBalanceDate: '2026-07-01',
    includeInTotal: true,
    archived: false,
    order: 5,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  },
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  // Income
  {
    id: 'tx-inc-salary-1',
    accountId: 'acc-checking',
    categoryId: 'cat-inc-salary',
    kind: 'income',
    amountMinor: 380000, // $3,800.00
    note: 'Bi-weekly tech payroll',
    date: '2026-09-01',
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 'tx-inc-salary-2',
    accountId: 'acc-checking',
    categoryId: 'cat-inc-salary',
    kind: 'income',
    amountMinor: 380000, // $3,800.00
    note: 'Bi-weekly tech payroll',
    date: '2026-09-15',
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-09-15T09:00:00.000Z',
  },
  {
    id: 'tx-inc-savings-interest',
    accountId: 'acc-savings',
    categoryId: 'cat-inc-savings',
    kind: 'income',
    amountMinor: 7250, // $72.50
    note: 'Monthly 4.75% APY interest',
    date: '2026-09-30',
    createdAt: '2026-09-30T23:00:00.000Z',
    updatedAt: '2026-09-30T23:00:00.000Z',
  },

  // Expenses
  {
    id: 'tx-exp-rent',
    accountId: 'acc-checking',
    categoryId: 'cat-exp-home',
    kind: 'expense',
    amountMinor: 175000, // $1,750.00
    note: 'Apartment rent',
    date: '2026-09-02',
    createdAt: '2026-09-02T10:00:00.000Z',
    updatedAt: '2026-09-02T10:00:00.000Z',
  },
  {
    id: 'tx-exp-groceries-1',
    accountId: 'acc-credit-card',
    categoryId: 'cat-exp-food',
    kind: 'expense',
    amountMinor: 14280, // $142.80
    note: 'Whole Foods groceries',
    date: '2026-09-04',
    createdAt: '2026-09-04T14:30:00.000Z',
    updatedAt: '2026-09-04T14:30:00.000Z',
  },
  {
    id: 'tx-exp-gas-1',
    accountId: 'acc-credit-card',
    categoryId: 'cat-exp-gas',
    kind: 'expense',
    amountMinor: 5200, // $52.00
    note: 'Chevron gas refill',
    date: '2026-09-06',
    createdAt: '2026-09-06T11:15:00.000Z',
    updatedAt: '2026-09-06T11:15:00.000Z',
  },
  {
    id: 'tx-exp-dinner-1',
    accountId: 'acc-credit-card',
    categoryId: 'cat-exp-eating-out',
    kind: 'expense',
    amountMinor: 8850, // $88.50
    note: 'Sushi dinner with friends',
    date: '2026-09-10',
    createdAt: '2026-09-10T19:45:00.000Z',
    updatedAt: '2026-09-10T19:45:00.000Z',
  },
  {
    id: 'tx-exp-bills-internet',
    accountId: 'acc-checking',
    categoryId: 'cat-exp-comms',
    kind: 'expense',
    amountMinor: 7999, // $79.99
    note: 'Gigabit fiber internet',
    date: '2026-09-12',
    createdAt: '2026-09-12T08:00:00.000Z',
    updatedAt: '2026-09-12T08:00:00.000Z',
  },
  {
    id: 'tx-exp-clothes',
    accountId: 'acc-credit-card',
    categoryId: 'cat-exp-clothes',
    kind: 'expense',
    amountMinor: 12450, // $124.50
    note: 'Autumn jacket',
    date: '2026-09-18',
    createdAt: '2026-09-18T16:20:00.000Z',
    updatedAt: '2026-09-18T16:20:00.000Z',
  },
  {
    id: 'tx-exp-coffee',
    accountId: 'acc-cash',
    categoryId: 'cat-exp-eating-out',
    kind: 'expense',
    amountMinor: 650, // $6.50
    note: 'Specialty pour-over coffee',
    date: '2026-09-22',
    createdAt: '2026-09-22T09:30:00.000Z',
    updatedAt: '2026-09-22T09:30:00.000Z',
  },
  {
    id: 'tx-exp-entertainment',
    accountId: 'acc-credit-card',
    categoryId: 'cat-exp-ent',
    kind: 'expense',
    amountMinor: 3500, // $35.00
    note: 'Cinema tickets',
    date: '2026-09-26',
    createdAt: '2026-09-26T20:00:00.000Z',
    updatedAt: '2026-09-26T20:00:00.000Z',
  },
];

export const SAMPLE_TRANSFERS: Transfer[] = [
  {
    id: 'tr-savings-transfer',
    fromAccountId: 'acc-checking',
    toAccountId: 'acc-savings',
    amountFromMinor: 100000, // $1,000.00
    amountToMinor: 100000,   // $1,000.00
    rate: 1.0,
    note: 'Monthly savings contribution',
    date: '2026-09-03',
    fromTransactionId: 'tr-tx-savings-out',
    toTransactionId: 'tr-tx-savings-in',
    createdAt: '2026-09-03T10:00:00.000Z',
    updatedAt: '2026-09-03T10:00:00.000Z',
  },
  {
    id: 'tr-cash-atm',
    fromAccountId: 'acc-checking',
    toAccountId: 'acc-cash',
    amountFromMinor: 10000,  // $100.00
    amountToMinor: 10000,    // $100.00
    rate: 1.0,
    note: 'ATM cash withdrawal',
    date: '2026-09-14',
    fromTransactionId: 'tr-tx-cash-out',
    toTransactionId: 'tr-tx-cash-in',
    createdAt: '2026-09-14T15:00:00.000Z',
    updatedAt: '2026-09-14T15:00:00.000Z',
  },
  {
    id: 'tr-euro-exchange',
    fromAccountId: 'acc-checking',
    toAccountId: 'acc-euro-travel',
    amountFromMinor: 30000,  // $300.00
    amountToMinor: 27450,    // €274.50 (rate ~0.915)
    rate: 0.915,
    note: 'Pre-trip currency exchange',
    date: '2026-09-20',
    fromTransactionId: 'tr-tx-eur-out',
    toTransactionId: 'tr-tx-eur-in',
    createdAt: '2026-09-20T12:00:00.000Z',
    updatedAt: '2026-09-20T12:00:00.000Z',
  },
];
