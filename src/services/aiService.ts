import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import OpenAI from 'openai';

export interface PlantSearchResult {
  query: string;
  interpretation: string;
  suggestions: string[];
  searchTerms: string[];
  category?: string;
}

export interface PlantIdentificationResult {
  plantName: string;
  scientificName?: string;
  confidence: number;
  careInstructions: string[];
  commonIssues: string[];
  description: string;
}

// Gemini AI Service
class GeminiService {
  private model: GenerativeModel | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  isAvailable(): boolean {
    return this.model !== null;
  }

  async smartSearch(query: string): Promise<PlantSearchResult> {
    if (!this.model) {
      throw new Error('Gemini API not configured');
    }

    const prompt = `You are a plant expert assistant. Analyze this search query about plants: "${query}"

    Respond in JSON format with:
    {
      "interpretation": "What the user is likely looking for",
      "suggestions": ["3-5 helpful search suggestions"],
      "searchTerms": ["optimized search terms to use"],
      "category": "indoor|outdoor|vegetable|flower|succulent|tree|herb|other"
    }

    Only respond with valid JSON, no markdown.`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    try {
      const parsed = JSON.parse(response);
      return {
        query,
        interpretation: parsed.interpretation || '',
        suggestions: parsed.suggestions || [],
        searchTerms: parsed.searchTerms || [query],
        category: parsed.category,
      };
    } catch {
      return {
        query,
        interpretation: 'General plant search',
        suggestions: [query],
        searchTerms: [query],
      };
    }
  }

  async identifyPlant(imageBase64: string): Promise<PlantIdentificationResult> {
    if (!this.model) {
      throw new Error('Gemini API not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const prompt = `Identify this plant and provide care information.

    Respond in JSON format:
    {
      "plantName": "Common name",
      "scientificName": "Scientific name if known",
      "confidence": 0.0-1.0,
      "careInstructions": ["List of care tips"],
      "commonIssues": ["Common problems to watch for"],
      "description": "Brief description of the plant"
    }

    Only respond with valid JSON.`;

    const result = await visionModel.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      },
    ]);

    const response = result.response.text();

    try {
      return JSON.parse(response);
    } catch {
      return {
        plantName: 'Unknown',
        confidence: 0,
        careInstructions: [],
        commonIssues: [],
        description: 'Could not identify the plant',
      };
    }
  }

  async getCareTips(plantName: string): Promise<string[]> {
    if (!this.model) {
      throw new Error('Gemini API not configured');
    }

    const prompt = `Provide 5-7 essential care tips for ${plantName}.
    Respond as a JSON array of strings only.
    Example: ["Tip 1", "Tip 2", "Tip 3"]`;

    const result = await this.model.generateContent(prompt);
    const response = result.response.text();

    try {
      return JSON.parse(response);
    } catch {
      return [`Care for ${plantName} with proper watering and light.`];
    }
  }
}

// OpenAI Service
class OpenAIService {
  private client: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async smartSearch(query: string): Promise<PlantSearchResult> {
    if (!this.client) {
      throw new Error('OpenAI API not configured');
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a plant expert. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: `Analyze this plant search query: "${query}"

          Respond with JSON:
          {
            "interpretation": "What the user is looking for",
            "suggestions": ["3-5 search suggestions"],
            "searchTerms": ["optimized terms"],
            "category": "indoor|outdoor|vegetable|flower|succulent|tree|herb|other"
          }`,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '{}';

    try {
      const parsed = JSON.parse(content);
      return {
        query,
        interpretation: parsed.interpretation || '',
        suggestions: parsed.suggestions || [],
        searchTerms: parsed.searchTerms || [query],
        category: parsed.category,
      };
    } catch {
      return {
        query,
        interpretation: 'General plant search',
        suggestions: [query],
        searchTerms: [query],
      };
    }
  }

  async identifyPlant(imageUrl: string): Promise<PlantIdentificationResult> {
    if (!this.client) {
      throw new Error('OpenAI API not configured');
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Identify this plant and provide care information in JSON format:
              {
                "plantName": "Common name",
                "scientificName": "Scientific name",
                "confidence": 0.0-1.0,
                "careInstructions": ["tips"],
                "commonIssues": ["issues"],
                "description": "Brief description"
              }`,
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '{}';

    try {
      return JSON.parse(content);
    } catch {
      return {
        plantName: 'Unknown',
        confidence: 0,
        careInstructions: [],
        commonIssues: [],
        description: 'Could not identify the plant',
      };
    }
  }

  async getCareTips(plantName: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('OpenAI API not configured');
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Provide 5-7 care tips for ${plantName} as a JSON array of strings only.`,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '[]';

    try {
      return JSON.parse(content);
    } catch {
      return [`Care for ${plantName} with proper watering and light.`];
    }
  }
}

// Unified AI Service
class AIService {
  private gemini: GeminiService;
  private openai: OpenAIService;

  constructor() {
    this.gemini = new GeminiService();
    this.openai = new OpenAIService();
  }

  getProvider(): 'gemini' | 'openai' | null {
    if (this.gemini.isAvailable()) return 'gemini';
    if (this.openai.isAvailable()) return 'openai';
    return null;
  }

  async smartSearch(query: string): Promise<PlantSearchResult> {
    if (this.gemini.isAvailable()) {
      return this.gemini.smartSearch(query);
    }
    if (this.openai.isAvailable()) {
      return this.openai.smartSearch(query);
    }
    // Fallback response without AI
    return {
      query,
      interpretation: 'Search for plants',
      suggestions: [query],
      searchTerms: query.toLowerCase().split(' '),
    };
  }

  async identifyPlant(imageData: string, isBase64: boolean = true): Promise<PlantIdentificationResult> {
    if (isBase64 && this.gemini.isAvailable()) {
      return this.gemini.identifyPlant(imageData);
    }
    if (!isBase64 && this.openai.isAvailable()) {
      return this.openai.identifyPlant(imageData);
    }
    throw new Error('No AI service available for plant identification');
  }

  async getCareTips(plantName: string): Promise<string[]> {
    if (this.gemini.isAvailable()) {
      return this.gemini.getCareTips(plantName);
    }
    if (this.openai.isAvailable()) {
      return this.openai.getCareTips(plantName);
    }
    return [`Ensure proper care for ${plantName}.`];
  }
}

export const aiService = new AIService();
export default aiService;
