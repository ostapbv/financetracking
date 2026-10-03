import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import { ArrowLeftRight, Trash2, Info } from 'lucide-react';
import { toMinorUnits, toMajorUnits } from '../../lib/money';
import { findEffectiveRate } from '../../lib/currency';

export const TransferModal: React.FC = () => {
  const { transferModal, closeTransferModal } = useUIStore();
  const {
    accounts,
    exchangeRates,
    currencies,
    createTransfer,
    updateTransfer,
    deleteTransfer,
  } = useFinanceStore();

  const isEditing = Boolean(transferModal.transfer);

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts]);

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amountFromMajor, setAmountFromMajor] = useState('');
  const [amountToMajor, setAmountToMajor] = useState('');
  const [rate, setRate] = useState(1.0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fromAccount = useMemo(() => accounts.find((a) => a.id === fromAccountId), [accounts, fromAccountId]);
  const toAccount = useMemo(() => accounts.find((a) => a.id === toAccountId), [accounts, toAccountId]);

  const isCrossCurrency = Boolean(fromAccount && toAccount && fromAccount.currency !== toAccount.currency);

  const fromCurrencyMeta = useMemo(
    () => currencies.find((c) => c.code === fromAccount?.currency),
    [currencies, fromAccount]
  );
  const toCurrencyMeta = useMemo(
    () => currencies.find((c) => c.code === toAccount?.currency),
    [currencies, toAccount]
  );

  // Initialize form state
  useEffect(() => {
    if (transferModal.transfer) {
      const tr = transferModal.transfer;
      setFromAccountId(tr.fromAccountId);
      setToAccountId(tr.toAccountId);
      setDate(tr.date);
      setNote(tr.note || '');
      setRate(tr.rate);

      const fCurr = currencies.find((c) => c.code === accounts.find((a) => a.id === tr.fromAccountId)?.currency);
      const tCurr = currencies.find((c) => c.code === accounts.find((a) => a.id === tr.toAccountId)?.currency);
      setAmountFromMajor(toMajorUnits(tr.amountFromMinor, fCurr?.precision ?? 2).toString());
      setAmountToMajor(toMajorUnits(tr.amountToMinor, tCurr?.precision ?? 2).toString());
    } else {
      if (activeAccounts.length >= 2) {
        setFromAccountId(activeAccounts[0].id);
        setToAccountId(activeAccounts[1].id);
      } else if (activeAccounts.length === 1) {
        setFromAccountId(activeAccounts[0].id);
        setToAccountId('');
      }
      setDate(new Date().toISOString().slice(0, 10));
      setAmountFromMajor('');
      setAmountToMajor('');
      setRate(1.0);
      setNote('');
    }
    setError('');
  }, [transferModal, activeAccounts, accounts, currencies]);

  // Update default rate when accounts or date change
  useEffect(() => {
    if (!isEditing && fromAccount && toAccount) {
      if (fromAccount.currency === toAccount.currency) {
        setRate(1.0);
        if (amountFromMajor) setAmountToMajor(amountFromMajor);
      } else {
        const storedRate = findEffectiveRate(fromAccount.currency, toAccount.currency, date, exchangeRates) || 1.0;
        setRate(storedRate);
        const fromNum = parseFloat(amountFromMajor);
        if (!isNaN(fromNum) && fromNum > 0) {
          const prec = toCurrencyMeta?.precision ?? 2;
          setAmountToMajor((fromNum * storedRate).toFixed(prec));
        }
      }
    }
  }, [fromAccount, toAccount, date, exchangeRates, isEditing]);

  const handleSwap = () => {
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const handleAmountFromChange = (val: string) => {
    setAmountFromMajor(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const prec = toCurrencyMeta?.precision ?? 2;
      setAmountToMajor((num * rate).toFixed(prec));
    }
  };

  const handleAmountToChange = (val: string) => {
    setAmountToMajor(val);
    const toNum = parseFloat(val);
    const fromNum = parseFloat(amountFromMajor);
    if (!isNaN(toNum) && !isNaN(fromNum) && fromNum > 0) {
      const impliedRate = toNum / fromNum;
      setRate(Math.round(impliedRate * 10000) / 10000);
    }
  };

  const handleRateChange = (val: string) => {
    const r = parseFloat(val) || 1.0;
    setRate(r);
    const fromNum = parseFloat(amountFromMajor);
    if (!isNaN(fromNum) && fromNum > 0) {
      const prec = toCurrencyMeta?.precision ?? 2;
      setAmountToMajor((fromNum * r).toFixed(prec));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      setError('Please select both From and To accounts');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('From and To accounts must be different');
      return;
    }

    const fromNum = parseFloat(amountFromMajor);
    const toNum = parseFloat(amountToMajor);

    if (isNaN(fromNum) || fromNum <= 0 || isNaN(toNum) || toNum <= 0) {
      setError('Please enter valid transfer amounts');
      return;
    }

    const fromPrec = fromCurrencyMeta?.precision ?? 2;
    const toPrec = toCurrencyMeta?.precision ?? 2;
    const amountFromMinor = toMinorUnits(fromNum, fromPrec);
    const amountToMinor = toMinorUnits(toNum, toPrec);

    setIsSubmitting(true);
    try {
      if (isEditing && transferModal.transfer) {
        await updateTransfer(transferModal.transfer.id, {
          fromAccountId,
          toAccountId,
          amountFromMinor,
          amountToMinor,
          rate,
          note: note.trim() || undefined,
          date,
        });
      } else {
        await createTransfer({
          fromAccountId,
          toAccountId,
          amountFromMinor,
          amountToMinor,
          rate,
          note: note.trim() || undefined,
          date,
        });
      }
      closeTransferModal();
    } catch (err: any) {
      setError(err.message || 'Failed to process transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!transferModal.transfer) return;
    if (window.confirm('Are you sure you want to delete this transfer? Both sides will be deleted.')) {
      await deleteTransfer(transferModal.transfer.id);
      closeTransferModal();
    }
  };

  return (
    <Modal
      isOpen={transferModal.isOpen}
      onClose={closeTransferModal}
      title={isEditing ? 'Edit Transfer' : 'Transfer Between Accounts'}
      subtitle="Moves funds between accounts without altering net worth or income/expense stats"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40">
            {error}
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Transfer Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        {/* Account Pickers with Swap Button */}
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              From Account
            </label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-medium"
            >
              <option value="">Select source...</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 mt-5 text-slate-500 hover:text-amber-600 transition-colors"
            title="Swap Accounts"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              To Account
            </label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-medium"
            >
              <option value="">Select destination...</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amounts */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount Sent {fromAccount && `(${fromAccount.currency})`}
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amountFromMajor}
              onChange={(e) => handleAmountFromChange(e.target.value)}
              required
              className="w-full px-3 py-2 text-base font-bold tabular-nums rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Cross currency amount received and implied rate */}
          {isCrossCurrency && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl space-y-3">
              <div className="flex items-center space-x-1.5 text-xs text-amber-800 dark:text-amber-200 font-medium">
                <Info className="w-3.5 h-3.5" />
                <span>Cross-currency conversion ({fromAccount?.currency} → {toAccount?.currency})</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Amount Received ({toAccount?.currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={amountToMajor}
                    onChange={(e) => handleAmountToChange(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 text-sm font-bold tabular-nums rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Applied Rate
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={rate}
                    onChange={(e) => handleRateChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-medium tabular-nums rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Monthly savings boost"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center space-x-1 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Transfer</span>
            </button>
          ) : <div />}

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={closeTransferModal}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : isEditing ? 'Save Changes' : 'Execute Transfer'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
