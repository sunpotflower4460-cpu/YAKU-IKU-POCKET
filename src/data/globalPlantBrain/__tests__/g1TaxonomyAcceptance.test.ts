import {
  G1_CURRENT_CATALOG_ACCEPTANCE,
} from '../g1TaxonomyAcceptance';

describe('G1 current-catalog taxonomy acceptance', () => {
  it('passes every current-catalog foundation gate', () => {
    expect(G1_CURRENT_CATALOG_ACCEPTANCE.status).toBe('pass');

    const failed = G1_CURRENT_CATALOG_ACCEPTANCE.checks.filter(
      (check) => !check.passed,
    );
    expect(failed).toEqual([]);
  });

  it('does not overclaim global-world coverage', () => {
    expect(G1_CURRENT_CATALOG_ACCEPTANCE.scope).toBe(
      'current_catalog_foundation',
    );
    expect(
      G1_CURRENT_CATALOG_ACCEPTANCE.limitations.some((text) =>
        text.includes('not all world plant taxa'),
      ),
    ).toBe(true);
  });

  it('locks the expected current taxonomy state partition', () => {
    const partition = G1_CURRENT_CATALOG_ACCEPTANCE.checks.find(
      (check) => check.id === 'resolution_state_partition',
    );
    expect(partition?.observed).toBe(
      'resolved=137, reconciled=7, conflicted=5',
    );
  });

  it('requires active conflict gates rather than treating conflicts as failure', () => {
    const explicit = G1_CURRENT_CATALOG_ACCEPTANCE.checks.find(
      (check) => check.id === 'conflicts_explicit',
    );
    const guarded = G1_CURRENT_CATALOG_ACCEPTANCE.checks.find(
      (check) => check.id === 'conflicts_block_auto_concept_changes',
    );

    expect(explicit?.passed).toBe(true);
    expect(guarded?.passed).toBe(true);
  });
});
