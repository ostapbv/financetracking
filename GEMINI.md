# GEMINI.md: Personal Finance Tracker Context & Architecture Reference

> **Project:** Modern, local-first web-based personal finance tracker (Installable PWA)  
> **Aesthetic Inspiration:** Monarch Money (calm, card-based, data-rich dashboards, warm amber accents, tabular numerals, generous whitespace)  
> **Functional Architecture:** Monefy (multiple accounts, cross-currency transfers, category badges, quick-add calculator keypad, period carry-over reconciliation)  
> **Privacy / Storage:** 100% Local-first in-browser IndexedDB (Dexie.js), JSON export/import backup, no mandatory cloud login in v1, architected behind repository interfaces for future sync.

---

## 1. Tech Stack & Key Libraries

- **Framework:** React 19 + TypeScript (ES2023)
- **Bundler & Build Tool:** Vite 8 (`@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-plugin-pwa`)
- **Styling:** Tailwind CSS v4 with custom design tokens in `src/index.css`
- **Iconography:** `lucide-react` with dynamic badge rendering & categorized icon picker
- **Database & Local Persistence:** `dexie` (v4) with IndexedDB compound indexes
- **State Management:** `zustand` (stores for finance data, period navigation, and UI modals)
- **Data Visualizations:** `recharts` (Category Donut, Cash Flow Bar Chart with Net line, Net Worth Area Trend, and Account Detail History)
- **Date Handling:** `date-fns` (lightweight, tree-shakeable)
- **Unit & Integration Testing:** `vitest` + `fake-indexeddb` + `@testing-library/react` + `jsdom`

---

## 2. Critical Rule: Integer Minor Units for Money

> [!IMPORTANT]
> **Floating-point numbers are strictly forbidden for storing currency amounts.**  
> All money values must be stored as **integer minor units** (e.g. cents).  
> Examples:
> - `$1.00` = `100` minor units (precision 2)
> - `$12.50` = `1250` minor units (precision 2)
> - `¥100` = `100` minor units (precision 0)
> - `1.250 OMR` = `1250` minor units (precision 3)
>
> Conversion helpers live in [`src/lib/money.ts`](file:///c:/Users/Ost/Documents/finance%20tracking/src/lib/money.ts):
> - `toMinorUnits(amountMajor, precision)`
> - `toMajorUnits(amountMinor, precision)`
> - `formatMoney(amountMinor, currencyCode, currenciesMap)`

---

## 3. Data Schema & Core Models

All TypeScript definitions reside in [`src/db/types.ts`](file:///c:/Users/Ost/Documents/finance%20tracking/src/db/types.ts):

### `Account`
```typescript
export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'savings' | 'other';
  icon: string;                 // Lucide icon name (e.g. 'Landmark', 'CreditCard')
  color: string;                // Hex color code (e.g. '#3B82F6')
  currency: string;             // ISO 4217 (e.g. 'USD', 'EUR')
  initialBalanceMinor: number;  // Negative allowed for credit cards
  initialBalanceDate: string;   // 'YYYY-MM-DD'
  includeInTotal: boolean;      // Toggle inclusion in net worth / dashboard
  archived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

### `Category`
```typescript
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: 'expense' | 'income';
  order: number;
  archived: boolean;
}
```

### `Transaction`
```typescript
export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  kind: 'expense' | 'income';
  amountMinor: number;          // Strictly positive integer minor units
  note?: string;
  date: string;                 // 'YYYY-MM-DD'
  recurringRuleId?: string;
  transferId?: string;          // Linked transfer ID if part of a transfer pair
  createdAt: string;
  updatedAt: string;
}
```

### `Transfer`
```typescript
export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amountFromMinor: number;      // In fromAccount's currency minor units
  amountToMinor: number;        // In toAccount's currency minor units
  rate: number;                 // Implied exchange rate (amountTo / amountFrom)
  note?: string;
  date: string;                 // 'YYYY-MM-DD'
  fromTransactionId: string;    // Atomic outflow ledger entry
  toTransactionId: string;      // Atomic inflow ledger entry
  createdAt: string;
  updatedAt: string;
}
```

### `Currency` & `ExchangeRate`
```typescript
export interface Currency {
  code: string;                 // e.g. 'USD', 'EUR', 'PLN', 'UAH'
  name: string;                 // 'US Dollar'
  symbol: string;               // '$'
  precision: number;            // 0, 2, 3 decimals
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;                 // Multiplier: 1 fromCurrency = rate toCurrency
  effectiveDate: string;        // 'YYYY-MM-DD' (dated history)
}
```

### `AppSettings`
```typescript
export interface AppSettings {
  id: string;
  mainCurrency: string;         // 'USD'
  firstDayOfWeek: 0 | 1;        // 0 = Sunday, 1 = Monday
  theme: 'system' | 'light' | 'dark';
  dateFormat: string;           // 'yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy'
  hasSampleDataLoaded: boolean;
  updatedAt: string;
}
```

---

## 4. Key Financial Business Logic

1. **Account Balances ([`src/lib/balances.ts`](file:///c:/Users/Ost/Documents/finance%20tracking/src/lib/balances.ts)):**
   $$\text{Balance} = \text{InitialBalance} + \sum \text{Income} - \sum \text{Expenses}$$
   *(Transfers create linked debit & credit transactions, keeping account balances updated automatically while excluded from income/expense cash-flow totals).*

2. **Carry-Over Balance:**
   Represents all net savings accumulated prior to `period.startDate`. Displayed prominently in the Monefy-style grouped view and summary banner so period net reconciles with total net worth.

3. **Dated Exchange Rate Lookup ([`src/lib/currency.ts`](file:///c:/Users/Ost/Documents/finance%20tracking/src/lib/currency.ts)):**
   - Finds the most recent rate where `effectiveDate <= transaction.date`.
   - Checks inverse rate ($1 / R$) if only the reverse pair exists.
   - Triangulates through USD if converting between two secondary currencies (e.g. UAH $\to$ USD $\to$ EUR).

4. **Calculator Keypad ([`src/lib/calculator.ts`](file:///c:/Users/Ost/Documents/finance%20tracking/src/lib/calculator.ts)):**
   - Pure arithmetic parser respecting precedence ($\times, \div$ before $+,-$).
   - Normalizes Unicode operators ($\times, \div, −$).
   - Tolerates trailing operators gracefully (e.g. `"15.00 + "` evaluates to `15.00`).
   - Supports physical computer keyboard keystrokes.

---

## 5. Directory & File Structure

```
finance-tracking/
├── public/
│   ├── favicon.svg             # Amber 'M' geometric brand icon
│   └── manifest.webmanifest    # Standalone PWA manifest
├── src/
│   ├── db/
│   │   ├── types.ts            # Domain TypeScript models
│   │   ├── schema.ts           # Dexie database class & table stores
│   │   ├── repository.ts       # IFinanceRepository & DexieFinanceRepository
│   │   └── seed-data.ts        # Seed currencies, categories, & demo accounts/transactions
│   ├── lib/
│   │   ├── money.ts            # Minor-unit arithmetic & formatting
│   │   ├── currency.ts         # Multi-currency converter with dated rates
│   │   ├── balances.ts         # Balances, net worth, carry-over, cash flow
│   │   ├── calculator.ts       # Monefy keypad parser & state helpers
│   │   ├── recurring.ts        # Recurrence generator (daily, weekly, monthly, yearly)
│   │   └── export-import.ts    # JSON and CSV export/import utilities
│   ├── stores/
│   │   ├── useFinanceStore.ts  # Central reactive data store with Dexie sync
│   │   ├── usePeriodStore.ts   # Global period (Month/Week/Day/Year/Custom) & account filter
│   │   └── useUIStore.ts       # Active screen, modals, and theme
│   ├── components/
│   │   ├── layout/             # Sidebar, TopBar, BottomBar, Layout shell
│   │   ├── common/             # IconRenderer, IconPicker, ColorPicker, Modal, Sparkline, EmptyState
│   │   └── keypad/             # CalculatorKeypad with keyboard listener
│   ├── features/
│   │   ├── dashboard/          # SummaryRow, CategoryDonutChart, CashFlowChart, NetWorthChart, AccountsSnapshot, RecentTransactions
│   │   ├── accounts/           # AccountsScreen, AccountCard, AccountModal, AccountDetailView
│   │   ├── categories/         # CategoriesScreen, CategoryModal, DeleteCategoryModal (reassign/archive)
│   │   ├── quick-add/          # QuickAddModal with keypad, Expense/Income/Transfer tabs, and recurring toggle
│   │   ├── transfers/          # TransfersScreen, TransferModal (dual-currency conversion)
│   │   ├── currencies/         # CurrenciesScreen, CurrencyModal, RateModal, live rate sync
│   │   └── settings/           # SettingsScreen (backup export/import, CSV, theme, reset data)
│   ├── tests/
│   │   ├── setup.ts            # Fake-indexeddb & Recharts jsdom mocks
│   │   ├── money.test.ts       # Formatting & minor-unit arithmetic tests
│   │   ├── currency.test.ts    # Dated rate lookup & conversion tests
│   │   ├── balances.test.ts    # Balance, transfer, carry-over, net worth tests
│   │   ├── calculator.test.ts  # Keypad precedence & parsing tests
│   │   ├── recurring.test.ts   # Recurrence date generation tests
│   │   ├── repository.test.ts  # Dexie repository & atomic ledger tests
│   │   └── ui-flow.test.tsx    # End-to-end component & flow tests
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css               # Tailwind CSS v4 design tokens & base rules
├── vite.config.ts              # Vite + Tailwind + VitePWA + Vitest config
├── tsconfig.json
└── package.json
```

---

## 6. Development & Testing Commands

```bash
# Start local Vite development server
npm run dev -- --port 5173

# Run all 40 Vitest unit & integration tests
npm test

# Build production bundle & generate PWA service worker
npm run build
```

---

## 7. Current Project Status

- **Step 1 (Data Layer & Math):** Completed & 100% passing tests.
- **Step 2 (Currencies & Accounts):** Completed with dated exchange rates, grouped account cards, and 14-day sparklines.
- **Step 3 (Categories):** Completed with icon picker, colors, drag reordering, and reassign-on-delete safety.
- **Step 4 (Quick-Add & Keypad):** Completed with Monefy calculator keypad, keyboard support, and recurring transactions.
- **Step 5 (Transfers):** Completed with cross-currency calculation and atomic paired transactions.
- **Step 6 (Transactions List):** Completed with Flat Table $\leftrightarrow$ Monefy Grouped Categories toggle and bulk actions.
- **Step 7 (Dashboard):** Completed with summary row, carry-over banner, category donut, cash flow trend, net worth history, and accounts snapshot.
- **Step 8 (Settings & Export):** Completed with JSON backup/restore, CSV export, and theme switcher.
- **Step 9 (PWA):** Completed with web manifest and service worker precaching.

---

## 8. Phase 2 Future Roadmap (Post-v1)

- Monthly category budgets with progress bars and rollover.
- Dedicated savings goals with target dates.
- Transaction tags for multi-dimensional tracking (e.g. `#vacation`, `#business`).
- Sankey-style income $\to$ expenses cash flow diagram.
- Automatic merchant categorization rules.
- CSV bank-statement importer with duplicate transaction detection.
- Optional cloud sync backend adapter (e.g. Supabase) swapping in via `IFinanceRepository`.
