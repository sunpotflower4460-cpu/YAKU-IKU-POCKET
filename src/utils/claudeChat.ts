import { PLANTS } from '../data/plants';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Build RAG context from user's collection for the system prompt.
 * This allows Claude to give personalized advice based on what the user has collected.
 */
function buildUserContext(
  discoveredPlantIds: string[],
  playerName: string,
  level: number
): string {
  if (discoveredPlantIds.length === 0) {
    return `ユーザー「${playerName}」（レベル${level}）はまだ植物を収集していません。`;
  }

  const discovered = PLANTS.filter((p) => discoveredPlantIds.includes(p.id));
  const plantList = discovered
    .map((p) => `- ${p.name}（${p.nameEn}）: 効果 [${p.effects.join('、')}]`)
    .join('\n');

  return `ユーザー「${playerName}」（レベル${level}）が現在収集している植物・薬草（${discovered.length}種）:\n${plantList}`;
}

const SYSTEM_PROMPT = `あなたは「やくいくコンシェルジュ」です。東洋医学・薬膳・アーユルヴェーダ・西洋ハーブ療法の知識を持つ、親しみやすい養生アドバイザーです。

あなたの役割:
- ユーザーの健康相談に、収集した植物データをもとに個別化したアドバイスを提供する
- 東洋医学・薬膳・アーユルヴェーダなど複数の視点から情報を提供する
- 難しい専門用語は避け、日常的でやさしい言葉で説明する
- 絵文字を適度に使い、読みやすく親しみやすいトーンで話す

重要なルール:
- 医療診断や治療の代替ではないことを適切なタイミングで伝える
- 「必ず専門家（医師・薬剤師）に確認してください」という旨を症状が重い場合は必ず付け加える
- 危険な植物や過剰摂取のリスクについては正直に伝える
- ユーザーが収集した植物を積極的に活用した提案をする（RAG活用）
- 回答は短すぎず長すぎず、200〜400字程度を目安にする`;

/**
 * Send a message to Claude and get a health consultation response.
 * Includes RAG context from the user's plant collection.
 */
export async function sendHealthChat(
  messages: ChatMessage[],
  discoveredPlantIds: string[],
  playerName: string,
  level: number
): Promise<string> {
  if (!API_KEY) {
    return getMockResponse(messages[messages.length - 1]?.content ?? '');
  }

  const userContext = buildUserContext(discoveredPlantIds, playerName, level);
  const systemWithContext = `${SYSTEM_PROMPT}\n\n【現在のユーザー情報（RAGコンテキスト）】\n${userContext}`;

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: systemWithContext,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Claude API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data?.content?.[0]?.text ?? 'すみません、うまく回答できませんでした。';
}

/**
 * Recipe suggestion using Claude API.
 * Takes a list of available ingredients (plant names) and suggests recipes.
 */
export async function suggestRecipe(
  ingredients: string[],
  goal: string
): Promise<string> {
  if (!API_KEY) {
    return getMockRecipe(ingredients);
  }

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `以下の食材・ハーブ・薬草を使ったレシピを提案してください。

【使える食材・薬草】
${ingredients.join('、')}

【目的・希望】
${goal || '体に良いシンプルなレシピ'}

条件:
- 作りやすいシンプルなレシピ（調理時間15〜30分程度）
- 薬膳・養生の観点からの効果も説明
- 手順は5ステップ以内で簡潔に
- 絵文字を使って読みやすく
- 分量は1〜2人前で記載

形式:
🍽️ レシピ名
📝 材料（1〜2人前）
👨‍🍳 作り方（番号付きで）
✨ 養生ポイント`,
      },
    ],
  };

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Claude API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data?.content?.[0]?.text ?? 'レシピの生成に失敗しました。';
}

// ─── Mock responses (when API key is not set) ─────────────────────────────

function getMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('冷え') || lower.includes('寒')) {
    return '🌿 冷え性には生姜（ショウガ）がとてもおすすめです！\n\n毎朝、すりおろし生姜をお湯に溶かして飲む「生姜湯」を習慣にしてみてください。東洋医学では「冷えは万病の元」と言われています。根菜類（ごぼう・にんじん・れんこん）を積極的に摂ることも大切です。\n\nまた、よもぎを使ったよもぎ蒸しも、子宮や骨盤周りを温めるのに効果的ですよ ✨';
  }
  if (lower.includes('疲れ') || lower.includes('だるい') || lower.includes('疲労')) {
    return '😊 疲労回復にはローズマリーとタンポポコーヒーがおすすめです！\n\nローズマリーは血行を促進して全身に活力を与えてくれます。タンポポの根を焙煎したタンポポコーヒーは、肝臓をサポートして体の代謝を整えてくれます。\n\nまた、アーユルヴェーダではアシュワガンダが「ストレス適応力を高めるハーブ」として有名です。ミルクに混ぜて飲むのがおすすめです 🌿';
  }
  if (lower.includes('眠れ') || lower.includes('不眠') || lower.includes('睡眠')) {
    return '🌙 睡眠の悩みにはカモミールとラベンダーが定番です！\n\nカモミールティーを就寝30分前に飲む習慣をつけてみてください。甘くておだやかな香りが神経をほぐし、自然な眠りへ誘います。\n\n枕元にラベンダーの精油を1〜2滴たらしたアロマディフューザーを置くのもとても効果的です。就寝1時間前からスマートフォンを避けることも合わせて実践してみてください 💜';
  }
  if (lower.includes('胃') || lower.includes('消化') || lower.includes('お腹')) {
    return '🌱 消化不良にはミントとショウガが効果的です！\n\nペパーミントティーは食後に飲むと、消化管の痙攣をやわらげてくれます。生姜は消化酵素の働きを助け、食欲も促進してくれます。\n\n東洋医学では「脾（ひ）」という消化器系を司る臓腑を整えることが大切とされています。食事はよく噛んでゆっくり食べることが根本的な養生です 🍵';
  }

  return '🌿 ご相談ありがとうございます！\n\nより具体的な症状や気になることを教えていただければ、あなたが収集した植物・ハーブをもとに個別のアドバイスをお伝えできます。\n\n例えば「最近疲れやすい」「冷えが気になる」「胃の調子が悪い」など、気軽に話しかけてください 😊\n\n※本アドバイスは一般的な養生情報です。医療診断の代替ではありませんので、症状が気になる場合は医師にご相談ください。';
}

function getMockRecipe(ingredients: string[]): string {
  const main = ingredients[0] ?? 'ハーブ';
  return `🍽️ ${main}の養生茶ブレンド

📝 材料（1〜2人前）
- ${ingredients.slice(0, 3).join(' 少々、')} 各2〜3g
- 熱湯 200ml
- はちみつ お好みで

👨‍🍳 作り方
1. ティーポットにハーブを入れる
2. 熱湯を注ぎ、蓋をして3〜5分蒸らす
3. カップに注ぎ、お好みではちみつを加える
4. ゆっくりと味わいながら飲む

✨ 養生ポイント
収集したハーブをブレンドすることで、相乗効果が生まれます。朝一番や就寝前に飲むと、体内リズムを整えるのに効果的です。

※ APIキーを設定するとClaude AIがより詳しいレシピを提案します！`;
}
