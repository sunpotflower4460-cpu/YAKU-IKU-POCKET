import { katakanaToHiragana, normalizeForSearch } from '../kana';

describe('kana normalization', () => {
  it('converts katakana to hiragana', () => {
    expect(katakanaToHiragana('タンポポ')).toBe('たんぽぽ');
    expect(katakanaToHiragana('ドクダミ')).toBe('どくだみ');
  });

  it('leaves kanji, hiragana, and ascii untouched', () => {
    expect(katakanaToHiragana('薬育ポケット')).toBe('薬育ぽけっと');
    expect(katakanaToHiragana('たんぽぽ')).toBe('たんぽぽ');
    expect(katakanaToHiragana('Dandelion')).toBe('Dandelion');
  });

  it('normalizeForSearch makes hiragana input match a katakana name', () => {
    const query = normalizeForSearch('たんぽぽ');
    const name = normalizeForSearch('タンポポ');
    expect(name.includes(query)).toBe(true);
  });

  it('normalizeForSearch is case-insensitive for latin text', () => {
    expect(normalizeForSearch('Taraxacum')).toBe(normalizeForSearch('taraxacum'));
  });
});
