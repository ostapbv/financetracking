import { db, FinanceDatabase } from './schema';
import type {
  Account,
  Category,
  Transaction,
  Transfer,
  Currency,
  ExchangeRate,
  RecurringRule,
  AppSettings,
  TransactionFilter,
  ExportData,
  TransactionKind,
} from './types';
import {
  DEFAULT_CURRENCIES,
  DEFAULT_CATEGORIES,
  DEFAULT_EXCHANGE_RATES,
  DEFAULT_SETTINGS,
  SAMPLE_ACCOUNTS,
  SAMPLE_TRANSACTIONS,
  SAMPLE_TRANSFERS,
} from './seed-data';

export interface IFinanceRepository {
  // Accounts
  getAccounts(includeArchived?: boolean): Promise<Account[]>;
  getAccountById(id: string): Promise<Account | undefined>;
  createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Account>;
  updateAccount(id: string, changes: Partial<Omit<Account, 'id'>>): Promise<Account>;
  deleteAccount(id: string): Promise<void>;

  // Categories
  getCategories(kind?: TransactionKind, includeArchived?: boolean): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: Omit<Category, 'id'> & { id?: string }): Promise<Category>;
  updateCategory(id: string, changes: Partial<Omit<Category, 'id'>>): Promise<Category>;
  deleteCategory(id: string, reassignToCategoryId?: string): Promise<void>;

  // Transactions
  getTransactions(filter?: TransactionFilter): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  createTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Transaction>;
  updateTransaction(id: string, changes: Partial<Omit<Transaction, 'id'>>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  bulkDeleteTransactions(ids: string[]): Promise<void>;
  bulkRecategorizeTransactions(ids: string[], categoryId: string): Promise<void>;

  // Transfers
  getTransfers(): Promise<Transfer[]>;
  getTransferById(id: string): Promise<Transfer | undefined>;
  createTransfer(transfer: Omit<Transfer, 'id' | 'createdAt' | 'updatedAt' | 'fromTransactionId' | 'toTransactionId'> & { id?: string }): Promise<Transfer>;
  updateTransfer(id: string, changes: Partial<Omit<Transfer, 'id' | 'fromTransactionId' | 'toTransactionId'>>): Promise<Transfer>;
  deleteTransfer(id: string): Promise<void>;

  // Currencies & Exchange Rates
  getCurrencies(): Promise<Currency[]>;
  createCurrency(currency: Currency): Promise<Currency>;
  updateCurrency(code: string, changes: Partial<Currency>): Promise<Currency>;
  getExchangeRates(from?: string, to?: string): Promise<ExchangeRate[]>;
  addExchangeRate(rate: Omit<ExchangeRate, 'id' | 'createdAt'> & { id?: string }): Promise<ExchangeRate>;
  deleteExchangeRate(id: string): Promise<void>;

  // Recurring Rules
  getRecurringRules(): Promise<RecurringRule[]>;
  createRecurringRule(rule: Omit<RecurringRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<RecurringRule>;
  updateRecurringRule(id: string, changes: Partial<Omit<RecurringRule, 'id'>>): Promise<RecurringRule>;
  deleteRecurringRule(id: string): Promise<void>;

  // Settings
  getSettings(): Promise<AppSettings>;
  updateSettings(changes: Partial<AppSettings>): Promise<AppSettings>;

  // Data Lifecycle
  initializeDefaultDataIfNeeded(): Promise<boolean>;
  loadSampleData(): Promise<void>;
  exportAllData(): Promise<ExportData>;
  importAllData(data: ExportData): Promise<void>;
  resetDatabase(): Promise<void>;
}

export class DexieFinanceRepository implements IFinanceRepository {
  private database: FinanceDatabase;

  constructor(customDb?: FinanceDatabase) {
    this.database = customDb || db;
  }

  // --- Accounts ---
  async getAccounts(includeArchived = false): Promise<Account[]> {
    const list = await this.database.accounts.toArray();
    return list
      .filter((acc) => includeArchived || !acc.archived)
      .sort((a, b) => a.order - b.order);
  }

  async getAccountById(id: string): Promise<Account | undefined> {
    return this.database.accounts.get(id);
  }

  async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Account> {
    const now = new Date().toISOString();
    const id = accountData.id || `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newAccount: Account = {
      ...accountData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await this.database.accounts.add(newAccount);
    return newAccount;
  }

  async updateAccount(id: string, changes: Partial<Omit<Account, 'id'>>): Promise<Account> {
    const existing = await this.database.accounts.get(id);
    if (!existing) throw new Error(`Account ${id} not found`);

    const updated: Account = {
      ...existing,
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    await this.database.accounts.put(updated);
    return updated;
  }

  async deleteAccount(id: string): Promise<void> {
    await this.database.transaction('rw', [this.database.accounts, this.database.transactions, this.database.transfers], async () => {
      await this.database.accounts.delete(id);
      // Delete any associated transactions
      const txs = await this.database.transactions.where('accountId').equals(id).toArray();
      await this.database.transactions.bulkDelete(txs.map((t) => t.id));
      // Delete any transfers involving this account
      const transfersFrom = await this.database.transfers.where('fromAccountId').equals(id).toArray();
      const transfersTo = await this.database.transfers.where('toAccountId').equals(id).toArray();
      const allTransfers = [...transfersFrom, ...transfersTo];
      for (const tr of allTransfers) {
        await this.deleteTransfer(tr.id);
      }
    });
  }

  // --- Categories ---
  async getCategories(kind?: TransactionKind, includeArchived = false): Promise<Category[]> {
    let list = await this.database.categories.toArray();
    if (kind) {
      list = list.filter((c) => c.kind === kind);
    }
    if (!includeArchived) {
      list = list.filter((c) => !c.archived);
    }
    return list.sort((a, b) => a.order - b.order);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this.database.categories.get(id);
  }

  async createCategory(catData: Omit<Category, 'id'> & { id?: string }): Promise<Category> {
    const id = catData.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const category: Category = {
      ...catData,
      id,
    };
    await this.database.categories.add(category);
    return category;
  }

  async updateCategory(id: string, changes: Partial<Omit<Category, 'id'>>): Promise<Category> {
    const existing = await this.database.categories.get(id);
    if (!existing) throw new Error(`Category ${id} not found`);

    const updated: Category = {
      ...existing,
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    await this.database.categories.put(updated);
    return updated;
  }

  async deleteCategory(id: string, reassignToCategoryId?: string): Promise<void> {
    await this.database.transaction('rw', [this.database.categories, this.database.transactions], async () => {
      if (reassignToCategoryId) {
        const txs = await this.database.transactions.where('categoryId').equals(id).toArray();
        for (const tx of txs) {
          tx.categoryId = reassignToCategoryId;
          tx.updatedAt = new Date().toISOString();
          await this.database.transactions.put(tx);
        }
      }
      await this.database.categories.delete(id);
    });
  }

  // --- Transactions ---
  async getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
    let list = await this.database.transactions.toArray();

    if (filter) {
      if (filter.period) {
        list = list.filter((tx) => tx.date >= filter.period!.startDate && tx.date <= filter.period!.endDate);
      }
      if (filter.accountId && filter.accountId !== 'all') {
        list = list.filter((tx) => tx.accountId === filter.accountId);
      }
      if (filter.categoryId && filter.categoryId !== 'all') {
        list = list.filter((tx) => tx.categoryId === filter.categoryId);
      }
      if (filter.kind && filter.kind !== 'all') {
        list = list.filter((tx) => tx.kind === filter.kind);
      }
      if (filter.minAmountMinor !== undefined) {
        list = list.filter((tx) => tx.amountMinor >= filter.minAmountMinor!);
      }
      if (filter.maxAmountMinor !== undefined) {
        list = list.filter((tx) => tx.amountMinor <= filter.maxAmountMinor!);
      }
      if (filter.searchQuery && filter.searchQuery.trim() !== '') {
        const q = filter.searchQuery.toLowerCase();
        list = list.filter((tx) => tx.note && tx.note.toLowerCase().includes(q));
      }
    }

    // Sort newest to oldest
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    return this.database.transactions.get(id);
  }

  async createTransaction(txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Transaction> {
    const now = new Date().toISOString();
    const id = txData.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const tx: Transaction = {
      ...txData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await this.database.transactions.add(tx);
    return tx;
  }

  async updateTransaction(id: string, changes: Partial<Omit<Transaction, 'id'>>): Promise<Transaction> {
    const existing = await this.database.transactions.get(id);
    if (!existing) throw new Error(`Transaction ${id} not found`);

    const updated: Transaction = {
      ...existing,
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    await this.database.transactions.put(updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<void> {
    const existing = await this.database.transactions.get(id);
    if (existing?.transferId) {
      // If linked to a transfer, delete the whole transfer pair to preserve balance integrity
      await this.deleteTransfer(existing.transferId);
    } else {
      await this.database.transactions.delete(id);
    }
  }

  async bulkDeleteTransactions(ids: string[]): Promise<void> {
    await this.database.transaction('rw', [this.database.transactions, this.database.transfers], async () => {
      for (const id of ids) {
        await this.deleteTransaction(id);
      }
    });
  }

  async bulkRecategorizeTransactions(ids: string[], categoryId: string): Promise<void> {
    await this.database.transaction('rw', this.database.transactions, async () => {
      const now = new Date().toISOString();
      for (const id of ids) {
        const tx = await this.database.transactions.get(id);
        if (tx && !tx.transferId) {
          tx.categoryId = categoryId;
          tx.updatedAt = now;
          await this.database.transactions.put(tx);
        }
      }
    });
  }

  // --- Transfers ---
  async getTransfers(): Promise<Transfer[]> {
    const list = await this.database.transfers.toArray();
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  async getTransferById(id: string): Promise<Transfer | undefined> {
    return this.database.transfers.get(id);
  }

  async createTransfer(
    transferData: Omit<Transfer, 'id' | 'createdAt' | 'updatedAt' | 'fromTransactionId' | 'toTransactionId'> & { id?: string }
  ): Promise<Transfer> {
    const transferId = transferData.id || `tr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fromTxId = `tr-tx-out-${transferId}`;
    const toTxId = `tr-tx-in-${transferId}`;
    const now = new Date().toISOString();

    const transfer: Transfer = {
      ...transferData,
      id: transferId,
      fromTransactionId: fromTxId,
      toTransactionId: toTxId,
      createdAt: now,
      updatedAt: now,
    };

    // Linked ledger entries:
    // Outflow entry on fromAccount
    const fromTx: Transaction = {
      id: fromTxId,
      accountId: transfer.fromAccountId,
      categoryId: 'cat-transfer', // Transfer marker category
      kind: 'expense',
      amountMinor: transfer.amountFromMinor,
      note: transfer.note ? `Transfer: ${transfer.note}` : 'Transfer out',
      date: transfer.date,
      transferId: transferId,
      createdAt: now,
      updatedAt: now,
    };

    // Inflow entry on toAccount
    const toTx: Transaction = {
      id: toTxId,
      accountId: transfer.toAccountId,
      categoryId: 'cat-transfer',
      kind: 'income',
      amountMinor: transfer.amountToMinor,
      note: transfer.note ? `Transfer: ${transfer.note}` : 'Transfer in',
      date: transfer.date,
      transferId: transferId,
      createdAt: now,
      updatedAt: now,
    };

    await this.database.transaction('rw', [this.database.transfers, this.database.transactions], async () => {
      await this.database.transfers.add(transfer);
      await this.database.transactions.add(fromTx);
      await this.database.transactions.add(toTx);
    });

    return transfer;
  }

  async updateTransfer(id: string, changes: Partial<Omit<Transfer, 'id' | 'fromTransactionId' | 'toTransactionId'>>): Promise<Transfer> {
    const existing = await this.database.transfers.get(id);
    if (!existing) throw new Error(`Transfer ${id} not found`);

    const updatedTransfer: Transfer = {
      ...existing,
      ...changes,
      updatedAt: new Date().toISOString(),
    };

    await this.database.transaction('rw', [this.database.transfers, this.database.transactions], async () => {
      await this.database.transfers.put(updatedTransfer);

      // Keep both paired transactions in sync
      const fromTx = await this.database.transactions.get(existing.fromTransactionId);
      if (fromTx) {
        fromTx.accountId = updatedTransfer.fromAccountId;
        fromTx.amountMinor = updatedTransfer.amountFromMinor;
        fromTx.date = updatedTransfer.date;
        fromTx.note = updatedTransfer.note ? `Transfer: ${updatedTransfer.note}` : 'Transfer out';
        fromTx.updatedAt = updatedTransfer.updatedAt;
        await this.database.transactions.put(fromTx);
      }

      const toTx = await this.database.transactions.get(existing.toTransactionId);
      if (toTx) {
        toTx.accountId = updatedTransfer.toAccountId;
        toTx.amountMinor = updatedTransfer.amountToMinor;
        toTx.date = updatedTransfer.date;
        toTx.note = updatedTransfer.note ? `Transfer: ${updatedTransfer.note}` : 'Transfer in';
        toTx.updatedAt = updatedTransfer.updatedAt;
        await this.database.transactions.put(toTx);
      }
    });

    return updatedTransfer;
  }

  async deleteTransfer(id: string): Promise<void> {
    const existing = await this.database.transfers.get(id);
    if (!existing) return;

    await this.database.transaction('rw', [this.database.transfers, this.database.transactions], async () => {
      await this.database.transfers.delete(id);
      await this.database.transactions.delete(existing.fromTransactionId);
      await this.database.transactions.delete(existing.toTransactionId);
    });
  }

  // --- Currencies & Rates ---
  async getCurrencies(): Promise<Currency[]> {
    return this.database.currencies.toArray();
  }

  async createCurrency(currency: Currency): Promise<Currency> {
    await this.database.currencies.put(currency);
    return currency;
  }

  async updateCurrency(code: string, changes: Partial<Currency>): Promise<Currency> {
    const existing = await this.database.currencies.get(code);
    if (!existing) throw new Error(`Currency ${code} not found`);
    const updated = { ...existing, ...changes };
    await this.database.currencies.put(updated);
    return updated;
  }

  async getExchangeRates(from?: string, to?: string): Promise<ExchangeRate[]> {
    let list = await this.database.exchangeRates.toArray();
    if (from) {
      list = list.filter((r) => r.fromCurrency === from);
    }
    if (to) {
      list = list.filter((r) => r.toCurrency === to);
    }
    return list.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  }

  async addExchangeRate(rateData: Omit<ExchangeRate, 'id' | 'createdAt'> & { id?: string }): Promise<ExchangeRate> {
    const id = rateData.id || `rate-${rateData.fromCurrency.toLowerCase()}-${rateData.toCurrency.toLowerCase()}-${rateData.effectiveDate}`;
    const rate: ExchangeRate = {
      ...rateData,
      id,
      createdAt: new Date().toISOString(),
    };
    await this.database.exchangeRates.put(rate);
    return rate;
  }

  async deleteExchangeRate(id: string): Promise<void> {
    await this.database.exchangeRates.delete(id);
  }

  // --- Recurring Rules ---
  async getRecurringRules(): Promise<RecurringRule[]> {
    return this.database.recurringRules.toArray();
  }

  async createRecurringRule(ruleData: Omit<RecurringRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<RecurringRule> {
    const id = ruleData.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const rule: RecurringRule = {
      ...ruleData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await this.database.recurringRules.add(rule);
    return rule;
  }

  async updateRecurringRule(id: string, changes: Partial<Omit<RecurringRule, 'id'>>): Promise<RecurringRule> {
    const existing = await this.database.recurringRules.get(id);
    if (!existing) throw new Error(`RecurringRule ${id} not found`);
    const updated = {
      ...existing,
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    await this.database.recurringRules.put(updated);
    return updated;
  }

  async deleteRecurringRule(id: string): Promise<void> {
    await this.database.recurringRules.delete(id);
  }

  // --- Settings ---
  async getSettings(): Promise<AppSettings> {
    const current = await this.database.settings.get('global_settings');
    if (!current) {
      await this.database.settings.put(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return current;
  }

  async updateSettings(changes: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    await this.database.settings.put(updated);
    return updated;
  }

  // --- Seed & Data Lifecycle ---
  async initializeDefaultDataIfNeeded(): Promise<boolean> {
    const currencyCount = await this.database.currencies.count();
    if (currencyCount === 0) {
      await this.database.transaction('rw', [this.database.currencies, this.database.categories, this.database.exchangeRates, this.database.settings], async () => {
        await this.database.currencies.bulkAdd(DEFAULT_CURRENCIES);
        await this.database.categories.bulkAdd(DEFAULT_CATEGORIES);
        await this.database.exchangeRates.bulkAdd(DEFAULT_EXCHANGE_RATES);
        await this.database.settings.put(DEFAULT_SETTINGS);
      });
      return true;
    }
    return false;
  }

  async loadSampleData(): Promise<void> {
    await this.initializeDefaultDataIfNeeded();
    await this.database.transaction('rw', [this.database.accounts, this.database.transactions, this.database.transfers, this.database.settings], async () => {
      // Add accounts
      for (const acc of SAMPLE_ACCOUNTS) {
        await this.database.accounts.put(acc);
      }
      // Add transactions
      for (const tx of SAMPLE_TRANSACTIONS) {
        await this.database.transactions.put(tx);
      }
      // Add transfers and their linked ledger entries
      for (const tr of SAMPLE_TRANSFERS) {
        await this.database.transfers.put(tr);
        // create paired transactions
        await this.database.transactions.put({
          id: tr.fromTransactionId,
          accountId: tr.fromAccountId,
          categoryId: 'cat-transfer',
          kind: 'expense',
          amountMinor: tr.amountFromMinor,
          note: tr.note ? `Transfer: ${tr.note}` : 'Transfer out',
          date: tr.date,
          transferId: tr.id,
          createdAt: tr.createdAt,
          updatedAt: tr.updatedAt,
        });
        await this.database.transactions.put({
          id: tr.toTransactionId,
          accountId: tr.toAccountId,
          categoryId: 'cat-transfer',
          kind: 'income',
          amountMinor: tr.amountToMinor,
          note: tr.note ? `Transfer: ${tr.note}` : 'Transfer in',
          date: tr.date,
          transferId: tr.id,
          createdAt: tr.createdAt,
          updatedAt: tr.updatedAt,
        });
      }

      await this.updateSettings({ hasSampleDataLoaded: true });
    });
  }

  async exportAllData(): Promise<ExportData> {
    const [accounts, categories, transactions, transfers, currencies, exchangeRates, recurringRules, settings] = await Promise.all([
      this.database.accounts.toArray(),
      this.database.categories.toArray(),
      this.database.transactions.toArray(),
      this.database.transfers.toArray(),
      this.database.currencies.toArray(),
      this.database.exchangeRates.toArray(),
      this.database.recurringRules.toArray(),
      this.getSettings(),
    ]);

    return {
      version: 1,
      exportDate: new Date().toISOString(),
      accounts,
      categories,
      transactions,
      transfers,
      currencies,
      exchangeRates,
      recurringRules,
      settings,
    };
  }

  async importAllData(data: ExportData): Promise<void> {
    if (!data.version || !data.accounts || !data.categories) {
      throw new Error('Invalid backup file format');
    }

    await this.database.transaction(
      'rw',
      [
        this.database.accounts,
        this.database.categories,
        this.database.transactions,
        this.database.transfers,
        this.database.currencies,
        this.database.exchangeRates,
        this.database.recurringRules,
        this.database.settings,
      ],
      async () => {
        await this.database.accounts.clear();
        await this.database.categories.clear();
        await this.database.transactions.clear();
        await this.database.transfers.clear();
        await this.database.currencies.clear();
        await this.database.exchangeRates.clear();
        await this.database.recurringRules.clear();
        await this.database.settings.clear();

        if (data.accounts.length) await this.database.accounts.bulkAdd(data.accounts);
        if (data.categories.length) await this.database.categories.bulkAdd(data.categories);
        if (data.transactions.length) await this.database.transactions.bulkAdd(data.transactions);
        if (data.transfers?.length) await this.database.transfers.bulkAdd(data.transfers);
        if (data.currencies?.length) await this.database.currencies.bulkAdd(data.currencies);
        if (data.exchangeRates?.length) await this.database.exchangeRates.bulkAdd(data.exchangeRates);
        if (data.recurringRules?.length) await this.database.recurringRules.bulkAdd(data.recurringRules);
        if (data.settings) await this.database.settings.put(data.settings);
      }
    );
  }

  async resetDatabase(): Promise<void> {
    await this.database.transaction(
      'rw',
      [
        this.database.accounts,
        this.database.categories,
        this.database.transactions,
        this.database.transfers,
        this.database.currencies,
        this.database.exchangeRates,
        this.database.recurringRules,
        this.database.settings,
      ],
      async () => {
        await this.database.accounts.clear();
        await this.database.categories.clear();
        await this.database.transactions.clear();
        await this.database.transfers.clear();
        await this.database.currencies.clear();
        await this.database.exchangeRates.clear();
        await this.database.recurringRules.clear();
        await this.database.settings.clear();

        // Re-seed defaults
        await this.database.currencies.bulkAdd(DEFAULT_CURRENCIES);
        await this.database.categories.bulkAdd(DEFAULT_CATEGORIES);
        await this.database.exchangeRates.bulkAdd(DEFAULT_EXCHANGE_RATES);
        await this.database.settings.put(DEFAULT_SETTINGS);
      }
    );
  }
}

export const financeRepository = new DexieFinanceRepository();
