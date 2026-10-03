import 'fake-indexeddb/auto';
import React from 'react';
import { vi } from 'vitest';

// Mock Recharts ResponsiveContainer for jsdom environment
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<Record<string, any>>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { style: { width: 800, height: 400 } }, children),
  };
});
