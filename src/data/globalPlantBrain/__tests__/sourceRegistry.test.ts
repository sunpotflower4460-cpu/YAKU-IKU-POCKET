import {
  SOURCE_REGISTRY,
  SOURCE_RIGHTS_POLICIES,
  evaluateSourceUse,
  getRightsPolicyForSource,
} from '../sourceRegistry';
import { validateSourceRegistryEntry } from '../../../types/sourceRegistry';

describe('Global Plant Brain source registry (G0)', () => {
  it('has unique source and rights-policy IDs', () => {
    expect(new Set(SOURCE_REGISTRY.map((source) => source.id)).size).toBe(
      SOURCE_REGISTRY.length,
    );
    expect(
      new Set(SOURCE_RIGHTS_POLICIES.map((policy) => policy.id)).size,
    ).toBe(SOURCE_RIGHTS_POLICIES.length);
  });

  it('keeps every source structurally valid and linked to a rights policy', () => {
    for (const source of SOURCE_REGISTRY) {
      expect(validateSourceRegistryEntry(source)).toEqual([]);
      expect(getRightsPolicyForSource(source.id)).toBeDefined();
    }
  });

  it('only approves taxonomy sources whose specific reusable dataset rights were reviewed', () => {
    const approved = SOURCE_REGISTRY.filter(
      (source) => source.status === 'approved_core',
    ).map((source) => source.id);

    expect(approved).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/:catalogue-of-life$/),
        expect.stringMatching(/:world-flora-online$/),
      ]),
    );
    expect(approved).toHaveLength(2);
  });

  it('allows reviewed core storage while keeping unresolved AI-use rights fail-closed', () => {
    const col = SOURCE_REGISTRY.find((source) =>
      source.id.endsWith(':catalogue-of-life'),
    )!;
    const wfo = SOURCE_REGISTRY.find((source) =>
      source.id.endsWith(':world-flora-online'),
    )!;

    expect(evaluateSourceUse(col.id, 'local_storage')).toBe('allow');
    expect(evaluateSourceUse(col.id, 'commercial_use')).toBe('allow');
    expect(evaluateSourceUse(col.id, 'ai_training')).toBe('review');

    expect(evaluateSourceUse(wfo.id, 'local_storage')).toBe('allow');
    expect(evaluateSourceUse(wfo.id, 'ai_training')).toBe('allow');
  });

  it('keeps all unreviewed sources fail-closed for commercial use', () => {
    for (const source of SOURCE_REGISTRY.filter(
      (entry) => entry.status !== 'approved_core',
    )) {
      expect(evaluateSourceUse(source.id, 'commercial_use')).not.toBe('allow');
    }
  });

  it('keeps protected traditional-knowledge sources explicitly restricted', () => {
    const tkdl = SOURCE_REGISTRY.find((source) =>
      source.id.endsWith(':tkdl'),
    );
    expect(tkdl?.status).toBe('restricted');
  });
});
