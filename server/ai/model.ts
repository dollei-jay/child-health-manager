import { AiMessage, ModelClient } from './types.js';

class MockModelClient implements ModelClient {
  async generate(input: { systemPrompt: string; messages: AiMessage[] }) {
    const lastUser = String([...input.messages].reverse().find((m) => m.role === 'user')?.content || '').trim();

    // 基础建议问答（不调用工具）
    if (/建议|怎么做|咋办|最近/.test(lastUser)) {
      return {
        text: [
          '最近建议先抓 3 件事：',
          '1) 每周至少记录 1 次身高体重，确保趋势可追踪。',
          '2) 每天优先完成“早餐/运动/早睡”三项打卡。',
          '3) 周末做一次复盘，下一周计划与采购清单同步调整。'
        ].join('\n')
      };
    }

    // 身高体重识别 -> update_growth
    const hw = /(?:身高|高)\s*(\d{2,3}(?:\.\d)?)\s*(?:cm|厘米)?[，,\s]*.*(?:体重|重)\s*(\d{1,3}(?:\.\d)?)\s*(?:kg|公斤)?/i.exec(lastUser);
    if (hw) {
      return {
        text: JSON.stringify({
          answer: `收到，已按你提供的数据准备记录：身高${hw[1]}cm，体重${hw[2]}kg。`,
          functionCall: {
            name: 'update_growth',
            arguments: {
              heightCm: Number(hw[1]),
              weightKg: Number(hw[2]),
              measuredAt: new Date().toISOString().slice(0, 10)
            }
          }
        })
      };
    }

    // 待办识别 -> add_todo
    const todoMatch = /(?:待办|提醒|记一下|记个|安排)(?:：|:)?\s*(.+)/.exec(lastUser);
    if (todoMatch && todoMatch[1]?.trim()) {
      return {
        text: JSON.stringify({
          answer: `好的，已准备新增待办：${todoMatch[1].trim()}`,
          functionCall: {
            name: 'add_todo',
            arguments: {
              text: todoMatch[1].trim().slice(0, 120),
              priority: 'medium'
            }
          }
        })
      };
    }

    // 医疗记录识别 -> add_diagnosis（仍由后端确认门禁控制）
    if (/诊断|就医|复查|医生/.test(lastUser)) {
      return {
        text: JSON.stringify({
          answer: '我先为你整理成医疗记录草稿，确认后写入。',
          functionCall: {
            name: 'add_diagnosis',
            arguments: {
              diagnosisText: lastUser.slice(0, 200),
              adviceText: '请结合医生建议执行，并按时复查。',
              riskFlag: 'warning',
              visitDate: new Date().toISOString().slice(0, 10)
            }
          }
        })
      };
    }

    return {
      text: [
        '已收到。为便于我直接执行，请用以下格式之一：',
        '1) 记录身高体重：例如“今天身高130.56，体重28.34”',
        '2) 新增待办：例如“记个待办：周五复查”',
        '3) 生成计划：例如“帮我生成一周计划”',
        '4) 生成采购：例如“帮我生成采购清单”'
      ].join('\n')
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
