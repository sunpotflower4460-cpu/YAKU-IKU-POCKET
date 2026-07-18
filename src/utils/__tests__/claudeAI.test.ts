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

describe('recognizePlantWithClaude', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends one image block per captured photo', async () => {
    const target = PLANTS[0];
    mockFetchOnce(
      JSON.stringify({ identified: true, plantName: target.name, confidence: 90, reason: 'test' })
    );

    await recognizePlantWithClaude([photo('a'), photo('b'), photo('c')], 'test-key');

    const call = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(call[1].body);
    const imageBlocks = body.messages[0].content.filter((c: any) => c.type === 'image');
    expect(imageBlocks).toHaveLength(3);
  });

  it('returns identified when Claude names a plant in our database', async () => {
    const target = PLANTS[0];
    mockFetchOnce(
      JSON.stringify({ identified: true, plantName: target.name, confidence: 88, reason: 'leaf shape' })
    );

    const outcome = await recognizePlantWithClaude([photo('a')], 'test-key');
    expect(outcome.status).toBe('identified');
    if (outcome.status === 'identified') {
      expect(outcome.plant.id).toBe(target.id);
      expect(outcome.confidence).toBe(88);
    }
  });

  it('never invents a plant when Claude says identified but names something outside the database', async () => {
    mockFetchOnce(JSON.stringify({ identified: true, plantName: '存在しない植物X', confidence: 90 }));
    const outcome = await recognizePlantWithClaude([photo('a')], 'test-key');
    expect(outcome.status).toBe('unidentified');
  });

  it('returns unidentified when Claude reports identified: false', async () => {
    mockFetchOnce(JSON.stringify({ identified: false, reason: '不明瞭' }));
    const outcome = await recognizePlantWithClaude([photo('a')], 'test-key');
    expect(outcome.status).toBe('unidentified');
  });

  it('returns unidentified when confidence is missing/invalid (never fabricates one)', async () => {
    const target = PLANTS[0];
    mockFetchOnce(JSON.stringify({ identified: true, plantName: target.name, confidence: 'high' }));
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
