// Process-local sequence closes the only deterministic collision hole left by
// timestamp + Math.random(): random can legally return the same value (including
// exactly 0) for multiple calls in one millisecond.
let sequence = 0;

/**
 * A locally-unique record ID. Timestamp keeps IDs debuggable, a monotonic
 * process sequence guarantees uniqueness for calls in this runtime, and a
 * random suffix makes collisions across app restarts vanishingly unlikely.
 */
export function generateId(prefix: string): string {
  sequence += 1;
  const randomPart = Math.random().toString(36).slice(2, 8).padEnd(6, '0');
  return `${prefix}_${Date.now()}_${sequence.toString(36)}_${randomPart}`;
}
