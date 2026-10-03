import React, { useMemo } from 'react';
import { IconRenderer } from '../../components/common/IconRenderer';
import { Sparkline } from '../../components/common/Sparkline';
import type { Account } from '../../db/types';
import { formatMoney } from '../../lib/money';
import { calculateAccountBalance, calculateAccountSparkline } from '../../lib/balances';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import { MoreVertical, Edit2 } from 'lucide-react';

interface AccountCardProps {
  account: Account;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const { transactions, currencies } = useFinanceStore();
  const { setAccountDetailId, openAccountModal } = useUIStore();

  const balanceMinor = useMemo(() => {
    return calculateAccountBalance(account, transactions);
  }, [account, transactions]);

  const sparklineData = useMemo(() => {
    return calculateAccountSparkline(account, transactions, 14);
  }, [account, transactions]);

  const formattedBalance = formatMoney(balanceMinor, account.currency, currencies);
  const isNegative = balanceMinor < 0;

  return (
    <div
      onClick={() => setAccountDetailId(account.id)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top: Icon & Actions */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{
              backgroundColor: `${account.color}15`,
              color: account.color,
            }}
          >
            <IconRenderer name={account.icon} className="w-5 h-5" />
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openAccountModal(account);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit Account"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {account.currency}
            </span>
          </div>
        </div>

        {/* Account Name & Type */}
        <div className="mb-2">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors m-0 truncate">
            {account.name}
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 capitalize mt-0.5 m-0">
            {account.type} {!account.includeInTotal && '· Excluded from Total'}
          </p>
        </div>
      </div>

      {/* Bottom: Balance & Sparkline */}
      <div className="flex items-end justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-2">
        <div>
          <span className="text-[10px] uppercase font-medium text-slate-400 tracking-wider block mb-0.5">
            Balance
          </span>
          <span
            className={`text-lg font-bold tabular-nums tracking-tight ${
              isNegative
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {formattedBalance}
          </span>
        </div>

        <div className="pb-0.5">
          <Sparkline
            data={sparklineData}
            color={isNegative ? '#EF4444' : account.color || '#10B981'}
            width={85}
            height={26}
          />
        </div>
      </div>
    </div>
  );
};
