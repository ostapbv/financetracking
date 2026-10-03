import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Layers,
  Table as TableIcon,
  Trash2,
  Tag,
  X,
} from 'lucide-react';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { usePeriodStore } from '../../stores/usePeriodStore';
import { useUIStore } from '../../stores/useUIStore';
import { TransactionsGroupedView } from './TransactionsGroupedView';
import { TransactionsTableView } from './TransactionsTableView';
import { TransactionEditModal } from './TransactionEditModal';
import { calculateTotalCarryOver } from '../../lib/balances';
import type { TransactionKind } from '../../db/types';

export const TransactionsScreen: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    currencies,
    exchangeRates,
    settings,
    bulkDeleteTransactions,
    bulkRecategorizeTransactions,
  } = useFinanceStore();

  const { getPeriodFilter, selectedAccountId } = usePeriodStore();
  const { openQuickAdd } = useUIStore();

  const period = getPeriodFilter();
  const mainCurrency = settings.mainCurrency || 'USD';

  // Local filter states
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('table');
  const [kindFilter, setKindFilter] = useState<'all' | TransactionKind>('all');
  const [accountFilter, setAccountFilter] = useState<string>(selectedAccountId);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<string>('');
  const [isBulkRecategorizing, setIsBulkRecategorizing] = useState(false);

  // Sync when top bar account selection changes
  React.useEffect(() => {
    setAccountFilter(selectedAccountId);
  }, [selectedAccountId]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Period filter
      if (period.type !== 'all') {
        if (tx.date < period.startDate || tx.date > period.endDate) return false;
      }
      // Kind filter
      if (kindFilter !== 'all' && tx.kind !== kindFilter) return false;
      // Account filter
      if (accountFilter !== 'all' && tx.accountId !== accountFilter) return false;
      // Category filter
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!tx.note || !tx.note.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [transactions, period, kindFilter, accountFilter, categoryFilter, searchQuery]);

  // Calculate carry-over balance prior to period start
  const carryOverMinor = useMemo(() => {
    return calculateTotalCarryOver(
      accounts,
      period.startDate,
      transactions,
      exchangeRates,
      mainCurrency,
      currencies
    );
  }, [accounts, period.startDate, transactions, exchangeRates, mainCurrency, currencies]);

  // Bulk Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Delete ${selectedIds.size} selected transaction(s)?`)) {
      await bulkDeleteTransactions(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleBulkRecategorize = async () => {
    if (selectedIds.size === 0 || !bulkCategoryTarget) return;
    await bulkRecategorizeTransactions(Array.from(selectedIds), bulkCategoryTarget);
    setIsBulkRecategorizing(false);
    setSelectedIds(new Set());
  };

  const allSelected = filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length;

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16">
      {/* Header with View Toggle & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0">
            Transactions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
            Showing {filteredTransactions.length} entries for {period.label}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle: Flat Table vs Monefy Grouped */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Flat Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'grouped'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Monefy Grouped Categories View"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grouped</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => openQuickAdd('expense')}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by note or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Kind Filter */}
          <div>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-medium"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-medium"
            >
              <option value="all">All Accounts</option>
              {accounts
                .filter((a) => !a.archived)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when ≥1 items selected) */}
      {selectedIds.size > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
            <span>{selectedIds.size} selected</span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {isBulkRecategorizing ? (
              <div className="flex items-center space-x-1.5">
                <select
                  value={bulkCategoryTarget}
                  onChange={(e) => setBulkCategoryTarget(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.kind})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleBulkRecategorize}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkRecategorizing(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsBulkRecategorizing(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
              >
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>Bulk Re-categorize</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleBulkDelete}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Main View: Flat Table or Monefy Grouped */}
      {viewMode === 'table' ? (
        <TransactionsTableView
          transactions={filteredTransactions}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          allSelected={allSelected}
        />
      ) : (
        <TransactionsGroupedView
          transactions={filteredTransactions}
          carryOverMinor={carryOverMinor}
          mainCurrency={mainCurrency}
        />
      )}

      <TransactionEditModal />
    </div>
  );
};
