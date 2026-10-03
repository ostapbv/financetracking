import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  format,
  parseISO,
  isBefore,
  isAfter,
  isEqual,
} from 'date-fns';
import type { RecurringRule, Transaction, RecurringFrequency } from '../db/types';

/**
 * Calculates all occurrence dates for a recurring rule between start/afterDate and untilDate
 */
export function generateRecurringDates(
  startDateStr: string,
  frequency: RecurringFrequency,
  interval: number,
  untilDateStr: string,
  endDateStr?: string,
  afterDateStr?: string
): string[] {
  const result: string[] = [];
  const until = parseISO(untilDateStr);
  const cutoff = endDateStr ? parseISO(endDateStr) : null;
  const after = afterDateStr ? parseISO(afterDateStr) : null;

  let current = parseISO(startDateStr);
  const safeInterval = Math.max(1, interval || 1);

  // Advance helper
  const advance = (d: Date): Date => {
    switch (frequency) {
      case 'daily':
        return addDays(d, safeInterval);
      case 'weekly':
        return addWeeks(d, safeInterval);
      case 'monthly':
        return addMonths(d, safeInterval);
      case 'yearly':
        return addYears(d, safeInterval);
    }
  };

  // Guard against infinite loop
  let safetyCounter = 0;
  const maxIterations = 1000;

  while (safetyCounter++ < maxIterations) {
    if (isAfter(current, until)) break;
    if (cutoff && isAfter(current, cutoff)) break;

    const dateStr = format(current, 'yyyy-MM-dd');

    // Only include if strictly after afterDateStr (or equal to startDate if no afterDateStr)
    const isEligible = after ? isAfter(current, after) : isBefore(current, until) || isEqual(current, until);

    if (isEligible) {
      result.push(dateStr);
    }

    current = advance(current);
  }

  return result;
}

/**
 * Generates transaction instances due from a recurring rule up to untilDate
 */
export function generateTransactionsFromRule(
  rule: RecurringRule,
  untilDateStr: string
): Transaction[] {
  const dates = generateRecurringDates(
    rule.startDate,
    rule.frequency,
    rule.interval,
    untilDateStr,
    rule.endDate,
    rule.lastProcessedDate
  );

  const now = new Date().toISOString();

  return dates.map((date, index) => ({
    id: `tx-rec-${rule.id}-${date}-${index}`,
    accountId: rule.template.accountId,
    categoryId: rule.template.categoryId,
    kind: rule.template.kind,
    amountMinor: rule.template.amountMinor,
    note: rule.template.note,
    date,
    recurringRuleId: rule.id,
    createdAt: now,
    updatedAt: now,
  }));
}
