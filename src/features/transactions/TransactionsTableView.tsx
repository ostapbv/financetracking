import React, { useMemo } from 'react';
import {
  Calendar,
  Wallet,
  Tag,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import { IconRenderer } from '../../components/common/IconRenderer';
import { formatMoney } from '../../lib/money';
import type { Transaction } from '../../db/types';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';

interface TransactionsTableViewProps {
  transactions: Transaction[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  allSelected: boolean;
}

export const TransactionsTableView: React.FC<TransactionsTableViewProps> = ({
  transactions,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  allSelected,
}) => {
  const { accounts, categories, currencies, deleteTransaction } = useFinanceStore();
  const { openTransactionModal } = useUIStore();

  const accountsMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoriesMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  if (transactions.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        No transactions match your current filters.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-800/40">
              <th className="py-3 px-3.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Account</th>
              <th className="py-3 px-3">Description / Note</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3 text-right w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {transactions.map((tx) => {
              const acc = accountsMap.get(tx.accountId);
              const cat = categoriesMap.get(tx.categoryId);
              const isSelected = selectedIds.has(tx.id);
              const isIncome = tx.kind === 'income';
              const isTransfer = Boolean(tx.transferId);
              const formatted = formatMoney(tx.amountMinor, acc?.currency || 'USD', currencies);

              return (
                <tr
                  key={tx.id}
                  onClick={() => openTransactionModal(tx)}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                    isSelected ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(tx.id)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </td>

                  <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {tx.date}
                  </td>

                  <td className="py-3 px-3">
                    {isTransfer ? (
                      <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Transfer</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${cat?.color || '#94A3B8'}15`,
                          color: cat?.color || '#94A3B8',
                        }}
                      >
                        <IconRenderer name={cat?.icon || 'Tag'} className="w-3 h-3" />
                        <span>{cat?.name || 'Uncategorized'}</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: acc?.color || '#94a3b8' }}
                      />
                      <span>{acc?.name || 'Unknown'}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 truncate max-w-xs">
                    {tx.note || <span className="text-slate-300 dark:text-slate-600 italic">—</span>}
                  </td>

                  <td className="py-3 px-3 text-right font-bold tabular-nums whitespace-nowrap">
                    <span
                      className={
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }
                    >
                      {isIncome ? `+${formatted}` : `-${formatted}`}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        type="button"
                        onClick={() => openTransactionModal(tx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
