import { describe, it, expect } from 'vitest';
import {
  toMinorUnits,
  toMajorUnits,
  parseMoneyInput,
  formatMoney,
  convertMinorByRate,
} from '../lib/money';

describe('Money utility functions', () => {
  it('converts major to minor units without floating point imprecision', () => {
    expect(toMinorUnits(12.50, 2)).toBe(1250);
    expect(toMinorUnits(0.10 + 0.20, 2)).toBe(30); // 0.30000000000000004 avoided
    expect(toMinorUnits(100, 0)).toBe(100);
    expect(toMinorUnits(1.234, 3)).toBe(1234);
  });

  it('converts minor to major units', () => {
    expect(toMajorUnits(1250, 2)).toBe(12.5);
    expect(toMajorUnits(100, 0)).toBe(100);
    expect(toMajorUnits(1234, 3)).toBe(1.234);
  });

  it('parses various money input string formats', () => {
    expect(parseMoneyInput('12.50')).toBe(1250);
    expect(parseMoneyInput('$1,234.56')).toBe(123456);
    expect(parseMoneyInput('-45.00')).toBe(-4500);
    expect(parseMoneyInput('12,50')).toBe(1250); // European comma decimal
    expect(parseMoneyInput('1.500,00')).toBe(150000); // European thousands dot
    expect(parseMoneyInput('')).toBe(0);
    expect(parseMoneyInput('abc')).toBe(0);
  });

  it('formats minor units to localized currency string', () => {
    const formattedUsd = formatMoney(125050, 'USD');
    expect(formattedUsd).toContain('1,250.50');
    expect(formattedUsd).toContain('$');

    const formattedNegative = formatMoney(-42000, 'USD');
    expect(formattedNegative).toContain('420.00');

    const formattedWithSign = formatMoney(5000, 'USD', undefined, { showSign: true });
    expect(formattedWithSign).toContain('+');
  });

  it('converts minor amount using exchange rate correctly', () => {
    // 100 USD (10000 cents) at rate 0.90 to EUR -> 9000 cents EUR
    const eurMinor = convertMinorByRate(10000, 0.90, 2, 2);
    expect(eurMinor).toBe(9000);

    // 100 USD (10000 cents) at rate 150 to JPY (precision 0) -> 15000 yen
    const jpyMinor = convertMinorByRate(10000, 150, 2, 0);
    expect(jpyMinor).toBe(15000);
  });
});
