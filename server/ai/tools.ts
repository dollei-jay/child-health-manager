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

const validateTodoInput = (input: any) => {
  const text = String(input?.text || '').trim();
  const priorityRaw = String(input?.priority || 'medium').trim().toLowerCase();
  const priority = ['low', 'medium', 'high'].includes(priorityRaw) ? priorityRaw : 'medium';
  const dueDate = input?.dueDate ? String(input.dueDate).slice(0, 10) : null;

  if (!text) {
    throw new Error('add_todo requires non-empty text');
  }

  return { text: text.slice(0, 200), priority, dueDate };
};

export interface ToolAdapters {
  persistGrowth?: (input: { heightCm: number; weightKg: number; measuredAt: string }, context: ToolExecutionContext) => Promise<any>;
  persistTodo?: (input: { text: string; priority: string; dueDate: string | null }, context: ToolExecutionContext) => Promise<any>;
}

export const createDefaultToolRegistry = (adapters: ToolAdapters = {}) => {
  const registry = new ToolRegistry();

  registry.register({
    name: 'get_child_context',
    description: 'Get current child context summary for AI planning.',
    async execute(_input, context) {
      return {
        userId: context.userId,
        childProfileId: context.childProfileId ?? null,
        note: 'placeholder: wire richer child context later'
      };
    }
  });

  registry.register({
    name: 'update_growth',
    description: 'Write growth record (height/weight) after schema validation.',
    riskLevel: 'low',
    async execute(input, context) {
      const normalized = validateGrowthInput(input);
      if (adapters.persistGrowth) {
        return adapters.persistGrowth(normalized, context);
      }
      return {
        accepted: true,
        input: normalized,
        context,
        note: 'placeholder write success: adapter not configured'
      };
    }
  });

  registry.register({
    name: 'add_todo',
    description: 'Add a todo item with priority and optional due date.',
    riskLevel: 'low',
    async execute(input, context) {
      const normalized = validateTodoInput(input);
      if (adapters.persistTodo) {
        return adapters.persistTodo(normalized, context);
      }
      return {
        accepted: true,
        input: normalized,
        context,
        note: 'placeholder write success: adapter not configured'
      };
    }
  });

  return registry;
};
