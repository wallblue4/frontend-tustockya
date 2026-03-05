/** Returns a local YYYY-MM-DD string for the given date (avoids UTC shift from toISOString). */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns today's date as YYYY-MM-DD in local timezone. */
export function todayLocal(): string {
  return toLocalDateString(new Date());
}

/** Returns a past date as YYYY-MM-DD (e.g. daysAgo(30) for 30 days back). */
export function daysAgoLocal(days: number): string {
  return toLocalDateString(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}
