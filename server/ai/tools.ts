import { ToolDefinition, ToolExecutionContext } from './types.js';

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition<any, any>>();

  register<TInput, TResult>(tool: ToolDefinition<TInput, TResult>) {
    this.tools.set(tool.name, tool as ToolDefinition<any, any>);
  }

  list() {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      riskLevel: t.riskLevel || 'low'
    }));
  }

  has(name: string) {
    return this.tools.has(name);
  }

  async execute(name: string, input: any, context: ToolExecutionContext) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return tool.execute(input, context);
  }
}

export const createDefaultToolRegistry = () => {
  const registry = new ToolRegistry();

  registry.register({
    name: 'get_child_context',
    description: 'Get current child context summary for AI planning.',
    async execute(_input, context) {
      return {
        userId: context.userId,
        childProfileId: context.childProfileId ?? null,
        note: 'placeholder: wire real db query in P2-T2/P2-T3'
      };
    }
  });

  registry.register({
    name: 'update_growth',
    description: 'Write growth record (height/weight) after schema validation.',
    riskLevel: 'low',
    async execute(input) {
      return {
        accepted: true,
        input,
        note: 'placeholder: wire real write in P2-T3'
      };
    }
  });

  return registry;
};
