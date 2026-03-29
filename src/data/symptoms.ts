export interface SymptomRemedy {
  plantId: string;
  plantName: string;
  emoji: string;
  method: string;       // 摂取方法
  description: string;  // 効果の説明
}

export interface SymptomEntry {
  id: string;
  symptom: string;
  emoji: string;
  category: SymptomCategory;
  remedies: SymptomRemedy[];
  advice: string;
  warningNote?: string;
}

export type SymptomCategory =
  | '消化・胃腸'
  | '呼吸・風邪'
  | '皮膚・外用'
  | '疲労・回復'
  | '精神・ストレス'
  | '冷え・血行'
  | '解毒・デトックス'
  | '女性の悩み'
  | '免疫・抗炎症';

export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  '消化・胃腸',
  '呼吸・風邪',
  '皮膚・外用',
  '疲労・回復',
  '精神・ストレス',
  '冷え・血行',
  '解毒・デトックス',
  '女性の悩み',
  '免疫・抗炎症',
];

export const SYMPTOMS: SymptomEntry[] = [
  // ─── 消化・胃腸 ──────────────────────────────────────────────
  {
    id: 's001',
    symptom: '胃もたれ・消化不良',
    emoji: '🤢',
    category: '消化・胃腸',
    remedies: [
      {
        plantId: 'p001',
        plantName: 'タンポポ',
        emoji: '🌼',
        method: 'お茶（葉・根を乾燥して煎じる）',
        description: '胆汁分泌を促し、消化を助けます。食後に飲むと効果的。',
      },
      {
        plantId: 'p016',
        plantName: 'ミント',
        emoji: '🌿',
        method: 'ハーブティー（葉を熱湯で3分蒸らす）',
        description: '消化管の痙攣をやわらげ、胃もたれをすっきりさせます。',
      },
      {
        plantId: 'p027',
        plantName: 'ショウガ',
        emoji: '🫚',
        method: '生姜湯・料理に加える',
        description: '消化酵素の働きを活発にし、食欲を促進します。',
      },
    ],
    advice: '食事はゆっくりよく噛んで食べることが根本的な対策です。ハーブティーは食後30分以内に飲むと効果的です。',
    warningNote: '症状が続く場合は消化器内科を受診してください。',
  },
  {
    id: 's002',
    symptom: '便秘',
    emoji: '😣',
    category: '消化・胃腸',
    remedies: [
      {
        plantId: 'p003',
        plantName: 'ドクダミ',
        emoji: '🍃',
        method: 'お茶（乾燥葉を煎じる）',
        description: '腸の動きを整え、老廃物の排出を助けます。',
      },
      {
        plantId: 'p001',
        plantName: 'タンポポ',
        emoji: '🌼',
        method: 'サラダ・お茶',
        description: '食物繊維と消化促進作用で腸内環境を整えます。',
      },
      {
        plantId: 'p024',
        plantName: 'フェンネル',
        emoji: '🌾',
        method: 'ハーブティー・料理のスパイス',
        description: '腸のガスを抜き、腸蠕動を促進します。',
      },
    ],
    advice: '水分をしっかり摂り、食物繊維の多い食事を心がけましょう。朝起きたら白湯を飲む習慣も効果的です。',
  },
  {
    id: 's003',
    symptom: '腹痛・下痢',
    emoji: '🤧',
    category: '消化・胃腸',
    remedies: [
      {
        plantId: 'p016',
        plantName: 'ミント',
        emoji: '🌿',
        method: 'ハーブティー（薄めに作る）',
        description: '腸の痙攣をやわらげ、腹痛を緩和します。',
      },
      {
        plantId: 'p027',
        plantName: 'ショウガ',
        emoji: '🫚',
        method: '生姜湯（温かく飲む）',
        description: '腸を温め、消化器系の炎症を鎮めます。',
      },
    ],
    advice: 'まずは水分補給が最優先です。温かい飲み物でお腹を温めましょう。脱水が心配な場合は経口補水液も有効です。',
    warningNote: '激しい腹痛・血便・高熱を伴う場合はすぐに医療機関へ。',
  },

  // ─── 呼吸・風邪 ──────────────────────────────────────────────
  {
    id: 's004',
    symptom: '咳・のどの痛み',
    emoji: '😷',
    category: '呼吸・風邪',
    remedies: [
      {
        plantId: 'p004',
        plantName: 'オオバコ',
        emoji: '🌱',
        method: 'お茶（葉を煎じる）・うがい',
        description: '粘膜を保護し、咳を鎮める作用があります。',
      },
      {
        plantId: 'p027',
        plantName: 'ショウガ',
        emoji: '🫚',
        method: '生姜蜂蜜湯',
        description: '抗菌・抗炎症作用でのどの痛みを和らげます。',
      },
      {
        plantId: 'p028',
        plantName: 'タイム',
        emoji: '🌿',
        method: 'ハーブティー・蒸気吸入',
        description: '強力な抗菌作用で気道の炎症を鎮めます。',
      },
    ],
    advice: '室内の加湿と十分な水分補給が大切です。ハーブティーにはちみつを加えると効果が高まります。',
    warningNote: '高熱・呼吸困難・1週間以上続く症状は医師に相談してください。',
  },
  {
    id: 's005',
    symptom: '鼻づまり・鼻水',
    emoji: '🤧',
    category: '呼吸・風邪',
    remedies: [
      {
        plantId: 'p016',
        plantName: 'ミント',
        emoji: '🌿',
        method: '蒸気吸入（熱湯に葉を入れて吸う）',
        description: 'メントールの成分が鼻腔を広げ、通りをよくします。',
      },
      {
        plantId: 'p028',
        plantName: 'タイム',
        emoji: '🌿',
        method: 'ハーブティー',
        description: '抗菌・去痰作用で鼻腔の炎症を鎮めます。',
      },
    ],
    advice: '鼻腔を温める温タオルや、蒸気吸入が即効性があります。就寝前のミント蒸気吸入が特に効果的。',
  },
  {
    id: 's006',
    symptom: '発熱・免疫低下',
    emoji: '🌡️',
    category: '呼吸・風邪',
    remedies: [
      {
        plantId: 'p002',
        plantName: 'ヨモギ',
        emoji: '🌿',
        method: 'お茶（乾燥葉を煎じる）',
        description: '体を温め、免疫機能を高めます。',
      },
      {
        plantId: 'p038',
        plantName: 'エキナセア',
        emoji: '🌸',
        method: 'ハーブティー',
        description: '免疫系を活性化し、ウイルスへの抵抗力を高めます。',
      },
    ],
    advice: '安静と十分な睡眠が最も重要です。水分をこまめに補給しましょう。',
    warningNote: '38.5℃以上の発熱や症状が改善しない場合は医師の診察を。',
  },

  // ─── 疲労・回復 ──────────────────────────────────────────────
  {
    id: 's007',
    symptom: '疲労感・倦怠感',
    emoji: '😴',
    category: '疲労・回復',
    remedies: [
      {
        plantId: 'p034',
        plantName: 'ローズマリー',
        emoji: '🌿',
        method: 'ハーブティー・アロマ・料理',
        description: '血行を促進し、全身の活力を取り戻すサポートをします。',
      },
      {
        plantId: 'p001',
        plantName: 'タンポポ',
        emoji: '🌼',
        method: 'タンポポコーヒー（根を焙煎）',
        description: '肝臓をサポートし、体内の疲労物質の代謝を助けます。',
      },
      {
        plantId: 'p025',
        plantName: 'アシュワガンダ',
        emoji: '🌿',
        method: 'パウダーをミルクに混ぜる',
        description: 'アダプトゲンとして身体のストレス耐性を高め疲労回復を促進。',
      },
    ],
    advice: '十分な睡眠と栄養バランスの良い食事が基本です。ハーブは補助的な役割として活用しましょう。',
  },
  {
    id: 's008',
    symptom: '睡眠の悩み・不眠',
    emoji: '🌙',
    category: '疲労・回復',
    remedies: [
      {
        plantId: 'p039',
        plantName: 'カモミール',
        emoji: '🌼',
        method: 'ハーブティー（就寝30分前）',
        description: '神経系をやわらげ、自然な眠りへ誘います。',
      },
      {
        plantId: 'p040',
        plantName: 'ラベンダー',
        emoji: '💜',
        method: 'アロマ・ハーブティー・枕元に置く',
        description: '鎮静作用で心身をリラックスさせ、深い眠りをサポート。',
      },
    ],
    advice: '就寝1時間前からスマートフォンを避け、温かいハーブティーでリラックスしましょう。瞑想も効果的です。',
  },

  // ─── 精神・ストレス ──────────────────────────────────────────
  {
    id: 's009',
    symptom: 'ストレス・不安感',
    emoji: '😰',
    category: '精神・ストレス',
    remedies: [
      {
        plantId: 'p040',
        plantName: 'ラベンダー',
        emoji: '💜',
        method: 'アロマテラピー・ハーブティー',
        description: '鎮静作用で不安感を和らげ、心を落ち着かせます。',
      },
      {
        plantId: 'p039',
        plantName: 'カモミール',
        emoji: '🌼',
        method: 'ハーブティー',
        description: '神経の緊張をほぐし、穏やかな気持ちを取り戻します。',
      },
      {
        plantId: 'p016',
        plantName: 'ミント',
        emoji: '🌿',
        method: 'アロマ・ハーブティー',
        description: '清涼感が気分をリフレッシュし、頭をすっきりさせます。',
      },
    ],
    advice: '深呼吸や瞑想を日課にすることが根本的な対策になります。自然の中で過ごす時間も心に良い影響を与えます。',
  },
  {
    id: 's010',
    symptom: '頭痛・頭重感',
    emoji: '🤕',
    category: '精神・ストレス',
    remedies: [
      {
        plantId: 'p016',
        plantName: 'ミント',
        emoji: '🌿',
        method: 'こめかみに薄めたミントオイルを塗る・ハーブティー',
        description: 'メントールの冷却作用が緊張性頭痛をやわらげます。',
      },
      {
        plantId: 'p034',
        plantName: 'ローズマリー',
        emoji: '🌿',
        method: 'アロマ・ハーブティー',
        description: '脳への血流を改善し、頭重感を軽減します。',
      },
      {
        plantId: 'p027',
        plantName: 'ショウガ',
        emoji: '🫚',
        method: '生姜湯',
        description: '血行促進作用で血管性頭痛を緩和します。',
      },
    ],
    advice: '水分不足や睡眠不足が頭痛の原因になることが多いです。まず水を飲んで休息を取りましょう。',
    warningNote: '突然の激しい頭痛・視覚異常・麻痺を伴う場合は救急へ。',
  },

  // ─── 冷え・血行 ──────────────────────────────────────────────
  {
    id: 's011',
    symptom: '冷え性・手足の冷え',
    emoji: '🥶',
    category: '冷え・血行',
    remedies: [
      {
        plantId: 'p002',
        plantName: 'ヨモギ',
        emoji: '🌿',
        method: 'よもぎ蒸し・足湯・お茶',
        description: '血行を促進し、体の芯から温めます。',
      },
      {
        plantId: 'p027',
        plantName: 'ショウガ',
        emoji: '🫚',
        method: '生姜湯・料理に多用',
        description: '身体を内側から温め、末梢の血行を改善します。',
      },
      {
        plantId: 'p034',
        plantName: 'ローズマリー',
        emoji: '🌿',
        method: 'ハーブティー・入浴剤',
        description: '血液循環を促進し、全身を温めます。',
      },
    ],
    advice: '体を温める食材（根菜・発酵食品）を積極的に摂りましょう。冷たい飲み物を控えることも大切です。',
  },
  {
    id: 's012',
    symptom: 'むくみ',
    emoji: '💧',
    category: '冷え・血行',
    remedies: [
      {
        plantId: 'p001',
        plantName: 'タンポポ',
        emoji: '🌼',
        method: 'お茶（根・葉を煎じる）',
        description: '天然の利尿作用で余分な水分の排出を助けます。',
      },
      {
        plantId: 'p004',
        plantName: 'オオバコ',
        emoji: '🌱',
        method: 'お茶',
        description: '利尿作用でむくみを改善します。',
      },
      {
        plantId: 'p024',
        plantName: 'フェンネル',
        emoji: '🌾',
        method: 'ハーブティー',
        description: '利尿・代謝促進作用でむくみを解消します。',
      },
    ],
    advice: '長時間同じ姿勢を避け、足を動かす習慣をつけましょう。塩分の摂りすぎにも注意。',
  },

  // ─── 皮膚・外用 ──────────────────────────────────────────────
  {
    id: 's013',
    symptom: '肌荒れ・ニキビ',
    emoji: '😖',
    category: '皮膚・外用',
    remedies: [
      {
        plantId: 'p003',
        plantName: 'ドクダミ',
        emoji: '🍃',
        method: '化粧水（煎じ液を薄めて）・内服茶',
        description: '強い抗菌・抗炎症作用で肌トラブルを改善します。',
      },
      {
        plantId: 'p039',
        plantName: 'カモミール',
        emoji: '🌼',
        method: '蒸気スチーム・化粧水',
        description: '敏感肌にも優しく、炎症を鎮めます。',
      },
    ],
    advice: '内側からのケアも重要です。腸内環境を整えることで肌荒れが改善するケースが多くあります。',
    warningNote: '植物アレルギーをお持ちの方は外用前にパッチテストを行ってください。',
  },
  {
    id: 's014',
    symptom: '虫刺され・かゆみ',
    emoji: '🦟',
    category: '皮膚・外用',
    remedies: [
      {
        plantId: 'p003',
        plantName: 'ドクダミ',
        emoji: '🍃',
        method: '生葉を揉んで患部に当てる',
        description: '抗炎症・抗菌作用でかゆみと炎症を素早く鎮めます。',
      },
      {
        plantId: 'p040',
        plantName: 'ラベンダー',
        emoji: '💜',
        method: '精油を希釈して患部に塗布',
        description: '抗炎症・鎮静作用でかゆみをやわらげます。',
      },
    ],
    advice: '患部を搔きこわさないよう冷やすことが先決。清潔に保ち、植物を使う前は必ず希釈してください。',
    warningNote: 'アレルギー反応（腫れ・蕁麻疹）が出た場合はすぐに使用を中止。',
  },

  // ─── 解毒・デトックス ────────────────────────────────────────
  {
    id: 's015',
    symptom: '体のだるさ・デトックスしたい',
    emoji: '🌿',
    category: '解毒・デトックス',
    remedies: [
      {
        plantId: 'p003',
        plantName: 'ドクダミ',
        emoji: '🍃',
        method: 'お茶（毎日1〜2杯）',
        description: '解毒・デトックスの代表的な薬草。老廃物の排出を促します。',
      },
      {
        plantId: 'p001',
        plantName: 'タンポポ',
        emoji: '🌼',
        method: 'タンポポコーヒー・サラダ',
        description: '肝臓の解毒機能をサポートし、体内浄化を助けます。',
      },
      {
        plantId: 'p008',
        plantName: 'スギナ',
        emoji: '🌱',
        method: 'お茶（乾燥させて煎じる）',
        description: '利尿作用が強く、体内の老廃物や毒素の排出を促します。',
      },
    ],
    advice: '日常的な水分摂取（1日1.5〜2L）と、食物繊維の多い食事がデトックスの基本です。',
  },

  // ─── 免疫・抗炎症 ────────────────────────────────────────────
  {
    id: 's016',
    symptom: '免疫力を高めたい',
    emoji: '🛡️',
    category: '免疫・抗炎症',
    remedies: [
      {
        plantId: 'p029',
        plantName: 'ターメリック',
        emoji: '🟡',
        method: 'ゴールデンミルク・料理のスパイス',
        description: 'クルクミンが強力な抗炎症・免疫賦活作用を発揮します。',
      },
      {
        plantId: 'p038',
        plantName: 'エキナセア',
        emoji: '🌸',
        method: 'ハーブティー（シーズン前に飲む）',
        description: '白血球を活性化し、ウイルスへの抵抗力を高めます。',
      },
      {
        plantId: 'p027',
        plantName: 'ショウガ',
        emoji: '🫚',
        method: '毎日の料理・生姜湯',
        description: 'ジンゲロールが抗酸化・抗炎症作用で免疫をサポート。',
      },
    ],
    advice: '免疫力は毎日の生活習慣が基本。十分な睡眠・適度な運動・ストレス管理を優先しましょう。',
  },
  {
    id: 's017',
    symptom: '関節痛・筋肉痛',
    emoji: '🦵',
    category: '免疫・抗炎症',
    remedies: [
      {
        plantId: 'p029',
        plantName: 'ターメリック',
        emoji: '🟡',
        method: 'ゴールデンミルク・サプリ',
        description: 'クルクミンが関節の炎症を強力に鎮めます。',
      },
      {
        plantId: 'p034',
        plantName: 'ローズマリー',
        emoji: '🌿',
        method: 'マッサージオイル（希釈）・お茶',
        description: '抗炎症・血行促進作用で筋肉の回復を助けます。',
      },
      {
        plantId: 'p027',
        plantName: 'ショウガ',
        emoji: '🫚',
        method: '生姜湿布・生姜湯',
        description: '温熱作用と抗炎症作用で痛みをやわらげます。',
      },
    ],
    advice: '適度な休息と温熱療法が基本です。植物は補助的に活用しましょう。',
    warningNote: '激しい痛みや腫れが続く場合は整形外科・リウマチ科へ。',
  },

  // ─── 女性の悩み ──────────────────────────────────────────────
  {
    id: 's018',
    symptom: '生理痛・PMSの緩和',
    emoji: '🌸',
    category: '女性の悩み',
    remedies: [
      {
        plantId: 'p002',
        plantName: 'ヨモギ',
        emoji: '🌿',
        method: 'よもぎ蒸し・お茶・足浴',
        description: '子宮を温め、血行を促進。生理痛を和らげる古来からの知恵。',
      },
      {
        plantId: 'p039',
        plantName: 'カモミール',
        emoji: '🌼',
        method: 'ハーブティー（温かく）',
        description: '子宮の痙攣をやわらげ、PMSによるイライラも鎮めます。',
      },
      {
        plantId: 'p040',
        plantName: 'ラベンダー',
        emoji: '💜',
        method: '腹部アロママッサージ',
        description: '鎮痛・鎮静作用で生理痛と精神的な不調を緩和します。',
      },
    ],
    advice: '身体を冷やさないことが最も重要。温かい飲み物・腹部を温めることを日常的に心がけましょう。',
  },
];
