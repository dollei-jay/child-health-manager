import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, ClipboardList, ShoppingCart, TrendingUp, Calendar, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { api } from '../api';
import { getMonthDates } from '../utils';

interface DashboardProps {
  childName?: string;
  childAvatar?: string;
  isBoyTheme?: boolean;
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

export default function Dashboard({ childName, childAvatar, isBoyTheme = false }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [weeklyPlanData, setWeeklyPlanData] = useState<any[] | null>(null);
  const [groceryData, setGroceryData] = useState<Record<string, string[]> | null>(null);
  const [checklistData, setChecklistData] = useState<Record<string, boolean>>({});
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [todosRes, growthRes, weeklyPlanRes, groceryRes, checklistRes] = await Promise.all([
          api.getTodos(),
          api.getGrowthRecords(),
          api.getWeeklyPlan(),
          api.getGroceryList(),
          api.getChecklist()
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

        if (checklistRes?.checkedItems) {
          try {
            setChecklistData(JSON.parse(checklistRes.checkedItems));
          } catch {
            setChecklistData({});
          }
        } else {
          setChecklistData({});
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

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthDates = getMonthDates(year, month);

    const tasksByDate: Record<string, number> = {};
    Object.entries(checklistData).forEach(([key, checked]) => {
      if (!checked || typeof key !== 'string') return;
      const date = key.substring(0, 10);
      tasksByDate[date] = (tasksByDate[date] || 0) + 1;
    });

    const mapped = monthDates.map((d) => ({
      ...d,
      count: tasksByDate[d.date] || 0
    }));

    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthDoneTasks = Object.entries(tasksByDate).reduce((acc, [date, count]) => {
      return date.startsWith(monthPrefix) ? acc + count : acc;
    }, 0);
    const perfectDays = mapped.filter((d) => d.isCurrentMonth && d.count >= 5).length;

    return {
      year,
      month,
      days: mapped,
      monthDoneTasks,
      perfectDays
    };
  }, [checklistData, currentDate]);

  const prevMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  if (loading) {
    return <div className="animate-pulse text-center py-10 text-stone-400">加载总览数据中...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-pink-100 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text ${isBoyTheme ? 'bg-gradient-to-r from-sky-500 to-cyan-500' : 'bg-gradient-to-r from-pink-600 to-purple-600'}`}>
              {childName ? `${childName} 的本周健康总览` : '本周健康总览'}
            </h2>
            <p className="mt-2 text-sm md:text-base text-stone-500 font-medium">
              先看关键数据，再进入各模块执行。
            </p>
          </div>
          <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl text-white flex items-center justify-center shrink-0 overflow-hidden ring-4 ring-white/85 border ${isBoyTheme ? 'bg-gradient-to-br from-sky-300 to-cyan-400 border-sky-200 shadow-lg shadow-sky-200/60' : 'bg-gradient-to-br from-pink-400 to-rose-400 border-pink-200 shadow-lg shadow-pink-200/60'}`}>
            {childAvatar ? (
              <img src={childAvatar} alt="孩子头像" className="w-full h-full object-cover" />
            ) : (
              <span className="font-extrabold text-3xl">{(childName || '宝').charAt(0)}</span>
            )}
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

        <section className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-extrabold text-stone-800 flex items-center gap-2">
              <Calendar size={18} className="text-pink-500" />
              打卡日历
            </h3>
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-100 rounded-xl p-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg text-stone-500 hover:bg-white hover:shadow-sm transition-all">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold text-stone-700 min-w-[82px] text-center">{calendarData.year}年{calendarData.month + 1}月</span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg text-stone-500 hover:bg-white hover:shadow-sm transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-xl border border-pink-100 bg-pink-50 px-3 py-2">
              <p className="text-[11px] text-pink-500 font-bold">本月打卡完成</p>
              <p className="text-lg font-extrabold text-pink-600 leading-tight">{calendarData.monthDoneTasks} 项</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2">
              <p className="text-[11px] text-rose-500 font-bold">完美达成天</p>
              <p className="text-lg font-extrabold text-rose-600 leading-tight">{calendarData.perfectDays} 天</p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-1">
            {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
              <div key={day} className="text-center text-[10px] font-bold text-stone-400 py-1">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {calendarData.days.map((d, i) => {
              const base = !d.isCurrentMonth ? 'bg-stone-50 text-stone-300' : d.count === 0 ? 'bg-white text-stone-500 border border-stone-100' : d.count <= 2 ? 'bg-pink-100 text-pink-600 border border-pink-200' : d.count <= 4 ? 'bg-pink-300 text-white border border-pink-400' : 'bg-gradient-to-br from-pink-400 to-rose-500 text-white';
              return (
                <div key={i} className={`h-9 rounded-lg flex flex-col items-center justify-center text-[11px] font-bold relative ${base}`} title={`${d.date} · 完成 ${d.count} 项`}>
                  <span>{d.day}</span>
                  {d.isCurrentMonth && d.count > 0 && d.count < 5 && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {Array.from({ length: Math.min(d.count, 3) }).map((_, idx) => (
                        <span key={idx} className="w-1 h-1 rounded-full bg-current opacity-70"></span>
                      ))}
                    </div>
                  )}
                  {d.isCurrentMonth && d.count >= 5 && (
                    <Star size={10} className="absolute bottom-1 fill-white text-white opacity-90" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500 font-medium">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-200"></span>部分完成</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400"></span>多数完成</span>
            <span className="inline-flex items-center gap-1"><Star size={10} className="text-rose-500" />完美达成</span>
          </div>
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
