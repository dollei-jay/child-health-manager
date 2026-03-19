import React, { useState, useEffect } from 'react';
import { getMonthDates } from '../utils';
import { Trophy, Star, Target, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Stats() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [checklistData, setChecklistData] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('anli_checklist_data');
    if (saved) {
      setChecklistData(JSON.parse(saved));
    }
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthDates = getMonthDates(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Calculate stats
  let totalTasks = 0;
  let perfectDays = 0;
  let currentMonthTasks = 0;

  // Group by date
  const tasksByDate: Record<string, number> = {};
  Object.entries(checklistData).forEach(([key, isChecked]) => {
    if (isChecked) {
      const date = key.substring(0, 10);
      tasksByDate[date] = (tasksByDate[date] || 0) + 1;
      totalTasks++;
      if (date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
        currentMonthTasks++;
      }
    }
  });

  Object.values(tasksByDate).forEach(count => {
    if (count === 5) perfectDays++;
  });

  const getDayColor = (date: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 'bg-stone-50/50 text-stone-300';
    const count = tasksByDate[date] || 0;
    if (count === 0) return 'bg-white text-stone-400 border border-stone-100';
    if (count <= 2) return 'bg-pink-100 text-pink-600 border border-pink-200';
    if (count <= 4) return 'bg-pink-300 text-white border border-pink-400 shadow-sm';
    return 'bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-md shadow-pink-200 font-bold';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-500 flex items-center justify-center">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-500">累计完成任务</p>
            <p className="text-2xl font-extrabold text-stone-800">{totalTasks} <span className="text-sm font-medium text-stone-400">项</span></p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-500 flex items-center justify-center">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-500">完美达成天数</p>
            <p className="text-2xl font-extrabold text-stone-800">{perfectDays} <span className="text-sm font-medium text-stone-400">天</span></p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-500 flex items-center justify-center">
            <CalendarIcon size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-500">本月完成任务</p>
            <p className="text-2xl font-extrabold text-stone-800">{currentMonthTasks} <span className="text-sm font-medium text-stone-400">项</span></p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-extrabold text-stone-800 flex items-center gap-2">
            <CalendarIcon className="text-pink-500" />
            打卡日历
          </h2>
          <div className="flex items-center gap-2 bg-stone-50 p-1 rounded-2xl border border-stone-100">
            <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-stone-500 transition-all">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-stone-700 min-w-[100px] text-center">
              {year}年 {month + 1}月
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-stone-500 transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-4 mb-2">
          {['一', '二', '三', '四', '五', '六', '日'].map(day => (
            <div key={day} className="text-center text-sm font-bold text-stone-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {monthDates.map((d, i) => {
            const count = tasksByDate[d.date] || 0;
            return (
              <div 
                key={i} 
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 ${getDayColor(d.date, d.isCurrentMonth)}`}
              >
                <span className="text-sm md:text-base font-bold">{d.day}</span>
                {d.isCurrentMonth && count === 5 && (
                  <Star size={12} className="absolute bottom-2 fill-white text-white opacity-90" />
                )}
                {d.isCurrentMonth && count > 0 && count < 5 && (
                  <div className="absolute bottom-2 flex gap-1">
                    {Array.from({length: count}).map((_, idx) => (
                      <div key={idx} className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-wrap items-center justify-center gap-6 text-xs md:text-sm font-medium text-stone-500">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-white border border-stone-200"></div>未打卡</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-pink-100 border border-pink-200"></div>部分完成</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-pink-300 border border-pink-400"></div>多数完成</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 shadow-sm"></div>完美达成</div>
        </div>
      </div>
    </div>
  );
}
