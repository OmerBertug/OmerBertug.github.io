// apps/mobile/src/core/enforcement/enforcementBus.ts
// In-process event bus for domain enforcement events.
// Used by feature slices to react to limit-reached events.

import type { DomainEvent, EnforcementBus } from '@aegis/domain';

const _handlers = new Set<(event: DomainEvent) => void>();

export const enforcementBus: EnforcementBus = {
  emit(event: DomainEvent): void {
    for (const handler of _handlers) {
      try {
        handler(event);
      } catch {
        // Handlers must not crash the bus — log to console.error only
        console.error('[EnforcementBus] Handler threw:', event.type);
      }
    }
  },

  subscribe(handler: (event: DomainEvent) => void): () => void {
    _handlers.add(handler);
    return () => {
      _handlers.delete(handler);
    };
  },
};
