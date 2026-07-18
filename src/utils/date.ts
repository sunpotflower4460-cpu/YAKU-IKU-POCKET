// Local-timezone date helpers.
// The app targets Japanese (JST) users; using the device's *local* date keeps
// daily quests, streaks, and the profile calendar aligned with the user's real
// day instead of rolling over at 09:00 JST (which UTC-based dates would do).

/** Format a Date as a local `YYYY-MM-DD` string. */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's date as a local `YYYY-MM-DD` string. */
export function todayLocalStr(): string {
  return toLocalDateStr(new Date());
}

/** The local `YYYY-MM-DD` for the day `offsetDays` from today (negative = past). */
export function localDateStrOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toLocalDateStr(d);
}

/** Convert an absolute ISO timestamp to its local `YYYY-MM-DD` day. */
export function localDayFromISO(iso: string): string {
  return toLocalDateStr(new Date(iso));
}
