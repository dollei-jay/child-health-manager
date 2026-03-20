import React, { useEffect, useMemo, useState } from 'react';
import { Save, RotateCcw, Target, AlertTriangle, Lightbulb, CalendarDays } from 'lucide-react';
import { api } from '../api';

function getWeekStartMonday(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function toDateString(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatZh(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function WeeklyReview() {
  const [weekStart, setWeekStart] = useState(() => toDateString(getWeekStartMonday()));
  const [summary, setSummary] = useState('');
  const [blockers, setBlockers] = useState('');
  const [nextFocus, setNextFocus] = useState('');
  const [score, setScore] = useState(80);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    if (Number.isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + 6);
    return toDateString(d);
  }, [weekStart]);

  const loadReview = async (targetWeekStart: string) => {
    setLoading(true);
    setMessage('');
    try {
      const data = await api.getWeeklyReview(targetWeekStart);
      setSummary(data.summary || '');
      setBlockers(data.blockers || '');
      setNextFocus(data.nextFocus || '');
      setScore(Number(data.score) || 80);
    } catch (err: any) {
      setMessage(err?.message || '加载周复盘失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReview(weekStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.saveWeeklyReview({ weekStart, summary, blockers, nextFocus, score });
      setMessage('已保存本周复盘');
    } catch (err: any) {
      setMessage(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const resetCurrentWeek = () => {
    setSummary('');
    setBlockers('');
    setNextFocus('');
    setScore(80);
    setMessage('已重置表单（未保存）');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm">
        <h2 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 flex items-center gap-2">
          <CalendarDays className="text-pink-500" /> 计划闭环（周复盘）
        </h2>
        <p className="mt-2 text-sm font-medium text-stone-500">
          每周固定复盘：执行结果、阻塞项、下周焦点，形成“计划-执行-复盘-迭代”闭环。
        </p>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="text-sm font-medium text-stone-600 inline-flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
            周起始（周一）
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </label>
          <span className="text-sm text-stone-500 font-medium">
            周区间：{formatZh(weekStart)} - {weekEnd ? formatZh(weekEnd) : '--'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse text-center py-10 text-stone-400">加载复盘数据中...</div>
      ) : (
        <div className="space-y-5">
          <Card title="本周执行总结" icon={<Target size={18} className="text-pink-500" />}>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              placeholder="例如：本周完成 22 项任务，生长记录 1 条，打卡执行稳定..."
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 resize-y text-sm text-stone-700"
            />
          </Card>

          <Card title="本周阻塞与问题" icon={<AlertTriangle size={18} className="text-amber-500" />}>
            <textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              rows={4}
              placeholder="例如：周三加班导致运动执行不足；周末采购漏项..."
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 resize-y text-sm text-stone-700"
            />
          </Card>

          <Card title="下周焦点动作" icon={<Lightbulb size={18} className="text-purple-500" />}>
            <textarea
              value={nextFocus}
              onChange={(e) => setNextFocus(e.target.value)}
              rows={4}
              placeholder="例如：固定周二/周五记录生长数据；每日晚 8 点前完成打卡..."
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 resize-y text-sm text-stone-700"
            />
          </Card>

          <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
            <label className="text-sm font-bold text-stone-600">本周执行评分：{score}/100</label>
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full mt-3 accent-pink-500"
            />

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-[42px] px-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold text-sm shadow-md shadow-pink-200 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-1.5"><Save size={16} /> {saving ? '保存中...' : '保存本周复盘'}</span>
              </button>
              <button
                onClick={resetCurrentWeek}
                className="h-[42px] px-4 bg-white border border-stone-200 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-50 transition-colors"
              >
                <span className="inline-flex items-center gap-1.5"><RotateCcw size={16} /> 重置表单</span>
              </button>
            </div>

            {!!message && <p className="mt-3 text-sm font-medium text-stone-500">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
      <h3 className="text-lg font-extrabold text-stone-800 mb-3 inline-flex items-center gap-2">
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}
