import React, { useState } from 'react';
import { SummaryRow } from './SummaryRow';
import { CategoryDonutChart } from './CategoryDonutChart';
import { CashFlowChart } from './CashFlowChart';
import { NetWorthChart } from './NetWorthChart';
import { AccountsSnapshot } from './AccountsSnapshot';
import { RecentTransactions } from './RecentTransactions';

export const DashboardScreen: React.FC = () => {
  const [filteredCategoryId, setFilteredCategoryId] = useState<string | undefined>(undefined);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Monarch Summary Cards Row + Carry-Over */}
      <SummaryRow />

      {/* 2. Charts Grid: Category Donut & Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryDonutChart
          onSelectCategory={(catId) => setFilteredCategoryId(catId || undefined)}
          selectedCategoryId={filteredCategoryId}
        />
        <CashFlowChart />
      </div>

      {/* 3. Net Worth Trend Line Chart */}
      <NetWorthChart />

      {/* 4. Bottom Grid: Accounts Snapshot & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountsSnapshot />
        <RecentTransactions filterCategoryId={filteredCategoryId} />
      </div>
    </div>
  );
};
