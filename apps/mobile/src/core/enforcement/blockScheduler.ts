// apps/mobile/src/core/enforcement/blockScheduler.ts
// Orchestrates the block enforcement: subscribes to enforcement bus events
// and triggers the appropriate native block actions.
// SIMULATION: Logs block decisions in Expo Go; native bridges do real blocking.

import { enforcementBus } from './enforcementBus.js';
import type { DomainEvent } from '@aegis/domain';
import { assertNever } from '@aegis/domain';

// ─── Native bridge interfaces ─────────────────────────────────────────────────
// These are thin TS wrappers over native modules (see core/native/).
// SIMULATION: In Expo Go / web, all actions are no-ops with console.warn.

export type BlockAction = {
  blockApp(appId: string): Promise<void>;
  unblockApp(appId: string): Promise<void>;
  blockGroup(groupId: string): Promise<void>;
  unblockGroup(groupId: string): Promise<void>;
  shieldShortVideo(platforms: readonly string[]): Promise<void>;
  blockInternet(appId: string): Promise<void>;
};

// SIMULATION: Default no-op implementation
const simulatedBlockAction: BlockAction = {
  async blockApp(appId) {
    // SIMULATION: TODO(native): AccessibilityService overlay / ManagedSettings shield
    console.warn(`[SIMULATION] blockApp: ${appId}`);
  },
  async unblockApp(appId) {
    console.warn(`[SIMULATION] unblockApp: ${appId}`);
  },
  async blockGroup(groupId) {
    console.warn(`[SIMULATION] blockGroup: ${groupId}`);
  },
  async unblockGroup(groupId) {
    console.warn(`[SIMULATION] unblockGroup: ${groupId}`);
  },
  async shieldShortVideo(platforms) {
    // SIMULATION: TODO(native): Android view-hierarchy overlay; iOS DeviceActivitySchedule
    console.warn(`[SIMULATION] shieldShortVideo: ${platforms.join(', ')}`);
  },
  async blockInternet(appId) {
    // SIMULATION: TODO(native): Android VpnService UID-based routing
    console.warn(`[SIMULATION] blockInternet: ${appId}`);
  },
};

let _actions: BlockAction = simulatedBlockAction;

export function registerBlockActions(actions: BlockAction): void {
  _actions = actions;
}

// ─── Event handler ────────────────────────────────────────────────────────────

function handleEnforcementEvent(event: DomainEvent): void {
  switch (event.type) {
    case 'AppLimitReached':
      void _actions.blockApp(event.appId);
      return;

    case 'GroupQuotaReached':
      void _actions.blockGroup(event.groupId);
      return;

    case 'ShortVideoCollectiveReached':
      void _actions.shieldShortVideo(event.blockedPlatforms);
      return;

    case 'ScheduleWindowClosed':
      void _actions.blockGroup(event.groupId);
      return;

    case 'TamperEvent':
      // T6/T10/T11: Tamper events are handled by the protection feature slice
      return;

    case 'ProtectionMutated':
    case 'RestrictionChanged':
      // Informational — no immediate block action needed
      return;

    default:
      return assertNever(event);
  }
}

let _unsubscribe: (() => void) | null = null;

export function startBlockScheduler(): void {
  if (_unsubscribe !== null) return;
  _unsubscribe = enforcementBus.subscribe(handleEnforcementEvent);
}

export function stopBlockScheduler(): void {
  if (_unsubscribe !== null) {
    _unsubscribe();
    _unsubscribe = null;
  }
}
