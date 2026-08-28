import { generateId } from '../id';

describe('generateId', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prefixes the id as requested', () => {
    expect(generateId('scan')).toMatch(/^scan_/);
  });

  it('never collides across many calls in the same tick', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId('x')));
    expect(ids.size).toBe(1000);
  });

  it('remains unique even when Date.now and Math.random both repeat exactly', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const ids = new Set(Array.from({ length: 100 }, () => generateId('fixed')));

    expect(ids.size).toBe(100);
    for (const id of ids) {
      expect(id).toMatch(/^fixed_1234567890_[a-z0-9]+_000000$/);
    }
  });
});
