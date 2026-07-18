// Capture-flow types (PR9 — Observe Capture Flow, §7.4 / §10.3).
//
// Full ObservationPhoto (with quality scoring, thumbnails, etc.) lands with
// the Observation schema in PR11/PR13. PR9 introduces just the organ-tagging
// piece needed for multi-photo capture today.

export type PhotoOrgan = 'auto' | 'whole' | 'leaf' | 'flower' | 'fruit' | 'bark' | 'stem' | 'other';

export const ORGAN_LABEL: Record<PhotoOrgan, string> = {
  auto: '自動',
  whole: '全体',
  leaf: '葉',
  flower: '花',
  fruit: '実',
  bark: '樹皮',
  stem: '茎',
  other: 'その他',
};

/** Cycle order used when the user taps an organ chip to relabel a photo. */
export const ORGAN_CYCLE: PhotoOrgan[] = ['auto', 'whole', 'leaf', 'flower', 'fruit', 'bark', 'stem', 'other'];

export interface CapturedPhoto {
  id: string;
  uri: string;
  base64: string;
  organ: PhotoOrgan;
}

export const MAX_CAPTURE_PHOTOS = 5;
