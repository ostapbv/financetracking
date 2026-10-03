import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Repeat, ArrowRightLeft } from 'lucide-react';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { usePeriodStore } from '../../stores/usePeriodStore';
import { useUIStore } from '../../stores/useUIStore';
import { CalculatorKeypad } from '../../components/keypad/CalculatorKeypad';
import { IconRenderer } from '../../components/common/IconRenderer';
import { evaluateExpressionToMinor } from '../../lib/calculator';
import type { TransactionKind, RecurringFrequency } from '../../db/types';

export const QuickAddModal: React.FC = () => {
  const { isQuickAddOpen, quickAddTab, quickAddAccountId, quickAddCategoryId, closeQuickAdd } = useUIStore();
  const { selectedAccountId } = usePeriodStore();
  const {
    accounts,
    categories,
    currencies,
    createTransaction,
    createTransfer,
    settings,
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [expression, setExpression] = useState('0');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');

  // Recurring options
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency>('monthly');
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringEndDate, setRecurringEndDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts]);

  // Synchronize initial state when modal opens
  useEffect(() => {
    if (isQuickAddOpen) {
      setActiveTab(quickAddTab);
      setExpression('0');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
      setIsRecurring(false);
      setError('');

      // Pick account: priority to quickAddAccountId, then selectedAccountId from periodStore, then first active
      const defaultAcc =
        quickAddAccountId ||
        (selectedAccountId !== 'all' ? selectedAccountId : activeAccounts[0]?.id) ||
        '';
      setAccountId(defaultAcc);

      // Default second account for transfers
      const otherAcc = activeAccounts.find((a) => a.id !== defaultAcc);
      setToAccountId(otherAcc?.id || '');

      // Pick category: priority to quickAddCategoryId, then first active of kind
      const kind = quickAddTab === 'income' ? 'income' : 'expense';
      const availableCats = categories.filter((c) => c.kind === kind && !c.archived);
      const defaultCat = quickAddCategoryId || availableCats[0]?.id || '';
      setCategoryId(defaultCat);
    }
  }, [isQuickAddOpen, quickAddTab, quickAddAccountId, quickAddCategoryId, selectedAccountId, activeAccounts, categories]);

  // Keep category updated when tab switches between expense/income
  const handleTabChange = (newTab: 'expense' | 'income' | 'transfer') => {
    setActiveTab(newTab);
    if (newTab !== 'transfer') {
      const availableCats = categories.filter((c) => c.kind === newTab && !c.archived);
      if (!availableCats.some((c) => c.id === categoryId)) {
        setCategoryId(availableCats[0]?.id || '');
      }
    }
  };

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === accountId);
  }, [accounts, accountId]);

  const currencySymbol = useMemo(() => {
    if (!selectedAccount) return '$';
    const c = currencies.find((curr) => curr.code === selectedAccount.currency);
    return c?.symbol || '$';
  }, [selectedAccount, currencies]);

  const availableCategories = useMemo(() => {
    if (activeTab === 'transfer') return [];
    return categories.filter((c) => c.kind === activeTab && !c.archived);
  }, [categories, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      setError('Please select an account');
      return;
    }

    const precision = currencies.find((c) => c.code === selectedAccount?.currency)?.precision ?? 2;
    const amountMinor = evaluateExpressionToMinor(expression, precision);

    if (amountMinor <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeTab === 'transfer') {
        if (!toAccountId || toAccountId === accountId) {
          setError('Please select a different destination account');
          setIsSubmitting(false);
          return;
        }

        const toAcc = accounts.find((a) => a.id === toAccountId);
        const toPrec = currencies.find((c) => c.code === toAcc?.currency)?.precision ?? 2;
        // For quick add transfer, assume 1:1 if same currency or direct calculation
        const amountToMinor = amountMinor;

        await createTransfer({
          fromAccountId: accountId,
          toAccountId,
          amountFromMinor: amountMinor,
          amountToMinor,
          rate: 1.0,
          date,
          note: note.trim() || undefined,
        });
      } else {
        if (!categoryId) {
          setError('Please select a category');
          setIsSubmitting(false);
          return;
        }

        await createTransaction({
          accountId,
          categoryId,
          kind: activeTab,
          amountMinor,
          date,
          note: note.trim() || undefined,
        });
      }

      closeQuickAdd();
    } catch (err: any) {
      setError(err.message || 'Failed to record entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isQuickAddOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={closeQuickAdd}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 sm:border sm:border-slate-200/80 sm:dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 z-10 max-h-[92vh] sm:max-h-[88vh] overflow-y-auto transform transition-all animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Top Header & Tabs */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleTabChange('expense')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('income')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('transfer')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'transfer'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Transfer
            </button>
          </div>

          <button
            type="button"
            onClick={closeQuickAdd}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Monefy Calculator Display & Keypad */}
          <CalculatorKeypad
            expression={expression}
            onChange={setExpression}
            currencySymbol={currencySymbol}
          />

          {/* Account Picker */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                {activeTab === 'transfer' ? 'From Account' : 'Account'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'transfer' ? (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  To Account
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="">Select destination...</option>
                  {activeAccounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            )}
          </div>

          {/* Category Picker (Grid of Badges for Expense/Income) */}
          {activeTab !== 'transfer' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                {availableCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                        isSelected
                          ? 'ring-2 ring-amber-500 shadow-xs'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${cat.color}20` : undefined,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          color: cat.color,
                        }}
                      >
                        <IconRenderer name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium truncate max-w-full text-slate-800 dark:text-slate-200">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note Input */}
          <div>
            <input
              type="text"
              placeholder="Note / Description (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Optional Recurring Toggle */}
          {activeTab !== 'transfer' && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center space-x-1.5"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>{isRecurring ? 'Recurring Rule Enabled' : '+ Make Recurring'}</span>
              </button>

              {isRecurring && (
                <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-2 text-xs">
                  <select
                    value={recurringFreq}
                    onChange={(e) => setRecurringFreq(e.target.value as RecurringFrequency)}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <span className="text-slate-400">every</span>
                  <input
                    type="number"
                    min={1}
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(parseInt(e.target.value, 10) || 1)}
                    className="w-12 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center"
                  />
                  <span className="text-slate-400">period(s)</span>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
                activeTab === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : activeTab === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting
                ? 'Recording...'
                : activeTab === 'expense'
                ? 'Save Expense'
                : activeTab === 'income'
                ? 'Save Income'
                : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
