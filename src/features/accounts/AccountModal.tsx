import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { IconPicker } from '../../components/common/IconPicker';
import { ColorPicker } from '../../components/common/ColorPicker';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import type { AccountType } from '../../db/types';
import { toMinorUnits, toMajorUnits } from '../../lib/money';
import { Trash2, Archive } from 'lucide-react';

export const AccountModal: React.FC = () => {
  const { accountModal, closeAccountModal, setAccountDetailId } = useUIStore();
  const { currencies, createAccount, updateAccount, deleteAccount, settings } = useFinanceStore();

  const isEditing = Boolean(accountModal.account);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [currency, setCurrency] = useState('USD');
  const [initialBalanceMajor, setInitialBalanceMajor] = useState('0');
  const [initialBalanceDate, setInitialBalanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [icon, setIcon] = useState('Landmark');
  const [color, setColor] = useState('#3B82F6');
  const [includeInTotal, setIncludeInTotal] = useState(true);
  const [archived, setArchived] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accountModal.account) {
      const acc = accountModal.account;
      setName(acc.name);
      setType(acc.type);
      setCurrency(acc.currency);
      const curr = currencies.find((c) => c.code === acc.currency);
      const prec = curr?.precision ?? 2;
      setInitialBalanceMajor(toMajorUnits(acc.initialBalanceMinor, prec).toString());
      setInitialBalanceDate(acc.initialBalanceDate || new Date().toISOString().slice(0, 10));
      setIcon(acc.icon || 'Landmark');
      setColor(acc.color || '#3B82F6');
      setIncludeInTotal(acc.includeInTotal);
      setArchived(acc.archived);
    } else {
      setName('');
      setType('bank');
      setCurrency(settings.mainCurrency || 'USD');
      setInitialBalanceMajor('0');
      setInitialBalanceDate(new Date().toISOString().slice(0, 10));
      setIcon('Landmark');
      setColor('#3B82F6');
      setIncludeInTotal(true);
      setArchived(false);
    }
    setError('');
  }, [accountModal, currencies, settings.mainCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an account name');
      return;
    }

    const curr = currencies.find((c) => c.code === currency);
    const precision = curr?.precision ?? 2;
    const balanceNum = parseFloat(initialBalanceMajor) || 0;
    const initialBalanceMinor = toMinorUnits(balanceNum, precision);

    setIsSubmitting(true);
    try {
      if (isEditing && accountModal.account) {
        await updateAccount(accountModal.account.id, {
          name: name.trim(),
          type,
          currency,
          initialBalanceMinor,
          initialBalanceDate,
          icon,
          color,
          includeInTotal,
          archived,
        });
      } else {
        await createAccount({
          name: name.trim(),
          type,
          currency,
          initialBalanceMinor,
          initialBalanceDate,
          icon,
          color,
          includeInTotal,
          archived: false,
          order: 99,
        });
      }
      closeAccountModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!accountModal.account) return;
    if (window.confirm(`Are you sure you want to delete "${accountModal.account.name}"? All its transactions and transfers will also be deleted.`)) {
      await deleteAccount(accountModal.account.id);
      setAccountDetailId(null);
      closeAccountModal();
    }
  };

  return (
    <Modal
      isOpen={accountModal.isOpen}
      onClose={closeAccountModal}
      title={isEditing ? 'Edit Account' : 'Add New Account'}
      subtitle="Track cash, checking, savings, or credit balances"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Account Name
            </label>
            <input
              type="text"
              placeholder="e.g. Chase Total Checking"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Account Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="bank">Bank / Checking</option>
              <option value="savings">Savings / High-Yield</option>
              <option value="credit">Credit Card</option>
              <option value="cash">Cash / Physical Wallet</option>
              <option value="other">Other Asset / Investment</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Initial Balance
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00 (negative for credit cards)"
              value={initialBalanceMajor}
              onChange={(e) => setInitialBalanceMajor(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Initial Balance Date
            </label>
            <input
              type="date"
              value={initialBalanceDate}
              onChange={(e) => setInitialBalanceDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Account Color & Icon
          </label>
          <ColorPicker value={color} onChange={setColor} />
          <div className="mt-2">
            <IconPicker value={icon} onChange={setIcon} accentColor={color} />
          </div>
        </div>

        {/* Options */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInTotal}
              onChange={(e) => setIncludeInTotal(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
            />
            <span>Include in Net Worth and Total Balance calculations</span>
          </label>

          {isEditing && (
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={archived}
                onChange={(e) => setArchived(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span className="flex items-center space-x-1">
                <Archive className="w-3.5 h-3.5 text-slate-400" />
                <span>Archive this account (hides from quick selection)</span>
              </span>
            </label>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-3">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center space-x-1 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          ) : <div />}

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={closeAccountModal}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
