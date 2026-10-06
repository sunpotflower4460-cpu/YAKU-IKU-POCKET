import {
  assessTaxonomyCandidate,
  makeCanonicalId,
  type TaxonomyResolutionQuery,
} from '../../../../types/globalPlantBrain';
import {
  COL_XR_SOURCE_VERSION,
  buildCatalogueOfLifeMatchUrl,
  parseCatalogueOfLifeMatchResponse,
  resolveCatalogueOfLifeName,
} from '../catalogueOfLifeResolver';

describe('Catalogue of Life G1 resolver', () => {
  const query: TaxonomyResolutionQuery = {
    yakuTaxonConceptId: makeCanonicalId('taxon', 'p005'),
    scientificName: 'Equisetum arvense',
    expectedRank: 'species',
    kingdom: 'Plantae',
  };

  const exactAcceptedResponse = {
    usage: {
      key: 'COL-ID-1',
      name: 'Equisetum arvense L.',
      canonicalName: 'Equisetum arvense',
      rank: 'SPECIES',
      status: 'ACCEPTED',
    },
    classification: [
      { key: 'PLANTAE', name: 'Plantae', rank: 'KINGDOM' },
      { key: 'GENUS-1', name: 'Equisetum', rank: 'GENUS' },
    ],
    diagnostics: {
      matchType: 'EXACT',
      confidence: 99,
    },
    synonym: false,
  };

  it('pins the authoritative COL release metadata used for resolution', () => {
    expect(COL_XR_SOURCE_VERSION).toEqual({
      provider: 'catalogue_of_life',
      releaseLabel: '2026-09-25 XR',
      issuedAt: '2026-09-25',
      datasetKey: '316441',
      checklistKey: '7ddf754f-d193-4cc9-b351-99906754a03b',
      doi: '10.48580/dgz9s',
    });
  });

  it('builds a plant-scoped COL XR v2 match query', () => {
    const url = new URL(buildCatalogueOfLifeMatchUrl(query));
    expect(url.origin + url.pathname).toBe(
      'https://api.gbif.org/v2/species/match',
    );
    expect(url.searchParams.get('scientificName')).toBe('Equisetum arvense');
    expect(url.searchParams.get('taxonRank')).toBe('SPECIES');
    expect(url.searchParams.get('kingdom')).toBe('Plantae');
    expect(url.searchParams.get('checklistKey')).toBe(
      '7ddf754f-d193-4cc9-b351-99906754a03b',
    );
  });

  it('parses an exact accepted match with classification and source version', () => {
    const candidate = parseCatalogueOfLifeMatchResponse(
      query,
      exactAcceptedResponse,
    );
    expect(candidate?.providerRecordId).toBe('COL-ID-1');
    expect(candidate?.canonicalName).toBe('Equisetum arvense');
    expect(candidate?.matchType).toBe('exact');
    expect(candidate?.status).toBe('accepted');
    expect(candidate?.classification[0]?.name).toBe('Plantae');
    expect(candidate?.sourceVersion.datasetKey).toBe('316441');
  });

  it('auto-resolves only a high-confidence exact accepted plant match', () => {
    const candidate = parseCatalogueOfLifeMatchResponse(
      query,
      exactAcceptedResponse,
    );
    expect(assessTaxonomyCandidate(query, candidate).decision).toBe(
      'auto_resolve',
    );
  });

  it('requires review for synonyms so accepted-name relationships are not hidden', () => {
    const candidate = parseCatalogueOfLifeMatchResponse(query, {
      ...exactAcceptedResponse,
      usage: {
        ...exactAcceptedResponse.usage,
        status: 'SYNONYM',
      },
      acceptedUsage: {
        key: 'COL-ACCEPTED',
        name: 'Equisetum arvense L.',
        canonicalName: 'Equisetum arvense',
        rank: 'SPECIES',
        status: 'ACCEPTED',
      },
      synonym: true,
    });

    const assessment = assessTaxonomyCandidate(query, candidate);
    expect(assessment.decision).toBe('needs_review');
    expect(assessment.reasons).toContain('status_synonym');
    expect(candidate?.acceptedTaxon?.providerRecordId).toBe('COL-ACCEPTED');
  });

  it('requires review for fuzzy/variant or low-confidence matches', () => {
    const variant = parseCatalogueOfLifeMatchResponse(query, {
      ...exactAcceptedResponse,
      diagnostics: { matchType: 'VARIANT', confidence: 93 },
    });
    const assessment = assessTaxonomyCandidate(query, variant);

    expect(assessment.decision).toBe('needs_review');
    expect(assessment.reasons).toContain('match_type_variant');
    expect(assessment.reasons).toContain('confidence_below_auto_threshold');
  });

  it('does not resolve a taxon when the response has no usage', () => {
    const candidate = parseCatalogueOfLifeMatchResponse(query, {
      diagnostics: { matchType: 'NONE', confidence: 0 },
    });
    expect(candidate).toBeUndefined();
    expect(assessTaxonomyCandidate(query, candidate).decision).toBe(
      'unresolved',
    );
  });

  it('keeps network transport injectable instead of coupling mobile code to taxonomy HTTP', async () => {
    const transport = jest.fn(async () => exactAcceptedResponse);
    const result = await resolveCatalogueOfLifeName(query, transport);

    expect(transport).toHaveBeenCalledTimes(1);
    expect(result?.canonicalName).toBe('Equisetum arvense');
  });
});
