// Kana normalization for search (PR12 — Explore, §7.6 "ひらがな/カタカナ...に対応").
//
// Most plant names in this app are written in katakana (e.g. タンポポ). Users
// often type in hiragana instead (たんぽぽ). Normalizing both the query and
// the candidate text to hiragana before comparing makes either script match.

/** Convert katakana characters to hiragana; leaves other characters untouched. */
export function katakanaToHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/** Lowercase + katakana→hiragana, so a search query matches regardless of script/case. */
export function normalizeForSearch(str: string): string {
  return katakanaToHiragana(str.toLowerCase());
}
