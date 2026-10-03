import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { SampleDataBanner } from '../common/SampleDataBanner';
import { QuickAddModal } from '../../features/quick-add/QuickAddModal';
import { useUIStore } from '../../stores/useUIStore';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { DashboardScreen } from '../../features/dashboard/DashboardScreen';
import { TransactionsScreen } from '../../features/transactions/TransactionsScreen';
import { AccountsScreen } from '../../features/accounts/AccountsScreen';
import { TransfersScreen } from '../../features/transfers/TransfersScreen';
import { CategoriesScreen } from '../../features/categories/CategoriesScreen';
import { CurrenciesScreen } from '../../features/currencies/CurrenciesScreen';
import { SettingsScreen } from '../../features/settings/SettingsScreen';

export const Layout: React.FC = () => {
  const { activeScreen } = useUIStore();
  const { isLoading, error } = useFinanceStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-xl animate-pulse">
            M
          </div>
          <div className="text-xs font-semibold text-slate-500 animate-pulse">
            Loading your financial ledger...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 p-6 rounded-2xl shadow-lg text-center space-y-3">
          <h2 className="text-base font-bold text-rose-600">Database Connection Error</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'transactions':
        return <TransactionsScreen />;
      case 'accounts':
        return <AccountsScreen />;
      case 'transfers':
        return <TransfersScreen />;
      case 'categories':
        return <CategoriesScreen />;
      case 'currencies':
        return <CurrenciesScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Desktop Sidebar (>=1024px) */}
      <Sidebar />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          <SampleDataBanner />
          {renderActiveScreen()}
        </main>
      </div>

      {/* Mobile Bottom Navigation (<1024px) */}
      <BottomBar />

      {/* Global Quick Add Modal / Sheet */}
      <QuickAddModal />
    </div>
  );
};
