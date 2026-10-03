import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { formatMoney, toMajorUnits } from '../../lib/money';
import { calculateNetWorth } from '../../lib/balances';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { subMonths, subYears, format, subDays, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';

type NetWorthRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export const NetWorthChart: React.FC = () => {
  const { accounts, transactions, exchangeRates, currencies, settings } = useFinanceStore();
  const [range, setRange] = useState<NetWorthRange>('3M');

  const mainCurrency = settings.mainCurrency || 'USD';
  const precision = useMemo(
    () => currencies.find((c) => c.code === mainCurrency)?.precision ?? 2,
    [currencies, mainCurrency]
  );

  const data = useMemo(() => {
    const chartData: { date: string; displayDate: string; netWorth: number; netWorthMinor: number }[] = [];
    const now = new Date();

    let startDate: Date;
    let stepDays = 1;

    switch (range) {
      case '1M':
        startDate = subDays(now, 30);
        stepDays = 2;
        break;
      case '3M':
        startDate = subMonths(now, 3);
        stepDays = 5;
        break;
      case '6M':
        startDate = subMonths(now, 6);
        stepDays = 10;
        break;
      case '1Y':
        startDate = subYears(now, 1);
        stepDays = 20;
        break;
      case 'ALL':
        startDate = subYears(now, 2);
        stepDays = 30;
        break;
    }

    // Sample interval points
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const minor = calculateNetWorth(
        accounts,
        transactions,
        exchangeRates,
        mainCurrency,
        currencies,
        dateStr
      );

      chartData.push({
        date: dateStr,
        displayDate: format(currentDate, range === '1M' ? 'MMM d' : 'MMM yy'),
        netWorth: toMajorUnits(minor, precision),
        netWorthMinor: minor,
      });

      currentDate.setDate(currentDate.getDate() + stepDays);
    }

    // Always include today as final point
    const todayStr = format(now, 'yyyy-MM-dd');
    if (chartData.length === 0 || chartData[chartData.length - 1].date !== todayStr) {
      const minor = calculateNetWorth(accounts, transactions, exchangeRates, mainCurrency, currencies, todayStr);
      chartData.push({
        date: todayStr,
        displayDate: format(now, range === '1M' ? 'MMM d' : 'MMM yy'),
        netWorth: toMajorUnits(minor, precision),
        netWorthMinor: minor,
      });
    }

    return chartData;
  }, [accounts, transactions, exchangeRates, mainCurrency, currencies, precision, range]);

  const currentNetWorth = data[data.length - 1]?.netWorthMinor || 0;
  const startNetWorth = data[0]?.netWorthMinor || 0;
  const growthMinor = currentNetWorth - startNetWorth;
  const isPositiveGrowth = growthMinor >= 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0">
              Net Worth History
            </h2>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isPositiveGrowth
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPositiveGrowth ? '+' : ''}
              {formatMoney(growthMinor, mainCurrency, currencies)} ({range})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
            Total assets minus liabilities converted at historical rates
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as NetWorthRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                range === r
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97706" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="displayDate"
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
                    <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs">
                      <div className="text-slate-400 mb-0.5">{item.date}</div>
                      <div className="font-bold tabular-nums">
                        {formatMoney(item.netWorthMinor, mainCurrency, currencies)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke="#D97706"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#netWorthAreaGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
