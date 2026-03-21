import { AiMessage, ModelClient } from './types.js';

class MockModelClient implements ModelClient {
  async generate(input: { systemPrompt: string; messages: AiMessage[] }) {
    const lastUser = [...input.messages].reverse().find((m) => m.role === 'user')?.content || '';
    return {
      text: `已收到：${lastUser}`
    };
  }
}

class OpenAICompatibleClient implements ModelClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async generate(input: { systemPrompt: string; messages: AiMessage[] }) {
    const resp = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: input.systemPrompt },
          ...input.messages.map((m) => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.2
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Model request failed: ${resp.status} ${text}`);
    }

    const data = (await resp.json()) as any;
    const text = data?.choices?.[0]?.message?.content || '';
    return { text };
  }
}

export const createModelClient = (): ModelClient => {
  const provider = process.env.AI_PROVIDER || 'mock';

  if (provider === 'openai-compatible') {
    const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    const apiKey = process.env.AI_API_KEY || '';
    const model = process.env.AI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      throw new Error('AI_PROVIDER=openai-compatible requires AI_API_KEY');
    }

    return new OpenAICompatibleClient(baseUrl, apiKey, model);
  }

  return new MockModelClient();
};
