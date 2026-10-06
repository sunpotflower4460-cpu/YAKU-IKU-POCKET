import {
  createUnknownRightsPolicy,
  evaluateRights,
  getCanonicalIdKind,
  makeCanonicalId,
  upgradeLegacySourceRef,
  validateKnowledgeClaim,
  validateKnowledgeProvenance,
  validateSourceRefV2,
  type KnowledgeClaim,
  type KnowledgeProvenance,
  type RightsPolicy,
} from '../globalPlantBrain';

describe('Global Plant Brain G0 foundation', () => {
  const rightsPolicyId = makeCanonicalId('rights_policy', 'unknown-default');
  const sourceId = makeCanonicalId('source', 'mhlw-toxic-plant');
  const provenanceId = makeCanonicalId('provenance', 'prov-001');
  const claimId = makeCanonicalId('claim', 'claim-001');

  it('creates typed YAKU canonical IDs with stable kind prefixes', () => {
    const taxonId = makeCanonicalId('taxon', '000001');
    expect(taxonId).toBe('yaku:taxon:000001');
    expect(getCanonicalIdKind(taxonId)).toBe('taxon');
    expect(getCanonicalIdKind(sourceId)).toBe('source');
  });

  it('rejects unsafe or name-like canonical ID fragments instead of silently normalizing them', () => {
    expect(() => makeCanonicalId('taxon', 'Aconitum japonicum')).toThrow();
    expect(() => makeCanonicalId('taxon', '../p024')).toThrow();
  });

  it('upgrades a legacy URL only when explicit metadata/scope/rights are supplied', () => {
    const upgraded = upgradeLegacySourceRef(
      'https://www.mhlw.go.jp/example',
      {
        id: sourceId,
        title: 'Example official source',
        publisher: '厚生労働省',
        scope: ['toxicity'],
        retrievedAt: '2026-10-06T00:00:00.000Z',
        rightsPolicyId,
      },
    );

    expect(upgraded.url).toBe('https://www.mhlw.go.jp/example');
    expect(upgraded.scope).toEqual(['toxicity']);
    expect(upgraded.rightsPolicyId).toBe(rightsPolicyId);
    expect(validateSourceRefV2(upgraded)).toEqual([]);
  });

  it('rejects insecure legacy citation URLs', () => {
    expect(() =>
      upgradeLegacySourceRef('http://example.com/source', {
        id: sourceId,
        title: 'Example',
        scope: ['other'],
        retrievedAt: '2026-10-06T00:00:00.000Z',
        rightsPolicyId,
      }),
    ).toThrow('HTTPS');
  });

  it('fails closed on unknown or conditional rights', () => {
    const unknown = createUnknownRightsPolicy(
      rightsPolicyId,
      '2026-10-06T00:00:00.000Z',
    );
    expect(evaluateRights(unknown, 'commercial_use')).toBe('review');
    expect(evaluateRights(unknown, 'ai_training')).toBe('review');

    const explicit: RightsPolicy = {
      ...unknown,
      localStorage: 'allowed',
      aiTraining: 'prohibited',
    };
    expect(evaluateRights(explicit, 'local_storage')).toBe('allow');
    expect(evaluateRights(explicit, 'ai_training')).toBe('deny');
  });

  it('requires source-backed provenance', () => {
    const invalid: KnowledgeProvenance = {
      id: provenanceId,
      sourceRefIds: [],
      rightsPolicyId,
      transformation: 'extracted',
      agents: [{ id: 'extractor-v1', kind: 'software' }],
      createdAt: '2026-10-06T00:00:00.000Z',
    };

    expect(validateKnowledgeProvenance(invalid)).toContain('source_ref_required');

    const valid: KnowledgeProvenance = {
      ...invalid,
      sourceRefIds: [sourceId],
    };
    expect(validateKnowledgeProvenance(valid)).toEqual([]);
  });

  it('requires each atomic claim to cite its own sources', () => {
    const base: KnowledgeClaim = {
      id: claimId,
      subjectType: 'taxon',
      subjectId: makeCanonicalId('taxon', '000001'),
      predicate: 'has_toxicity_warning',
      object: true,
      context: {},
      evidenceClass: 'descriptive',
      sourceRefIds: [],
      provenanceId,
      status: 'source_validated',
      temporalRole: 'current_status',
      createdAt: '2026-10-06T00:00:00.000Z',
    };

    expect(validateKnowledgeClaim(base)).toContain('source_ref_required');
    expect(
      validateKnowledgeClaim({ ...base, sourceRefIds: [sourceId] }),
    ).toEqual([]);
  });
});
