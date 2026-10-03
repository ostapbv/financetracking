import React from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { IconRenderer } from '../../components/common/IconRenderer';
import { formatMoney } from '../../lib/money';
import { calculateAccountBalance } from '../../lib/balances';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';

export const AccountsSnapshot: React.FC = () => {
  const { accounts, transactions, currencies } = useFinanceStore();
  const { setActiveScreen, setAccountDetailId, openAccountModal } = useUIStore();

  const activeAccounts = accounts.filter((a) => !a.archived);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0">
            Accounts Snapshot
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
            {activeAccounts.length} active accounts
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveScreen('accounts')}
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {activeAccounts.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          <p>No accounts configured yet.</p>
          <button
            type="button"
            onClick={() => openAccountModal()}
            className="mt-2 text-amber-600 font-semibold hover:underline"
          >
            + Add First Account
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {activeAccounts.slice(0, 5).map((acc) => {
            const balanceMinor = calculateAccountBalance(acc, transactions);
            const isNegative = balanceMinor < 0;
            const formatted = formatMoney(balanceMinor, acc.currency, currencies);

            return (
              <div
                key={acc.id}
                onClick={() => {
                  setAccountDetailId(acc.id);
                  setActiveScreen('accounts');
                }}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${acc.color}15`, color: acc.color }}
                  >
                    <IconRenderer name={acc.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 m-0 group-hover:text-amber-600 transition-colors">
                      {acc.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {acc.type} · {acc.currency}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {formatted}
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
