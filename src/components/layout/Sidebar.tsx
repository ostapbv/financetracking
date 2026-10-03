import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  ArrowRightLeft,
  Tag,
  Coins,
  Settings,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useUIStore, type ActiveScreen } from '../../stores/useUIStore';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { formatMoney } from '../../lib/money';
import { calculateNetWorth } from '../../lib/balances';

interface NavItem {
  id: ActiveScreen;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'currencies', label: 'Currencies', icon: Coins },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeScreen, setActiveScreen } = useUIStore();
  const { accounts, transactions, exchangeRates, currencies, settings } = useFinanceStore();

  const netWorthMinor = calculateNetWorth(
    accounts,
    transactions,
    exchangeRates,
    settings.mainCurrency || 'USD',
    currencies
  );
  const formattedNetWorth = formatMoney(netWorthMinor, settings.mainCurrency || 'USD', currencies);

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 h-screen sticky top-0 p-4 justify-between select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center space-x-3 px-3 py-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg shadow-xs">
            M
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 block leading-tight">
              Monarch Finance
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Local-first PWA</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Net Worth Footer Card */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl">
        <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-semibold tracking-wider mb-1">
          <ShieldCheck className="w-3 h-3 text-amber-500" />
          <span>Net Worth</span>
        </div>
        <div className="text-base font-bold tabular-nums text-slate-900 dark:text-slate-100 truncate">
          {formattedNetWorth}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {accounts.filter((a) => !a.archived).length} accounts connected
        </div>
      </div>
    </aside>
  );
};
