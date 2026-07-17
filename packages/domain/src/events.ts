// packages/domain/src/events.ts
// Domain events emitted on the enforcement bus when restrictions change.

import type { ShortVideoPlatform } from '@aegis/schemas';

// ─── Event discriminated union ────────────────────────────────────────────────

export type AppLimitReachedEvent = {
  readonly type: 'AppLimitReached';
  readonly appId: string;
  readonly usedMinutes: number;
  readonly limitMinutes: number;
  readonly trustedEpochMs: number;
};

export type GroupQuotaReachedEvent = {
  readonly type: 'GroupQuotaReached';
  readonly groupId: string;
  readonly usedMinutes: number;
  readonly quotaMinutes: number;
  readonly trustedEpochMs: number;
};

export type ShortVideoCollectiveReachedEvent = {
  readonly type: 'ShortVideoCollectiveReached';
  readonly blockedPlatforms: readonly ShortVideoPlatform[];
  readonly totalUsedMinutes: number;
  readonly limitMinutes: number;
  readonly trustedEpochMs: number;
};

export type ScheduleWindowClosedEvent = {
  readonly type: 'ScheduleWindowClosed';
  readonly groupId: string;
  readonly trustedEpochMs: number;
};

export type TamperEvent = {
  readonly type: 'TamperEvent';
  readonly reason: 'HmacMismatch' | 'ClockRollback' | 'PermissionRevoked' | 'VpnRevoked';
  readonly detail: string;
  readonly trustedEpochMs: number;
};

export type ProtectionMutatedEvent = {
  readonly type: 'ProtectionMutated';
  readonly field:
    | 'immutableMode'
    | 'immutableWindow'
    | 'protectedAccess'
    | 'tamperProtection'
    | 'uninstallWindow';
  readonly trustedEpochMs: number;
};

export type RestrictionChangedEvent = {
  readonly type: 'RestrictionChanged';
  readonly entityType: 'App' | 'Group' | 'Website' | 'ShortVideo' | 'Notification';
  readonly entityId: string;
  readonly change: 'Blocked' | 'Unblocked' | 'LimitSet' | 'LimitRemoved';
  readonly trustedEpochMs: number;
};

// ─── Union type ────────────────────────────────────────────────────────────────
export type DomainEvent =
  | AppLimitReachedEvent
  | GroupQuotaReachedEvent
  | ShortVideoCollectiveReachedEvent
  | ScheduleWindowClosedEvent
  | TamperEvent
  | ProtectionMutatedEvent
  | RestrictionChangedEvent;

export type DomainEventType = DomainEvent['type'];

// ─── Event bus interface (implemented in core/enforcement) ────────────────────
export type EnforcementBus = {
  emit(event: DomainEvent): void;
  subscribe(handler: (event: DomainEvent) => void): () => void; // returns unsubscribe
};
