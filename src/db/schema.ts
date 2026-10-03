import Dexie, { type Table } from 'dexie';
import type {
  Account,
  Category,
  Transaction,
  Transfer,
  Currency,
  ExchangeRate,
  RecurringRule,
  AppSettings,
} from './types';

export class FinanceDatabase extends Dexie {
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;
  transfers!: Table<Transfer, string>;
  currencies!: Table<Currency, string>;
  exchangeRates!: Table<ExchangeRate, string>;
  recurringRules!: Table<RecurringRule, string>;
  settings!: Table<AppSettings, string>;

  constructor(dbName = 'MonarchFinanceDB') {
    super(dbName);

    this.version(1).stores({
      accounts: 'id, type, currency, archived, order, includeInTotal',
      categories: 'id, kind, archived, order',
      transactions: 'id, accountId, categoryId, kind, date, recurringRuleId, transferId, [accountId+date]',
      transfers: 'id, fromAccountId, toAccountId, date',
      currencies: 'code',
      exchangeRates: 'id, fromCurrency, toCurrency, effectiveDate, [fromCurrency+toCurrency]',
      recurringRules: 'id, frequency, startDate, endDate',
      settings: 'id',
    });
  }
}

export const db = new FinanceDatabase();
