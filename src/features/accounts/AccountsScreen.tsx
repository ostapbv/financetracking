import React, { useMemo } from 'react';
import { Plus, Wallet, ShieldCheck } from 'lucide-react';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import { AccountCard } from './AccountCard';
import { AccountModal } from './AccountModal';
import { AccountDetailView } from './AccountDetailView';
import { calculateNetWorth } from '../../lib/balances';
import { formatMoney } from '../../lib/money';
import type { AccountType, Account } from '../../db/types';

export const AccountsScreen: React.FC = () => {
  const { accounts, transactions, exchangeRates, currencies, settings } = useFinanceStore();
  const { openAccountModal, accountDetailId } = useUIStore();

  if (accountDetailId) {
    return <AccountDetailView accountId={accountDetailId} />;
  }

  const activeAccounts = useMemo(() => {
    return accounts.filter((a) => !a.archived);
  }, [accounts]);

  const archivedAccounts = useMemo(() => {
    return accounts.filter((a) => a.archived);
  }, [accounts]);

  // Aggregate net worth across all included accounts in main currency
  const totalBalanceMinor = useMemo(() => {
    return calculateNetWorth(
      accounts,
      transactions,
      exchangeRates,
      settings.mainCurrency || 'USD',
      currencies
    );
  }, [accounts, transactions, exchangeRates, settings.mainCurrency, currencies]);

  const formattedTotal = formatMoney(totalBalanceMinor, settings.mainCurrency || 'USD', currencies);

  // Group active accounts by type
  const groupedAccounts = useMemo(() => {
    const groups: Record<AccountType, { label: string; items: Account[] }> = {
      cash: { label: 'Cash & Physical Wallets', items: [] },
      bank: { label: 'Bank & Checking Accounts', items: [] },
      credit: { label: 'Credit Cards', items: [] },
      savings: { label: 'Savings & Investments', items: [] },
      other: { label: 'Other Accounts', items: [] },
    };

    for (const acc of activeAccounts) {
      if (groups[acc.type]) {
        groups[acc.type].items.push(acc);
      } else {
        groups.other.items.push(acc);
      }
    }

    return groups;
  }, [activeAccounts]);

  const orderOfTypes: AccountType[] = ['bank', 'savings', 'cash', 'credit', 'other'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Banner & Total Balance */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center space-x-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Total Net Worth (Included Accounts)</span>
          </span>
          <div className="text-3xl font-black tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
            {formattedTotal}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 m-0">
            Converted to primary currency ({settings.mainCurrency || 'USD'}) using dated rates
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAccountModal()}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-xs transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Account Groups */}
      <div className="space-y-8">
        {orderOfTypes.map((typeKey) => {
          const group = groupedAccounts[typeKey];
          if (group.items.length === 0) return null;

          return (
            <div key={typeKey} className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 m-0">
                  {group.label} ({group.items.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((acc) => (
                  <AccountCard key={acc.id} account={acc} />
                ))}
              </div>
            </div>
          );
        })}

        {activeAccounts.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <Wallet className="w-10 h-10 text-amber-500/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No accounts yet</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add your checking, savings, cash, or credit accounts to track balances.
            </p>
            <button
              type="button"
              onClick={() => openAccountModal()}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl"
            >
              Create First Account
            </button>
          </div>
        )}

        {/* Archived Accounts */}
        {archivedAccounts.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider m-0">
              Archived Accounts ({archivedAccounts.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
              {archivedAccounts.map((acc) => (
                <AccountCard key={acc.id} account={acc} />
              ))}
            </div>
          </div>
        )}
      </div>

      <AccountModal />
    </div>
  );
};
