import type { ExchangeRate, Currency } from '../db/types';
import { convertMinorByRate } from './money';

/**
 * Finds the most recent effective exchange rate on or before the given target date.
 * If no direct rate exists, attempts inverse rate (1/R) or triangular conversion via USD.
 */
export function findEffectiveRate(
  fromCurrency: string,
  toCurrency: string,
  date: string,
  rates: ExchangeRate[]
): number | null {
  if (fromCurrency === toCurrency) return 1.0;

  // 1. Direct rate search: from -> to where effectiveDate <= date
  const directRates = rates.filter(
    (r) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
  );

  const directEligible = directRates
    .filter((r) => r.effectiveDate <= date)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  if (directEligible.length > 0) {
    return directEligible[0].rate;
  }

  // Fallback direct: if all rates are in future relative to date, pick earliest available
  if (directRates.length > 0) {
    const sorted = [...directRates].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
    return sorted[0].rate;
  }

  // 2. Inverse rate search: to -> from
  const inverseRates = rates.filter(
    (r) => r.fromCurrency === toCurrency && r.toCurrency === fromCurrency
  );

  const inverseEligible = inverseRates
    .filter((r) => r.effectiveDate <= date)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  if (inverseEligible.length > 0 && inverseEligible[0].rate > 0) {
    return 1 / inverseEligible[0].rate;
  }

  if (inverseRates.length > 0 && inverseRates[0].rate > 0) {
    const sorted = [...inverseRates].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
    return 1 / sorted[0].rate;
  }

  // 3. Triangulation via USD if neither from nor to is USD
  if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
    const rateToUSD = findEffectiveRate(fromCurrency, 'USD', date, rates);
    const rateFromUSD = findEffectiveRate('USD', toCurrency, date, rates);
    if (rateToUSD !== null && rateFromUSD !== null) {
      return rateToUSD * rateFromUSD;
    }
  }

  return null;
}

/**
 * Converts minor amount between currencies using the effective dated exchange rate
 */
export function convertCurrency(
  amountMinor: number,
  fromCurrency: string,
  toCurrency: string,
  date: string,
  rates: ExchangeRate[],
  currencies?: Record<string, Currency> | Map<string, Currency> | Currency[]
): number {
  if (fromCurrency === toCurrency) return amountMinor;

  const rate = findEffectiveRate(fromCurrency, toCurrency, date, rates) ?? 1.0;

  let fromPrecision = 2;
  let toPrecision = 2;

  if (currencies) {
    const getPrecision = (code: string) => {
      if (currencies instanceof Map) return currencies.get(code)?.precision ?? 2;
      if (Array.isArray(currencies)) return currencies.find((c) => c.code === code)?.precision ?? 2;
      return currencies[code]?.precision ?? 2;
    };
    fromPrecision = getPrecision(fromCurrency);
    toPrecision = getPrecision(toCurrency);
  }

  return convertMinorByRate(amountMinor, rate, fromPrecision, toPrecision);
}

/**
 * Optional helper to fetch latest public exchange rates from a free API
 */
export async function fetchPublicExchangeRates(
  baseCurrency = 'USD'
): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.rates) {
      return data.rates as Record<string, number>;
    }
    return null;
  } catch (err) {
    console.warn('Failed to fetch public exchange rates:', err);
    return null;
  }
}
