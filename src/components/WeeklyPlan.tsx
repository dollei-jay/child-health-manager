import React, { useState, useEffect, useRef } from 'react';
import { weeklyPlan as defaultPlan, dayColors } from '../data';
import { Activity, Lightbulb, Utensils, CheckCircle2, RotateCcw, Download, Upload } from 'lucide-react';
import { getWeekDates } from '../utils';

export default function WeeklyPlan() {
  const [planData, setPlanData] = useState(() => {
    const saved = localStorage.getItem('anli_weekly_plan');
    return saved ? JSON.parse(saved) : defaultPlan;
  });
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('anli_checklist_data');
    return saved ? JSON.parse(saved) : {};
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const weekDates = getWeekDates();

  useEffect(() => {
    localStorage.setItem('anli_checklist_data', JSON.stringify(checkedItems));
  }, [checkedItems]);

  const toggleCheck = (date: string, task: string) => {
    const key = `${date}-${task}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const confirmReset = () => {
    const newItems = { ...checkedItems };
    weekDates.forEach(date => {
      tasks.forEach(task => {
        delete newItems[`${date}-${task.id}`];
      });
    });
    setCheckedItems(newItems);
    setShowResetConfirm(false);
  };

  const tasks = [
    { id: 'breakfast', label: '早餐' },
    { id: 'exercise', label: '运动' },
    { id: 'snack', label: '加餐' },
    { id: 'dinner', label: '晚饭' },
    { id: 'sleep', label: '早睡' }
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(planData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "anli_weekly_plan.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json) && json.length > 0) {
          setPlanData(json);
          localStorage.setItem('anli_weekly_plan', JSON.stringify(json));
          alert('计划导入成功！');
        } else {
          alert('导入失败：JSON格式不正确，请参考导出文件的格式。');
        }
      } catch (err) {
        alert('导入失败：文件解析错误。');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden mb-2">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImport}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-bold text-stone-500 bg-white hover:bg-stone-50 hover:text-pink-500 border border-stone-200 hover:border-pink-200 rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            <Upload size={16} /> 导入计划
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-bold text-stone-500 bg-white hover:bg-stone-50 hover:text-pink-500 border border-stone-200 hover:border-pink-200 rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            <Download size={16} /> 导出模板
          </button>
        </div>
        
        <div className="flex justify-end w-full sm:w-auto">
          {showResetConfirm ? (
          <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-1.5 rounded-xl shadow-sm border border-rose-100 animate-in fade-in slide-in-from-right-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs sm:text-sm font-bold text-rose-500">确定清空本周打卡？</span>
            <div className="flex gap-2">
              <button 
                onClick={confirmReset} 
                className="px-2 sm:px-3 py-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors whitespace-nowrap"
              >
                确定清空
              </button>
              <button 
                onClick={() => setShowResetConfirm(false)} 
                className="px-2 sm:px-3 py-1.5 text-xs font-bold text-stone-500 hover:bg-stone-100 rounded-lg transition-colors whitespace-nowrap"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-stone-500 bg-white hover:bg-stone-50 hover:text-rose-500 border border-stone-200 hover:border-rose-200 rounded-xl shadow-sm transition-all w-full sm:w-auto whitespace-nowrap"
          >
            <RotateCcw size={16} /> 重置本周打卡
          </button>
        )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {planData.map((day: any, index: number) => {
          const theme = dayColors[day.id as keyof typeof dayColors] || dayColors['monday'];
          const currentDate = weekDates[index];
          const displayDate = currentDate.substring(5).replace('-', '/');
          
          return (
            <div key={day.id} className={`bg-white rounded-3xl shadow-sm border ${theme.border} overflow-hidden flex flex-col transition-transform hover:-translate-y-1 duration-300`}>
              <div className={`${theme.headerBg} px-5 py-4 border-b ${theme.border} flex justify-between items-center`}>
                <h2 className={`text-xl font-extrabold ${theme.text}`}>{day.day}</h2>
                <span className={`text-sm font-bold opacity-70 ${theme.text}`}>{displayDate}</span>
              </div>
              
              <div className="p-5 flex-1 space-y-6">
                {/* Food Section */}
                <div className="space-y-3">
                  <h3 className={`text-sm font-bold ${theme.text} uppercase tracking-wider flex items-center gap-2`}>
                    <Utensils size={16} className={theme.icon} /> 饮食安排
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="font-bold text-stone-700 shrink-0 w-10">早餐</span>
                      <span className="text-stone-600">{day.food.breakfast}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-stone-700 shrink-0 w-10">午餐</span>
                      <span className="text-stone-600">{day.food.lunch}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-stone-700 shrink-0 w-10">加餐</span>
                      <span className="text-stone-600">{day.food.snack}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-stone-700 shrink-0 w-10">晚餐</span>
                      <span className="text-stone-600">{day.food.dinner}</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-stone-700 shrink-0 w-10">水果</span>
                      <span className="text-stone-600">{day.food.fruit}</span>
                    </li>
                  </ul>
                </div>

                {/* Exercise Section */}
                <div className="space-y-3">
                  <h3 className={`text-sm font-bold ${theme.text} uppercase tracking-wider flex items-center gap-2`}>
                    <Activity size={16} className={theme.icon} /> 运动计划
                  </h3>
                  <ul className="space-y-2 text-sm text-stone-600">
                    {day.exercise.map((ex, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`${theme.text} mt-0.5 font-bold`}>•</span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Checklist Section */}
                <div className="pt-4 border-t border-stone-100">
                  <h3 className={`text-sm font-bold ${theme.text} uppercase tracking-wider flex items-center gap-2 mb-4`}>
                    <CheckCircle2 size={16} className={theme.icon} /> 今日打卡
                  </h3>
                  <div className="flex justify-between items-center gap-1">
                    {tasks.map(task => {
                      const key = `${currentDate}-${task.id}`;
                      const isChecked = !!checkedItems[key];
                      return (
                        <div key={task.id} className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => toggleCheck(currentDate, task.id)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isChecked 
                                ? `${theme.checkBg} text-white shadow-md scale-110` 
                                : 'bg-stone-100 text-stone-300 hover:bg-stone-200 scale-100'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <span className="text-[11px] font-bold text-stone-500">{task.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Suggestion Section */}
              <div className={`${theme.bg} p-4 border-t ${theme.border}`}>
                <div className={`flex items-start gap-2 text-sm ${theme.text}`}>
                  <Lightbulb size={16} className={`shrink-0 mt-0.5 ${theme.icon}`} />
                  <p className="font-medium">{day.suggestion}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
