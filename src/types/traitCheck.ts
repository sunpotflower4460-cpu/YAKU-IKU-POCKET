// 現物確認（compare-in-the-field) model — v3 §7.1/§7.3.
//
// A TraitCheck records the user's own judgement against a real, physical
// specimen for one check item ("does the habitat match?", "does this
// differ from the dangerous look-alike the way the note describes?"). This
// is deliberately never AI-generated: the AI already produced its guess
// (the candidate); this is the human confirming or refuting it against
// reality, per §7.1 "AIの答えを受け取って終わりにせず...".

export type TraitCheckState = 'match' | 'mismatch' | 'unknown';

export interface TraitCheck {
  traitId: string;
  state: TraitCheckState;
  userNote?: string;
}

/** One checkable item, with a reference hint drawn only from real per-plant data (never fabricated). */
export interface TraitDefinition {
  id: string;
  label: string;
  referenceHint: string;
}

export interface TraitCheckSummary {
  match: number;
  mismatch: number;
  unknown: number;
  total: number;
}

export function summarizeTraitChecks(checks: TraitCheck[]): TraitCheckSummary {
  return {
    match: checks.filter((c) => c.state === 'match').length,
    mismatch: checks.filter((c) => c.state === 'mismatch').length,
    unknown: checks.filter((c) => c.state === 'unknown').length,
    total: checks.length,
  };
}
