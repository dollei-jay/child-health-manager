import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, MessageCircle, RotateCcw, Send, ShieldAlert, X } from 'lucide-react';
import { api } from '../../api';

type StructuredCard = {
  type?: string;
  title?: string;
  data?: any;
};

type AiAction = {
  type?: string;
  status?: 'done' | 'pending_confirm' | 'blocked' | 'skipped';
  summary?: string;
  reason?: string;
};

type PendingFunctionCall = {
  name: string;
  arguments: Record<string, any>;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  undoToken?: string;
  status?: 'ok' | 'error';
  riskLevel?: 'low' | 'medium' | 'high';
  actions?: AiAction[];
  cards?: StructuredCard[];
  pendingFunctionCall?: PendingFunctionCall;
};

interface AIAssistantProps {
  childName?: string;
  childProfileId?: number | null;
}

const riskTone: Record<string, string> = {
  low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  high: 'text-rose-700 bg-rose-50 border-rose-200'
};

export default function AIAssistant({ childName, childProfileId }: AIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `我是成长管理小助手${childName ? `（当前：${childName}）` : ''}。你可以直接说：记录身高体重、加待办、写诊断。`
    }
  ]);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const appendMessage = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    appendMessage({ role: 'user', content: text });
    setLoading(true);

    try {
      const resp = await api.aiChat({
        sessionId,
        message: text,
        childProfileId: childProfileId || undefined
      });

      if (resp?.sessionId) setSessionId(Number(resp.sessionId));

      const cards: StructuredCard[] = Array.isArray(resp?.cards) ? resp.cards : [];
      const actions: AiAction[] = Array.isArray(resp?.actions) ? resp.actions : [];
      const undoToken = cards?.[0]?.data?.undoToken;

      const pendingCard = cards.find((c) => c?.data?.pendingConfirm);
      const actionType = actions?.[0]?.type || 'add_diagnosis';
      const pendingFunctionCall = pendingCard?.data?.input
        ? {
            name: String(actionType),
            arguments: pendingCard.data.input as Record<string, any>
          }
        : undefined;

      appendMessage({
        role: 'assistant',
        content: String(resp?.assistant || '已处理。'),
        undoToken,
        status: 'ok',
        riskLevel: resp?.riskLevel || 'low',
        cards,
        actions,
        pendingFunctionCall
      });
    } catch (err: any) {
      appendMessage({ role: 'assistant', content: `执行失败：${err.message || '未知错误'}`, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const undoLast = async (undoToken?: string) => {
    if (!undoToken) return;
    try {
      const resp = await api.aiUndo(undoToken);
      appendMessage({ role: 'assistant', content: String(resp?.summary || '已撤销最近操作。'), status: 'ok' });
    } catch (err: any) {
      appendMessage({ role: 'assistant', content: `撤销失败：${err.message || '未知错误'}`, status: 'error' });
    }
  };

  const confirmMedicalWrite = async (pending?: PendingFunctionCall) => {
    if (!pending) return;
    try {
      const resp = await api.aiChat({
        sessionId,
        message: '确认写入医疗记录',
        childProfileId: childProfileId || undefined,
        confirmMedicalWrite: true,
        functionCall: {
          name: pending.name,
          arguments: pending.arguments
        }
      });

      if (resp?.sessionId) setSessionId(Number(resp.sessionId));
      const cards: StructuredCard[] = Array.isArray(resp?.cards) ? resp.cards : [];
      appendMessage({
        role: 'assistant',
        content: String(resp?.assistant || '已确认写入。'),
        status: 'ok',
        undoToken: cards?.[0]?.data?.undoToken,
        riskLevel: resp?.riskLevel || 'medium',
        cards,
        actions: Array.isArray(resp?.actions) ? resp.actions : []
      });
    } catch (err: any) {
      appendMessage({ role: 'assistant', content: `确认写入失败：${err.message || '未知错误'}`, status: 'error' });
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed z-30 bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-xl shadow-pink-200 flex items-center justify-center hover:scale-105 transition"
        title="AI 成长助手"
      >
        {open ? <X size={24} /> : <Bot size={24} />}
      </button>

      {open && (
        <div className="fixed z-20 bottom-24 right-6 w-[370px] max-w-[92vw] h-[600px] max-h-[80vh] bg-white/95 backdrop-blur rounded-2xl border border-pink-100 shadow-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-pink-500" />
              <div>
                <div className="text-sm font-bold text-pink-600">成长管理智能体</div>
                <div className="text-[11px] text-stone-500">{childName ? `当前孩子：${childName}` : '当前孩子：未选择'}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] ${m.role === 'user' ? '' : 'w-full'}`}>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-pink-500 text-white rounded-br-md inline-block'
                        : m.status === 'error'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 rounded-bl-md'
                          : 'bg-stone-50 text-stone-700 border border-stone-200 rounded-bl-md'
                    }`}
                  >
                    <div>{m.content}</div>
                  </div>

                  {m.role === 'assistant' && m.riskLevel && (
                    <div className={`mt-2 text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-lg border ${riskTone[m.riskLevel] || riskTone.low}`}>
                      {m.riskLevel === 'high' ? <ShieldAlert size={12} /> : m.riskLevel === 'medium' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                      风险级别：{m.riskLevel}
                    </div>
                  )}

                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2 bg-white border border-stone-200 rounded-xl p-2">
                      <div className="text-[11px] font-bold text-stone-500 mb-1">执行回执</div>
                      <div className="space-y-1">
                        {m.actions.map((a, i) => (
                          <div key={i} className="text-xs text-stone-700 flex items-center justify-between gap-2">
                            <span className="truncate">{a.type || 'unknown'}</span>
                            <span className={`px-1.5 py-0.5 rounded ${a.status === 'done' ? 'bg-emerald-100 text-emerald-700' : a.status === 'pending_confirm' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
                              {a.status || 'unknown'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.pendingFunctionCall && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2">
                      <div className="text-xs text-amber-800 mb-2">医疗相关写入需确认，是否继续？</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmMedicalWrite(m.pendingFunctionCall)}
                          className="text-xs px-2 py-1 rounded bg-amber-500 text-white hover:bg-amber-600"
                        >
                          确认写入
                        </button>
                        <button
                          onClick={() => appendMessage({ role: 'assistant', content: '已取消本次医疗写入。', status: 'ok' })}
                          className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {m.undoToken && (
                    <button
                      onClick={() => undoLast(m.undoToken)}
                      className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-stone-300 hover:bg-stone-100"
                    >
                      <RotateCcw size={12} /> 撤销这一步
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-stone-400 px-1">AI 正在处理...</div>}
          </div>

          <div className="p-3 border-t border-pink-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="例如：记录今天 118cm、22.4kg"
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
              <button
                onClick={sendMessage}
                disabled={!canSend}
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${canSend ? 'bg-pink-500 text-white' : 'bg-stone-100 text-stone-300'}`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
