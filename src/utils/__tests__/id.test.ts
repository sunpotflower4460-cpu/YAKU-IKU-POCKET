import { generateId } from '../id';

describe('generateId', () => {
  it('prefixes the id as requested', () => {
    expect(generateId('scan')).toMatch(/^scan_/);
  });

  it('never collides across many calls in the same tick', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId('x')));
    expect(ids.size).toBe(1000);
  });
});
