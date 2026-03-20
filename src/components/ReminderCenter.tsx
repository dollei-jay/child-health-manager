import React, { useEffect, useMemo, useState } from 'react';
import { Bell, RefreshCcw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { api } from '../api';

type ReminderLevel = 'danger' | 'warning' | 'info';

interface ReminderItem {
  type: string;
  level: ReminderLevel;
  title: string;
  detail?: string;
}

export default function ReminderCenter({ onGotoTab }: { onGotoTab?: (tab: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [date, setDate] = useState('');

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await api.getReminders();
      setItems(Array.isArray(res?.items) ? res.items : []);
      setDate(String(res?.date || ''));
    } catch (err) {
      console.error('failed to fetch reminders', err);
      setItems([]);
      setDate('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const grouped = useMemo(() => {
    return {
      danger: items.filter((i) => i.level === 'danger'),
      warning: items.filter((i) => i.level === 'warning'),
      info: items.filter((i) => i.level === 'info')
    };
  }, [items]);

  const gotoByType = (type: string) => {
    if (!onGotoTab) return;
    if (type.includes('todo')) return onGotoTab('todos');
    if (type.includes('growth')) return onGotoTab('growth');
    if (type.includes('weekly_review')) return onGotoTab('review');
    return onGotoTab('dashboard');
  };

  if (loading) {
    return <div className="animate-pulse text-center py-10 text-stone-400">加载提醒中...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 inline-flex items-center gap-2">
              <Bell className="text-pink-500" /> 提醒中心
            </h2>
            <p className="mt-2 text-sm text-stone-500 font-medium">按当前孩子上下文聚合提醒，优先处理危险与预警项。</p>
            {date && <p className="mt-1 text-xs text-stone-400">统计日期：{date}</p>}
          </div>
          <button
            onClick={fetchReminders}
            className="h-10 px-3 rounded-xl border border-stone-200 bg-white text-stone-600 text-sm font-bold hover:bg-stone-50 inline-flex items-center gap-1.5"
          >
            <RefreshCcw size={14} /> 刷新
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-stone-100 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-lg font-extrabold text-stone-700">当前无提醒</p>
          <p className="text-sm text-stone-500 mt-2">执行状态良好，继续保持本周节奏。</p>
        </div>
      ) : (
        <div className="space-y-4">
          <ReminderGroup title="高优先（危险）" tone="danger" items={grouped.danger} onGoto={gotoByType} />
          <ReminderGroup title="中优先（预警）" tone="warning" items={grouped.warning} onGoto={gotoByType} />
          <ReminderGroup title="提示信息" tone="info" items={grouped.info} onGoto={gotoByType} />
        </div>
      )}
    </div>
  );
}

function ReminderGroup({
  title,
  tone,
  items,
  onGoto
}: {
  title: string;
  tone: ReminderLevel;
  items: ReminderItem[];
  onGoto: (type: string) => void;
}) {
  const styles = {
    danger: {
      wrap: 'border-rose-200 bg-rose-50/40',
      title: 'text-rose-700',
      icon: <AlertTriangle size={16} className="text-rose-500" />
    },
    warning: {
      wrap: 'border-amber-200 bg-amber-50/40',
      title: 'text-amber-700',
      icon: <AlertTriangle size={16} className="text-amber-500" />
    },
    info: {
      wrap: 'border-sky-200 bg-sky-50/40',
      title: 'text-sky-700',
      icon: <Info size={16} className="text-sky-500" />
    }
  }[tone];

  if (items.length === 0) return null;

  return (
    <section className={`rounded-3xl border p-5 shadow-sm ${styles.wrap}`}>
      <h3 className={`text-sm font-extrabold mb-3 inline-flex items-center gap-1.5 ${styles.title}`}>
        {styles.icon}
        {title}（{items.length}）
      </h3>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={`${item.type}-${idx}`} className="bg-white rounded-2xl border border-stone-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-stone-700">{item.title}</p>
                {item.detail && <p className="text-xs text-stone-500 mt-1 leading-relaxed">{item.detail}</p>}
              </div>
              <button
                onClick={() => onGoto(item.type)}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-pink-200 text-pink-600 hover:bg-pink-50 shrink-0"
              >
                去处理
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
