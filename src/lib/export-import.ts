import type { Transaction, Account, Category, Currency } from '../db/types';
import { toMajorUnits } from './money';

export function exportTransactionsToCSV(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  currencies: Currency[]
): string {
  const accountsMap = new Map(accounts.map((a) => [a.id, a]));
  const categoriesMap = new Map(categories.map((c) => [c.id, c]));

  const headers = ['Date', 'Type', 'Category', 'Account', 'Amount', 'Currency', 'Note', 'Transfer ID'];

  const rows = transactions.map((tx) => {
    const acc = accountsMap.get(tx.accountId);
    const cat = categoriesMap.get(tx.categoryId);
    const curr = currencies.find((c) => c.code === acc?.currency);
    const prec = curr?.precision ?? 2;
    const majorAmount = toMajorUnits(tx.amountMinor, prec);
    const signedAmount = tx.kind === 'income' ? majorAmount : -majorAmount;

    return [
      tx.date,
      tx.kind,
      cat?.name || 'Uncategorized',
      acc?.name || 'Unknown Account',
      signedAmount.toFixed(prec),
      acc?.currency || 'USD',
      `"${(tx.note || '').replace(/"/g, '""')}"`,
      tx.transferId || '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
