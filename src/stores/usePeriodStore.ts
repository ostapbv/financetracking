import { create } from 'zustand';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  startOfYear,
  endOfYear,
  addMonths,
  addWeeks,
  addDays,
  addYears,
  format,
} from 'date-fns';
import type { PeriodType, PeriodFilter } from '../db/types';

interface PeriodState {
  periodType: PeriodType;
  referenceDate: Date;
  customStartDate?: string;
  customEndDate?: string;
  selectedAccountId: string; // 'all' or specific account id
  searchQuery: string;

  // Computed / Getter
  getPeriodFilter: () => PeriodFilter;

  // Actions
  setPeriodType: (type: PeriodType) => void;
  nextPeriod: () => void;
  prevPeriod: () => void;
  setReferenceDate: (date: Date) => void;
  setCustomRange: (start: string, end: string) => void;
  setSelectedAccountId: (id: string) => void;
  setSearchQuery: (query: string) => void;
}

function calculateBounds(type: PeriodType, refDate: Date, customStart?: string, customEnd?: string): { start: string; end: string; label: string } {
  const toStr = (d: Date) => format(d, 'yyyy-MM-dd');

  switch (type) {
    case 'day': {
      const s = startOfDay(refDate);
      const e = endOfDay(refDate);
      return { start: toStr(s), end: toStr(e), label: format(refDate, 'MMMM d, yyyy') };
    }
    case 'week': {
      const s = startOfWeek(refDate, { weekStartsOn: 1 });
      const e = endOfWeek(refDate, { weekStartsOn: 1 });
      return {
        start: toStr(s),
        end: toStr(e),
        label: `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`,
      };
    }
    case 'month': {
      const s = startOfMonth(refDate);
      const e = endOfMonth(refDate);
      return { start: toStr(s), end: toStr(e), label: format(refDate, 'MMMM yyyy') };
    }
    case 'year': {
      const s = startOfYear(refDate);
      const e = endOfYear(refDate);
      return { start: toStr(s), end: toStr(e), label: format(refDate, 'yyyy') };
    }
    case 'all': {
      return { start: '1970-01-01', end: '2099-12-31', label: 'All Time' };
    }
    case 'custom': {
      const start = customStart || toStr(startOfMonth(refDate));
      const end = customEnd || toStr(endOfMonth(refDate));
      return { start, end, label: `${start} to ${end}` };
    }
  }
}

export const usePeriodStore = create<PeriodState>((set, get) => ({
  periodType: 'month',
  referenceDate: new Date(),
  selectedAccountId: 'all',
  searchQuery: '',

  getPeriodFilter: () => {
    const { periodType, referenceDate, customStartDate, customEndDate } = get();
    const bounds = calculateBounds(periodType, referenceDate, customStartDate, customEndDate);
    return {
      type: periodType,
      startDate: bounds.start,
      endDate: bounds.end,
      label: bounds.label,
    };
  },

  setPeriodType: (type) => set({ periodType: type }),

  nextPeriod: () => {
    const { periodType, referenceDate } = get();
    let nextDate = referenceDate;
    if (periodType === 'day') nextDate = addDays(referenceDate, 1);
    else if (periodType === 'week') nextDate = addWeeks(referenceDate, 1);
    else if (periodType === 'month') nextDate = addMonths(referenceDate, 1);
    else if (periodType === 'year') nextDate = addYears(referenceDate, 1);
    set({ referenceDate: nextDate });
  },

  prevPeriod: () => {
    const { periodType, referenceDate } = get();
    let prevDate = referenceDate;
    if (periodType === 'day') prevDate = addDays(referenceDate, -1);
    else if (periodType === 'week') prevDate = addWeeks(referenceDate, -1);
    else if (periodType === 'month') prevDate = addMonths(referenceDate, -1);
    else if (periodType === 'year') prevDate = addYears(referenceDate, -1);
    set({ referenceDate: prevDate });
  },

  setReferenceDate: (date) => set({ referenceDate: date }),

  setCustomRange: (start, end) => set({
    periodType: 'custom',
    customStartDate: start,
    customEndDate: end,
  }),

  setSelectedAccountId: (id) => set({ selectedAccountId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
