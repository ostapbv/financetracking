import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import { Trash2 } from 'lucide-react';
import { toMinorUnits, toMajorUnits } from '../../lib/money';
import type { TransactionKind } from '../../db/types';

export const TransactionEditModal: React.FC = () => {
  const { transactionModal, closeTransactionModal } = useUIStore();
  const { accounts, categories, currencies, updateTransaction, deleteTransaction } = useFinanceStore();

  const tx = transactionModal.transaction;

  const [kind, setKind] = useState<TransactionKind>('expense');
  const [amountMajor, setAmountMajor] = useState('');
  const [date, setDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts]);

  useEffect(() => {
    if (tx) {
      setKind(tx.kind);
      const acc = accounts.find((a) => a.id === tx.accountId);
      const curr = currencies.find((c) => c.code === acc?.currency);
      const prec = curr?.precision ?? 2;
      setAmountMajor(toMajorUnits(tx.amountMinor, prec).toString());
      setDate(tx.date);
      setAccountId(tx.accountId);
      setCategoryId(tx.categoryId);
      setNote(tx.note || '');
    }
    setError('');
  }, [tx, accounts, currencies]);

  if (!tx) return null;

  const isTransfer = Boolean(tx.transferId);

  const availableCategories = categories.filter((c) => c.kind === kind && !c.archived);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountMajor);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    const acc = accounts.find((a) => a.id === accountId);
    const prec = currencies.find((c) => c.code === acc?.currency)?.precision ?? 2;
    const amountMinor = toMinorUnits(num, prec);

    setIsSubmitting(true);
    try {
      await updateTransaction(tx.id, {
        kind,
        amountMinor,
        date,
        accountId,
        categoryId: isTransfer ? tx.categoryId : categoryId,
        note: note.trim() || undefined,
      });
      closeTransactionModal();
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this transaction?')) {
      await deleteTransaction(tx.id);
      closeTransactionModal();
    }
  };

  return (
    <Modal
      isOpen={transactionModal.isOpen}
      onClose={closeTransactionModal}
      title={isTransfer ? 'Transfer Transaction' : 'Edit Transaction'}
      subtitle="Modify amount, date, account, or category details"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40">
            {error}
          </div>
        )}

        {isTransfer && (
          <div className="p-3 text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-900/40">
            This entry is linked to a transfer. Updating or deleting it maintains balanced ledger entries.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Kind
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as TransactionKind)}
              disabled={isTransfer}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-60"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Amount
          </label>
          <input
            type="number"
            step="any"
            value={amountMajor}
            onChange={(e) => setAmountMajor(e.target.value)}
            required
            className="w-full px-3 py-2 text-base font-bold tabular-nums rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </div>

          {!isTransfer && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Note / Memo
          </label>
          <input
            type="text"
            placeholder="e.g. Lunch with team"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center space-x-1 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={closeTransactionModal}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
