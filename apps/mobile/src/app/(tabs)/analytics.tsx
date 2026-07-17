// apps/mobile/src/app/(tabs)/analytics.tsx
// Tab 2 — İstatistikler: weekly bar chart, app rows, data usage.

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useAnalyticsStore } from '../../features/analytics/store.js';
import { useAppBlockingStore } from '../../features/appBlocking/store.js';
import { StatBar } from '../../ui/components/StatBar.js';
import { tokens } from '../../ui/tokens.js';
import { t } from '../../i18n/index.js';

// ─── Days in TR order ─────────────────────────────────────────────────────────
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

// ─── Analytics Screen ─────────────────────────────────────────────────────────

export default function AnalyticsScreen(): React.JSX.Element {
  const { selectedView, selectedWeekdayIndex, setView, setWeekdayIndex } = useAnalyticsStore();
  const appBlocking = useAppBlockingStore();

  // Mock weekly data — in production comes from SQLite usage_daily
  const weeklyScreenData = useMemo(() =>
    WEEKDAYS.map((_, i) => {
      const total = Object.values(appBlocking.state.todayUsageMin).reduce((a, b) => a + b, 0);
      // Simulated variation per day
      return i === selectedWeekdayIndex ? total : Math.floor(Math.random() * 180);
    }), [selectedWeekdayIndex, appBlocking.state.todayUsageMin]);

  const weeklyDataUsage = useMemo(() =>
    WEEKDAYS.map((_, i) => ({
      wifi: i === selectedWeekdayIndex ? 120 : Math.floor(Math.random() * 500),
      cellular: i === selectedWeekdayIndex ? 40 : Math.floor(Math.random() * 200),
    })), [selectedWeekdayIndex]);

  const maxScreen = Math.max(...weeklyScreenData, 1);
  const maxData = Math.max(...weeklyDataUsage.map((d) => d.wifi + d.cellular), 1);

  // Apps for selected day sorted by descending usage
  const selectedDayApps = useMemo(() => {
    return Object.entries(appBlocking.state.apps)
      .map(([id, app]) => ({
        id,
        name: app.name,
        minutes: appBlocking.state.todayUsageMin[id] ?? 0,
        internetBlocked: app.internetBlocked,
      }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [appBlocking.state.apps, appBlocking.state.todayUsageMin]);

  return (
    <View style={styles.screen}>
      {/* Segmented control */}
      <View style={styles.segmentedControl}>
        {(['SCREEN', 'DATA'] as const).map((view) => (
          <TouchableOpacity
            key={view}
            style={[styles.segment, selectedView === view && styles.segmentActive]}
            onPress={() => { setView(view); }}
            testID={`tab-analytics-${view.toLowerCase()}`}
          >
            <Text
              style={[
                styles.segmentText,
                { color: selectedView === view ? tokens.color.primary : tokens.color.muted },
              ]}
            >
              {view === 'SCREEN' ? t('analytics.screenTime') : t('analytics.dataUsage')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Weekly bar chart */}
        <View style={styles.chartContainer}>
          {WEEKDAYS.map((day, i) => {
            const value = selectedView === 'SCREEN'
              ? (weeklyScreenData[i] ?? 0)
              : ((weeklyDataUsage[i]?.wifi ?? 0) + (weeklyDataUsage[i]?.cellular ?? 0));
            const max = selectedView === 'SCREEN' ? maxScreen : maxData;

            return (
              <StatBar
                key={day}
                day={t(`analytics.days.${day}` as Parameters<typeof t>[0])}
                value={value}
                max={max}
                selected={i === selectedWeekdayIndex}
                onSelect={() => { setWeekdayIndex(i); }}
                testID={`bar-${day}`}
              />
            );
          })}
        </View>

        {/* App rows */}
        {selectedView === 'SCREEN' ? (
          <FlatList
            data={selectedDayApps}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.appRow}>
                <View style={styles.appIcon}>
                  <Text style={styles.appIconText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{item.name}</Text>
                  <Text style={styles.appUsage}>
                    {item.minutes > 0
                      ? `${String(Math.floor(item.minutes / 60))}s ${String(item.minutes % 60)}dk`
                      : '0dk'}
                  </Text>
                </View>
                {/* Limit stepper */}
                <TouchableOpacity
                  style={styles.limitBtn}
                  testID={`btn-limit-${item.id}`}
                >
                  <Text style={styles.limitBtnText}>⏱</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <FlatList
            data={selectedDayApps}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.appRow,
                  item.internetBlocked && { borderLeftWidth: 3, borderLeftColor: tokens.color.danger },
                ]}
              >
                <View style={styles.appIcon}>
                  <Text style={styles.appIconText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{item.name}</Text>
                  <Text style={styles.appUsage}>
                    {t('analytics.dataRow.wifi', { mb: String(120) })} ·{' '}
                    {t('analytics.dataRow.cellular', { mb: String(40) })}
                  </Text>
                  {item.internetBlocked && (
                    <View style={styles.blockedPill}>
                      <Text style={styles.blockedPillText}>
                        {t('analytics.dataRow.internetBlocked')}
                      </Text>
                    </View>
                  )}
                </View>
                {/* Globe toggle */}
                <TouchableOpacity
                  onPress={async () => {
                    await appBlocking.blockInternet(item.id, !item.internetBlocked);
                  }}
                  style={styles.globeBtn}
                  testID={`btn-internet-${item.id}`}
                >
                  <Text style={{ color: item.internetBlocked ? tokens.color.danger : tokens.color.muted }}>
                    🌐
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  segmentedControl: {
    flexDirection: 'row',
    margin: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    alignItems: 'center',
    borderRadius: tokens.radius.sm,
  },
  segmentActive: { backgroundColor: tokens.color.surface2 },
  segmentText: { fontSize: tokens.fontSize.sm, fontWeight: '600' },

  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    marginHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    paddingTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },

  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.surface,
    gap: tokens.spacing.sm,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.color.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIconText: { color: tokens.color.primary, fontWeight: '700', fontSize: tokens.fontSize.base },
  appInfo: { flex: 1, gap: 2 },
  appName: { color: tokens.color.text, fontSize: tokens.fontSize.base, fontWeight: '500' },
  appUsage: { color: tokens.color.muted, fontSize: tokens.fontSize.sm },
  limitBtn: { padding: tokens.spacing.sm },
  limitBtnText: { fontSize: 20 },
  blockedPill: {
    backgroundColor: `${tokens.color.danger}33`,
    borderRadius: 100,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  blockedPillText: { color: tokens.color.danger, fontSize: tokens.fontSize.xs, fontWeight: '700' },
  globeBtn: { padding: tokens.spacing.sm },
});
