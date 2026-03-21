import React, { useMemo, useState } from 'react';
import { Bot, MessageCircle, Send, X, RotateCcw } from 'lucide-react';
import { api } from '../../api';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  undoToken?: string;
  status?: 'ok' | 'error';
};

interface AIAssistantProps {
  childName?: string;
  childProfileId?: number | null;
}

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

      const undoToken = resp?.cards?.[0]?.data?.undoToken;
      appendMessage({
        role: 'assistant',
        content: String(resp?.assistant || '已处理。'),
        undoToken,
        status: 'ok'
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
        <div className="fixed z-20 bottom-24 right-6 w-[360px] max-w-[92vw] h-[560px] max-h-[78vh] bg-white/95 backdrop-blur rounded-2xl border border-pink-100 shadow-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-pink-500" />
              <div>
                <div className="text-sm font-bold text-pink-600">成长管理智能体</div>
                <div className="text-[11px] text-stone-500">{childName ? `当前孩子：${childName}` : '当前孩子：未选择'}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[86%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-pink-500 text-white rounded-br-md'
                      : m.status === 'error'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 rounded-bl-md'
                        : 'bg-stone-50 text-stone-700 border border-stone-200 rounded-bl-md'
                  }`}
                >
                  <div>{m.content}</div>
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
