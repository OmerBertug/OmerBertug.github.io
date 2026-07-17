// packages/domain/src/result.ts
// Typed Result<T, E> monad — eliminates silent catches per §1.4

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

// Unwrap or throw — only use in test code or top-level boundaries
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw new Error(`unwrap called on Err: ${String(result.error)}`);
}

// Map over Ok value
export function mapOk<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) return ok(fn(result.value));
  return result;
}

// ─── Domain error types ───────────────────────────────────────────────────────
export type DomainErrorCode =
  | 'E_LOCKED' // mutation rejected because state is locked
  | 'E_INVALID_WINDOW' // TimeWindow validation failed
  | 'E_DUPLICATE_HOST' // website already in blacklist
  | 'E_RESERVED_TLD' // reserved TLD rejected
  | 'E_TAMPER_DETECTED' // HMAC mismatch
  | 'E_CLOCK_LOW_CONFIDENCE' // NTP unavailable, drift too large
  | 'E_INVALID_SCHEMA' // Zod parse failed
  | 'E_RACE_CONDITION'; // serial queue violation (should never happen)

export type DomainError = {
  code: DomainErrorCode;
  message: string;
  detail?: unknown;
};

export function domainErr(code: DomainErrorCode, message: string, detail?: unknown): Err<DomainError> {
  return err({ code, message, detail });
}

// ─── assertNever — exhaustive switch helper ───────────────────────────────────
export function assertNever(value: never): never {
  throw new Error(`assertNever: unexpected value: ${JSON.stringify(value)}`);
}
