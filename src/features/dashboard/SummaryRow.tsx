import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  History,
} from 'lucide-react';
import { formatMoney } from '../../lib/money';
import {
  calculateNetWorth,
  calculatePeriodCashFlow,
  calculateTotalCarryOver,
} from '../../lib/balances';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { usePeriodStore } from '../../stores/usePeriodStore';
import { subMonths, parseISO, format } from 'date-fns';

export const SummaryRow: React.FC = () => {
  const { accounts, transactions, exchangeRates, currencies, settings } = useFinanceStore();
  const { getPeriodFilter } = usePeriodStore();

  const period = getPeriodFilter();
  const mainCurrency = settings.mainCurrency || 'USD';

  const accountsMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Current Period Cash Flow
  const currentFlow = useMemo(() => {
    return calculatePeriodCashFlow(transactions, period.startDate, period.endDate, {
      rates: exchangeRates,
      mainCurrency,
      accountsMap,
      currencies,
    });
  }, [transactions, period, exchangeRates, mainCurrency, accountsMap, currencies]);

  // Previous Period Cash Flow (e.g. previous month) for comparative changes
  const prevFlow = useMemo(() => {
    try {
      const startD = parseISO(period.startDate);
      const endD = parseISO(period.endDate);
      const prevStart = format(subMonths(startD, 1), 'yyyy-MM-dd');
      const prevEnd = format(subMonths(endD, 1), 'yyyy-MM-dd');

      return calculatePeriodCashFlow(transactions, prevStart, prevEnd, {
        rates: exchangeRates,
        mainCurrency,
        accountsMap,
        currencies,
      });
    } catch {
      return { totalIncomeMinor: 0, totalExpenseMinor: 0, netIncomeMinor: 0 };
    }
  }, [transactions, period, exchangeRates, mainCurrency, accountsMap, currencies]);

  // Total Net Worth (included accounts)
  const netWorthMinor = useMemo(() => {
    return calculateNetWorth(accounts, transactions, exchangeRates, mainCurrency, currencies);
  }, [accounts, transactions, exchangeRates, mainCurrency, currencies]);

  // Carry-over balance (prior to period start)
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

  // Percentage changes vs previous period
  const expenseChangePct = useMemo(() => {
    if (prevFlow.totalExpenseMinor === 0) return null;
    const diff = currentFlow.totalExpenseMinor - prevFlow.totalExpenseMinor;
    return Math.round((diff / prevFlow.totalExpenseMinor) * 100);
  }, [currentFlow.totalExpenseMinor, prevFlow.totalExpenseMinor]);

  const incomeChangePct = useMemo(() => {
    if (prevFlow.totalIncomeMinor === 0) return null;
    const diff = currentFlow.totalIncomeMinor - prevFlow.totalIncomeMinor;
    return Math.round((diff / prevFlow.totalIncomeMinor) * 100);
  }, [currentFlow.totalIncomeMinor, prevFlow.totalIncomeMinor]);

  return (
    <div className="space-y-4">
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Worth</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {formatMoney(netWorthMinor, mainCurrency, currencies)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
              <span>All included accounts</span>
            </div>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Income</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatMoney(currentFlow.totalIncomeMinor, mainCurrency, currencies)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
              {incomeChangePct !== null ? (
                <span className={`font-semibold ${incomeChangePct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {incomeChangePct >= 0 ? `+${incomeChangePct}%` : `${incomeChangePct}%`}
                </span>
              ) : (
                <span>No prior data</span>
              )}
              <span>vs prev period</span>
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {formatMoney(currentFlow.totalExpenseMinor, mainCurrency, currencies)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
              {expenseChangePct !== null ? (
                <span className={`font-semibold ${expenseChangePct <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {expenseChangePct > 0 ? `+${expenseChangePct}%` : `${expenseChangePct}%`}
                </span>
              ) : (
                <span>No prior data</span>
              )}
              <span>vs prev period</span>
            </div>
          </div>
        </div>

        {/* Net Cash Flow Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Savings</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-black tabular-nums tracking-tight ${
                currentFlow.netIncomeMinor >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatMoney(currentFlow.netIncomeMinor, mainCurrency, currencies, { showSign: true })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
              <span>Income minus expenses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monefy Carry-over Banner (Period Reconciliation) */}
      <div className="bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
          <History className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Carry-over balance:</strong> {formatMoney(carryOverMinor, mainCurrency, currencies)} entered into this period.
          </span>
        </div>
        <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] tabular-nums">
          Reconciled Net Worth: {formatMoney(carryOverMinor + currentFlow.netIncomeMinor, mainCurrency, currencies)}
        </div>
      </div>
    </div>
  );
};
