// apps/mobile/src/features/analytics/store.ts
// Zustand slice for analytics view state (tab selection, weekday selection).

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AnalyticsView } from '@aegis/schemas';

type AnalyticsStore = {
  selectedView: AnalyticsView;
  selectedWeekdayIndex: number; // 0=Mon…6=Sun
  setView(view: AnalyticsView): void;
  setWeekdayIndex(index: number): void;
};

export const useAnalyticsStore = create<AnalyticsStore>()(
  immer((set) => ({
    selectedView: 'SCREEN',
    selectedWeekdayIndex: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,

    setView(view) {
      set((s) => { s.selectedView = view; });
    },

    setWeekdayIndex(index) {
      if (index < 0 || index > 6) return;
      set((s) => { s.selectedWeekdayIndex = index; });
    },
  })),
);
