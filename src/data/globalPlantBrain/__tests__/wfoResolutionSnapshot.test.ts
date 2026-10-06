import {
  WFO_MATERIAL_CONFLICT_IDS,
  WFO_RESOLUTION_SOURCE,
  WFO_RESOLUTION_SUMMARY,
  WFO_SAFE_ACCEPTED_IDS,
  WFO_SPECIAL_RESOLUTIONS,
} from '../wfoResolutionSnapshot';

describe('WFO 2026-06 resolution snapshot (G1)', () => {
  it('pins the exact WFO release and verified artifact identity', () => {
    expect(WFO_RESOLUTION_SOURCE.releaseLabel).toBe('2026-06');
    expect(WFO_RESOLUTION_SOURCE.doi).toBe(
      '10.5281/zenodo.20782718',
    );
    expect(WFO_RESOLUTION_SOURCE.backboneMd5).toBe(
      '0e4486945cd9f7af548ca87eb9a870ed',
    );
    expect(WFO_RESOLUTION_SOURCE.ipniMapMd5).toBe(
      'faa5aae66e51dce6b9890a4f78817bb6',
    );
  });

  it('records the live resolver result and reviewed promotion boundary', () => {
    expect(WFO_RESOLUTION_SUMMARY).toEqual({
      inputTaxonCount: 149,
      exactAccepted: 137,
      exactSynonym: 9,
      exactUnchecked: 1,
      ambiguousExactRank: 2,
      rankMismatch: 0,
      noExactNameMatch: 0,
      safeAcceptedConceptsAfterCrossCheck: 144,
      materialAuthorityConflicts: 5,
    });

    expect(Object.keys(WFO_SAFE_ACCEPTED_IDS)).toHaveLength(144);
    expect(WFO_MATERIAL_CONFLICT_IDS.size).toBe(5);
  });

  it('never promotes a WFO concept for the five material authority conflicts', () => {
    for (const taxonId of WFO_MATERIAL_CONFLICT_IDS) {
      expect(WFO_SAFE_ACCEPTED_IDS[taxonId]).toBeUndefined();
    }
  });

  it('resolves Aster yomena only through the Kew/IPNI cross-check', () => {
    expect(WFO_SAFE_ACCEPTED_IDS['yaku:taxon:p027']).toBe(
      'wfo-0000134015',
    );
    expect(WFO_SPECIAL_RESOLUTIONS['yaku:taxon:p027']).toEqual(
      expect.objectContaining({
        selectedWfoId: 'wfo-0000134015',
        selectedIpniLsid: 'urn:lsid:ipni.org:names:182620-1',
        selectedAuthorship: '(Kitam.) Honda',
      }),
    );
  });

  it('keeps Citrus junos unresolved at WFO concept level', () => {
    expect(WFO_SAFE_ACCEPTED_IDS['yaku:taxon:h043']).toBeUndefined();
    expect(WFO_SPECIAL_RESOLUTIONS['yaku:taxon:h043']).toEqual(
      expect.objectContaining({
        catalogIpniLsid: 'urn:lsid:ipni.org:names:771942-1',
      }),
    );
  });
});
