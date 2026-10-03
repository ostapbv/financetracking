import React, { useState, useMemo } from 'react';
import {
  Coins,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  ArrowRightLeft,
} from 'lucide-react';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { useUIStore } from '../../stores/useUIStore';
import { CurrencyModal } from './CurrencyModal';
import { RateModal } from './RateModal';
import { format } from 'date-fns';

export const CurrenciesScreen: React.FC = () => {
  const {
    currencies,
    accounts,
    exchangeRates,
    settings,
    updateSettings,
    deleteExchangeRate,
    fetchAndSaveLiveRates,
  } = useFinanceStore();

  const { openCurrencyModal, openRateModal } = useUIStore();

  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [fetchFeedback, setFetchFeedback] = useState<string | null>(null);
  const [filterPair, setFilterPair] = useState<string>('all');

  // Derive "Used currencies" list from active accounts
  const usedCurrencyCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const acc of accounts) {
      if (!acc.archived) {
        codes.add(acc.currency);
      }
    }
    // Always include main currency
    codes.add(settings.mainCurrency || 'USD');
    return Array.from(codes);
  }, [accounts, settings.mainCurrency]);

  const usedCurrencies = useMemo(() => {
    return currencies.filter((c) => usedCurrencyCodes.includes(c.code));
  }, [currencies, usedCurrencyCodes]);

  const handleFetchRates = async () => {
    setIsFetchingRates(true);
    setFetchFeedback(null);
    try {
      const ok = await fetchAndSaveLiveRates();
      if (ok) {
        setFetchFeedback('Live exchange rates updated successfully!');
      } else {
        setFetchFeedback('Unable to reach rate service. Please check connection or enter rates manually.');
      }
    } catch {
      setFetchFeedback('Error fetching live rates.');
    } finally {
      setIsFetchingRates(false);
      setTimeout(() => setFetchFeedback(null), 4000);
    }
  };

  const handleMainCurrencyChange = async (code: string) => {
    await updateSettings({ mainCurrency: code });
  };

  // Filter exchange rates list
  const filteredRates = useMemo(() => {
    if (filterPair === 'all') return exchangeRates;
    const [from, to] = filterPair.split('-');
    return exchangeRates.filter(
      (r) => (r.fromCurrency === from && r.toCurrency === to) || (r.fromCurrency === to && r.toCurrency === from)
    );
  }, [exchangeRates, filterPair]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0">
            Currencies & Exchange Rates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">
            Multi-currency tracking with dated historical rates and precision controls
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleFetchRates}
            disabled={isFetchingRates}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-xs disabled:opacity-50"
            title="Fetch live rates from free public API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRates ? 'animate-spin text-amber-500' : ''}`} />
            <span>{isFetchingRates ? 'Fetching...' : 'Fetch Latest Rates'}</span>
          </button>

          <button
            type="button"
            onClick={() => openRateModal()}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 rounded-xl transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rate</span>
          </button>
        </div>
      </div>

      {fetchFeedback && (
        <div className="p-3 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{fetchFeedback}</span>
        </div>
      )}

      {/* Main Currency & Used Currencies Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Main Currency Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center space-x-2.5 text-amber-600 dark:text-amber-400 mb-3">
            <Coins className="w-5 h-5" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0">
              Primary Currency
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            All net worth dashboards and multi-currency aggregate totals convert into this currency.
          </p>
          <select
            value={settings.mainCurrency || 'USD'}
            onChange={(e) => handleMainCurrencyChange(e.target.value)}
            className="w-full px-3 py-2 text-sm font-medium rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} – {c.name} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Used Currencies in Accounts */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0">
                Currencies in Use ({usedCurrencies.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                Automatically derived from your accounts
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCurrencyModal()}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Currency</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {usedCurrencies.map((c) => {
              const count = accounts.filter((a) => !a.archived && a.currency === c.code).length;
              const isMain = c.code === settings.mainCurrency;
              return (
                <div
                  key={c.code}
                  className={`p-3 rounded-xl border transition-all ${
                    isMain
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {c.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => openCurrencyModal(c)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      title="Edit precision"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {c.symbol} · {c.precision} dec
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    {count} {count === 1 ? 'account' : 'accounts'} {isMain && '· Main'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dated Historical Rates Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0">
              Exchange Rate History (Dated)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
              Transactions are converted using the rate effective on or immediately prior to transaction date
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-500 dark:text-slate-400">Filter:</label>
            <select
              value={filterPair}
              onChange={(e) => setFilterPair(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="all">All Pairs</option>
              <option value="EUR-USD">EUR / USD</option>
              <option value="USD-PLN">USD / PLN</option>
              <option value="USD-UAH">USD / UAH</option>
            </select>
          </div>
        </div>

        {filteredRates.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No exchange rates found. Click "Add Rate" or "Fetch Latest Rates".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Effective Date</th>
                  <th className="py-2.5 px-3">Currency Pair</th>
                  <th className="py-2.5 px-3">Rate Multiplier</th>
                  <th className="py-2.5 px-3">Inverse (1 / R)</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRates.map((rate) => {
                  const inv = rate.rate > 0 ? (1 / rate.rate).toFixed(4) : '—';
                  return (
                    <tr
                      key={rate.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{format(new Date(rate.effectiveDate), 'yyyy-MM-dd')}</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {rate.fromCurrency} <ArrowRightLeft className="inline w-3 h-3 text-slate-400 mx-1" /> {rate.toCurrency}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium tabular-nums text-slate-800 dark:text-slate-200">
                        1 {rate.fromCurrency} = {rate.rate.toFixed(4)} {rate.toCurrency}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400">
                        1 {rate.toCurrency} = {inv} {rate.fromCurrency}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteExchangeRate(rate.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete rate entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CurrencyModal />
      <RateModal />
    </div>
  );
};
