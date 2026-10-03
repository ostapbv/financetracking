import type {
  Account,
  Transaction,
  ExchangeRate,
  Currency,
} from '../db/types';
import { convertCurrency } from './currency';

/**
 * Calculates current balance of an account in its native minor units.
 * Formula: initialBalance + income - expense (including transfer ledger entries).
 * If asOfDate is provided, only considers transactions on or before that date.
 */
export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[],
  asOfDate?: string
): number {
  let balance = account.initialBalanceMinor;

  const relevantTxs = transactions.filter((tx) => {
    if (tx.accountId !== account.id) return false;
    // Transactions before initial balance date shouldn't double count if user set an initial date
    if (account.initialBalanceDate && tx.date < account.initialBalanceDate) return false;
    if (asOfDate && tx.date > asOfDate) return false;
    return true;
  });

  for (const tx of relevantTxs) {
    if (tx.kind === 'income') {
      balance += tx.amountMinor;
    } else if (tx.kind === 'expense') {
      balance -= tx.amountMinor;
    }
  }

  return balance;
}

/**
 * Calculates carry-over balance for an account prior to the given period start date.
 * Represents all net worth / funds accumulated before period start.
 */
export function calculateAccountCarryOver(
  account: Account,
  periodStartDate: string,
  transactions: Transaction[]
): number {
  let balance = account.initialBalanceMinor;

  const priorTxs = transactions.filter((tx) => {
    if (tx.accountId !== account.id) return false;
    if (account.initialBalanceDate && tx.date < account.initialBalanceDate) return false;
    return tx.date < periodStartDate;
  });

  for (const tx of priorTxs) {
    if (tx.kind === 'income') {
      balance += tx.amountMinor;
    } else if (tx.kind === 'expense') {
      balance -= tx.amountMinor;
    }
  }

  return balance;
}

/**
 * Calculates aggregate carry-over balance across all active included accounts,
 * converted to the main currency.
 */
export function calculateTotalCarryOver(
  accounts: Account[],
  periodStartDate: string,
  transactions: Transaction[],
  rates: ExchangeRate[],
  mainCurrency = 'USD',
  currencies?: Record<string, Currency> | Map<string, Currency> | Currency[]
): number {
  let totalMinor = 0;

  for (const acc of accounts) {
    if (!acc.includeInTotal || acc.archived) continue;

    const accCarryOver = calculateAccountCarryOver(acc, periodStartDate, transactions);
    const converted = convertCurrency(
      accCarryOver,
      acc.currency,
      mainCurrency,
      periodStartDate,
      rates,
      currencies
    );
    totalMinor += converted;
  }

  return totalMinor;
}

/**
 * Calculates Net Worth across all active included accounts in main currency minor units.
 */
export function calculateNetWorth(
  accounts: Account[],
  transactions: Transaction[],
  rates: ExchangeRate[],
  mainCurrency = 'USD',
  currencies?: Record<string, Currency> | Map<string, Currency> | Currency[],
  asOfDate?: string
): number {
  let netWorthMinor = 0;
  const targetDate = asOfDate || new Date().toISOString().slice(0, 10);

  for (const acc of accounts) {
    if (!acc.includeInTotal || acc.archived) continue;

    const balance = calculateAccountBalance(acc, transactions, targetDate);
    const converted = convertCurrency(
      balance,
      acc.currency,
      mainCurrency,
      targetDate,
      rates,
      currencies
    );
    netWorthMinor += converted;
  }

  return netWorthMinor;
}

/**
 * Computes Cash Flow stats (Income, Expense, Net) for a given period.
 * IMPORTANT: Transfer ledger entries (tx.transferId) are excluded from income and expense stats.
 */
export function calculatePeriodCashFlow(
  transactions: Transaction[],
  periodStartDate: string,
  periodEndDate: string,
  options?: {
    accountId?: string;
    rates?: ExchangeRate[];
    mainCurrency?: string;
    accountsMap?: Map<string, Account>;
    currencies?: Record<string, Currency> | Map<string, Currency> | Currency[];
  }
): { totalIncomeMinor: number; totalExpenseMinor: number; netIncomeMinor: number } {
  let totalIncomeMinor = 0;
  let totalExpenseMinor = 0;

  const relevantTxs = transactions.filter((tx) => {
    // Exclude transfers from income/expense metrics
    if (tx.transferId) return false;
    if (options?.accountId && options.accountId !== 'all' && tx.accountId !== options.accountId) {
      return false;
    }
    return tx.date >= periodStartDate && tx.date <= periodEndDate;
  });

  for (const tx of relevantTxs) {
    let amount = tx.amountMinor;

    // Convert to main currency if multi-currency conversion is requested
    if (options?.rates && options?.mainCurrency && options?.accountsMap) {
      const acc = options.accountsMap.get(tx.accountId);
      if (acc && acc.currency !== options.mainCurrency) {
        amount = convertCurrency(
          tx.amountMinor,
          acc.currency,
          options.mainCurrency,
          tx.date,
          options.rates,
          options.currencies
        );
      }
    }

    if (tx.kind === 'income') {
      totalIncomeMinor += amount;
    } else if (tx.kind === 'expense') {
      totalExpenseMinor += amount;
    }
  }

  return {
    totalIncomeMinor,
    totalExpenseMinor,
    netIncomeMinor: totalIncomeMinor - totalExpenseMinor,
  };
}

/**
 * Computes sparkline data points for an account over the last N days
 */
export function calculateAccountSparkline(
  account: Account,
  transactions: Transaction[],
  pointsCount = 14
): { date: string; balance: number }[] {
  const points: { date: string; balance: number }[] = [];
  const now = new Date();

  for (let i = pointsCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const balance = calculateAccountBalance(account, transactions, dateStr);
    points.push({ date: dateStr, balance });
  }

  return points;
}
