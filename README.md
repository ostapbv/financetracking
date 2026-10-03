# Monarch Finance — Personal Finance Tracker (PWA)

A modern, responsive, installable web-based personal finance tracker combining the aesthetic elegance and card-rich dashboards of **Monarch Money** with the functionality of the **Monefy** mobile app.

---

## ✨ Features

- **Local-First & Private:** All data lives in your browser's IndexedDB via Dexie.js. Zero mandatory cloud login.
- **Strict Minor Units:** All financial amounts are stored as integer minor units (e.g. cents) — no floating-point rounding errors.
- **Multiple Accounts:** Grouped by type (Cash, Bank Accounts, Credit Cards, Savings, Other) with 14-day balance trend sparklines and account detail views.
- **Multi-Currency with Dated Exchange Rates:** Main currency selector, automatic "used currencies" derivation, dated exchange rate history, and optional live rate fetcher.
- **Monefy Quick-Add Keypad:** Built-in interactive calculator keypad (digits, ., +, −, ×, ÷, =, backspace) that also accepts physical keyboard inputs.
- **Dual-Currency Transfers:** Linked atomic ledger entries (debit & credit) that keep accounts in sync without inflating income/expense stats.
- **Transactions Management:** Toggle between a flat filterable table and a Monefy-style category grouped view with a **Carry-over balance** row at the top.
- **Monarch-Style Dashboard:**
  - Net Worth, Income, Expense, and Net Savings summary cards with period comparison percentages
  - Carry-over period reconciliation banner
  - Interactive category spending donut chart with center total & legend filtering
  - Cash flow monthly bar chart with net savings line
  - Net worth history area chart with 1M, 3M, 6M, 1Y, and ALL time ranges
  - Accounts snapshot and recent transactions feed
- **Data Export & Import:** Full JSON backup export/restore and CSV spreadsheet export.
- **Installable PWA:** Offline service worker caching and web manifest.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# Clone or navigate to the repository
cd "finance tracking"

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev -- --port 5173
```
Visit [http://localhost:5173/](http://localhost:5173/) in your browser.

### Running Unit & Integration Tests
```bash
npm test
```
Runs the full Vitest suite (40 tests covering money arithmetic, dated currency lookups, account balances, calculator expression parsing, recurring rule generation, Dexie repository operations, and UI flow).

### Production Build & PWA Generation
```bash
npm run build
```
Generates production assets, precaching service workers (`sw.js`), and `manifest.webmanifest`.

---

## 📁 Project Structure

```
finance-tracking/
├── public/                 # PWA icons & manifest
├── src/
│   ├── db/                 # Dexie schema, IFinanceRepository, seed data, & models
│   ├── lib/                # Pure financial math (balances, currency lookup, carry-over, keypad calculator)
│   ├── stores/             # Zustand stores (finance, period filter, UI modals)
│   ├── components/         # Monarch card primitives, Lucide badges, Monefy keypad, layout
│   ├── features/           # Dashboard, Accounts, Categories, Quick-Add, Transfers, Currencies, Settings
│   └── tests/              # Vitest test suite for financial math & ledger rules
├── GEMINI.md               # Context file for agent & development memory
├── package.json
└── vite.config.ts
```

---

## 📄 License
MIT License.
