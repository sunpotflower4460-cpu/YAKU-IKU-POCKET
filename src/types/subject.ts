// Subject Router (v3 §12, PR23).
//
// Classifies what a photo actually shows BEFORE attempting species
// identification, so a non-plant or out-of-scope subject gets an honest,
// specific answer instead of either a forced (wrong) plant match or a
// generic "unidentified" dead end.

export type SubjectCategory =
  | 'vascular_plant' // in scope — proceeds to species identification
  | 'moss_or_lichen'
  | 'algae'
  | 'dead_or_processed_plant'
  | 'mushroom'
  | 'insect'
  | 'animal'
  | 'food_or_processed'
  | 'artificial_object'
  | 'multiple_subjects'
  | 'unclear';

/** Honest, category-level guidance — never a fabricated per-image specific. */
export const SUBJECT_CATEGORY_GUIDANCE: Record<SubjectCategory, string> = {
  vascular_plant: '',
  moss_or_lichen: 'コケ・地衣類の可能性があります。現在は種子植物・シダ植物のみに対応しています。',
  algae: '藻類の可能性があります。現在は対応対象外です。',
  dead_or_processed_plant: '枯れた植物、または加工された植物の可能性があります。特定が難しいため、生きた状態の全体・葉・花の写真を追加してください。',
  mushroom: 'キノコの可能性があります。植物識別の対象外です。',
  insect: '昆虫の可能性があります。植物識別の対象外です。',
  animal: '動物の可能性があります。植物識別の対象外です。',
  food_or_processed: '食材・加工品の可能性があります。植物識別の対象外です。',
  artificial_object: '植物ではなく人工物のようです。',
  multiple_subjects: '複数の被写体が写っている可能性があります。1つの植物にズームして撮り直すと精度が上がります。',
  unclear: '画像から判定できませんでした。明るい場所で、葉や花がはっきり写るように撮り直してください。',
};

export const SUBJECT_CATEGORY_LABEL: Record<SubjectCategory, string> = {
  vascular_plant: '植物',
  moss_or_lichen: 'コケ・地衣類',
  algae: '藻類',
  dead_or_processed_plant: '枯れた植物・加工品',
  mushroom: 'キノコ',
  insect: '昆虫',
  animal: '動物',
  food_or_processed: '食材・加工品',
  artificial_object: '人工物',
  multiple_subjects: '複数の被写体',
  unclear: '判定不能',
};
