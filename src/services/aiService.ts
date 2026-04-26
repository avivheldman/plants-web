import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import Post from '../models/Post';

const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.0-flash',
    apiKey,
    maxOutputTokens: 1024,
    temperature: 0.3,
  });
};

export const smartSearch = async (query: string, limit = 10): Promise<unknown[]> => {
  const model = getModel();

  const keywordsResponse = await model.invoke([
    new SystemMessage(
      'You are a plant search assistant. Extract relevant search keywords from the user query. ' +
      'Return ONLY a JSON array of keyword strings, nothing else. ' +
      'Include plant names, care terms, and related concepts.'
    ),
    new HumanMessage(query),
  ]);

  let keywords: string[] = [];
  try {
    const content = typeof keywordsResponse.content === 'string'
      ? keywordsResponse.content
      : '';
    const cleaned = content.replace(/```json\n?|```\n?/g, '').trim();
    keywords = JSON.parse(cleaned);
  } catch {
    keywords = query.split(/\s+/).filter((w) => w.length > 2);
  }

  const searchRegex = keywords.map((k) => new RegExp(k, 'i'));

  const posts = await Post.find({
    isPublished: true,
    $or: [
      { title: { $in: searchRegex } },
      { content: { $in: searchRegex } },
      { plantName: { $in: searchRegex } },
      { tags: { $in: keywords.map((k) => k.toLowerCase()) } },
    ],
  })
    .sort({ likesCount: -1, createdAt: -1 })
    .limit(limit)
    .populate('author', 'displayName photoUrl')
    .lean();

  return posts;
};

export const analyzePostContent = async (
  title: string,
  content: string
): Promise<{ summary: string; suggestedTags: string[] }> => {
  const model = getModel();

  const response = await model.invoke([
    new SystemMessage(
      'You are a plant content analyst. Analyze the given post about plants and return a JSON object with: ' +
      '{ "summary": "brief 1-2 sentence summary", "suggestedTags": ["tag1", "tag2", ...] }. ' +
      'Return ONLY the JSON object.'
    ),
    new HumanMessage(`Title: ${title}\n\nContent: ${content}`),
  ]);

  try {
    const text = typeof response.content === 'string' ? response.content : '';
    const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { summary: '', suggestedTags: [] };
  }
};
