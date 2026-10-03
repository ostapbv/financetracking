import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../App';
import { useFinanceStore } from '../stores/useFinanceStore';
import { usePeriodStore } from '../stores/usePeriodStore';
import { useUIStore } from '../stores/useUIStore';

describe('Application End-to-End UI Flow', () => {
  beforeEach(async () => {
    await useFinanceStore.getState().resetDatabase();
    await useFinanceStore.getState().loadSampleData();
    usePeriodStore.getState().setPeriodType('all');
    useUIStore.getState().setActiveScreen('dashboard');
  });

  it('renders Monarch dashboard with summary cards and accounts', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Monarch Finance').length).toBeGreaterThan(0);
    });

    // Verify Summary Cards
    expect(screen.getAllByText('Net Worth').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Income').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Expenses').length).toBeGreaterThan(0);
    expect(screen.getByText('Net Savings')).toBeDefined();

    // Verify Dashboard Cards
    expect(screen.getByText('Spending by Category')).toBeDefined();
    expect(screen.getByText('Cash Flow Trend')).toBeDefined();
    expect(screen.getByText('Net Worth History')).toBeDefined();
    expect(screen.getByText('Accounts Snapshot')).toBeDefined();
    expect(screen.getByText('Recent Transactions')).toBeDefined();
  });

  it('opens Quick-Add modal and uses Monefy calculator keypad', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Monarch Finance').length).toBeGreaterThan(0);
    });

    // Trigger quick add
    useUIStore.getState().openQuickAdd('expense');

    await waitFor(() => {
      expect(screen.getByText('Save Expense')).toBeDefined();
    });

    // Check keypad buttons
    expect(screen.getByText('C')).toBeDefined();
    expect(screen.getByText('÷')).toBeDefined();
    expect(screen.getByText('×')).toBeDefined();
    expect(screen.getByText('+')).toBeDefined();
    expect(screen.getByText('−')).toBeDefined();

    // Tap keypad digits: 5, 0, +, 2, 5
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: '0' }));
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '5' }));

    // Verify expression display shows 50 + 25
    expect(screen.getByText('50 + 25')).toBeDefined();

    // Close modal
    useUIStore.getState().closeQuickAdd();
  });

  it('navigates via sidebar to Accounts, Transactions, Transfers, Currencies, and Settings', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Monarch Finance').length).toBeGreaterThan(0);
    });

    // Click Accounts in sidebar
    const accountsNavBtn = screen.getAllByRole('button', { name: /Accounts/i })[0];
    fireEvent.click(accountsNavBtn);

    await waitFor(() => {
      expect(screen.getByText('Total Net Worth (Included Accounts)')).toBeDefined();
    });

    expect(screen.getAllByText('Chase Main Checking').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Marcus High-Yield Savings').length).toBeGreaterThan(0);

    // Click Transactions in sidebar
    const txNavBtn = screen.getAllByRole('button', { name: /Transactions|Activity/i })[0];
    fireEvent.click(txNavBtn);

    await waitFor(() => {
      expect(screen.getByText('Description / Note')).toBeDefined();
    });

    // Click Transfers in UI
    useUIStore.getState().setActiveScreen('transfers');
    await waitFor(() => {
      expect(screen.getByText('New Transfer')).toBeDefined();
    });

    // Click Currencies in UI
    useUIStore.getState().setActiveScreen('currencies');
    await waitFor(() => {
      expect(screen.getByText('Primary Currency')).toBeDefined();
      expect(screen.getByText('Exchange Rate History (Dated)')).toBeDefined();
    });

    // Click Settings in UI
    useUIStore.getState().setActiveScreen('settings');
    await waitFor(() => {
      expect(screen.getByText('Settings & Data Management')).toBeDefined();
      expect(screen.getByText('Backup to JSON')).toBeDefined();
    });
  });
});
