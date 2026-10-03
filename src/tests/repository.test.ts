import { describe, it, expect, beforeEach } from 'vitest';
import { FinanceDatabase } from '../db/schema';
import { DexieFinanceRepository } from '../db/repository';

describe('DexieFinanceRepository Database & Ledger Operations', () => {
  let testDb: FinanceDatabase;
  let repo: DexieFinanceRepository;

  beforeEach(async () => {
    // Unique in-memory database instance per test
    testDb = new FinanceDatabase(`TestFinanceDB_${Date.now()}_${Math.random()}`);
    repo = new DexieFinanceRepository(testDb);
    await repo.initializeDefaultDataIfNeeded();
  });

  it('initializes default categories and currencies', async () => {
    const currencies = await repo.getCurrencies();
    expect(currencies.length).toBeGreaterThanOrEqual(4);
    expect(currencies.some((c) => c.code === 'USD')).toBe(true);
    expect(currencies.some((c) => c.code === 'EUR')).toBe(true);

    const categories = await repo.getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(10);
    expect(categories.some((c) => c.name === 'Food')).toBe(true);
    expect(categories.some((c) => c.name === 'Salary')).toBe(true);
  });

  it('performs account CRUD operations', async () => {
    const account = await repo.createAccount({
      name: 'Test Wallet',
      type: 'cash',
      icon: 'Wallet',
      color: '#10B981',
      currency: 'USD',
      initialBalanceMinor: 5000,
      initialBalanceDate: '2026-01-01',
      includeInTotal: true,
      archived: false,
      order: 1,
    });

    expect(account.id).toBeDefined();

    const fetched = await repo.getAccountById(account.id);
    expect(fetched?.name).toBe('Test Wallet');
    expect(fetched?.initialBalanceMinor).toBe(5000);

    const updated = await repo.updateAccount(account.id, { name: 'My Primary Wallet' });
    expect(updated.name).toBe('My Primary Wallet');

    await repo.deleteAccount(account.id);
    const deleted = await repo.getAccountById(account.id);
    expect(deleted).toBeUndefined();
  });

  it('creates transfers with linked dual-ledger entries atomically', async () => {
    const checking = await repo.createAccount({
      name: 'Checking',
      type: 'bank',
      icon: 'Landmark',
      color: '#3B82F6',
      currency: 'USD',
      initialBalanceMinor: 100000, // $1,000.00
      initialBalanceDate: '2026-01-01',
      includeInTotal: true,
      archived: false,
      order: 1,
    });

    const savings = await repo.createAccount({
      name: 'Savings',
      type: 'savings',
      icon: 'PiggyBank',
      color: '#10B981',
      currency: 'USD',
      initialBalanceMinor: 50000, // $500.00
      initialBalanceDate: '2026-01-01',
      includeInTotal: true,
      archived: false,
      order: 2,
    });

    // Transfer $200 from checking to savings
    const transfer = await repo.createTransfer({
      fromAccountId: checking.id,
      toAccountId: savings.id,
      amountFromMinor: 20000,
      amountToMinor: 20000,
      rate: 1.0,
      date: '2026-02-15',
      note: 'Emergency fund boost',
    });

    expect(transfer.id).toBeDefined();

    // Verify linked transactions exist
    const txOut = await repo.getTransactionById(transfer.fromTransactionId);
    const txIn = await repo.getTransactionById(transfer.toTransactionId);

    expect(txOut).toBeDefined();
    expect(txOut?.accountId).toBe(checking.id);
    expect(txOut?.kind).toBe('expense');
    expect(txOut?.amountMinor).toBe(20000);
    expect(txOut?.transferId).toBe(transfer.id);

    expect(txIn).toBeDefined();
    expect(txIn?.accountId).toBe(savings.id);
    expect(txIn?.kind).toBe('income');
    expect(txIn?.amountMinor).toBe(20000);
    expect(txIn?.transferId).toBe(transfer.id);

    // Update transfer amount to $250
    await repo.updateTransfer(transfer.id, {
      amountFromMinor: 25000,
      amountToMinor: 25000,
    });

    const updatedTxOut = await repo.getTransactionById(transfer.fromTransactionId);
    const updatedTxIn = await repo.getTransactionById(transfer.toTransactionId);
    expect(updatedTxOut?.amountMinor).toBe(25000);
    expect(updatedTxIn?.amountMinor).toBe(25000);

    // Delete transfer and verify both ledger entries are purged
    await repo.deleteTransfer(transfer.id);
    expect(await repo.getTransferById(transfer.id)).toBeUndefined();
    expect(await repo.getTransactionById(transfer.fromTransactionId)).toBeUndefined();
    expect(await repo.getTransactionById(transfer.toTransactionId)).toBeUndefined();
  });

  it('reassigns transactions when deleting a category', async () => {
    const catOld = await repo.createCategory({
      name: 'Old Category',
      icon: 'Tag',
      color: '#888888',
      kind: 'expense',
      order: 99,
      archived: false,
    });

    const catNew = await repo.createCategory({
      name: 'New Category',
      icon: 'Tag',
      color: '#999999',
      kind: 'expense',
      order: 100,
      archived: false,
    });

    const tx = await repo.createTransaction({
      accountId: 'acc-1',
      categoryId: catOld.id,
      kind: 'expense',
      amountMinor: 1500,
      date: '2026-03-01',
    });

    expect(tx.categoryId).toBe(catOld.id);

    // Delete catOld and reassign to catNew
    await repo.deleteCategory(catOld.id, catNew.id);

    const reloadedTx = await repo.getTransactionById(tx.id);
    expect(reloadedTx?.categoryId).toBe(catNew.id);
    expect(await repo.getCategoryById(catOld.id)).toBeUndefined();
  });

  it('supports full data export and import', async () => {
    await repo.loadSampleData();
    const exportData = await repo.exportAllData();

    expect(exportData.accounts.length).toBeGreaterThan(0);
    expect(exportData.transactions.length).toBeGreaterThan(0);
    expect(exportData.transfers.length).toBeGreaterThan(0);

    // Reset database
    await repo.resetDatabase();
    const emptyAccounts = await repo.getAccounts();
    expect(emptyAccounts.length).toBe(0);

    // Import back
    await repo.importAllData(exportData);
    const restoredAccounts = await repo.getAccounts();
    expect(restoredAccounts.length).toBe(exportData.accounts.length);
  });
});
