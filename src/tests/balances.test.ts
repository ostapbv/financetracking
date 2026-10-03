import { describe, it, expect } from 'vitest';
import {
  calculateAccountBalance,
  calculateAccountCarryOver,
  calculateTotalCarryOver,
  calculateNetWorth,
  calculatePeriodCashFlow,
} from '../lib/balances';
import type { Account, Transaction, ExchangeRate } from '../db/types';

describe('Balance and Net Worth Calculations', () => {
  const mockChecking: Account = {
    id: 'acc-1',
    name: 'Checking',
    type: 'bank',
    icon: 'Landmark',
    color: '#3B82F6',
    currency: 'USD',
    initialBalanceMinor: 100000, // $1,000.00
    initialBalanceDate: '2026-01-01',
    includeInTotal: true,
    archived: false,
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockCredit: Account = {
    id: 'acc-2',
    name: 'Credit Card',
    type: 'credit',
    icon: 'CreditCard',
    color: '#EF4444',
    currency: 'USD',
    initialBalanceMinor: -20000, // -$200.00 debt
    initialBalanceDate: '2026-01-01',
    includeInTotal: true,
    archived: false,
    order: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockEurSavings: Account = {
    id: 'acc-3',
    name: 'Euro Savings',
    type: 'savings',
    icon: 'PiggyBank',
    color: '#10B981',
    currency: 'EUR',
    initialBalanceMinor: 50000, // €500.00
    initialBalanceDate: '2026-01-01',
    includeInTotal: true,
    archived: false,
    order: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockRates: ExchangeRate[] = [
    { id: '1', fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.10, effectiveDate: '2026-01-01' },
    { id: '2', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.909, effectiveDate: '2026-01-01' },
  ];

  it('calculates account balance: initial balance + income - expenses', () => {
    const txs: Transaction[] = [
      {
        id: 'tx-1',
        accountId: 'acc-1',
        categoryId: 'cat-salary',
        kind: 'income',
        amountMinor: 300000, // +$3,000.00
        date: '2026-01-15',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'tx-2',
        accountId: 'acc-1',
        categoryId: 'cat-rent',
        kind: 'expense',
        amountMinor: 120000, // -$1,200.00
        date: '2026-01-20',
        createdAt: '',
        updatedAt: '',
      },
    ];

    // Initial $1000 + $3000 - $1200 = $2800 (280000 cents)
    const balance = calculateAccountBalance(mockChecking, txs);
    expect(balance).toBe(280000);
  });

  it('handles negative starting balance (credit card) with expenses and payments', () => {
    const txs: Transaction[] = [
      {
        id: 'tx-cc-1',
        accountId: 'acc-2',
        categoryId: 'cat-groceries',
        kind: 'expense',
        amountMinor: 15000, // -$150.00 more debt
        date: '2026-01-10',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'tx-cc-2',
        accountId: 'acc-2',
        categoryId: 'cat-payment',
        kind: 'income',
        amountMinor: 25000, // +$250.00 bill pay
        date: '2026-01-25',
        createdAt: '',
        updatedAt: '',
      },
    ];

    // Initial -$200 - $150 + $250 = -$100 (-10000 cents)
    const balance = calculateAccountBalance(mockCredit, txs);
    expect(balance).toBe(-10000);
  });

  it('correctly calculates balances with cross-currency transfers', () => {
    // Transfer $100 USD from Checking to Euro Savings (€90 EUR received)
    const txs: Transaction[] = [
      // Outflow from checking
      {
        id: 'tr-tx-1',
        accountId: 'acc-1',
        categoryId: 'cat-transfer',
        kind: 'expense',
        amountMinor: 10000, // -$100.00 USD
        transferId: 'tr-1',
        date: '2026-02-01',
        createdAt: '',
        updatedAt: '',
      },
      // Inflow to Euro Savings
      {
        id: 'tr-tx-2',
        accountId: 'acc-3',
        categoryId: 'cat-transfer',
        kind: 'income',
        amountMinor: 9000, // +€90.00 EUR
        transferId: 'tr-1',
        date: '2026-02-01',
        createdAt: '',
        updatedAt: '',
      },
    ];

    const checkingBal = calculateAccountBalance(mockChecking, txs);
    const euroBal = calculateAccountBalance(mockEurSavings, txs);

    // Checking: 100000 - 10000 = 90000 cents ($900.00)
    expect(checkingBal).toBe(90000);
    // Euro Savings: 50000 + 9000 = 59000 cents (€590.00)
    expect(euroBal).toBe(59000);
  });

  it('calculates carry-over balance prior to the start of a period', () => {
    const txs: Transaction[] = [
      {
        id: 'tx-jan',
        accountId: 'acc-1',
        categoryId: 'cat-bonus',
        kind: 'income',
        amountMinor: 50000, // +$500 in January
        date: '2026-01-15',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'tx-feb',
        accountId: 'acc-1',
        categoryId: 'cat-groceries',
        kind: 'expense',
        amountMinor: 8000, // -$80 in February
        date: '2026-02-05',
        createdAt: '',
        updatedAt: '',
      },
    ];

    // Period starts 2026-02-01.
    // Carry over before Feb 1st = Initial ($1,000) + Jan bonus ($500) = $1,500 (150000 cents)
    const carryOver = calculateAccountCarryOver(mockChecking, '2026-02-01', txs);
    expect(carryOver).toBe(150000);

    // Total balance after Feb tx is 150000 - 8000 = 142000
    const currentBal = calculateAccountBalance(mockChecking, txs);
    expect(currentBal).toBe(142000);
  });

  it('calculates total carry-over converted to main currency', () => {
    const accounts = [mockChecking, mockEurSavings];
    const txs: Transaction[] = []; // No extra txs, only initial balances

    // mockChecking carry-over: $1000.00
    // mockEurSavings carry-over: €500.00 at rate 1.10 = $550.00 USD
    // Total in USD = $1,550.00 (155000 cents)
    const totalCarry = calculateTotalCarryOver(accounts, '2026-02-01', txs, mockRates, 'USD');
    expect(totalCarry).toBe(155000);
  });

  it('calculates total net worth across multiple accounts converted to main currency', () => {
    const accounts = [mockChecking, mockCredit, mockEurSavings];
    const txs: Transaction[] = [];

    // Checking: +$1,000 USD
    // Credit: -$200 USD
    // Euro Savings: €500 * 1.10 = +$550 USD
    // Net worth = 1000 - 200 + 550 = $1,350 USD (135000 cents)
    const netWorth = calculateNetWorth(accounts, txs, mockRates, 'USD');
    expect(netWorth).toBe(135000);
  });

  it('calculates period cash flow excluding transfers', () => {
    const txs: Transaction[] = [
      {
        id: 'tx-income',
        accountId: 'acc-1',
        categoryId: 'cat-salary',
        kind: 'income',
        amountMinor: 200000, // $2,000.00
        date: '2026-03-05',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'tx-expense',
        accountId: 'acc-1',
        categoryId: 'cat-food',
        kind: 'expense',
        amountMinor: 60000, // $600.00
        date: '2026-03-12',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'tx-transfer-debit',
        accountId: 'acc-1',
        categoryId: 'cat-transfer',
        kind: 'expense',
        amountMinor: 50000, // $500 transfer out (should NOT count as expense in cash flow)
        transferId: 'tr-some-id',
        date: '2026-03-15',
        createdAt: '',
        updatedAt: '',
      },
    ];

    const stats = calculatePeriodCashFlow(txs, '2026-03-01', '2026-03-31');
    expect(stats.totalIncomeMinor).toBe(200000);
    expect(stats.totalExpenseMinor).toBe(60000);
    expect(stats.netIncomeMinor).toBe(140000);
  });
});
