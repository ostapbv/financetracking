import { create } from 'zustand';
import { financeRepository } from '../db/repository';
import type {
  Account,
  Category,
  Transaction,
  Transfer,
  Currency,
  ExchangeRate,
  AppSettings,
  TransactionKind,
  ExportData,
} from '../db/types';
import { DEFAULT_SETTINGS } from '../db/seed-data';
import { fetchPublicExchangeRates } from '../lib/currency';

interface FinanceState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  transfers: Transfer[];
  currencies: Currency[];
  exchangeRates: ExchangeRate[];
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;

  // Accounts
  createAccount: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Account>;
  updateAccount: (id: string, changes: Partial<Omit<Account, 'id'>>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Categories
  createCategory: (data: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, changes: Partial<Omit<Category, 'id'>>) => Promise<void>;
  deleteCategory: (id: string, reassignToCategoryId?: string) => Promise<void>;
  reorderCategories: (orderedCategories: Category[]) => Promise<void>;

  // Transactions
  createTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, changes: Partial<Omit<Transaction, 'id'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkDeleteTransactions: (ids: string[]) => Promise<void>;
  bulkRecategorizeTransactions: (ids: string[], categoryId: string) => Promise<void>;

  // Transfers
  createTransfer: (data: Omit<Transfer, 'id' | 'createdAt' | 'updatedAt' | 'fromTransactionId' | 'toTransactionId'>) => Promise<Transfer>;
  updateTransfer: (id: string, changes: Partial<Omit<Transfer, 'id' | 'fromTransactionId' | 'toTransactionId'>>) => Promise<void>;
  deleteTransfer: (id: string) => Promise<void>;

  // Currencies & Rates
  createCurrency: (currency: Currency) => Promise<void>;
  updateCurrency: (code: string, changes: Partial<Currency>) => Promise<void>;
  addExchangeRate: (rate: Omit<ExchangeRate, 'id' | 'createdAt'>) => Promise<void>;
  deleteExchangeRate: (id: string) => Promise<void>;
  fetchAndSaveLiveRates: () => Promise<boolean>;

  // Settings & Lifecycle
  updateSettings: (changes: Partial<AppSettings>) => Promise<void>;
  loadSampleData: () => Promise<void>;
  resetDatabase: () => Promise<void>;
  importData: (jsonData: ExportData) => Promise<void>;
  exportData: () => Promise<ExportData>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  accounts: [],
  categories: [],
  transactions: [],
  transfers: [],
  currencies: [],
  exchangeRates: [],
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      await financeRepository.initializeDefaultDataIfNeeded();

      const [accounts, categories, transactions, transfers, currencies, exchangeRates, settings] = await Promise.all([
        financeRepository.getAccounts(true),
        financeRepository.getCategories(undefined, true),
        financeRepository.getTransactions(),
        financeRepository.getTransfers(),
        financeRepository.getCurrencies(),
        financeRepository.getExchangeRates(),
        financeRepository.getSettings(),
      ]);

      set({
        accounts,
        categories,
        transactions,
        transfers,
        currencies,
        exchangeRates,
        settings,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to initialize database', isLoading: false });
    }
  },

  // Accounts
  createAccount: async (data) => {
    const acc = await financeRepository.createAccount(data);
    set((state) => ({ accounts: [...state.accounts, acc].sort((a, b) => a.order - b.order) }));
    return acc;
  },

  updateAccount: async (id, changes) => {
    const updated = await financeRepository.updateAccount(id, changes);
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? updated : a)),
    }));
  },

  deleteAccount: async (id) => {
    await financeRepository.deleteAccount(id);
    // Reload state since transactions and transfers involving this account were removed
    await get().initialize();
  },

  // Categories
  createCategory: async (data) => {
    const cat = await financeRepository.createCategory(data);
    set((state) => ({ categories: [...state.categories, cat].sort((a, b) => a.order - b.order) }));
    return cat;
  },

  updateCategory: async (id, changes) => {
    const updated = await financeRepository.updateCategory(id, changes);
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? updated : c)),
    }));
  },

  deleteCategory: async (id, reassignToCategoryId) => {
    await financeRepository.deleteCategory(id, reassignToCategoryId);
    await get().initialize();
  },

  reorderCategories: async (orderedCategories) => {
    set({ categories: orderedCategories });
    for (let i = 0; i < orderedCategories.length; i++) {
      const cat = orderedCategories[i];
      await financeRepository.updateCategory(cat.id, { order: i + 1 });
    }
  },

  // Transactions
  createTransaction: async (data) => {
    const tx = await financeRepository.createTransaction(data);
    set((state) => ({
      transactions: [tx, ...state.transactions].sort((a, b) => b.date.localeCompare(a.date)),
    }));
    return tx;
  },

  updateTransaction: async (id, changes) => {
    const updated = await financeRepository.updateTransaction(id, changes);
    set((state) => ({
      transactions: state.transactions
        .map((t) => (t.id === id ? updated : t))
        .sort((a, b) => b.date.localeCompare(a.date)),
    }));
  },

  deleteTransaction: async (id) => {
    await financeRepository.deleteTransaction(id);
    // If was part of transfer, reload to stay consistent
    const wasTransfer = get().transactions.find((t) => t.id === id)?.transferId;
    if (wasTransfer) {
      await get().initialize();
    } else {
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
    }
  },

  bulkDeleteTransactions: async (ids) => {
    await financeRepository.bulkDeleteTransactions(ids);
    await get().initialize();
  },

  bulkRecategorizeTransactions: async (ids, categoryId) => {
    await financeRepository.bulkRecategorizeTransactions(ids, categoryId);
    set((state) => ({
      transactions: state.transactions.map((t) =>
        ids.includes(t.id) && !t.transferId ? { ...t, categoryId } : t
      ),
    }));
  },

  // Transfers
  createTransfer: async (data) => {
    const transfer = await financeRepository.createTransfer(data);
    await get().initialize();
    return transfer;
  },

  updateTransfer: async (id, changes) => {
    await financeRepository.updateTransfer(id, changes);
    await get().initialize();
  },

  deleteTransfer: async (id) => {
    await financeRepository.deleteTransfer(id);
    await get().initialize();
  },

  // Currencies & Rates
  createCurrency: async (currency) => {
    await financeRepository.createCurrency(currency);
    set((state) => ({ currencies: [...state.currencies, currency] }));
  },

  updateCurrency: async (code, changes) => {
    const updated = await financeRepository.updateCurrency(code, changes);
    set((state) => ({
      currencies: state.currencies.map((c) => (c.code === code ? updated : c)),
    }));
  },

  addExchangeRate: async (rateData) => {
    const rate = await financeRepository.addExchangeRate(rateData);
    set((state) => ({
      exchangeRates: [rate, ...state.exchangeRates].sort((a, b) =>
        b.effectiveDate.localeCompare(a.effectiveDate)
      ),
    }));
  },

  deleteExchangeRate: async (id) => {
    await financeRepository.deleteExchangeRate(id);
    set((state) => ({
      exchangeRates: state.exchangeRates.filter((r) => r.id !== id),
    }));
  },

  fetchAndSaveLiveRates: async () => {
    const mainCur = get().settings.mainCurrency || 'USD';
    const liveRates = await fetchPublicExchangeRates(mainCur);
    if (!liveRates) return false;

    const today = new Date().toISOString().slice(0, 10);
    const existingCurrencies = get().currencies.map((c) => c.code);

    for (const code of existingCurrencies) {
      if (code === mainCur) continue;
      const rateVal = liveRates[code];
      if (rateVal) {
        // Direct rate
        await financeRepository.addExchangeRate({
          fromCurrency: mainCur,
          toCurrency: code,
          rate: rateVal,
          effectiveDate: today,
        });
        // Inverse rate
        if (rateVal > 0) {
          await financeRepository.addExchangeRate({
            fromCurrency: code,
            toCurrency: mainCur,
            rate: 1 / rateVal,
            effectiveDate: today,
          });
        }
      }
    }

    const updatedRates = await financeRepository.getExchangeRates();
    set({ exchangeRates: updatedRates });
    return true;
  },

  // Settings & Lifecycle
  updateSettings: async (changes) => {
    const updated = await financeRepository.updateSettings(changes);
    set({ settings: updated });
  },

  loadSampleData: async () => {
    await financeRepository.loadSampleData();
    await get().initialize();
  },

  resetDatabase: async () => {
    await financeRepository.resetDatabase();
    await get().initialize();
  },

  importData: async (jsonData) => {
    await financeRepository.importAllData(jsonData);
    await get().initialize();
  },

  exportData: async () => {
    return financeRepository.exportAllData();
  },
}));
