import React, { useMemo } from 'react';
import {
  ArrowRight,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import { formatMoney } from '../../lib/money';
import { IconRenderer } from '../../components/common/IconRenderer';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';

interface RecentTransactionsProps {
  filterCategoryId?: string;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ filterCategoryId }) => {
  const { transactions, accounts, categories, currencies } = useFinanceStore();
  const { setActiveScreen, openTransactionModal } = useUIStore();

  const accountsMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoriesMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const recentTxs = useMemo(() => {
    let list = transactions;
    if (filterCategoryId) {
      list = list.filter((t) => t.categoryId === filterCategoryId);
    }
    return list.slice(0, 10);
  }, [transactions, filterCategoryId]);

  const filteredCategory = filterCategoryId ? categoriesMap.get(filterCategoryId) : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0">
              Recent Transactions
            </h2>
            {filteredCategory && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${filteredCategory.color}15`,
                  color: filteredCategory.color,
                }}
              >
                Filtered: {filteredCategory.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
            Latest activity across your accounts
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveScreen('transactions')}
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recentTxs.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No recent transactions found.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {recentTxs.map((tx) => {
            const acc = accountsMap.get(tx.accountId);
            const cat = categoriesMap.get(tx.categoryId);
            const isIncome = tx.kind === 'income';
            const isTransfer = Boolean(tx.transferId);
            const formatted = formatMoney(tx.amountMinor, acc?.currency || 'USD', currencies);

            return (
              <div
                key={tx.id}
                onClick={() => openTransactionModal(tx)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isTransfer
                        ? 'bg-blue-500/10 text-blue-600'
                        : isIncome
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-rose-500/10 text-rose-600'
                    }`}
                  >
                    {isTransfer ? (
                      <ArrowRightLeft className="w-4 h-4" />
                    ) : isIncome ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 transition-colors">
                      {tx.note || cat?.name || (isTransfer ? 'Transfer' : 'Transaction')}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{tx.date}</span>
                      </span>
                      <span>·</span>
                      <span>{acc?.name || 'Account'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {isIncome ? `+${formatted}` : `-${formatted}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
