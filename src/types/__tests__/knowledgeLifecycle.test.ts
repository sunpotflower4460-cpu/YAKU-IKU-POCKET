import {
  canTransitionKnowledgeStage,
  findClaimsDependingOn,
  makeCanonicalId,
  transitionKnowledgeStage,
  validateKnowledgeAssertion,
  type KnowledgeAssertion,
  type KnowledgeDependencyEdge,
  type VersionedKnowledgeRecord,
} from '../globalPlantBrain';

describe('Global Plant Brain living lifecycle (G0)', () => {
  const sourceId = makeCanonicalId('source', 'source-1');
  const assertionId = makeCanonicalId('assertion', 'assertion-1');
  const claimId = makeCanonicalId('claim', 'claim-1');

  it('adds dedicated canonical IDs for assertions and knowledge snapshots', () => {
    expect(assertionId).toBe('yaku:assertion:assertion-1');
    expect(makeCanonicalId('snapshot', '2026-10-06')).toBe(
      'yaku:snapshot:2026-10-06',
    );
  });

  it('does not allow raw knowledge to jump directly into production', () => {
    expect(canTransitionKnowledgeStage('raw', 'production')).toBe(false);
    expect(canTransitionKnowledgeStage('raw', 'staging')).toBe(true);
    expect(canTransitionKnowledgeStage('staging', 'production')).toBe(true);
  });

  it('moves a knowledge record through staging without mutating the original', () => {
    const raw: VersionedKnowledgeRecord<{ value: string }> = {
      record: { value: 'example' },
      version: 1,
      stage: 'raw',
      createdAt: '2026-10-06T00:00:00.000Z',
    };

    const staging = transitionKnowledgeStage(
      raw,
      'staging',
      '2026-10-06T01:00:00.000Z',
    );
    const production = transitionKnowledgeStage(
      staging,
      'production',
      '2026-10-06T02:00:00.000Z',
    );

    expect(raw.stage).toBe('raw');
    expect(staging.stage).toBe('staging');
    expect(production.stage).toBe('production');
    expect(production.promotedAt).toBe('2026-10-06T02:00:00.000Z');
  });

  it('rejects invalid stage promotion', () => {
    const raw: VersionedKnowledgeRecord<string> = {
      record: 'example',
      version: 1,
      stage: 'raw',
      createdAt: '2026-10-06T00:00:00.000Z',
    };

    expect(() =>
      transitionKnowledgeStage(raw, 'production', '2026-10-06T01:00:00.000Z'),
    ).toThrow('raw -> production');
  });

  it('requires source-backed assertions and an explicit link when superseded', () => {
    const base: KnowledgeAssertion = {
      id: assertionId,
      subjectType: 'taxon',
      subjectId: makeCanonicalId('taxon', '000001'),
      predicate: 'accepted_name',
      object: 'Example plant',
      sourceRefIds: [sourceId],
      assertedAt: '2026-10-06T00:00:00.000Z',
      status: 'active',
    };

    expect(validateKnowledgeAssertion(base)).toEqual([]);
    expect(
      validateKnowledgeAssertion({
        ...base,
        status: 'superseded',
      }),
    ).toContain('superseded_by_assertion_link_required');
  });

  it('allows a replacement assertion to point back to the assertion it supersedes', () => {
    const replacement: KnowledgeAssertion = {
      id: makeCanonicalId('assertion', 'assertion-2'),
      subjectType: 'taxon',
      subjectId: makeCanonicalId('taxon', '000001'),
      predicate: 'accepted_name',
      object: 'Updated plant',
      sourceRefIds: [sourceId],
      assertedAt: '2026-10-07T00:00:00.000Z',
      status: 'active',
      supersedesAssertionId: assertionId,
    };

    expect(validateKnowledgeAssertion(replacement)).toEqual([]);
  });

  it('finds downstream claims affected by a source/assertion change', () => {
    const otherClaimId = makeCanonicalId('claim', 'claim-2');
    const edges: KnowledgeDependencyEdge[] = [
      {
        fromClaimId: claimId,
        target: { type: 'source', id: sourceId },
        relation: 'supported_by',
        createdAt: '2026-10-06T00:00:00.000Z',
      },
      {
        fromClaimId: otherClaimId,
        target: { type: 'assertion', id: assertionId },
        relation: 'derived_from',
        createdAt: '2026-10-06T00:00:00.000Z',
      },
    ];

    expect(
      findClaimsDependingOn({ type: 'source', id: sourceId }, edges),
    ).toEqual([claimId]);
    expect(
      findClaimsDependingOn({ type: 'assertion', id: assertionId }, edges),
    ).toEqual([otherClaimId]);
  });
});
