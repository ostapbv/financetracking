import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { formatMoney, toMajorUnits } from '../../lib/money';
import { calculatePeriodCashFlow } from '../../lib/balances';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export const CashFlowChart: React.FC = () => {
  const { transactions, exchangeRates, currencies, accounts, settings } = useFinanceStore();
  const [monthsCount, setMonthsCount] = useState<6 | 12>(6);

  const mainCurrency = settings.mainCurrency || 'USD';
  const accountsMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const precision = useMemo(
    () => currencies.find((c) => c.code === mainCurrency)?.precision ?? 2,
    [currencies, mainCurrency]
  );

  const data = useMemo(() => {
    const chartData: {
      monthKey: string;
      label: string;
      income: number;
      expense: number;
      net: number;
      incomeMinor: number;
      expenseMinor: number;
      netMinor: number;
    }[] = [];

    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const startStr = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const endStr = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      const label = format(monthDate, 'MMM yy');

      const flow = calculatePeriodCashFlow(transactions, startStr, endStr, {
        rates: exchangeRates,
        mainCurrency,
        accountsMap,
        currencies,
      });

      chartData.push({
        monthKey: startStr,
        label,
        income: toMajorUnits(flow.totalIncomeMinor, precision),
        expense: toMajorUnits(flow.totalExpenseMinor, precision),
        net: toMajorUnits(flow.netIncomeMinor, precision),
        incomeMinor: flow.totalIncomeMinor,
        expenseMinor: flow.totalExpenseMinor,
        netMinor: flow.netIncomeMinor,
      });
    }

    return chartData;
  }, [transactions, monthsCount, exchangeRates, mainCurrency, accountsMap, currencies, precision]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0">
            Cash Flow Trend
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
            Monthly income vs. expenses with net savings line
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMonthsCount(6)}
            className={`px-3 py-1 rounded-lg transition-all ${
              monthsCount === 6
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Last 6 Months
          </button>
          <button
            type="button"
            onClick={() => setMonthsCount(12)}
            className={`px-3 py-1 rounded-lg transition-all ${
              monthsCount === 12
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Last 12 Months
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1">
                      <div className="font-bold border-b border-slate-700 pb-1 mb-1">
                        {item.label}
                      </div>
                      <div className="flex justify-between space-x-4">
                        <span className="text-emerald-400">Income:</span>
                        <span className="font-mono font-bold">
                          {formatMoney(item.incomeMinor, mainCurrency, currencies)}
                        </span>
                      </div>
                      <div className="flex justify-between space-x-4">
                        <span className="text-rose-400">Expense:</span>
                        <span className="font-mono font-bold">
                          {formatMoney(item.expenseMinor, mainCurrency, currencies)}
                        </span>
                      </div>
                      <div className="flex justify-between space-x-4 pt-1 border-t border-slate-700">
                        <span className="text-amber-400">Net:</span>
                        <span className="font-mono font-bold">
                          {formatMoney(item.netMinor, mainCurrency, currencies, { showSign: true })}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />
            <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="expense" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Line
              type="monotone"
              dataKey="net"
              name="Net Savings"
              stroke="#F59E0B"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#F59E0B' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
