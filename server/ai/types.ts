export type AiRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AiMessage {
  role: AiRole;
  content: string;
  name?: string;
}

export interface AiContext {
  userId: number;
  childProfileId?: number;
  sessionId?: number;
  timeRange?: '7d' | '30d' | '90d' | 'all';
}

export interface AiAction {
  type: string;
  status: 'done' | 'pending_confirm' | 'blocked' | 'skipped';
  target?: string;
  targetId?: number;
  summary?: string;
  undoToken?: string;
  reason?: string;
}

export interface AiCard {
  type: string;
  title: string;
  data?: Record<string, any>;
}

export interface AiReply {
  summary: string;
  assistant: string;
  actions: AiAction[];
  cards?: AiCard[];
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface ToolExecutionContext {
  userId: number;
  childProfileId?: number;
  sessionId?: number;
}

export interface ToolDefinition<TInput = any, TResult = any> {
  name: string;
  description: string;
  riskLevel?: 'low' | 'medium' | 'high';
  execute: (input: TInput, context: ToolExecutionContext) => Promise<TResult>;
}

export interface ModelClient {
  generate(input: {
    systemPrompt: string;
    messages: AiMessage[];
    tools?: Array<{ name: string; description: string }>;
  }): Promise<{ text: string }>;
}
