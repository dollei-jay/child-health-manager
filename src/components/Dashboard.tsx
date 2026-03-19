import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, ClipboardList, ShoppingCart, TrendingUp, Sparkles } from 'lucide-react';
import { api } from '../api';

interface DashboardProps {
  childName?: string;
}

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface GrowthRecord {
  id: string | number;
  date: string;
  height: number;
  weight: number;
  bmi: string;
  createdAt?: string;
}

export default function Dashboard({ childName }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [weeklyPlanData, setWeeklyPlanData] = useState<any[] | null>(null);
  const [groceryData, setGroceryData] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [todosRes, growthRes, weeklyPlanRes, groceryRes] = await Promise.all([
          api.getTodos(),
          api.getGrowthRecords(),
          api.getWeeklyPlan(),
          api.getGroceryList()
        ]);

        setTodos(Array.isArray(todosRes) ? todosRes : []);
        setGrowthRecords(Array.isArray(growthRes) ? growthRes : []);

        if (weeklyPlanRes?.planData) {
          try {
            setWeeklyPlanData(JSON.parse(weeklyPlanRes.planData));
          } catch {
            setWeeklyPlanData(null);
          }
        }

        if (groceryRes?.listData) {
          try {
            setGroceryData(JSON.parse(groceryRes.listData));
          } catch {
            setGroceryData(null);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const pendingTodos = useMemo(() => todos.filter(t => !t.completed), [todos]);
  const completedTodos = useMemo(() => todos.filter(t => t.completed), [todos]);

  const latestGrowth = useMemo(() => {
    if (!growthRecords.length) return null;
    return [...growthRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [growthRecords]);

  const weeklyTaskCount = useMemo(() => {
    if (!Array.isArray(weeklyPlanData)) return 0;
    return weeklyPlanData.reduce((acc, day: any) => {
      const breakfast = Array.isArray(day?.breakfast) ? day.breakfast.length : 0;
      const exercise = Array.isArray(day?.exercise) ? day.exercise.length : 0;
      const snack = Array.isArray(day?.snack) ? day.snack.length : 0;
      const dinner = Array.isArray(day?.dinner) ? day.dinner.length : 0;
      const sleep = day?.sleep ? 1 : 0;
      return acc + breakfast + exercise + snack + dinner + sleep;
    }, 0);
  }, [weeklyPlanData]);

  const groceryCount = useMemo(() => {
    if (!groceryData || typeof groceryData !== 'object') return 0;
    const groups = Object.values(groceryData) as string[][];
    return groups.reduce((acc, val) => {
      if (!Array.isArray(val)) return acc;
      return acc + val.filter(item => typeof item === 'string' && item.trim()).length;
    }, 0);
  }, [groceryData]);

  if (loading) {
    return <div className="animate-pulse text-center py-10 text-stone-400">加载总览数据中...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-pink-100 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
              {childName ? `${childName} 的本周健康总览` : '本周健康总览'}
            </h2>
            <p className="mt-2 text-sm md:text-base text-stone-500 font-medium">
              先看关键数据，再进入各模块执行。
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-200 shrink-0">
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card
          title="待办进度"
          icon={<ClipboardList size={20} />}
          iconWrap="bg-pink-100 text-pink-500"
          value={`${pendingTodos.length} 项待完成`}
          sub={`${completedTodos.length} 项已完成`}
        />
        <Card
          title="生长最近记录"
          icon={<TrendingUp size={20} />}
          iconWrap="bg-purple-100 text-purple-500"
          value={latestGrowth ? `${latestGrowth.date}` : '暂无记录'}
          sub={latestGrowth ? `身高 ${latestGrowth.height}cm · 体重 ${latestGrowth.weight}kg · BMI ${latestGrowth.bmi}` : '请先添加第一条生长记录'}
        />
        <Card
          title="周计划任务量"
          icon={<CalendarCheck2 size={20} />}
          iconWrap="bg-rose-100 text-rose-500"
          value={`${weeklyTaskCount} 项`}
          sub={weeklyTaskCount > 0 ? '来自当前一周计划模板' : '尚未配置计划任务'}
        />
        <Card
          title="采购准备"
          icon={<ShoppingCart size={20} />}
          iconWrap="bg-amber-100 text-amber-500"
          value={`${groceryCount} 项物资`}
          sub={groceryCount > 0 ? '可在采购清单模块继续编辑' : '尚未填写采购清单'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
          <h3 className="text-lg font-extrabold text-stone-800 mb-4">优先待办（Top 5）</h3>
          {pendingTodos.length === 0 ? (
            <p className="text-stone-400 text-sm">暂无待办，状态很好，建议转到「一周计划」补充下一阶段安排。</p>
          ) : (
            <ul className="space-y-3">
              {pendingTodos.slice(0, 5).map((todo, idx) => (
                <li key={todo.id} className="flex items-start gap-3 rounded-xl border border-stone-100 px-3 py-2.5 bg-stone-50/60">
                  <span className="w-6 h-6 rounded-lg bg-pink-100 text-pink-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                  <span className="text-stone-700 font-medium leading-relaxed">{todo.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
          <h3 className="text-lg font-extrabold text-stone-800 mb-4">本周执行建议</h3>
          <ul className="space-y-3 text-sm text-stone-600 font-medium">
            <li className="rounded-xl border border-stone-100 px-3 py-2.5 bg-stone-50/60">1) 先清空/完成当前待办，再补充本周新增事项。</li>
            <li className="rounded-xl border border-stone-100 px-3 py-2.5 bg-stone-50/60">2) 每周至少新增 1 条生长记录，保证趋势可追踪。</li>
            <li className="rounded-xl border border-stone-100 px-3 py-2.5 bg-stone-50/60">3) 周计划与采购清单联动维护，减少临时缺项。</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Card({
  title,
  icon,
  iconWrap,
  value,
  sub
}: {
  title: string;
  icon: React.ReactNode;
  iconWrap: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm flex items-start gap-4 transition-transform hover:-translate-y-0.5 duration-300">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${iconWrap}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-stone-500">{title}</p>
        <p className="text-xl font-extrabold text-stone-800 mt-0.5 leading-tight break-words">{value}</p>
        <p className="text-xs text-stone-400 mt-1 leading-relaxed">{sub}</p>
      </div>
    </div>
  );
}
