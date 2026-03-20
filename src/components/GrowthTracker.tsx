import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2, Scale, Ruler, Calendar as CalendarIcon, Activity, Clock3, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api, getToken } from '../api';

interface GrowthRecord {
  id: string | number;
  date: string;
  height: number;
  weight: number;
  bmi: string;
  createdAt?: string;
}

function parseDateSafe(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toFixedMaybe(value: number, digits = 1) {
  if (Number.isNaN(value)) return '--';
  return value.toFixed(digits);
}

export default function GrowthTracker() {
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const isAuthenticated = !!getToken();

  const fetchRecords = async () => {
    try {
      const data = await api.getGrowthRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching growth records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchRecords();
  }, [isAuthenticated]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !date || !height || !weight) return;

    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (Number.isNaN(h) || Number.isNaN(w) || h <= 0 || w <= 0) return;

    const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);

    try {
      await api.createGrowthRecord({
        date,
        height: h,
        weight: w,
        bmi
      });
      setHeight('');
      setWeight('');
      fetchRecords();
    } catch (error) {
      console.error('Error adding growth record:', error);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!isAuthenticated) return;
    try {
      await api.deleteGrowthRecord(id);
      fetchRecords();
    } catch (error) {
      console.error('Error deleting growth record:', error);
    }
  };

  const sortedAsc = useMemo(
    () => [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [records]
  );

  const latest = sortedAsc.length ? sortedAsc[sortedAsc.length - 1] : null;
  const previous = sortedAsc.length >= 2 ? sortedAsc[sortedAsc.length - 2] : null;

  const deltas = useMemo(() => {
    if (!latest || !previous) return null;
    return {
      height: Number(latest.height) - Number(previous.height),
      weight: Number(latest.weight) - Number(previous.weight),
      bmi: Number(latest.bmi) - Number(previous.bmi)
    };
  }, [latest, previous]);

  const recent30 = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    return sortedAsc.filter((r) => {
      const d = parseDateSafe(r.date);
      return d ? d >= start && d <= now : false;
    });
  }, [sortedAsc]);

  const chartData = useMemo(
    () => sortedAsc.map((r) => ({ ...r, bmiNum: parseFloat(r.bmi) })),
    [sortedAsc]
  );

  if (loading) {
    return <div className="animate-pulse text-center py-10 text-stone-400">加载记录中...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm">
        <h2 className="text-xl font-extrabold text-stone-800 flex items-center gap-2 mb-6">
          <TrendingUp className="text-pink-500" />
          新增生长记录
        </h2>

        <form onSubmit={handleAddRecord} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-500 flex items-center gap-1">
              <CalendarIcon size={14} /> 测量日期
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all font-medium text-stone-700"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-500 flex items-center gap-1">
              <Ruler size={14} /> 身高 (cm)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="例如: 130.5"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all font-medium text-stone-700"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-500 flex items-center gap-1">
              <Scale size={14} /> 体重 (kg)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="例如: 28.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all font-medium text-stone-700"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full h-[46px] bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-md shadow-pink-200 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} /> 添加记录
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <InsightCard
          title="最新记录"
          icon={<Activity size={18} />}
          value={latest ? `${latest.date}` : '暂无'}
          sub={latest ? `身高 ${latest.height}cm · 体重 ${latest.weight}kg · BMI ${latest.bmi}` : '请先添加记录'}
          tone="rose"
        />
        <InsightCard
          title="较上次变化"
          icon={<BarChart3 size={18} />}
          value={deltas ? `身高 ${deltas.height >= 0 ? '+' : ''}${toFixedMaybe(deltas.height)}cm` : '--'}
          sub={deltas ? `体重 ${deltas.weight >= 0 ? '+' : ''}${toFixedMaybe(deltas.weight)}kg · BMI ${deltas.bmi >= 0 ? '+' : ''}${toFixedMaybe(deltas.bmi)}` : '至少需2条记录'}
          tone="purple"
        />
        <InsightCard
          title="近30天记录"
          icon={<Clock3 size={18} />}
          value={`${recent30.length} 次`}
          sub={recent30.length >= 4 ? '记录频次良好' : '建议每周至少1次'}
          tone="amber"
        />
        <InsightCard
          title="数据完整性"
          icon={<TrendingUp size={18} />}
          value={sortedAsc.length >= 2 ? '可看趋势' : '样本不足'}
          sub={sortedAsc.length >= 2 ? '可用于阶段趋势观察' : '补充更多记录后更稳定'}
          tone="teal"
        />
      </div>

      {records.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
          <h2 className="text-xl font-extrabold text-stone-800 mb-1">生长曲线图</h2>
          <p className="text-xs text-stone-400 mb-5">提示：曲线仅用于家庭趋势观察，不替代专业医疗评估。</p>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#a8a29e' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => String(val).substring(5).replace('-', '/')}
                />
                <YAxis
                  yAxisId="left"
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 12, fill: '#f43f5e' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tick={{ fontSize: 12, fill: '#8b5cf6' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <YAxis
                  yAxisId="bmi"
                  orientation="right"
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tick={{ fontSize: 12, fill: '#0ea5e9' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#57534e', marginBottom: '4px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line yAxisId="left" type="monotone" dataKey="height" name="身高 (cm)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line yAxisId="right" type="monotone" dataKey="weight" name="体重 (kg)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line yAxisId="bmi" type="monotone" dataKey="bmiNum" name="BMI" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {records.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm overflow-hidden">
          <h2 className="text-xl font-extrabold text-stone-800 mb-6">历史记录</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-stone-100 text-stone-400 text-sm">
                  <th className="pb-3 font-bold">测量日期</th>
                  <th className="pb-3 font-bold">身高 (cm)</th>
                  <th className="pb-3 font-bold">体重 (kg)</th>
                  <th className="pb-3 font-bold">BMI</th>
                  <th className="pb-3 font-bold text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className="py-4 font-bold text-stone-600">{record.date}</td>
                    <td className="py-4 font-bold text-rose-500">{record.height}</td>
                    <td className="py-4 font-bold text-purple-500">{record.weight}</td>
                    <td className="py-4 font-bold text-stone-500">
                      <span className="bg-stone-100 px-2 py-1 rounded-lg text-xs">{record.bmi}</span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-2 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        title="删除记录"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-stone-100 border-dashed">
          <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
            <TrendingUp size={24} />
          </div>
          <p className="text-stone-500 font-medium">暂无生长记录，快来添加第一条吧！</p>
        </div>
      )}
    </div>
  );
}

function InsightCard({
  title,
  icon,
  value,
  sub,
  tone
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  sub: string;
  tone: 'rose' | 'purple' | 'amber' | 'teal';
}) {
  const styleMap = {
    rose: 'border-rose-100 bg-rose-50/40 text-rose-600',
    purple: 'border-purple-100 bg-purple-50/40 text-purple-600',
    amber: 'border-amber-100 bg-amber-50/40 text-amber-600',
    teal: 'border-teal-100 bg-teal-50/40 text-teal-600'
  } as const;

  return (
    <div className="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-xl border flex items-center justify-center ${styleMap[tone]}`}>{icon}</span>
        <p className="text-sm font-bold text-stone-500">{title}</p>
      </div>
      <p className="text-lg font-extrabold text-stone-800 mt-2 break-words">{value}</p>
      <p className="text-xs text-stone-400 mt-1 leading-relaxed">{sub}</p>
    </div>
  );
}
