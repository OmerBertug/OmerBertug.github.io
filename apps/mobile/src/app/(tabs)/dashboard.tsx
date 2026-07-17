// apps/mobile/src/app/(tabs)/dashboard.tsx
// Tab 1 — Kontrol Paneli: App Protection + App/Group Blocking + Website Blocker

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useProtectionStore } from '../../features/protection/store.js';
import { useWebsiteBlockerStore } from '../../features/websiteBlocker/store.js';
import { useAppBlockingStore } from '../../features/appBlocking/store.js';
import { LockedToggle } from '../../ui/components/LockedToggle.js';
import { TimeWindowPicker } from '../../ui/components/TimeWindowPicker.js';
import { tokens } from '../../ui/tokens.js';
import { t } from '../../i18n/index.js';
import { trustedNow } from '../../core/time/trustedNow.js';
import { isInMaintenanceWindow } from '../../core/time/maintenanceWindow.js';
import { epochToMinuteOfDay } from '@aegis/domain';
import type { TrustedTime } from '../../core/time/trustedNow.js';
import type { DomainError } from '@aegis/domain';
import { SHORT_VIDEO_PLATFORMS } from '@aegis/schemas';

// ─── Trusted time hook ────────────────────────────────────────────────────────

function useTrustedTime(): { trusted: TrustedTime | null; minuteOfDay: number } {
  const [trusted, setTrusted] = useState<TrustedTime | null>(null);

  useEffect(() => {
    let alive = true;
    const refresh = async (): Promise<void> => {
      const result = await trustedNow();
      if (alive && result.ok) setTrusted(result.value);
    };
    void refresh();
    const interval = setInterval(() => { void refresh(); }, 60_000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const minuteOfDay = trusted
    ? epochToMinuteOfDay(trusted.epochMs, Intl.DateTimeFormat().resolvedOptions().timeZone)
    : 0;

  return { trusted, minuteOfDay };
}

// ─── Toast helper ─────────────────────────────────────────────────────────────

function showError(error: DomainError): void {
  Alert.alert('', t(`errors.${error.code}` as Parameters<typeof t>[0]) ?? error.message);
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

export default function DashboardScreen(): React.JSX.Element {
  const protection = useProtectionStore();
  const websiteBlocker = useWebsiteBlockerStore();
  const appBlocking = useAppBlockingStore();
  const { trusted, minuteOfDay } = useTrustedTime();

  // Hydrate stores on mount
  useEffect(() => {
    if (!trusted) return;
    void protection.hydrate(trusted.epochMs);
    void websiteBlocker.hydrate(trusted.epochMs);
    void appBlocking.hydrate(trusted.epochMs);
  }, [trusted?.epochMs]);

  // Compute lock states
  const immutableLocked =
    protection.state.immutableMode &&
    trusted !== null &&
    !isInMaintenanceWindow(protection.state.immutableWindow, trusted);

  const tamperLocked =
    protection.state.tamperProtection &&
    trusted !== null &&
    !isInMaintenanceWindow(protection.state.uninstallWindow, trusted);

  const confidence = trusted?.confidence ?? 'low';
  const ctx = trusted ? { trusted, minuteOfDay } : null;

  // ─── New site input state ────────────────────────────────────────────────────
  const [siteInput, setSiteInput] = useState('');
  const [siteError, setSiteError] = useState<string | null>(null);

  const handleAddSite = useCallback(async () => {
    setSiteError(null);
    const result = await websiteBlocker.addHost(siteInput);
    if (result.ok) {
      setSiteInput('');
    } else {
      setSiteError(result.error.message);
    }
  }, [siteInput, websiteBlocker]);

  if (!protection.hydrated || !trusted) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={tokens.color.primary} size="large" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ──────────────────────────── APP PROTECTION ─────────────────────────── */}
      <SectionCard title={t('protection.title')}>
        {/* Immutable Mode */}
        <SettingRow
          label={t('protection.immutableMode')}
          description={t('protection.immutableModeDesc')}
        >
          <LockedToggle
            value={protection.state.immutableMode}
            locked={immutableLocked}
            onValueChange={async (v) => {
              if (!ctx) return;
              const r = await protection.toggleImmutableMode(v, ctx);
              if (!r.ok) showError(r.error);
            }}
            onAttemptWhileLocked={() => Alert.alert('', t('protection.lockedHint'))}
            testID="toggle-immutable-mode"
          />
        </SettingRow>

        {/* Immutable Window — also locked by immutableLocked */}
        <View style={styles.subItem}>
          <Text style={styles.subLabel}>
            {t('protection.immutableWindow')} {t('protection.windowSuffix')}
          </Text>
          <TimeWindowPicker
            window={protection.state.immutableWindow}
            onChange={async (w) => {
              if (!ctx) return;
              const r = await protection.setImmutableWindow(w, ctx);
              if (!r.ok) showError(r.error);
            }}
            locked={immutableLocked}
            testID="picker-immutable-window"
          />
        </View>

        <View style={styles.divider} />

        {/* Protected Access */}
        <SettingRow
          label={t('protection.protectedAccess')}
          description={t('protection.protectedAccessDesc')}
        >
          <LockedToggle
            value={protection.state.protectedAccess}
            locked={immutableLocked}
            onValueChange={async (v) => {
              if (!ctx) return;
              const r = await protection.toggleProtectedAccess(v, ctx);
              if (!r.ok) showError(r.error);
            }}
            onAttemptWhileLocked={() => Alert.alert('', t('protection.lockedHint'))}
            testID="toggle-protected-access"
          />
        </SettingRow>

        <View style={styles.divider} />

        {/* Tamper Protection */}
        <SettingRow
          label={t('protection.tamperProtection')}
          description={t('protection.tamperProtectionDesc')}
        >
          <LockedToggle
            value={protection.state.tamperProtection}
            locked={tamperLocked}
            onValueChange={async (v) => {
              if (!ctx) return;
              const r = await protection.toggleTamperProtection(v, ctx);
              if (!r.ok) showError(r.error);
            }}
            onAttemptWhileLocked={() => Alert.alert('', t('protection.lockedHint'))}
            testID="toggle-tamper-protection"
          />
        </SettingRow>

        {/* Uninstall Window */}
        <View style={styles.subItem}>
          <Text style={styles.subLabel}>
            {t('protection.uninstallWindow')} {t('protection.windowSuffix')}
          </Text>
          <TimeWindowPicker
            window={protection.state.uninstallWindow}
            onChange={async (w) => {
              if (!ctx) return;
              const r = await protection.setUninstallWindow(w, ctx);
              if (!r.ok) showError(r.error);
            }}
            locked={tamperLocked}
            testID="picker-uninstall-window"
          />
        </View>

        {/* Clock confidence badge */}
        {confidence === 'low' && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠ {t('errors.E_CLOCK_LOW_CONFIDENCE')}</Text>
          </View>
        )}
      </SectionCard>

      {/* ────────────────────────── SHORT VIDEO BLOCKER ───────────────────────── */}
      <SectionCard title={t('appBlocking.shortVideoTitle')}>
        {SHORT_VIDEO_PLATFORMS.map((platform) => {
          const checked = appBlocking.state.shortVideo.checked[platform] ?? false;
          const usedMin = appBlocking.state.shortVideoUsageToday[platform] ?? 0;
          const limit = appBlocking.state.shortVideo.universalLimitMin;
          const isBlocked = usedMin >= limit && checked;

          return (
            <View key={platform} style={styles.platformRow}>
              <View style={styles.platformLeft}>
                <LockedToggle
                  value={checked}
                  locked={false}
                  onValueChange={async (v) => {
                    const r = await appBlocking.updateShortVideoConfig(
                      { checked: { ...appBlocking.state.shortVideo.checked, [platform]: v } },
                      immutableLocked,
                    );
                    if (!r.ok) showError(r.error);
                  }}
                  testID={`toggle-sv-${platform}`}
                />
                <Text style={styles.platformName}>
                  {t(`appBlocking.platforms.${platform}` as Parameters<typeof t>[0])}
                </Text>
              </View>
              <View style={styles.platformRight}>
                <Text style={styles.platformUsage}>
                  {t('appBlocking.usedOf', { used: String(usedMin), limit: String(limit) })}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: isBlocked ? tokens.color.danger : tokens.color.success },
                  ]}
                >
                  <Text style={styles.statusPillText}>
                    {isBlocked ? t('appBlocking.statusBlocked') : t('appBlocking.statusAccessible')}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </SectionCard>

      {/* ─────────────────────────── WEBSITE BLOCKER ─────────────────────────── */}
      <SectionCard title={t('websiteBlocker.title')}>
        <SettingRow
          label={t('websiteBlocker.nsfwFilter')}
          description={t('websiteBlocker.nsfwFilterDesc')}
        >
          <LockedToggle
            value={websiteBlocker.state.nsfwFilterEnabled}
            locked={immutableLocked}
            onValueChange={async (v) => {
              const r = await websiteBlocker.toggleNsfw(v, immutableLocked);
              if (!r.ok) showError(r.error);
            }}
            onAttemptWhileLocked={() => Alert.alert('', t('protection.lockedHint'))}
            testID="toggle-nsfw"
          />
        </SettingRow>

        <View style={styles.divider} />

        {/* Custom blacklist input */}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.textInput, siteError ? styles.textInputError : null]}
            value={siteInput}
            onChangeText={setSiteInput}
            placeholder={t('websiteBlocker.sitePlaceholder')}
            placeholderTextColor={tokens.color.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={handleAddSite}
            testID="input-add-site"
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddSite}
            testID="btn-add-site"
          >
            <Text style={styles.addButtonText}>{t('websiteBlocker.addSite')}</Text>
          </TouchableOpacity>
        </View>

        {siteError && <Text style={styles.errorText}>{siteError}</Text>}

        {/* Blacklist — virtualized */}
        <FlatList
          data={websiteBlocker.state.customBlacklist}
          keyExtractor={(item) => item}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.blacklistRow}>
              <Text style={styles.blacklistHost}>{item}</Text>
              <TouchableOpacity
                onPress={async () => {
                  const r = await websiteBlocker.removeHost(item, immutableLocked);
                  if (!r.ok) showError(r.error);
                }}
                testID={`btn-remove-${item}`}
              >
                <Text style={styles.deleteText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </SectionCard>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.bg },
  content: { padding: tokens.spacing.md, gap: tokens.spacing.md, paddingBottom: tokens.spacing['2xl'] },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.color.bg, gap: tokens.spacing.md },
  loadingText: { color: tokens.color.muted, fontSize: tokens.fontSize.base },

  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  cardTitle: {
    color: tokens.color.text,
    fontSize: tokens.fontSize.lg,
    fontWeight: '700',
    marginBottom: tokens.spacing.xs,
  },

  settingRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md },
  settingText: { flex: 1, gap: 2 },
  settingLabel: { color: tokens.color.text, fontSize: tokens.fontSize.base, fontWeight: '600' },
  settingDesc: { color: tokens.color.muted, fontSize: tokens.fontSize.sm },

  subItem: { paddingLeft: tokens.spacing.md, gap: tokens.spacing.xs },
  subLabel: { color: tokens.color.muted, fontSize: tokens.fontSize.sm, fontWeight: '500' },

  divider: { height: 1, backgroundColor: tokens.color.surface2 },

  warningBanner: {
    backgroundColor: `${tokens.color.warning}22`,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: tokens.color.warning,
  },
  warningText: { color: tokens.color.warning, fontSize: tokens.fontSize.sm },

  platformRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: tokens.spacing.xs },
  platformLeft: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  platformName: { color: tokens.color.text, fontSize: tokens.fontSize.sm },
  platformRight: { alignItems: 'flex-end', gap: 4 },
  platformUsage: { color: tokens.color.muted, fontSize: tokens.fontSize.xs },
  statusPill: { borderRadius: 100, paddingHorizontal: tokens.spacing.sm, paddingVertical: 2 },
  statusPillText: { color: '#fff', fontSize: tokens.fontSize.xs, fontWeight: '700' },

  inputRow: { flexDirection: 'row', gap: tokens.spacing.sm },
  textInput: {
    flex: 1,
    backgroundColor: tokens.color.surface2,
    borderRadius: tokens.radius.sm,
    padding: tokens.spacing.sm,
    color: tokens.color.text,
    fontSize: tokens.fontSize.base,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textInputError: { borderColor: tokens.color.danger },
  errorText: { color: tokens.color.danger, fontSize: tokens.fontSize.sm },
  addButton: {
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.md,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: tokens.fontSize.sm },
  blacklistRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: tokens.spacing.xs },
  blacklistHost: { color: tokens.color.text, fontSize: tokens.fontSize.sm },
  deleteText: { color: tokens.color.danger, fontSize: tokens.fontSize.sm, fontWeight: '600' },
});
