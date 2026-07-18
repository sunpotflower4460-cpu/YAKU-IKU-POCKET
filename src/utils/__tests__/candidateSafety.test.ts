import { assessCandidateSafety } from '../candidateSafety';
import { getPlantById } from '../../data/plants';
import { IdentificationCandidate } from '../../types/observation';

function candidateFor(plantId: string, rank: number): IdentificationCandidate {
  const plant = getPlantById(plantId);
  if (!plant) throw new Error(`unknown plant id in test: ${plantId}`);
  return { plant, score: { visionScore: 90 - rank * 10, overallRank: rank }, reason: undefined };
}

describe('assessCandidateSafety', () => {
  it('flags a RED candidate even when it is not ranked first', () => {
    // p024 = トリカブト (RED), ranked 2nd behind a harmless plant
    const result = assessCandidateSafety([candidateFor('p001', 1), candidateFor('p024', 2)]);
    expect(result.hasDangerousCandidate).toBe(true);
  });

  it('flags look-alike risk when a candidate has a catalogued dangerous look-alike', () => {
    // p008 = セリ, confused with ドクゼリ
    const result = assessCandidateSafety([candidateFor('p008', 1)]);
    expect(result.hasLookalikeRisk).toBe(true);
    expect(result.warnings.some((w) => w.name === 'ドクゼリ')).toBe(true);
  });

  it('reports no risk when no candidate is dangerous or has a look-alike', () => {
    // p001 = タンポポ: no danger, no catalogued look-alike
    const result = assessCandidateSafety([candidateFor('p001', 1)]);
    expect(result.hasDangerousCandidate).toBe(false);
    expect(result.hasLookalikeRisk).toBe(false);
    expect(result.warnings).toEqual([]);
  });

  it('deduplicates identical warnings across candidates', () => {
    const result = assessCandidateSafety([candidateFor('p008', 1), candidateFor('p008', 2)]);
    const dokuzeriWarnings = result.warnings.filter((w) => w.name === 'ドクゼリ');
    expect(dokuzeriWarnings).toHaveLength(1);
  });
});
