import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Calendar,
  Wallet,
  Sun,
  Moon,
  Filter,
} from 'lucide-react';
import { usePeriodStore } from '../../stores/usePeriodStore';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import type { PeriodType } from '../../db/types';

export const TopBar: React.FC = () => {
  const {
    periodType,
    setPeriodType,
    nextPeriod,
    prevPeriod,
    getPeriodFilter,
    selectedAccountId,
    setSelectedAccountId,
    searchQuery,
    setSearchQuery,
    setCustomRange,
  } = usePeriodStore();

  const { accounts } = useFinanceStore();
  const { openQuickAdd, isDarkMode, toggleDarkMode } = useUIStore();

  const period = getPeriodFilter();
  const activeAccounts = accounts.filter((a) => !a.archived);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(period.startDate);
  const [customEnd, setCustomEnd] = useState(period.endDate);

  const handlePeriodChange = (val: string) => {
    if (val === 'custom') {
      setShowCustomModal(true);
    } else {
      setPeriodType(val as PeriodType);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomRange(customStart, customEnd);
    setShowCustomModal(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Period Selector with Arrows & Type Picker */}
        <div className="flex items-center space-x-2">
          {/* Arrow navigation for Day/Week/Month/Year */}
          {periodType !== 'all' && periodType !== 'custom' && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={prevPeriod}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-xs"
                title="Previous period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextPeriod}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-xs"
                title="Next period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Period Label Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="whitespace-nowrap">{period.label}</span>
          </div>

          {/* Period Type Dropdown */}
          <select
            value={periodType}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
            <option value="year">Year</option>
            <option value="all">All Time</option>
            <option value="custom">Custom Range...</option>
          </select>
        </div>

        {/* Right: Account Filter, Search, Theme Toggle, +Add Button */}
        <div className="flex items-center space-x-2.5">
          {/* Account Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer max-w-[150px] sm:max-w-[180px] truncate"
            >
              <option value="all">All Accounts</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => openQuickAdd('expense')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      {/* Custom Range Dialog */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0">
              Select Custom Date Range
            </h3>
            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl"
                >
                  Apply Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
