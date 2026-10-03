import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';

export const RateModal: React.FC = () => {
  const { rateModal, closeRateModal } = useUIStore();
  const { currencies, addExchangeRate } = useFinanceStore();

  const [fromCurrency, setFromCurrency] = useState(rateModal.fromCurrency || 'USD');
  const [toCurrency, setToCurrency] = useState(rateModal.toCurrency || 'EUR');
  const [rateStr, setRateStr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Synchronize initial state when modal opens
  React.useEffect(() => {
    if (rateModal.isOpen) {
      setFromCurrency(rateModal.fromCurrency || 'USD');
      setToCurrency(rateModal.toCurrency || 'EUR');
      setRateStr('');
      setDate(new Date().toISOString().slice(0, 10));
      setError('');
    }
  }, [rateModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(rateStr);
    if (!rateNum || rateNum <= 0) {
      setError('Please enter a valid rate greater than 0');
      return;
    }
    if (fromCurrency === toCurrency) {
      setError('From and To currencies must be different');
      return;
    }

    setIsSubmitting(true);
    try {
      await addExchangeRate({
        fromCurrency,
        toCurrency,
        rate: rateNum,
        effectiveDate: date,
      });

      // Also automatically add inverse rate if convenient
      await addExchangeRate({
        fromCurrency: toCurrency,
        toCurrency: fromCurrency,
        rate: 1 / rateNum,
        effectiveDate: date,
      });

      closeRateModal();
    } catch (err: any) {
      setError(err.message || 'Failed to add exchange rate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={rateModal.isOpen}
      onClose={closeRateModal}
      title="Add Dated Exchange Rate"
      subtitle="Conversions use the newest rate on or before the transaction date"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              From Currency
            </label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
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
              To Currency
            </label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Exchange Rate (1 {fromCurrency} = X {toCurrency})
          </label>
          <input
            type="number"
            step="0.0001"
            placeholder="e.g. 1.085"
            value={rateStr}
            onChange={(e) => setRateStr(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Effective Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={closeRateModal}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Add Rate'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
