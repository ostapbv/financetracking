import type { Currency } from '../db/types';

/**
 * Converts a decimal major currency amount (e.g. 12.50) into integer minor units (e.g. 1250 cents)
 */
export function toMinorUnits(amount: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round(amount * factor);
}

/**
 * Converts integer minor units (e.g. 1250) into major currency units (e.g. 12.50)
 */
export function toMajorUnits(minorAmount: number, precision = 2): number {
  const factor = Math.pow(10, precision);
  return minorAmount / factor;
}

/**
 * Parses user input string into integer minor units.
 * Supports comma/dot decimal separators, stripping currency symbols and whitespace.
 */
export function parseMoneyInput(input: string, precision = 2): number {
  if (!input || typeof input !== 'string') return 0;
  // Clean string: remove currency symbols and whitespace
  let clean = input.replace(/[^0-9.,-]/g, '').trim();
  if (!clean) return 0;

  const isNegative = clean.startsWith('-');
  if (isNegative) {
    clean = clean.substring(1);
  }

  // Handle European vs US number formatting: "1.234,56" vs "1,234.56"
  if (clean.includes(',') && clean.includes('.')) {
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');
    if (lastComma > lastDot) {
      // European format: 1.234,56 -> 1234.56
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56 -> 1234.56
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    // Only comma: check if it represents decimal (e.g. "12,50") or thousands ("1,000")
    const parts = clean.split(',');
    if (parts.length === 2 && parts[1].length <= precision) {
      clean = clean.replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  }

  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  const minor = toMinorUnits(num, precision);
  return isNegative ? -minor : minor;
}

/**
 * Formats integer minor units into localized currency string with proper symbols and tabular formatting
 */
export function formatMoney(
  minorAmount: number,
  currencyCode = 'USD',
  currencies?: Record<string, Currency> | Map<string, Currency> | Currency[],
  options?: {
    showSign?: boolean;
    compact?: boolean;
  }
): string {
  let currencyMeta: Currency | undefined;
  if (currencies) {
    if (currencies instanceof Map) {
      currencyMeta = currencies.get(currencyCode);
    } else if (Array.isArray(currencies)) {
      currencyMeta = currencies.find((c) => c.code === currencyCode);
    } else {
      currencyMeta = currencies[currencyCode];
    }
  }

  const precision = currencyMeta?.precision ?? 2;
  const major = toMajorUnits(minorAmount, precision);

  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      signDisplay: options?.showSign ? 'always' : 'auto',
    });
    return formatter.format(major);
  } catch {
    // Fallback if currency code is custom
    const symbol = currencyMeta?.symbol || currencyCode;
    const sign = minorAmount < 0 ? '-' : options?.showSign && minorAmount > 0 ? '+' : '';
    const absVal = Math.abs(major).toFixed(precision);
    return `${sign}${symbol}${absVal}`;
  }
}

/**
 * Safely converts an amount in minor units from one currency to another using an exchange rate
 */
export function convertMinorByRate(
  amountFromMinor: number,
  rate: number,
  fromPrecision = 2,
  toPrecision = 2
): number {
  if (rate === 1 && fromPrecision === toPrecision) {
    return amountFromMinor;
  }
  const fromMajor = toMajorUnits(amountFromMinor, fromPrecision);
  const toMajor = fromMajor * rate;
  return toMinorUnits(toMajor, toPrecision);
}
