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

  it('does not mark any seed source approved before explicit production rights review', () => {
    for (const source of SOURCE_REGISTRY) {
      expect(source.status).not.toBe('approved_core');
      expect(source.status).not.toBe('approved_federation');
      expect(source.status).not.toBe('conditional_license');
    }
  });

  it('fails closed for commercial, RAG and training use until rights are explicitly resolved', () => {
    for (const source of SOURCE_REGISTRY) {
      expect(evaluateSourceUse(source.id, 'commercial_use')).not.toBe('allow');
      expect(evaluateSourceUse(source.id, 'ai_rag')).not.toBe('allow');
      expect(evaluateSourceUse(source.id, 'ai_training')).not.toBe('allow');
    }
  });

  it('keeps protected traditional-knowledge sources explicitly restricted', () => {
    const tkdl = SOURCE_REGISTRY.find((source) =>
      source.id.endsWith(':tkdl'),
    );
    expect(tkdl?.status).toBe('restricted');
  });
});
