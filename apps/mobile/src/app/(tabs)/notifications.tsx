// apps/mobile/src/app/(tabs)/notifications.tsx
// Tab 3 — Bildirimler: recent activity, restrict, history with date filter.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useNotificationsStore } from '../../features/notifications/store.js';
import { tokens } from '../../ui/tokens.js';
import { t } from '../../i18n/index.js';
import type { NotificationRetention } from '@aegis/schemas';
import { RETENTION_MS } from '@aegis/schemas';

// Mock notification events (replaced by SQLite queries in native builds)
// SIMULATION: In native, query notification_events WHERE received_at >= now-24h AND hidden=0
const MOCK_EVENTS = [
  { id: '1', appId: 'com.instagram.android', appName: 'Instagram', title: 'Yeni mesaj', receivedAt: Date.now() - 1000 * 60 * 30, hidden: false },
  { id: '2', appId: 'com.twitter.android', appName: 'Twitter/X', title: undefined, receivedAt: Date.now() - 1000 * 60 * 90, hidden: false },
  { id: '3', appId: 'com.whatsapp', appName: 'WhatsApp', title: 'Arama cevapsız', receivedAt: Date.now() - 1000 * 60 * 180, hidden: false },
];

type Tab = 'activity' | 'restrict' | 'history';

export default function NotificationsScreen(): React.JSX.Element {
  const notifications = useNotificationsStore();
  const [activeTab, setActiveTab] = useState<Tab>('activity');

  const visibleEvents = useMemo(() =>
    MOCK_EVENTS.filter(
      (e) => !notifications.state.silenced[e.appId] && !e.hidden,
    ), [notifications.state.silenced]);

  return (
    <View style={styles.screen}>
      {/* Sub-tabs */}
      <View style={styles.subTabs}>
        {([
          ['activity', t('notifications.recentActivity')],
          ['restrict', t('notifications.restrict')],
          ['history', t('notifications.history')],
        ] as [Tab, string][]).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.subTab, activeTab === key && styles.subTabActive]}
            onPress={() => { setActiveTab(key); }}
            testID={`tab-notif-${key}`}
          >
            <Text
              style={[
                styles.subTabText,
                { color: activeTab === key ? tokens.color.primary : tokens.color.muted },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* ─── Recent Activity ─── */}
        {activeTab === 'activity' && (
          <>
            {visibleEvents.length === 0 ? (
              <EmptyState text="Son 24 saatte bildirim yok" />
            ) : (
              <FlatList
                data={visibleEvents}
                keyExtractor={(e) => e.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.eventRow}>
                    <View style={styles.eventIcon}>
                      <Text style={styles.eventIconText}>{item.appName.charAt(0)}</Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventApp}>{item.appName}</Text>
                      {item.title && <Text style={styles.eventTitle}>{item.title}</Text>}
                      <Text style={styles.eventTime}>
                        {formatRelativeTime(item.receivedAt)}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </>
        )}

        {/* ─── Restrict Notifications ─── */}
        {activeTab === 'restrict' && (
          <View style={styles.restrictList}>
            {MOCK_EVENTS.map((ev) => {
              const silenced = notifications.state.silenced[ev.appId] ?? false;
              return (
                <View key={ev.appId} style={styles.restrictRow}>
                  <View style={styles.eventIcon}>
                    <Text style={styles.eventIconText}>{ev.appName.charAt(0)}</Text>
                  </View>
                  <Text style={styles.restrictAppName}>{ev.appName}</Text>
                  <TouchableOpacity
                    style={[styles.silenceBtn, silenced && styles.silenceBtnActive]}
                    onPress={async () => {
                      await notifications.silenceApp(ev.appId, !silenced);
                    }}
                    testID={`btn-silence-${ev.appId}`}
                  >
                    <Text style={styles.silenceBtnText}>
                      {silenced ? t('notifications.silenced') : 'Sessiz Al'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* ─── History ─── */}
        {activeTab === 'history' && (
          <View style={styles.historySection}>
            {/* Retention selector */}
            <Text style={styles.sectionLabel}>{t('notifications.retention.label')}</Text>
            <View style={styles.retentionOptions}>
              {(['P15D', 'P1M', 'P3M', 'P6M', 'P1Y'] as NotificationRetention[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.retentionOption,
                    notifications.state.retention === r && styles.retentionOptionActive,
                  ]}
                  onPress={async () => { await notifications.updateRetention(r); }}
                  testID={`btn-retention-${r}`}
                >
                  <Text
                    style={[
                      styles.retentionText,
                      {
                        color: notifications.state.retention === r
                          ? tokens.color.primary
                          : tokens.color.muted,
                      },
                    ]}
                  >
                    {t(`notifications.retention.${r}` as Parameters<typeof t>[0])}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date filter */}
            <Text style={styles.sectionLabel} style={{ color: tokens.color.muted, marginTop: tokens.spacing.md }}>
              {t('notifications.filterFrom')} / {t('notifications.filterTo')}
            </Text>
            <Text style={[styles.sectionLabel, { color: tokens.color.muted, fontSize: tokens.fontSize.xs }]}>
              {/* TODO(ui): Replace with react-native-calendars date picker */}
              SIMULATION: Date picker not available in Expo Go preview
            </Text>

            {/* History grid */}
            <FlatList
              data={visibleEvents}
              keyExtractor={(e) => e.id}
              scrollEnabled={false}
              numColumns={1}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <View style={styles.eventIcon}>
                    <Text style={styles.eventIconText}>{item.appName.charAt(0)}</Text>
                  </View>
                  <View style={styles.historyItemInfo}>
                    <Text style={styles.eventApp}>{item.appName}</Text>
                    <Text style={styles.eventTime}>
                      {new Date(item.receivedAt).toLocaleDateString('tr-TR')}
                      {' · '}
                      {new Date(item.receivedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(epochMs: number): string {
  const diffMin = Math.floor((Date.now() - epochMs) / 60_000);
  if (diffMin < 1) return 'Az önce';
  if (diffMin < 60) return `${String(diffMin)} dk önce`;
  return `${String(Math.floor(diffMin / 60))} sa önce`;
}

function EmptyState({ text }: { text: string }): React.JSX.Element {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { flex: 1 },

  subTabs: {
    flexDirection: 'row',
    backgroundColor: tokens.color.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.surface2,
  },
  subTab: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: { borderBottomColor: tokens.color.primary },
  subTabText: { fontSize: tokens.fontSize.sm, fontWeight: '600' },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.surface,
    gap: tokens.spacing.sm,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.color.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventIconText: { color: tokens.color.primary, fontWeight: '700', fontSize: tokens.fontSize.base },
  eventInfo: { flex: 1, gap: 2 },
  eventApp: { color: tokens.color.text, fontSize: tokens.fontSize.base, fontWeight: '600' },
  eventTitle: { color: tokens.color.muted, fontSize: tokens.fontSize.sm },
  eventTime: { color: tokens.color.muted, fontSize: tokens.fontSize.xs },

  restrictList: { padding: tokens.spacing.md, gap: tokens.spacing.sm },
  restrictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.md,
    gap: tokens.spacing.sm,
  },
  restrictAppName: { flex: 1, color: tokens.color.text, fontSize: tokens.fontSize.base },
  silenceBtn: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: 100,
    backgroundColor: tokens.color.surface2,
  },
  silenceBtnActive: { backgroundColor: `${tokens.color.warning}33` },
  silenceBtnText: { color: tokens.color.text, fontSize: tokens.fontSize.sm, fontWeight: '600' },

  historySection: { padding: tokens.spacing.md, gap: tokens.spacing.sm },
  sectionLabel: { color: tokens.color.muted, fontSize: tokens.fontSize.sm, fontWeight: '600' },
  retentionOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs },
  retentionOption: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: 100,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  retentionOptionActive: { borderColor: tokens.color.primary },
  retentionText: { fontSize: tokens.fontSize.sm },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.sm,
    gap: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.surface,
  },
  historyItemInfo: { flex: 1 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: tokens.spacing['2xl'] },
  emptyText: { color: tokens.color.muted, fontSize: tokens.fontSize.base, textAlign: 'center' },
});
