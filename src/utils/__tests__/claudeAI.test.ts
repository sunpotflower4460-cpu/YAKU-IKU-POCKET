import { recognizePlantWithClaude } from '../claudeAI';
import { CapturedPhoto } from '../../types/capture';
import { PLANTS } from '../../data/plants';

function photo(id: string, organ: CapturedPhoto['organ'] = 'auto'): CapturedPhoto {
  return { id, uri: `file://${id}.jpg`, base64: `base64-${id}`, organ };
}

function mockFetchOnce(responseText: string, ok = true, status = 200) {
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => ({ content: [{ text: responseText }] }),
    text: async () => responseText,
  });
}

function candidateBody(candidates: { plantName?: string; confidence?: unknown; reason?: string }[]) {
  return JSON.stringify({ identified: true, candidates });
}

describe('recognizePlantWithClaude', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends one image block per captured photo', async () => {
    const target = PLANTS[0];
    mockFetchOnce(candidateBody([{ plantName: target.name, confidence: 90, reason: 'test' }]));

    await recognizePlantWithClaude([photo('a'), photo('b'), photo('c')], 'test-key');

    const call = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(call[1].body);
    const imageBlocks = body.messages[0].content.filter((c: any) => c.type === 'image');
    expect(imageBlocks).toHaveLength(3);
  });

  it('returns a single candidate when Claude names one plant in our database', async () => {
    const target = PLANTS[0];
    mockFetchOnce(candidateBody([{ plantName: target.name, confidence: 88, reason: 'leaf shape' }]));

    const outcome = await recognizePlantWithClaude([photo('a')], 'test-key');
    expect(outcome.status).toBe('identified');
    if (outcome.status === 'identified') {
      expect(outcome.candidates).toHaveLength(1);
      expect(outcome.candidates[0].plant.id).toBe(target.id);
      expect(outcome.candidates[0].score.visionScore).toBe(88);
      expect(outcome.candidates[0].score.overallRank).toBe(1);
    }
  });

  it('returns up to 3 ranked candidates, sorted by confidence descending', async () => {
    const [a, b, c] = PLANTS;
    mockFetchOnce(
      candidateBody([
        { plantName: a.name, confidence: 60 },
        { plantName: b.name, confidence: 90 },
        { plantName: c.name, confidence: 75 },
      ])
    );

    const outcome = await recognizePlantWithClaude([photo('a')], 'test-key');
    expect(outcome.status).toBe('identified');
    if (outcome.status === 'identified') {
      expect(outcome.candidates.map((cd) => cd.plant.id)).toEqual([b.id, c.id, a.id]);
      expect(outcome.candidates.map((cd) => cd.score.overallRank)).toEqual([1, 2, 3]);
    }
  });

  it('caps candidates at 3 even if Claude returns more', async () => {
    const [a, b, c, d] = PLANTS;
    mockFetchOnce(
      candidateBody([
        { plantName: a.name, confidence: 95 },
        { plantName: b.name, confidence: 90 },
        { plantName: c.name, confidence: 85 },
        { plantName: d.name, confidence: 80 },
      ])
    );
    const outcome = await recognizePlantWithClaude([photo('a')], 'test-key');
    expect(outcome.status).toBe('identified');
    if (outcome.status === 'identified') {
      expect(outcome.candidates).toHaveLength(3);
    }
  });

  it('never invents a plant when a candidate names something outside the database', async () => {
    mockFetchOnce(candidateBody([{ plantName: '存在しない植物X', confidence: 90 }]));
    const outcome = await recognizePlantWithClaude([photo('a')], 'test-key');
    expect(outcome.status).toBe('unidentified');
  });

  it('drops an invalid candidate but keeps the valid ones from the same response', async () => {
    const target = PLANTS[0];
    mockFetchOnce(
      candidateBody([
        { plantName: '存在しない植物X', confidence: 95 },
        { plantName: target.name, confidence: 80 },
      ])
    );
    const outcome = await recognizePlantWithClaude([photo('a')], 'test-key');
    expect(outcome.status).toBe('identified');
    if (outcome.status === 'identified') {
      expect(outcome.candidates).toHaveLength(1);
      expect(outcome.candidates[0].plant.id).toBe(target.id);
    }
  });

  it('returns unidentified when Claude reports identified: false', async () => {
    mockFetchOnce(JSON.stringify({ identified: false, reason: '不明瞭', candidates: [] }));
    const outcome = await recognizePlantWithClaude([photo('a')], 'test-key');
    expect(outcome.status).toBe('unidentified');
  });

  it('returns unidentified when candidates is empty', async () => {
    mockFetchOnce(candidateBody([]));
    const outcome = await recognizePlantWithClaude([photo('a')], 'test-key');
    expect(outcome.status).toBe('unidentified');
  });

  it('drops a candidate with missing/invalid confidence (never fabricates one)', async () => {
    const target = PLANTS[0];
    mockFetchOnce(candidateBody([{ plantName: target.name, confidence: 'high' as any }]));
    const outcome = await recognizePlantWithClaude([photo('a')], 'test-key');
    expect(outcome.status).toBe('unidentified');
  });

  it('throws (never silently substitutes) on a non-2xx API response', async () => {
    mockFetchOnce('Internal Server Error', false, 500);
    await expect(recognizePlantWithClaude([photo('a')], 'test-key')).rejects.toThrow();
  });

  it('throws on a malformed (non-JSON) response body', async () => {
    mockFetchOnce('this is not json at all');
    await expect(recognizePlantWithClaude([photo('a')], 'test-key')).rejects.toThrow();
  });
});
