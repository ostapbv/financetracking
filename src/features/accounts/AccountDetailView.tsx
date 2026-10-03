import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Trash2,
} from 'lucide-react';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import { IconRenderer } from '../../components/common/IconRenderer';
import { formatMoney, toMajorUnits } from '../../lib/money';
import { calculateAccountBalance } from '../../lib/balances';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { format, subDays } from 'date-fns';

interface AccountDetailViewProps {
  accountId: string;
}

export const AccountDetailView: React.FC<AccountDetailViewProps> = ({ accountId }) => {
  const { accounts, transactions, currencies, deleteTransaction } = useFinanceStore();
  const { setAccountDetailId, openAccountModal, openQuickAdd, openTransactionModal } = useUIStore();

  const [historyRangeDays, setHistoryRangeDays] = useState(30);

  const account = useMemo(() => {
    return accounts.find((a) => a.id === accountId);
  }, [accounts, accountId]);

  if (!account) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Account not found.</p>
        <button
          type="button"
          onClick={() => setAccountDetailId(null)}
          className="mt-3 text-xs text-amber-600 font-semibold"
        >
          Return to Accounts
        </button>
      </div>
    );
  }

  const currentBalanceMinor = useMemo(() => {
    return calculateAccountBalance(account, transactions);
  }, [account, transactions]);

  // Account transactions sorted newest first
  const accountTxs = useMemo(() => {
    return transactions.filter((t) => t.accountId === account.id);
  }, [transactions, account.id]);

  // Generate historical daily balance for Recharts
  const historyData = useMemo(() => {
    const data: { date: string; displayDate: string; balance: number }[] = [];
    const now = new Date();
    const curr = currencies.find((c) => c.code === account.currency);
    const precision = curr?.precision ?? 2;

    for (let i = historyRangeDays - 1; i >= 0; i--) {
      const d = subDays(now, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const minor = calculateAccountBalance(account, transactions, dateStr);
      data.push({
        date: dateStr,
        displayDate: format(d, 'MMM d'),
        balance: toMajorUnits(minor, precision),
      });
    }
    return data;
  }, [account, transactions, currencies, historyRangeDays]);

  const formattedBalance = formatMoney(currentBalanceMinor, account.currency, currencies);
  const isNegative = currentBalanceMinor < 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setAccountDetailId(null)}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Accounts</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => openAccountModal(account)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Account</span>
          </button>
          <button
            type="button"
            onClick={() => openQuickAdd('expense', account.id)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Account Header Hero Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${account.color}15`,
              color: account.color,
            }}
          >
            <IconRenderer name={account.icon} className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0">
                {account.name}
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase">
                {account.currency}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 capitalize mt-0.5 m-0">
              {account.type} account · {account.includeInTotal ? 'Included in total balance' : 'Excluded from total balance'}
            </p>
          </div>
        </div>

        <div>
          <span className="text-xs uppercase font-medium text-slate-400 tracking-wider block mb-0.5">
            Current Balance
          </span>
          <span
            className={`text-2xl font-bold tabular-nums tracking-tight ${
              isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {formattedBalance}
          </span>
        </div>
      </div>

      {/* Balance History Chart Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0">
              Balance Over Time
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
              Historical daily balances calculated from initial balance and ledger entries
            </p>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            {[7, 30, 90, 180].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setHistoryRangeDays(days)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  historyRangeDays === days
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {days === 7 ? '7D' : days === 30 ? '1M' : days === 90 ? '3M' : '6M'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="accountHistoryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={account.color || '#10B981'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={account.color || '#10B981'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="displayDate"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white dark:bg-slate-800 p-2.5 rounded-xl shadow-lg text-xs">
                        <div className="text-slate-400 mb-0.5">{d.date}</div>
                        <div className="font-bold tabular-nums">
                          {account.currency} {Number(d.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={account.color || '#10B981'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#accountHistoryGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Account Transactions List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0">
            Account Activity ({accountTxs.length})
          </h2>
          <button
            type="button"
            onClick={() => openQuickAdd('expense', account.id)}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Entry</span>
          </button>
        </div>

        {accountTxs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No transactions recorded for this account yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {accountTxs.map((tx) => {
              const isIncome = tx.kind === 'income';
              const isTransfer = Boolean(tx.transferId);
              const txFormatted = formatMoney(tx.amountMinor, account.currency, currencies, {
                showSign: true,
              });

              return (
                <div
                  key={tx.id}
                  onClick={() => openTransactionModal(tx)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isTransfer
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : isIncome
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
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
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {tx.note || (isTransfer ? 'Transfer' : isIncome ? 'Income' : 'Expense')}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{tx.date}</span>
                        {isTransfer && <span className="text-blue-500 font-medium">· Transfer</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-xs font-bold tabular-nums tracking-tight ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isIncome ? `+${txFormatted}` : `-${formatMoney(tx.amountMinor, account.currency, currencies)}`}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTransaction(tx.id);
                      }}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
