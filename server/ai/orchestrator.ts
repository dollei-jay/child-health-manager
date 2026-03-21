import { createModelClient } from './model.js';
import { createDefaultToolRegistry, ToolAdapters, ToolRegistry } from './tools.js';
import { AiAction, AiContext, AiMessage, AiReply, ModelClient } from './types.js';

const stripCodeFence = (text: string) => {
  const trimmed = String(text || '').trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
};

const parseActionEnvelope = (text: string): {
  answer: string;
  functionCall?: { name: string; arguments?: Record<string, any> };
} => {
  try {
    const parsed = JSON.parse(stripCodeFence(text));
    if (parsed && typeof parsed === 'object' && typeof parsed.answer === 'string') {
      return {
        answer: parsed.answer,
        functionCall:
          parsed.functionCall && typeof parsed.functionCall?.name === 'string'
            ? {
                name: parsed.functionCall.name,
                arguments: typeof parsed.functionCall.arguments === 'object' ? parsed.functionCall.arguments : {}
              }
            : undefined
      };
    }
  } catch {
    // fallback: plain text
  }

  return { answer: text };
};

export class AiOrchestrator {
  constructor(
    private readonly modelClient: ModelClient,
    private readonly tools: ToolRegistry
  ) {}

  async chat(input: { context: AiContext; messages: AiMessage[] }): Promise<AiReply> {
    const toolManifest = this.tools.list().map((t) => ({
      name: t.name,
      description: t.description
    }));

    const generated = await this.modelClient.generate({
      systemPrompt:
        [
          '你是儿童健康管理智能体。',
          '仅提供生活干预建议，不做诊断结论。',
          '如果需要调用工具，请严格返回 JSON：',
          '{"answer":"给用户的话","functionCall":{"name":"tool_name","arguments":{}}}',
          '如果不需要调用工具，只返回自然语言文本。'
        ].join('\n'),
      messages: input.messages,
      tools: toolManifest
    });

    const envelope = parseActionEnvelope(generated.text);
    const actions: AiAction[] = [];

    if (envelope.functionCall?.name && this.tools.has(envelope.functionCall.name)) {
      const result = await this.tools.execute(envelope.functionCall.name, envelope.functionCall.arguments || {}, {
        userId: input.context.userId,
        childProfileId: input.context.childProfileId,
        sessionId: input.context.sessionId
      });

      actions.push({
        type: envelope.functionCall.name,
        status: 'done',
        summary: '函数调用已执行'
      });

      return {
        summary: '已完成AI应答并执行1次函数调用',
        assistant: envelope.answer,
        actions,
        cards: [
          {
            type: 'ai_tool_result',
            title: '函数执行结果',
            data: result
          }
        ],
        riskLevel: 'low'
      };
    }

    return {
      summary: '已完成AI应答（无工具调用）',
      assistant: envelope.answer,
      actions,
      cards: [],
      riskLevel: 'low'
    };
  }

  async runFunctionCall(input: {
    context: AiContext;
    functionCall: { name: string; arguments?: Record<string, any> };
    answer?: string;
  }): Promise<AiReply> {
    const actions: AiAction[] = [];

    const fc = input.functionCall;
    if (!fc?.name || !this.tools.has(fc.name)) {
      return {
        summary: '函数调用无效或不在白名单',
        assistant: input.answer || '函数调用无效或不在白名单。',
        actions: [
          {
            type: fc?.name || 'unknown',
            status: 'blocked',
            reason: 'tool not allowed'
          }
        ],
        cards: [],
        riskLevel: 'medium'
      };
    }

    const result = await this.tools.execute(fc.name, fc.arguments || {}, {
      userId: input.context.userId,
      childProfileId: input.context.childProfileId,
      sessionId: input.context.sessionId
    });

    actions.push({
      type: fc.name,
      status: 'done',
      summary: '函数调用已执行'
    });

    return {
      summary: '已执行指定函数调用',
      assistant: input.answer || '已按你的指令完成执行。',
      actions,
      cards: [
        {
          type: 'ai_tool_result',
          title: '函数执行结果',
          data: result
        }
      ],
      riskLevel: 'low'
    };
  }
}

export const createAiOrchestrator = (adapters: ToolAdapters = {}) => {
  return new AiOrchestrator(createModelClient(), createDefaultToolRegistry(adapters));
};
