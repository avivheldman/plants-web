import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import Post from '../models/Post';

const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey,
    maxOutputTokens: 1024,
    temperature: 0.3,
  });
};

const GEMINI_TIMEOUT_MS = 6000;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout')), ms)
    ),
  ]);

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  const model = new GoogleGenerativeAIEmbeddings({
    model: 'gemini-embedding-001',
    apiKey,
  });
  return model.embedQuery(text);
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
};

const expandQuery = async (query: string): Promise<string> => {
  try {
    const model = getModel();
    const response = await withTimeout(
      model.invoke([
        new SystemMessage(
          'You are a plant search assistant. Rewrite the user query into a richer semantic search phrase ' +
          'by adding related plant concepts, synonyms, and care terms. ' +
          'Return ONLY the expanded phrase as plain text — no JSON, no bullet points, no explanation. ' +
          'Keep it under 30 words. Preserve the original intent.'
        ),
        new HumanMessage(query),
      ]),
      GEMINI_TIMEOUT_MS
    );
    const expanded = typeof response.content === 'string' ? response.content.trim() : '';
    return expanded || query;
  } catch {
    return query;
  }
};

export const smartSearch = async (query: string, limit = 10): Promise<unknown[]> => {
  // Call 1: expand the query semantically, then embed it
  const expandedQuery = await expandQuery(query);
  console.log(`[search] expanded: "${query}" → "${expandedQuery}"`);
  let queryEmbedding: number[];
  try {
    queryEmbedding = await withTimeout(generateEmbedding(expandedQuery), GEMINI_TIMEOUT_MS);
  } catch (err) {
    console.error('[search] embedding failed:', (err as Error).message);
    throw err;
  }

  // Fetch all published posts that have an embedding
  const posts = await Post.find({
    isPublished: true,
    embedding: { $exists: true, $not: { $size: 0 } },
  })
    .select('+embedding')
    .populate('author', 'displayName photoUrl')
    .lean();

  if (posts.length === 0) return [];

  type Scored = Record<string, unknown> & {
    _id?: unknown;
    title: string;
    content: string;
    plantName?: string;
    tags?: string[];
    likesCount?: number;
    _matchScore: number;
    _matchedKeywords: string[];
    _aiReason?: string;
  };

  // Score every post by cosine similarity
  const scored: Scored[] = posts.map((post) => {
    const embedding = (post.embedding as number[] | undefined) ?? [];
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    const postObj = (post as unknown) as Record<string, unknown>;
    return {
      ...postObj,
      embedding: undefined,
      title: post.title,
      content: post.content,
      plantName: post.plantName,
      tags: post.tags,
      likesCount: post.likesCount,
      _matchScore: Math.round(similarity * 100),
      _matchedKeywords: [],
    };
  });

  scored.sort((a, b) => {
    if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore;
    return (b.likesCount ?? 0) - (a.likesCount ?? 0);
  });

  // Relative threshold: within 10 points of top score, hard floor of 65, max 12 results
  const topScore = scored[0]?._matchScore ?? 0;
  const floor = Math.max(topScore - 10, 65);
  const relevant = scored.filter((p) => p._matchScore >= floor);
  const finalList = relevant.length >= 3
    ? relevant.slice(0, 12)
    : scored.slice(0, 3);

  const top = finalList.slice(0, 12);

  // Second Gemini call: get a one-sentence "why" for every top result
  if (top.length > 0) {
    try {
      const model = getModel();
      const idMap = new Map(top.map((p, i) => [String(i), p]));
      const items = top.map((p, i) =>
        `${i}. title="${(p.title || '').slice(0, 80)}" plant="${p.plantName ?? ''}" tags=[${(p.tags ?? []).slice(0, 5).join(',')}]`
      ).join('\n');

      const rerankResponse = await withTimeout(
        model.invoke([
          new SystemMessage(
            'You are a plant search assistant. For EACH numbered post below, write one short sentence ' +
            'explaining why it matches the user query (or its closest connection if the link is weak). ' +
            'Return ONLY a JSON array, one entry per post, in the same order: ' +
            '[{"id":"<the index number shown>","reason":"<one sentence>"}]. ' +
            'Do not skip any post. Do not wrap in markdown.'
          ),
          new HumanMessage(`Query: ${query}\n\nPosts:\n${items}`),
        ]),
        GEMINI_TIMEOUT_MS
      );

      const rerankText = typeof rerankResponse.content === 'string' ? rerankResponse.content : '';
      const rerankCleaned = rerankText.replace(/```json\n?|```\n?/g, '').trim();
      const arrayMatch = rerankCleaned.match(/\[[\s\S]*\]/);
      const jsonText = arrayMatch ? arrayMatch[0] : rerankCleaned;
      const parsed = JSON.parse(jsonText) as Array<{ id?: string | number; reason?: string }>;

      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          const post = idMap.get(String(entry.id));
          if (post && typeof entry.reason === 'string' && entry.reason.trim()) {
            post._aiReason = entry.reason.trim();
          }
        }
      }
    } catch (err) {
      console.warn('Gemini reason generation failed:', (err as Error).message);
    }
  }

  return finalList.slice(0, limit);
};

export const analyzePostContent = async (
  title: string,
  content: string
): Promise<{ summary: string; suggestedTags: string[] }> => {
  try {
    const model = getModel();
    const response = await withTimeout(
      model.invoke([
        new SystemMessage(
          'You are a plant content analyst. Analyze the given post about plants and return a JSON object with: ' +
          '{ "summary": "brief 1-2 sentence summary", "suggestedTags": ["tag1", "tag2", ...] }. ' +
          'Return ONLY the JSON object.'
        ),
        new HumanMessage(`Title: ${title}\n\nContent: ${content}`),
      ]),
      GEMINI_TIMEOUT_MS
    );
    const text = typeof response.content === 'string' ? response.content : '';
    const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('Gemini analyze failed:', (err as Error).message);
    return { summary: '', suggestedTags: [] };
  }
};
