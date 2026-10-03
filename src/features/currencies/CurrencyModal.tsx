import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';

export const CurrencyModal: React.FC = () => {
  const { currencyModal, closeCurrencyModal } = useUIStore();
  const { createCurrency, updateCurrency } = useFinanceStore();

  const isEditing = Boolean(currencyModal.currency);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [precision, setPrecision] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currencyModal.currency) {
      setCode(currencyModal.currency.code);
      setName(currencyModal.currency.name);
      setSymbol(currencyModal.currency.symbol);
      setPrecision(currencyModal.currency.precision);
    } else {
      setCode('');
      setName('');
      setSymbol('');
      setPrecision(2);
    }
    setError('');
  }, [currencyModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 2) {
      setError('Please provide a valid currency code (e.g. GBP, CAD)');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateCurrency(cleanCode, {
          name: name.trim() || cleanCode,
          symbol: symbol.trim() || cleanCode,
          precision,
        });
      } else {
        await createCurrency({
          code: cleanCode,
          name: name.trim() || cleanCode,
          symbol: symbol.trim() || cleanCode,
          precision,
        });
      }
      closeCurrencyModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save currency');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={currencyModal.isOpen}
      onClose={closeCurrencyModal}
      title={isEditing ? `Edit Currency (${code})` : 'Add Currency'}
      subtitle="Configure display precision (0–3 decimals) and symbol"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Currency Code (ISO)
          </label>
          <input
            type="text"
            placeholder="e.g. CHF, JPY"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isEditing}
            required
            className="w-full px-3 py-2 text-sm uppercase rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Currency Name
          </label>
          <input
            type="text"
            placeholder="e.g. Swiss Franc"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Symbol
            </label>
            <input
              type="text"
              placeholder="e.g. $, €, Fr"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Display Precision
            </label>
            <select
              value={precision}
              onChange={(e) => setPrecision(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value={0}>0 decimals (e.g. ¥100)</option>
              <option value={2}>2 decimals (e.g. $12.50)</option>
              <option value={3}>3 decimals (e.g. 1.250)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={closeCurrencyModal}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Currency' : 'Add Currency'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
