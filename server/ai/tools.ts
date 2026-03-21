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

const asNumber = (value: any) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const validateGrowthInput = (input: any) => {
  const heightCm = asNumber(input?.heightCm);
  const weightKg = asNumber(input?.weightKg);

  if (heightCm === null || weightKg === null) {
    throw new Error('update_growth requires numeric heightCm and weightKg');
  }

  if (heightCm < 30 || heightCm > 250) {
    throw new Error('heightCm out of valid range (30-250)');
  }

  if (weightKg < 2 || weightKg > 250) {
    throw new Error('weightKg out of valid range (2-250)');
  }

  return {
    heightCm: Number(heightCm.toFixed(1)),
    weightKg: Number(weightKg.toFixed(1)),
    measuredAt: String(input?.measuredAt || new Date().toISOString().slice(0, 10))
  };
};

export const createDefaultToolRegistry = () => {
  const registry = new ToolRegistry();

  registry.register({
    name: 'get_child_context',
    description: 'Get current child context summary for AI planning.',
    async execute(_input, context) {
      return {
        userId: context.userId,
        childProfileId: context.childProfileId ?? null,
        note: 'placeholder: wire real db query in P2-T3'
      };
    }
  });

  registry.register({
    name: 'update_growth',
    description: 'Write growth record (height/weight) after schema validation.',
    riskLevel: 'low',
    async execute(input, context) {
      const normalized = validateGrowthInput(input);
      return {
        accepted: true,
        input: normalized,
        context: {
          userId: context.userId,
          childProfileId: context.childProfileId ?? null
        },
        note: 'placeholder write success: real DB write will be implemented in P2-T3'
      };
    }
  });

  return registry;
};
