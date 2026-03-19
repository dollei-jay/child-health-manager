import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2, Scale, Ruler, Calendar as CalendarIcon } from 'lucide-react';
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
  id: string;
  date: string;
  height: number;
  weight: number;
  bmi: string;
  createdAt?: string;
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
      setRecords(data);
    } catch (error) {
      console.error("Error fetching growth records:", error);
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
    if (isNaN(h) || isNaN(w)) return;

    const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);

    const newRecord = {
      date,
      height: h,
      weight: w,
      bmi
    };

    try {
      await api.createGrowthRecord(newRecord);
      setHeight('');
      setWeight('');
      fetchRecords(); // Refresh list
    } catch (error) {
      console.error("Error adding growth record:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) return;
    try {
      await api.deleteGrowthRecord(id);
      fetchRecords(); // Refresh list
    } catch (error) {
      console.error("Error deleting growth record:", error);
    }
  };

  if (loading) {
    return <div className="animate-pulse text-center py-10 text-stone-400">加载记录中...</div>;
  }

  // Sort ascending for chart
  const chartData = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(r => ({
    ...r,
    bmiNum: parseFloat(r.bmi)
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Input Form */}
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

      {/* Chart */}
      {records.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
          <h2 className="text-xl font-extrabold text-stone-800 mb-6">生长曲线图</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12, fill: '#a8a29e'}} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => val.substring(5).replace('-', '/')}
                />
                <YAxis 
                  yAxisId="left" 
                  domain={['dataMin - 2', 'dataMax + 2']} 
                  tick={{fontSize: 12, fill: '#f43f5e'}} 
                  axisLine={false} 
                  tickLine={false} 
                  width={40}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={['dataMin - 1', 'dataMax + 1']} 
                  tick={{fontSize: 12, fill: '#8b5cf6'}} 
                  axisLine={false} 
                  tickLine={false}
                  width={40}
                />
                <YAxis 
                  yAxisId="bmi" 
                  orientation="right" 
                  domain={['dataMin - 1', 'dataMax + 1']} 
                  tick={{fontSize: 12, fill: '#0ea5e9'}} 
                  axisLine={false} 
                  tickLine={false}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  labelStyle={{fontWeight: 'bold', color: '#57534e', marginBottom: '4px'}}
                />
                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="height" 
                  name="身高 (cm)" 
                  stroke="#f43f5e" 
                  strokeWidth={3} 
                  dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                  activeDot={{r: 6, strokeWidth: 0}} 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="weight" 
                  name="体重 (kg)" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                  activeDot={{r: 6, strokeWidth: 0}} 
                />
                <Line 
                  yAxisId="bmi" 
                  type="monotone" 
                  dataKey="bmiNum" 
                  name="BMI" 
                  stroke="#0ea5e9" 
                  strokeWidth={3} 
                  dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                  activeDot={{r: 6, strokeWidth: 0}} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History Table */}
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
