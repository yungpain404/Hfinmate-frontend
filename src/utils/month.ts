// ============================================================================
// Month helpers (frontend)
// Mirrors the backend helpers so every screen agrees on "which month is now".
// All values are computed at call time - never frozen at module load, otherwise
// a session that crosses into a new month keeps showing the previous month.
// ============================================================================

export interface MonthRef {
  year: number;
  /** 1 - 12 */
  month: number;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

export function currentMonthRef(now: Date = new Date()): MonthRef {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function monthKey(ref: MonthRef): string {
  return `${ref.year}-${pad2(ref.month)}`;
}

/** Label used across the UI, e.g. `Tháng 11, 2026`. */
export function monthLabel(ref: MonthRef): string {
  return `Tháng ${ref.month}, ${ref.year}`;
}

export function isSameMonth(a?: MonthRef | null, b?: MonthRef | null): boolean {
  if (!a || !b) return false;
  return a.year === b.year && a.month === b.month;
}

function validate(ref: { year: number; month: number }): MonthRef | null {
  if (!Number.isInteger(ref.month) || ref.month < 1 || ref.month > 12) return null;
  if (!Number.isInteger(ref.year) || ref.year < 1970 || ref.year > 9999) return null;
  return { year: ref.year, month: ref.month };
}

/** Accepts `Tháng 11, 2026`, `2026-11`, `11/2026`, `11-2026` and `11`. */
export function parseMonthLabel(input?: string | number | null): MonthRef | null {
  if (input === undefined || input === null) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const vi = raw.match(/tháng\s*(\d{1,2})\s*[,\-/]\s*(\d{4})/i);
  if (vi) return validate({ month: Number(vi[1]), year: Number(vi[2]) });

  const ym = raw.match(/^(\d{4})\s*[-/]\s*(\d{1,2})$/);
  if (ym) return validate({ year: Number(ym[1]), month: Number(ym[2]) });

  const my = raw.match(/^(\d{1,2})\s*[-/]\s*(\d{4})$/);
  if (my) return validate({ month: Number(my[1]), year: Number(my[2]) });

  const bare = raw.match(/^(\d{1,2})$/);
  if (bare) return validate({ month: Number(bare[1]), year: currentMonthRef().year });

  return null;
}

/** Parse an optional label, falling back to the month the app is running in. */
export function resolveMonthLabel(input?: string | number | null): MonthRef {
  return parseMonthLabel(input) ?? currentMonthRef();
}

/**
 * True when both labels point at the same month.
 * Missing labels are treated as the current month.
 */
export function isSameMonthLabel(a?: string | null, b?: string | null): boolean {
  return isSameMonth(parseMonthLabel(a) ?? currentMonthRef(), parseMonthLabel(b) ?? currentMonthRef());
}
