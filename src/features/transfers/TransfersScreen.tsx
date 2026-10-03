import React, { useMemo } from 'react';
import {
  Plus,
  ArrowRightLeft,
  Calendar,
  Trash2,
  Edit2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import { formatMoney } from '../../lib/money';
import { TransferModal } from './TransferModal';
import { EmptyState } from '../../components/common/EmptyState';

export const TransfersScreen: React.FC = () => {
  const { transfers, accounts, currencies, deleteTransfer } = useFinanceStore();
  const { openTransferModal } = useUIStore();

  const accountsMap = useMemo(() => {
    return new Map(accounts.map((a) => [a.id, a]));
  }, [accounts]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0">
            Transfers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
            Reallocate balances between accounts without impacting income or expense cash flow
          </p>
        </div>

        <button
          type="button"
          onClick={() => openTransferModal()}
          className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl transition-all shadow-xs active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Transfers List Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        {transfers.length === 0 ? (
          <EmptyState
            icon="ArrowRightLeft"
            title="No transfers recorded"
            description="Move funds between bank accounts, credit cards, or cash wallets."
            actionLabel="Create First Transfer"
            onAction={() => openTransferModal()}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {transfers.map((tr) => {
              const fromAcc = accountsMap.get(tr.fromAccountId);
              const toAcc = accountsMap.get(tr.toAccountId);
              const fromFormatted = formatMoney(tr.amountFromMinor, fromAcc?.currency || 'USD', currencies);
              const toFormatted = formatMoney(tr.amountToMinor, toAcc?.currency || 'USD', currencies);
              const isDifferentCurrency = fromAcc && toAcc && fromAcc.currency !== toAcc.currency;

              return (
                <div
                  key={tr.id}
                  onClick={() => openTransferModal(tr)}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 px-3 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>{fromAcc?.name || 'Unknown Account'}</span>
                        <span className="text-slate-400">→</span>
                        <span>{toAcc?.name || 'Unknown Account'}</span>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{tr.date}</span>
                        </span>
                        {tr.note && <span>· {tr.note}</span>}
                        {isDifferentCurrency && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            · Rate {tr.rate.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3">
                    <div className="text-right">
                      <div className="text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {fromFormatted}
                        {isDifferentCurrency && (
                          <span className="text-slate-400 font-normal ml-1">
                            ({toFormatted})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">Ledger balanced</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTransferModal(tr);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit transfer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this transfer? Both sides will be deleted.')) {
                            deleteTransfer(tr.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete transfer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TransferModal />
    </div>
  );
};
