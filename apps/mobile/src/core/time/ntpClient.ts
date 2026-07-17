// apps/mobile/src/core/time/ntpClient.ts
// NTP client: queries 3 servers, takes median, returns trusted epoch.
// SIMULATION: Uses HTTP-based time API as fallback in Expo Go / web.
// TODO(native): Replace with react-native-ntp-client for true UDP NTP.

import type { Result } from '@aegis/domain';
import { ok, err } from '@aegis/domain';

export type NtpQueryOptions = {
  timeoutMs: number;
  servers?: readonly string[];
};

// NTP servers (fallback order)
const DEFAULT_NTP_SERVERS = [
  'https://worldtimeapi.org/api/timezone/UTC', // HTTP fallback
  'https://timeapi.io/api/Time/current/zone?timeZone=UTC', // second fallback
] as const;

type NtpResponse = { epochMs: number };

async function queryHttpTimeServer(url: string, timeoutMs: number): Promise<Result<NtpResponse, string>> {
  const controller = new AbortController();
  const timer = setTimeout(() => { controller.abort(); }, timeoutMs);

  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!resp.ok) return err(`HTTP ${resp.status.toString()}`);

    // worldtimeapi.org returns { unixtime: number, ... }
    // timeapi.io returns { dateTime: string, ... }
    const data = await resp.json() as Record<string, unknown>;

    if (typeof data['unixtime'] === 'number') {
      return ok({ epochMs: data['unixtime'] * 1000 });
    }
    if (typeof data['dateTime'] === 'string') {
      return ok({ epochMs: new Date(data['dateTime']).getTime() });
    }
    return err('Unrecognised time API response');
  } catch (e) {
    clearTimeout(timer);
    return err(e instanceof Error ? e.message : 'Unknown error');
  }
}

/**
 * Query NTP servers and return median epoch.
 * Uses HTTP fallbacks in Expo Go (SIMULATION).
 * TODO(native): Replace with UDP NTP via react-native-ntp-client for sub-100ms accuracy.
 */
export async function queryNtp(opts: NtpQueryOptions): Promise<Result<number, string>> {
  const servers = DEFAULT_NTP_SERVERS;
  const results: number[] = [];

  // Query all servers in parallel, collect successes
  const responses = await Promise.allSettled(
    servers.map((url) => queryHttpTimeServer(url, opts.timeoutMs)),
  );

  for (const r of responses) {
    if (r.status === 'fulfilled' && r.value.ok) {
      results.push(r.value.value.epochMs);
    }
  }

  if (results.length === 0) {
    return err('All NTP servers failed');
  }

  // Take median to resist outlier manipulation
  results.sort((a, b) => a - b);
  const median = results[Math.floor(results.length / 2)];
  if (median === undefined) return err('Median computation failed');

  return ok(median);
}
