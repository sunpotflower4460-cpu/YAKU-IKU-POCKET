/**
 * A locally-unique ID: timestamp plus a random suffix so two records created
 * within the same millisecond (easily hit in tests, and possible with fast
 * repeated taps) never collide the way a bare `Date.now()` id would.
 */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
