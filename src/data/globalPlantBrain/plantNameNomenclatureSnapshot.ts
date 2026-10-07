/**
 * Name-level nomenclatural snapshot for the current catalog.
 *
 * Main source:
 * - World Flora Online Plant List 2026-06
 * - DOI 10.5281/zenodo.20782718
 * - scientificNameID + ipni_to_wfo mapping
 *
 * One direct IPNI-only completion is recorded separately:
 * - Zingiber mioga -> urn:lsid:ipni.org:names:798364-1
 *
 * IMPORTANT: IPNI LSIDs belong to plant-name records, not TaxonConcept.
 */

export const NOMENCLATURE_SNAPSHOT_SOURCE = {
  wfoRelease: '2026-06',
  wfoDoi: '10.5281/zenodo.20782718',
  wfoBackboneMd5: '0e4486945cd9f7af548ca87eb9a870ed',
  wfoIpniMapMd5: 'faa5aae66e51dce6b9890a4f78817bb6',
  ipniDirectReviewDate: '2026-10-07',
} as const;

export const CATALOG_IPNI_SUFFIX_BY_PLANT_ID: Readonly<Record<string, string>> = {
  h001: '449008-1',
  h002: '457138-1',
  h003: '461765-1',
  h004: '452874-1',
  h005: '450969-1',
  h006: '154715-2',
  h007: '456833-1',
  h008: '453395-1',
  h009: '842680-1',
  h010: '837530-1',
  h011: '840760-1',
  h012: '119166-3',
  h013: '463752-1',
  h014: '796556-1',
  h015: '601421-1',
  h016: '554553-1',
  h017: '436688-1',
  h018: '262578-2',
  h019: '396896-1',
  h020: '60442790-2',
  h021: '837913-1',
  h022: '307848-2',
  h023: '475647-1',
  h024: '1174497-2',
  h025: '30122169-2',
  h026: '50886797-1',
  h027: '528796-1',
  h028: '453303-1',
  h029: '528823-1',
  h030: '846658-1',
  h031: '839677-1',
  h032: '840882-1',
  h033: '450084-1',
  h034: '586076-1',
  h035: '152093-3',
  h036: '60442520-2',
  h037: '798364-1',
  h038: '284345-1',
  h039: '837661-1',
  h040: '178385-1',
  h041: '320796-2',
  h042: '30051955-2',
  h043: '771942-1',
  h044: '775951-1',
  h045: '260630-2',
  h046: '113618-1',
  h047: '127231-2',
  h048: '523957-1',
  h049: '682369-1',
  h050: '196799-2',
  h051: '245468-2',
  h052: '187894-1',
  h053: '1015994-1',
  h054: '194533-1',
  h055: '30088655-2',
  h056: '675971-1',
  h057: '591026-1',
  h058: '872083-1',
  h059: '315555-2',
  h060: '675096-1',
  h061: '212898-1',
  h062: '750339-1',
  h063: '167338-2',
  h064: '838067-1',
  h065: '278747-1',
  h066: '77069479-1',
  h067: '60472666-2',
  h068: '518323-1',
  h069: '486606-1',
  h070: '326388-2',
  h071: '927299-1',
  p001: '1003018-2',
  p002: '179985-1',
  p003: '927252-1',
  p004: '684897-1',
  p005: '300073-2',
  p006: '214449-2',
  p007: '528368-1',
  p008: '845307-1',
  p010: '89613-1',
  p011: '1067586-2',
  p012: '17210060-1',
  p013: '77117634-1',
  p014: '534936-1',
  p015: '840846-1',
  p016: '279929-1',
  p017: '30072255-2',
  p018: '190343-2',
  p019: '435655-1',
  p020: '139531-1',
  p021: '144523-1',
  p022: '30056767-2',
  p023: '448797-1',
  p024: '927384-1',
  p025: '533487-1',
  p026: '323270-2',
  p027: '182620-1',
  p028: '697224-1',
  p029: '525117-1',
  p030: '195527-1',
  p031: '322497-2',
  p032: '370941-1',
  p033: '332105-2',
  p034: '536335-1',
  p035: '204312-1',
  p036: '818000-1',
  p037: '840414-1',
  p038: '66240-1',
  p039: '533232-1',
  p040: '529108-1',
  p041: '536637-1',
  p042: '262863-2',
  p043: '314739-2',
  p044: '89629-1',
  p045: '17145680-1',
  p048: '672291-1',
  p049: '713835-1',
  p050: '323290-2',
  p051: '85796-1',
  p052: '106376-1',
  p053: '319150-2',
  p054: '972483-1',
  p055: '868618-1',
  p056: '77189035-1',
  p057: '448939-1',
  p058: '250268-1',
  p059: '305797-1',
  p060: '265663-1',
  p061: '927390-1',
  p062: '30138371-2',
  p063: '927405-1',
  p064: '479842-1',
  p065: '840668-1',
  p066: '673258-1',
  p067: '684080-1',
  p068: '228726-1',
  p069: '1124129-2',
  p070: '614101-1',
  p071: '271356-1',
  p072: '80460-1',
  p073: '71811-1',
  p074: '525791-1',
  p075: '502415-1',
  p076: '408768-1',
  p077: '77327592-1',
  p078: '859466-1',
  p079: '927440-1',
};

export const CATALOG_NAME_WFO_USAGE_OVERRIDES: Readonly<Record<string, string>> = {
  p001: 'wfo-0000062154',
  p006: 'wfo-0000182939',
  p042: 'wfo-0000753561',
  p046: 'wfo-0000666177',
  p047: 'wfo-0000910104',
  p060: 'wfo-0001298470',
  p068: 'wfo-0000009780',
  p077: 'wfo-0000644345',
  p079: 'wfo-0000005061',
  h047: 'wfo-0000217205',
  h070: 'wfo-0000723020',
};

export const IPNI_DIRECT_SOURCE_OVERRIDES = new Set<string>(['h037']);

export interface PreferredAcceptedNameNomenclature {
  value: string;
  rank: 'species' | 'subspecies' | 'variety' | 'form' | 'genus' | 'family' | 'section' | 'hybrid' | 'unresolved';
  wfoNameUsageId: string;
  ipniLsid: string;
}

export const PREFERRED_ACCEPTED_NAME_NOMENCLATURE: Readonly<
  Record<string, PreferredAcceptedNameNomenclature>
> = {
  p006: {
    value: 'Pueraria montana var. lobata',
    rank: 'variety',
    wfoNameUsageId: 'wfo-0000193854',
    ipniLsid: 'urn:lsid:ipni.org:names:967441-1',
  },
  p042: {
    value: 'Veratrum oxysepalum',
    rank: 'species',
    wfoNameUsageId: 'wfo-0000751759',
    ipniLsid: 'urn:lsid:ipni.org:names:543520-1',
  },
  p046: {
    value: 'Elatostema involucratum',
    rank: 'species',
    wfoNameUsageId: 'wfo-0000665709',
    ipniLsid: 'urn:lsid:ipni.org:names:851938-1',
  },
  p047: {
    value: 'Glechoma grandis',
    rank: 'species',
    wfoNameUsageId: 'wfo-0000972869',
    ipniLsid: 'urn:lsid:ipni.org:names:447336-1',
  },
  p068: {
    value: 'Lapsanastrum apogonoides',
    rank: 'species',
    wfoNameUsageId: 'wfo-0000089369',
    ipniLsid: 'urn:lsid:ipni.org:names:981300-1',
  },
  p077: {
    value: 'Dianthus longicalyx',
    rank: 'species',
    wfoNameUsageId: 'wfo-0000643798',
    ipniLsid: 'urn:lsid:ipni.org:names:153551-1',
  },
  h070: {
    value: 'Sabdariffa gossypiifolia',
    rank: 'species',
    wfoNameUsageId: 'wfo-1000082921',
    ipniLsid: 'urn:lsid:ipni.org:names:77361038-1',
  },
};

export const CATALOG_NAME_NOMENCLATURE_COVERAGE = {
  catalogNames: 149,
  catalogNamesWithIpniLsid: 147,
  catalogNamesWithoutIpniLsid: 2,
  missingCatalogIpniPlantIds: ['p046', 'p047'],
  preferredAcceptedNames: 7,
  preferredAcceptedNamesWithIpniLsid: 7,
} as const;

export function toIpniLsid(suffix: string | undefined): string | undefined {
  return suffix ? `urn:lsid:ipni.org:names:${suffix}` : undefined;
}
