import { createModelClient } from './model.js';
import { createDefaultToolRegistry, ToolRegistry } from './tools.js';
import { AiContext, AiMessage, AiReply, ModelClient } from './types.js';

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
        '你是儿童健康管理智能体。仅提供生活干预建议，不做诊断结论。输出简洁、可执行。',
      messages: input.messages,
      tools: toolManifest
    });

    return {
      summary: '已完成AI最小应答（P2-T1基座）',
      assistant: generated.text,
      actions: [],
      cards: [],
      riskLevel: 'low'
    };
  }
}

export const createAiOrchestrator = () => {
  return new AiOrchestrator(createModelClient(), createDefaultToolRegistry());
};
