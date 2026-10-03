import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatMoney, toMajorUnits } from '../../lib/money';
import { convertCurrency } from '../../lib/currency';
import { IconRenderer } from '../../components/common/IconRenderer';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { usePeriodStore } from '../../stores/usePeriodStore';
import type { TransactionKind, Category } from '../../db/types';

interface CategoryDonutChartProps {
  onSelectCategory?: (categoryId: string) => void;
  selectedCategoryId?: string;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  onSelectCategory,
  selectedCategoryId,
}) => {
  const { transactions, categories, accounts, currencies, exchangeRates, settings } = useFinanceStore();
  const { getPeriodFilter } = usePeriodStore();

  const [kind, setKind] = useState<TransactionKind>('expense');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const period = getPeriodFilter();
  const mainCurrency = settings.mainCurrency || 'USD';
  const accountsMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoriesMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Aggregate by category for the current period and kind
  const { chartData, totalMinor } = useMemo(() => {
    const totalsByCat = new Map<string, number>();
    let total = 0;

    for (const tx of transactions) {
      if (tx.transferId) continue; // Exclude transfers
      if (tx.kind !== kind) continue;
      if (period.type !== 'all' && (tx.date < period.startDate || tx.date > period.endDate)) {
        continue;
      }

      const acc = accountsMap.get(tx.accountId);
      const cur = acc?.currency || mainCurrency;
      const converted = convertCurrency(
        tx.amountMinor,
        cur,
        mainCurrency,
        tx.date,
        exchangeRates,
        currencies
      );

      totalsByCat.set(tx.categoryId, (totalsByCat.get(tx.categoryId) || 0) + converted);
      total += converted;
    }

    const data: {
      id: string;
      name: string;
      icon: string;
      color: string;
      valueMinor: number;
      valueMajor: number;
      percent: number;
    }[] = [];

    const prec = currencies.find((c) => c.code === mainCurrency)?.precision ?? 2;

    for (const [catId, valMinor] of totalsByCat.entries()) {
      const cat = categoriesMap.get(catId);
      const name = cat?.name || 'Uncategorized';
      const icon = cat?.icon || 'Tag';
      const color = cat?.color || '#94A3B8';
      const percent = total > 0 ? Math.round((valMinor / total) * 100) : 0;

      data.push({
        id: catId,
        name,
        icon,
        color,
        valueMinor: valMinor,
        valueMajor: toMajorUnits(valMinor, prec),
        percent,
      });
    }

    // Sort highest to lowest
    data.sort((a, b) => b.valueMinor - a.valueMinor);

    return { chartData: data, totalMinor: total };
  }, [transactions, kind, period, accountsMap, categoriesMap, mainCurrency, exchangeRates, currencies]);

  const formattedTotal = formatMoney(totalMinor, mainCurrency, currencies);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Top Header & Kind Switcher */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0">
            {kind === 'expense' ? 'Spending by Category' : 'Income by Category'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
            Click any segment or legend item to filter transactions
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setKind('expense')}
            className={`px-3 py-1 rounded-lg transition-all ${
              kind === 'expense'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setKind('income')}
            className={`px-3 py-1 rounded-lg transition-all ${
              kind === 'income'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400">
          No {kind} transactions recorded for this period.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Donut Chart with Center Total */}
          <div className="relative h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="valueMajor"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  onClick={(entry: any) => onSelectCategory?.(entry?.payload?.id || entry?.id)}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => {
                    const isSelected = selectedCategoryId === entry.id;
                    const isHovered = activeIndex === index;
                    return (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={entry.color}
                        stroke={isSelected ? '#111827' : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                        style={{
                          transform: isHovered || isSelected ? 'scale(1.04)' : 'scale(1)',
                          transformOrigin: 'center center',
                          transition: 'transform 0.15s ease-out',
                        }}
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs">
                          <div className="font-semibold">{item.name}</div>
                          <div className="font-mono tabular-nums text-slate-300">
                            {formatMoney(item.valueMinor, mainCurrency, currencies)} ({item.percent}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                {kind === 'expense' ? 'Total Spent' : 'Total Income'}
              </span>
              <span className="text-xl font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                {formattedTotal}
              </span>
            </div>
          </div>

          {/* Interactive Legend */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {chartData.map((item) => {
              const isSelected = selectedCategoryId === item.id;
              const formatted = formatMoney(item.valueMinor, mainCurrency, currencies);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectCategory?.(isSelected ? '' : item.id)}
                  className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}18`, color: item.color }}
                    >
                      <IconRenderer name={item.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[130px]">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.percent}%</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatted}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
