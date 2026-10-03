import { describe, it, expect } from 'vitest';
import { generateRecurringDates, generateTransactionsFromRule } from '../lib/recurring';
import type { RecurringRule } from '../db/types';

describe('Recurring Transaction Generator', () => {
  it('generates daily recurrence dates', () => {
    const dates = generateRecurringDates(
      '2026-05-01',
      'daily',
      1,
      '2026-05-05'
    );
    expect(dates).toEqual([
      '2026-05-01',
      '2026-05-02',
      '2026-05-03',
      '2026-05-04',
      '2026-05-05',
    ]);
  });

  it('generates weekly recurrence with interval 2 (bi-weekly)', () => {
    const dates = generateRecurringDates(
      '2026-06-01',
      'weekly',
      2,
      '2026-06-30'
    );
    expect(dates).toEqual([
      '2026-06-01',
      '2026-06-15',
      '2026-06-29',
    ]);
  });

  it('generates monthly recurrence with cutoff end date', () => {
    const dates = generateRecurringDates(
      '2026-01-15',
      'monthly',
      1,
      '2026-12-31',
      '2026-04-30' // End date cutoff
    );
    expect(dates).toEqual([
      '2026-01-15',
      '2026-02-15',
      '2026-03-15',
      '2026-04-15',
    ]);
  });

  it('generates transactions only after lastProcessedDate', () => {
    const rule: RecurringRule = {
      id: 'rec-netflix',
      template: {
        accountId: 'acc-cc',
        categoryId: 'cat-ent',
        kind: 'expense',
        amountMinor: 1999, // $19.99
        note: 'Netflix Subscription',
      },
      frequency: 'monthly',
      interval: 1,
      startDate: '2026-01-05',
      lastProcessedDate: '2026-03-05', // Already generated through March
      createdAt: '',
      updatedAt: '',
    };

    const newTxs = generateTransactionsFromRule(rule, '2026-05-10');
    // Should generate for April and May only
    expect(newTxs.length).toBe(2);
    expect(newTxs[0].date).toBe('2026-04-05');
    expect(newTxs[1].date).toBe('2026-05-05');
    expect(newTxs[0].amountMinor).toBe(1999);
    expect(newTxs[0].note).toBe('Netflix Subscription');
    expect(newTxs[0].recurringRuleId).toBe('rec-netflix');
  });
});
