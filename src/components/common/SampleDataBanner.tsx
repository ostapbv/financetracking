import React, { useState } from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { useFinanceStore } from '../../stores/useFinanceStore';

export const SampleDataBanner: React.FC = () => {
  const { accounts, settings, loadSampleData, updateSettings } = useFinanceStore();
  const [dismissed, setDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If user already loaded sample data or dismissed banner or has already created accounts
  if (dismissed || settings.hasSampleDataLoaded || accounts.length > 0) {
    return null;
  }

  const handleLoadSample = async () => {
    setIsLoading(true);
    try {
      await loadSampleData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEmpty = async () => {
    setDismissed(true);
    await updateSettings({ hasSampleDataLoaded: true });
  };

  return (
    <div className="mb-6 p-4 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-700/60 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
      <div className="flex items-start sm:items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
            Welcome to Monarch Finance!
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 m-0">
            Would you like to explore with realistic demo accounts & transactions, or start with a clean slate?
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={handleStartEmpty}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          Start Empty
        </button>
        <button
          type="button"
          onClick={handleLoadSample}
          disabled={isLoading}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-xs transition-all active:scale-95 flex items-center space-x-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Loading demo...' : 'Load Sample Data'}</span>
        </button>
      </div>
    </div>
  );
};
