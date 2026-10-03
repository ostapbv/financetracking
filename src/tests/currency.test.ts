import { describe, it, expect } from 'vitest';
import { findEffectiveRate, convertCurrency } from '../lib/currency';
import type { ExchangeRate } from '../db/types';

describe('Currency and Dated Exchange Rate Lookup', () => {
  const mockRates: ExchangeRate[] = [
    { id: '1', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.90, effectiveDate: '2026-01-01' },
    { id: '2', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, effectiveDate: '2026-06-01' },
    { id: '3', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.95, effectiveDate: '2026-09-01' },
    { id: '4', fromCurrency: 'USD', toCurrency: 'PLN', rate: 4.00, effectiveDate: '2026-01-01' },
    { id: '5', fromCurrency: 'UAH', toCurrency: 'USD', rate: 0.024, effectiveDate: '2026-01-01' },
  ];

  it('returns 1.0 when converting to same currency', () => {
    expect(findEffectiveRate('USD', 'USD', '2026-07-15', mockRates)).toBe(1.0);
  });

  it('finds the most recent rate on or before the given transaction date', () => {
    // Before June 1st -> should use Jan 1st rate (0.90)
    expect(findEffectiveRate('USD', 'EUR', '2026-03-15', mockRates)).toBe(0.90);

    // Exact match on June 1st -> should use June 1st rate (0.92)
    expect(findEffectiveRate('USD', 'EUR', '2026-06-01', mockRates)).toBe(0.92);

    // Between June 1st and Sept 1st -> should use June 1st rate (0.92)
    expect(findEffectiveRate('USD', 'EUR', '2026-08-15', mockRates)).toBe(0.92);

    // After Sept 1st -> should use Sept 1st rate (0.95)
    expect(findEffectiveRate('USD', 'EUR', '2026-10-01', mockRates)).toBe(0.95);
  });

  it('calculates inverse rate when only reverse pair is provided', () => {
    // USD -> UAH is not directly listed, but UAH -> USD is 0.024
    const rateUsdToUah = findEffectiveRate('USD', 'UAH', '2026-05-01', mockRates);
    expect(rateUsdToUah).toBeCloseTo(1 / 0.024, 4); // ~41.6667
  });

  it('triangulates exchange rate via USD when neither currency is base USD', () => {
    // UAH -> EUR triangulated: UAH -> USD (0.024) * USD -> EUR (0.90 on Jan 1) = 0.0216
    const rateUahToEur = findEffectiveRate('UAH', 'EUR', '2026-02-01', mockRates);
    expect(rateUahToEur).toBeCloseTo(0.024 * 0.90, 4);
  });

  it('converts minor amounts accurately across dated rates', () => {
    // $100.00 (10000 cents) USD to EUR on 2026-01-15 (rate 0.90) -> €90.00 (9000 cents)
    const convertedJan = convertCurrency(10000, 'USD', 'EUR', '2026-01-15', mockRates);
    expect(convertedJan).toBe(9000);

    // $100.00 (10000 cents) USD to EUR on 2026-09-15 (rate 0.95) -> €95.00 (9500 cents)
    const convertedSep = convertCurrency(10000, 'USD', 'EUR', '2026-09-15', mockRates);
    expect(convertedSep).toBe(9500);
  });
});
