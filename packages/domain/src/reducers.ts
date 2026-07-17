// packages/domain/src/reducers.ts
// Pure state reducers for all features.
// All mutations go through these — they validate, then return a new state.
// Never call these directly from components — always via named Zustand actions.

import { BlockedHostname, ProtectionState, ShortVideoConfig } from '@aegis/schemas';
import type { AppEntry, AppGroup, AppBlockingState, WebsiteBlockerState, NotificationsState, NotificationRetention, TimeWindow, ShortVideoPlatform } from '@aegis/schemas';
import type { Result } from './result.js';
import { ok, domainErr } from './result.js';
import { canMutateProtection, canDisableTamper, isWideningAppLimit } from './invariants.js';

// ─── Protection reducers ──────────────────────────────────────────────────────

type ProtectionContext = {
  minuteOfDay: number;
  confidence: 'high' | 'medium' | 'low';
  trustedEpochMs: number;
};

export function setImmutableMode(
  state: ProtectionState,
  enabled: boolean,
  ctx: ProtectionContext,
): Result<ProtectionStateUpdate, import('./result.js').DomainError> {
  if (!canMutateProtection(state, ctx.minuteOfDay, ctx.confidence)) {
    return domainErr('E_LOCKED', 'Değiştirilemez mod etkin — bakım penceresi dışında değişiklik yapılamaz');
  }
  return ok({ ...state, immutableMode: enabled, lastMutationAt: ctx.trustedEpochMs });
}

export function setImmutableWindow(
  state: ProtectionState,
  window: TimeWindow,
  ctx: ProtectionContext,
): Result<ProtectionStateUpdate, import('./result.js').DomainError> {
  if (!canMutateProtection(state, ctx.minuteOfDay, ctx.confidence)) {
    return domainErr('E_LOCKED', 'Değiştirilemez mod etkin — pencere değiştirilemez');
  }
  // Zod already validates 10-min constraint; re-validate here for defense-in-depth
  const parsed = ProtectionState.shape.immutableWindow.safeParse(window);
  if (!parsed.success) {
    return domainErr('E_INVALID_WINDOW', parsed.error.message);
  }
  return ok({ ...state, immutableWindow: window, lastMutationAt: ctx.trustedEpochMs });
}

export function setProtectedAccess(
  state: ProtectionState,
  enabled: boolean,
  ctx: ProtectionContext,
): Result<ProtectionStateUpdate, import('./result.js').DomainError> {
  if (!canMutateProtection(state, ctx.minuteOfDay, ctx.confidence)) {
    return domainErr('E_LOCKED', 'Korumalı erişim değiştirilemiyor — değiştirilemez mod etkin');
  }
  return ok({ ...state, protectedAccess: enabled, lastMutationAt: ctx.trustedEpochMs });
}

export function setTamperProtection(
  state: ProtectionState,
  enabled: boolean,
  ctx: ProtectionContext,
): Result<ProtectionStateUpdate, import('./result.js').DomainError> {
  if (!canDisableTamper(state, ctx.minuteOfDay, ctx.confidence)) {
    return domainErr('E_LOCKED', 'Kurcalama koruması devre dışı bırakılamaz — kaldırma penceresi dışında');
  }
  return ok({ ...state, tamperProtection: enabled, lastMutationAt: ctx.trustedEpochMs });
}

export function setUninstallWindow(
  state: ProtectionState,
  window: TimeWindow,
  ctx: ProtectionContext,
): Result<ProtectionStateUpdate, import('./result.js').DomainError> {
  if (!canDisableTamper(state, ctx.minuteOfDay, ctx.confidence)) {
    return domainErr('E_LOCKED', 'Kaldırma penceresi değiştirilemez');
  }
  const parsed = ProtectionState.shape.uninstallWindow.safeParse(window);
  if (!parsed.success) {
    return domainErr('E_INVALID_WINDOW', parsed.error.message);
  }
  return ok({ ...state, uninstallWindow: window, lastMutationAt: ctx.trustedEpochMs });
}

// ProtectionStateUpdate = ProtectionState without hmac (hmac is computed after)
type ProtectionStateUpdate = Omit<ProtectionState, 'hmac'>;

// ─── App blocking reducers ────────────────────────────────────────────────────

type AppBlockingContext = { trustedEpochMs: number };

export function setAppDailyLimit(
  state: AppBlockingState,
  appId: string,
  limitMin: number,
  locked: boolean,
  _ctx: AppBlockingContext,
): Result<AppBlockingState, import('./result.js').DomainError> {
  const app = state.apps[appId];
  if (!app) {
    return domainErr('E_INVALID_SCHEMA', `Uygulama bulunamadı: ${appId}`);
  }
  // T15: reject widening while locked
  if (locked && isWideningAppLimit(app.dailyLimitMin, limitMin)) {
    return domainErr('E_LOCKED', 'Limit artırma kilitli moddayken yapılamaz');
  }
  // Validate range
  if (limitMin < 0 || limitMin > 1440) {
    return domainErr('E_INVALID_SCHEMA', 'Limit 0–1440 dakika arasında olmalıdır');
  }
  const updatedApp: AppEntry = { ...app, dailyLimitMin: limitMin };
  return ok({
    ...state,
    apps: { ...state.apps, [appId]: updatedApp },
  });
}

export function setAppBlocked(
  state: AppBlockingState,
  appId: string,
  blocked: boolean,
  locked: boolean,
  _ctx: AppBlockingContext,
): Result<AppBlockingState, import('./result.js').DomainError> {
  const app = state.apps[appId];
  if (!app) {
    return domainErr('E_INVALID_SCHEMA', `Uygulama bulunamadı: ${appId}`);
  }
  // T15: unblocking while locked = widening
  if (locked && !blocked && app.blocked) {
    return domainErr('E_LOCKED', 'Engel kaldırma kilitli moddayken yapılamaz');
  }
  const updatedApp: AppEntry = { ...app, blocked };
  return ok({ ...state, apps: { ...state.apps, [appId]: updatedApp } });
}

export function setInternetBlocked(
  state: AppBlockingState,
  appId: string,
  blocked: boolean,
  _ctx: AppBlockingContext,
): Result<AppBlockingState, import('./result.js').DomainError> {
  const app = state.apps[appId];
  if (!app) {
    return domainErr('E_INVALID_SCHEMA', `Uygulama bulunamadı: ${appId}`);
  }
  const updatedApp: AppEntry = { ...app, internetBlocked: blocked };
  return ok({ ...state, apps: { ...state.apps, [appId]: updatedApp } });
}

export function setShortVideoConfig(
  state: AppBlockingState,
  update: Partial<ShortVideoConfig>,
  locked: boolean,
  _ctx: AppBlockingContext,
): Result<AppBlockingState, import('./result.js').DomainError> {
  const current = state.shortVideo;
  // T15: reducing limit while locked = widening short-video restriction would be loosening
  if (
    locked &&
    update.universalLimitMin !== undefined &&
    current.universalLimitMin > 0 &&
    update.universalLimitMin > current.universalLimitMin
  ) {
    return domainErr('E_LOCKED', 'Kısa video limiti artırma kilitli moddayken yapılamaz');
  }

  const proposed: ShortVideoConfig = {
    ...current,
    ...update,
  };
  const parsed = ShortVideoConfig.safeParse(proposed);
  if (!parsed.success) {
    return domainErr('E_INVALID_SCHEMA', parsed.error.message);
  }
  return ok({ ...state, shortVideo: parsed.data });
}

export function addAppGroup(
  state: AppBlockingState,
  group: AppGroup,
  _ctx: AppBlockingContext,
): Result<AppBlockingState, import('./result.js').DomainError> {
  const exists = state.groups.some((g) => g.id === group.id);
  if (exists) {
    return domainErr('E_INVALID_SCHEMA', `Grup zaten var: ${group.id}`);
  }
  return ok({ ...state, groups: [...state.groups, group] });
}

export function removeAppGroup(
  state: AppBlockingState,
  groupId: string,
  locked: boolean,
  _ctx: AppBlockingContext,
): Result<AppBlockingState, import('./result.js').DomainError> {
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) {
    return domainErr('E_INVALID_SCHEMA', `Grup bulunamadı: ${groupId}`);
  }
  // T15: removing a group when enabled = loosening while locked
  if (locked && group.enabled) {
    return domainErr('E_LOCKED', 'Etkin grup kilitli moddayken kaldırılamaz');
  }
  return ok({ ...state, groups: state.groups.filter((g) => g.id !== groupId) });
}

// ─── Website blocker reducers ─────────────────────────────────────────────────

export function addWebsiteToBlacklist(
  state: WebsiteBlockerState,
  rawHost: string,
): Result<WebsiteBlockerState, import('./result.js').DomainError> {
  const parsed = BlockedHostname.safeParse(rawHost);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Geçersiz alan adı';
    return domainErr('E_INVALID_SCHEMA', message);
  }
  const host = parsed.data;
  if (state.customBlacklist.includes(host)) {
    return domainErr('E_DUPLICATE_HOST', `Bu alan adı zaten listede: ${host}`);
  }
  return ok({ ...state, customBlacklist: [...state.customBlacklist, host] });
}

export function removeWebsiteFromBlacklist(
  state: WebsiteBlockerState,
  host: string,
  locked: boolean,
): Result<WebsiteBlockerState, import('./result.js').DomainError> {
  // T15: removing from blacklist while locked = widening
  if (locked) {
    return domainErr('E_LOCKED', 'Kilitli moddayken engel listesinden kaldırılamaz');
  }
  const normalised = host.trim().toLowerCase();
  const updated = state.customBlacklist.filter((h) => h !== normalised);
  if (updated.length === state.customBlacklist.length) {
    return domainErr('E_INVALID_SCHEMA', `Alan adı listede değil: ${host}`);
  }
  return ok({ ...state, customBlacklist: updated });
}

export function setNsfwFilter(
  state: WebsiteBlockerState,
  enabled: boolean,
  locked: boolean,
): Result<WebsiteBlockerState, import('./result.js').DomainError> {
  // T15: disabling NSFW while locked = widening
  if (locked && !enabled && state.nsfwFilterEnabled) {
    return domainErr('E_LOCKED', 'NSFW filtresi kilitli moddayken devre dışı bırakılamaz');
  }
  return ok({ ...state, nsfwFilterEnabled: enabled });
}

// ─── Notifications reducers ───────────────────────────────────────────────────

export function setSilenced(
  state: NotificationsState,
  appId: string,
  silenced: boolean,
): Result<NotificationsState, import('./result.js').DomainError> {
  return ok({ ...state, silenced: { ...state.silenced, [appId]: silenced } });
}

export function setRetention(
  state: NotificationsState,
  retention: NotificationRetention,
): Result<NotificationsState, import('./result.js').DomainError> {
  return ok({ ...state, retention });
}

export function setHistoryFilter(
  state: NotificationsState,
  filter: { from: string; to: string } | undefined,
): Result<NotificationsState, import('./result.js').DomainError> {
  return ok({ ...state, historyFilter: filter });
}

// ─── Short video platform usage reducer (T13 — reset at trusted midnight) ─────

export function resetShortVideoUsage(
  state: AppBlockingState,
): AppBlockingState {
  // Called at trusted local midnight (T13), not device midnight
  const resetUsage: Record<string, number> = {};
  for (const platform of Object.keys(state.shortVideoUsageToday)) {
    resetUsage[platform] = 0;
  }
  return { ...state, shortVideoUsageToday: resetUsage };
}

export function recordShortVideoUsage(
  state: AppBlockingState,
  platform: ShortVideoPlatform,
  additionalMinutes: number,
): AppBlockingState {
  const current = state.shortVideoUsageToday[platform] ?? 0;
  return {
    ...state,
    shortVideoUsageToday: {
      ...state.shortVideoUsageToday,
      [platform]: current + additionalMinutes,
    },
  };
}
