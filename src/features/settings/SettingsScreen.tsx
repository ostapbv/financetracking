import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Sparkles,
  ShieldAlert,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import { exportTransactionsToCSV, downloadFile } from '../../lib/export-import';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    currencies,
    accounts,
    categories,
    transactions,
    updateSettings,
    exportData,
    importData,
    resetDatabase,
    loadSampleData,
  } = useFinanceStore();

  const { isDarkMode, setDarkMode } = useUIStore();

  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleExportJSON = async () => {
    const data = await exportData();
    const str = JSON.stringify(data, null, 2);
    const filename = `monarch-finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    downloadFile(str, filename, 'application/json');
    showToast('JSON backup exported successfully.');
  };

  const handleExportCSV = () => {
    const csv = exportTransactionsToCSV(transactions, accounts, categories, currencies);
    const filename = `monarch-finance-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(csv, filename, 'text/csv');
    showToast('Transactions CSV exported successfully.');
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await importData(json);
        showToast('Backup restored successfully!');
      } catch (err: any) {
        alert(`Failed to import backup: ${err.message || 'Invalid format'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all data? This will wipe all accounts, transactions, and settings and restore defaults.')) {
      await resetDatabase();
      showToast('Database reset to defaults.');
    }
  };

  const handleLoadSample = async () => {
    if (window.confirm('Load sample accounts and transactions?')) {
      await loadSampleData();
      showToast('Sample data loaded.');
    }
  };

  const handleThemeChange = (theme: 'system' | 'light' | 'dark') => {
    updateSettings({ theme });
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    } else {
      setDarkMode(theme === 'dark');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0">
          Settings & Data Management
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
          Preferences, backup exports, and database maintenance
        </p>
      </div>

      {feedback && (
        <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Preferences Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0 border-b border-slate-100 dark:border-slate-800 pb-2">
          Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Main Currency */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Primary Currency
            </label>
            <select
              value={settings.mainCurrency || 'USD'}
              onChange={(e) => updateSettings({ mainCurrency: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.name} - {c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* First day of week */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              First Day of Week
            </label>
            <select
              value={settings.firstDayOfWeek}
              onChange={(e) => updateSettings({ firstDayOfWeek: parseInt(e.target.value, 10) as 0 | 1 })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            >
              <option value={1}>Monday (Standard)</option>
              <option value={0}>Sunday</option>
            </select>
          </div>

          {/* Theme Mode */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Color Theme
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  settings.theme === 'light'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                    : 'text-slate-500'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                    : 'text-slate-500'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                  settings.theme === 'system'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                    : 'text-slate-500'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date Format
            </label>
            <select
              value={settings.dateFormat || 'yyyy-MM-dd'}
              onChange={(e) => updateSettings({ dateFormat: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
            >
              <option value="yyyy-MM-dd">YYYY-MM-DD (ISO standard)</option>
              <option value="dd/MM/yyyy">DD/MM/YYYY (European)</option>
              <option value="MM/dd/yyyy">MM/DD/YYYY (US format)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backup & Export / Import Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0 border-b border-slate-100 dark:border-slate-800 pb-2">
          Backup, Export & Import
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
          Your data is 100% local in your browser's IndexedDB. Export regular backups to protect your finances.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* JSON Export */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left flex flex-col justify-between"
          >
            <Download className="w-5 h-5 text-amber-600 mb-2" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Backup to JSON
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Complete database snapshot
              </p>
            </div>
          </button>

          {/* JSON Import */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left flex flex-col justify-between"
          >
            <Upload className="w-5 h-5 text-blue-600 mb-2" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Restore from JSON
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Import and replace data
              </p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileImport}
            className="hidden"
          />

          {/* CSV Export */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left flex flex-col justify-between"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-2" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Export to CSV
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Excel / Sheets spreadsheet
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Demo Data & Danger Zone */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0 border-b border-slate-100 dark:border-slate-800 pb-2">
          Demo Data & Maintenance
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Load Sample Demonstration Data</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Populate rich accounts, realistic multi-currency transactions, and transfers
            </p>
          </div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
          >
            Load Demo Data
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl">
          <div>
            <div className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center space-x-1.5">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Reset All Data</span>
            </div>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400 mt-0.5">
              Permanently clears all accounts, transactions, and transfers
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors shrink-0"
          >
            Reset Database
          </button>
        </div>
      </div>
    </div>
  );
};
