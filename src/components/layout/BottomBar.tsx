import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  Wallet,
  MoreHorizontal,
  ArrowRightLeft,
  Tag,
  Coins,
  Settings,
  X,
} from 'lucide-react';
import { useUIStore, type ActiveScreen } from '../../stores/useUIStore';

export const BottomBar: React.FC = () => {
  const { activeScreen, setActiveScreen, openQuickAdd } = useUIStore();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleNav = (screen: ActiveScreen) => {
    setActiveScreen(screen);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* More Menu Backdrop & Sheet */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs flex items-end lg:hidden">
          <div className="fixed inset-0" onClick={() => setShowMoreMenu(false)} />
          <div className="relative w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 shadow-2xl z-50 space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Additional Tools
              </span>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleNav('transfers')}
                className={`p-3 rounded-2xl flex items-center space-x-3 text-left border ${
                  activeScreen === 'transfers'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold">Transfers</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('categories')}
                className={`p-3 rounded-2xl flex items-center space-x-3 text-left border ${
                  activeScreen === 'categories'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Tag className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold">Categories</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('currencies')}
                className={`p-3 rounded-2xl flex items-center space-x-3 text-left border ${
                  activeScreen === 'currencies'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold">Currencies</span>
              </button>

              <button
                type="button"
                onClick={() => handleNav('settings')}
                className={`p-3 rounded-2xl flex items-center space-x-3 text-left border ${
                  activeScreen === 'settings'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Settings className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-semibold">Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around">
        <button
          type="button"
          onClick={() => handleNav('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
            activeScreen === 'dashboard'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          type="button"
          onClick={() => handleNav('transactions')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
            activeScreen === 'transactions'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Activity</span>
        </button>

        {/* Center Prominent Monefy-style + Button */}
        <div className="-mt-5">
          <button
            type="button"
            onClick={() => openQuickAdd('expense')}
            className="w-12 h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center transition-transform active:scale-95"
            aria-label="Add transaction"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleNav('accounts')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
            activeScreen === 'accounts'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Accounts</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
            showMoreMenu || ['transfers', 'categories', 'currencies', 'settings'].includes(activeScreen)
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
};
