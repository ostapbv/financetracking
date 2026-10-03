import { create } from 'zustand';
import type { Account, Category, Transfer, Currency, Transaction } from '../db/types';

export type ActiveScreen =
  | 'dashboard'
  | 'transactions'
  | 'accounts'
  | 'transfers'
  | 'categories'
  | 'currencies'
  | 'settings';

interface UIState {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;

  // Quick Add Modal / Sheet
  isQuickAddOpen: boolean;
  quickAddTab: 'expense' | 'income' | 'transfer';
  quickAddAccountId?: string;
  quickAddCategoryId?: string;
  openQuickAdd: (tab?: 'expense' | 'income' | 'transfer', accountId?: string, categoryId?: string) => void;
  closeQuickAdd: () => void;

  // Account Detail & Modals
  accountDetailId: string | null;
  setAccountDetailId: (id: string | null) => void;
  accountModal: { isOpen: boolean; account?: Account };
  openAccountModal: (account?: Account) => void;
  closeAccountModal: () => void;

  // Category Modals
  categoryModal: { isOpen: boolean; category?: Category; defaultKind?: 'expense' | 'income' };
  openCategoryModal: (category?: Category, defaultKind?: 'expense' | 'income') => void;
  closeCategoryModal: () => void;
  deleteCategoryModal: { isOpen: boolean; category?: Category };
  openDeleteCategoryModal: (category: Category) => void;
  closeDeleteCategoryModal: () => void;

  // Transfer Modal
  transferModal: { isOpen: boolean; transfer?: Transfer };
  openTransferModal: (transfer?: Transfer) => void;
  closeTransferModal: () => void;

  // Transaction Edit Modal
  transactionModal: { isOpen: boolean; transaction?: Transaction };
  openTransactionModal: (transaction: Transaction) => void;
  closeTransactionModal: () => void;

  // Currency & Rate Modals
  currencyModal: { isOpen: boolean; currency?: Currency };
  openCurrencyModal: (currency?: Currency) => void;
  closeCurrencyModal: () => void;
  rateModal: { isOpen: boolean; fromCurrency?: string; toCurrency?: string };
  openRateModal: (from?: string, to?: string) => void;
  closeRateModal: () => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeScreen: 'dashboard',
  setActiveScreen: (screen) => set({ activeScreen: screen, accountDetailId: null }),

  isQuickAddOpen: false,
  quickAddTab: 'expense',
  quickAddAccountId: undefined,
  quickAddCategoryId: undefined,
  openQuickAdd: (tab = 'expense', accountId, categoryId) =>
    set({ isQuickAddOpen: true, quickAddTab: tab, quickAddAccountId: accountId, quickAddCategoryId: categoryId }),
  closeQuickAdd: () => set({ isQuickAddOpen: false }),

  accountDetailId: null,
  setAccountDetailId: (id) => set({ accountDetailId: id }),
  accountModal: { isOpen: false },
  openAccountModal: (account) => set({ accountModal: { isOpen: true, account } }),
  closeAccountModal: () => set({ accountModal: { isOpen: false } }),

  categoryModal: { isOpen: false },
  openCategoryModal: (category, defaultKind = 'expense') =>
    set({ categoryModal: { isOpen: true, category, defaultKind } }),
  closeCategoryModal: () => set({ categoryModal: { isOpen: false } }),
  deleteCategoryModal: { isOpen: false },
  openDeleteCategoryModal: (category) => set({ deleteCategoryModal: { isOpen: true, category } }),
  closeDeleteCategoryModal: () => set({ deleteCategoryModal: { isOpen: false } }),

  transferModal: { isOpen: false },
  openTransferModal: (transfer) => set({ transferModal: { isOpen: true, transfer } }),
  closeTransferModal: () => set({ transferModal: { isOpen: false } }),

  transactionModal: { isOpen: false },
  openTransactionModal: (transaction) => set({ transactionModal: { isOpen: true, transaction } }),
  closeTransactionModal: () => set({ transactionModal: { isOpen: false } }),

  currencyModal: { isOpen: false },
  openCurrencyModal: (currency) => set({ currencyModal: { isOpen: true, currency } }),
  closeCurrencyModal: () => set({ currencyModal: { isOpen: false } }),
  rateModal: { isOpen: false },
  openRateModal: (from, to) => set({ rateModal: { isOpen: true, fromCurrency: from, toCurrency: to } }),
  closeRateModal: () => set({ rateModal: { isOpen: false } }),

  isDarkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.isDarkMode;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDarkMode: next };
    }),
  setDarkMode: (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDarkMode: dark });
  },
}));
