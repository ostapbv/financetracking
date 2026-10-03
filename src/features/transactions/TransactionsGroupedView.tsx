import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  History,
  Calendar,
  Wallet,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { IconRenderer } from '../../components/common/IconRenderer';
import { formatMoney } from '../../lib/money';
import { convertCurrency } from '../../lib/currency';
import type { Transaction, Category, Account } from '../../db/types';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';

interface TransactionsGroupedViewProps {
  transactions: Transaction[];
  carryOverMinor: number;
  mainCurrency: string;
}

export const TransactionsGroupedView: React.FC<TransactionsGroupedViewProps> = ({
  transactions,
  carryOverMinor,
  mainCurrency,
}) => {
  const { categories, accounts, currencies, exchangeRates } = useFinanceStore();
  const { openTransactionModal } = useUIStore();

  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());

  const toggleCategory = (catId: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const accountsMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoriesMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Group transactions by category (excluding transfer ledger entries for categories)
  const groupedData = useMemo(() => {
    const groups: {
      category: Category | { id: string; name: string; icon: string; color: string; kind: string };
      txs: Transaction[];
      totalMinor: number;
    }[] = [];

    const map = new Map<string, { txs: Transaction[]; totalMinor: number }>();

    for (const tx of transactions) {
      const catId = tx.transferId ? 'transfer' : tx.categoryId;
      if (!map.has(catId)) {
        map.set(catId, { txs: [], totalMinor: 0 });
      }
      const entry = map.get(catId)!;
      entry.txs.push(tx);

      // Convert to mainCurrency for consistent sorting and totals
      const acc = accountsMap.get(tx.accountId);
      const cur = acc?.currency || mainCurrency;
      const converted = convertCurrency(
        tx.amountMinor,
        cur,
        mainCurrency,
        tx.date,
        exchangeRates,
        currencies
      );
      entry.totalMinor += converted;
    }

    for (const [catId, val] of map.entries()) {
      let cat: any = categoriesMap.get(catId);
      if (!cat) {
        if (catId === 'transfer') {
          cat = {
            id: 'transfer',
            name: 'Transfers',
            icon: 'ArrowRightLeft',
            color: '#3B82F6',
            kind: 'transfer',
          };
        } else {
          cat = {
            id: catId,
            name: 'Uncategorized',
            icon: 'Tag',
            color: '#94A3B8',
            kind: 'expense',
          };
        }
      }

      groups.push({
        category: cat,
        txs: val.txs.sort((a, b) => b.date.localeCompare(a.date)),
        totalMinor: val.totalMinor,
      });
    }

    // Sort by total descending
    return groups.sort((a, b) => b.totalMinor - a.totalMinor);
  }, [transactions, categoriesMap, accountsMap, mainCurrency, exchangeRates, currencies]);

  const formattedCarryOver = formatMoney(carryOverMinor, mainCurrency, currencies);

  return (
    <div className="space-y-3">
      {/* Monefy Carry-over Row at Top */}
      <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 m-0">
              Carry-over Balance (Prior Period)
            </h3>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 m-0">
              Balance carried in before period start so period totals reconcile with actual net worth
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-bold tabular-nums text-amber-900 dark:text-amber-100">
            {formattedCarryOver}
          </span>
        </div>
      </div>

      {/* Category Groups List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-xs">
        {groupedData.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No transactions found for this period.
          </div>
        ) : (
          groupedData.map(({ category, txs, totalMinor }) => {
            const isExpanded = expandedCategoryIds.has(category.id);
            const formattedTotal = formatMoney(totalMinor, mainCurrency, currencies);
            const isIncome = category.kind === 'income';

            return (
              <div key={category.id} className="transition-colors">
                {/* Category Header Row */}
                <div
                  onClick={() => toggleCategory(category.id)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3">
                    <button type="button" className="text-slate-400 p-0.5">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${category.color}15`,
                        color: category.color,
                      }}
                    >
                      <IconRenderer name={category.icon} className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {category.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {txs.length}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {category.kind}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {formattedTotal}
                    </span>
                  </div>
                </div>

                {/* Expanded Nested Transactions */}
                {isExpanded && (
                  <div className="bg-slate-50/60 dark:bg-slate-800/25 px-4 py-2 divide-y divide-slate-100/80 dark:divide-slate-800/40">
                    {txs.map((tx) => {
                      const acc = accountsMap.get(tx.accountId);
                      const txCurr = acc?.currency || mainCurrency;
                      const formatted = formatMoney(tx.amountMinor, txCurr, currencies);
                      const isTxIncome = tx.kind === 'income';

                      return (
                        <div
                          key={tx.id}
                          onClick={() => openTransactionModal(tx)}
                          className="py-2.5 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800/60 px-3 rounded-xl cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                isTxIncome
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-rose-500/10 text-rose-600'
                              }`}
                            >
                              {isTxIncome ? (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              )}
                            </div>

                            <div>
                              <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                {tx.note || 'No note'}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{tx.date}</span>
                                </span>
                                <span>·</span>
                                <span className="flex items-center space-x-1">
                                  <Wallet className="w-3 h-3" />
                                  <span>{acc?.name || 'Account'}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-xs font-bold tabular-nums ${
                              isTxIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {isTxIncome ? `+${formatted}` : `-${formatted}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
