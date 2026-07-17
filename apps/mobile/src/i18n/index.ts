// apps/mobile/src/i18n/index.ts
// Minimal i18n layer: loads tr.json (primary) or en.json (fallback).
// Supports nested keys with dot notation and {{variable}} interpolation.

import trStrings from './tr.json';
import enStrings from './en.json';

type Strings = typeof trStrings;
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

// Supported locales
const locales = { 'tr': trStrings, 'en': enStrings } as const;
type Locale = keyof typeof locales;

// Detect device locale
function detectLocale(): Locale {
  const lang = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0] ?? 'tr';
  return (lang in locales ? lang : 'tr') as Locale;
}

let _currentLocale: Locale = detectLocale();
let _strings: DeepPartial<Strings> = locales[_currentLocale];

export function setLocale(locale: Locale): void {
  _currentLocale = locale;
  _strings = locales[locale];
}

export function getLocale(): Locale {
  return _currentLocale;
}

/**
 * Translate a dot-separated key with optional variable interpolation.
 * Falls back to English if key missing in current locale.
 * Falls back to the key itself if missing in both.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const resolved = resolvePath(_strings, key) ?? resolvePath(locales['en'], key) ?? key;
  if (!vars) return resolved;

  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
    resolved,
  );
}

function resolvePath(obj: DeepPartial<Strings> | Strings, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export type { Strings };
