import React, { useState, useEffect, useRef } from 'react';
import { weeklyPlan as defaultPlan, dayColors } from '../data';
import { Activity, Lightbulb, Utensils, CheckCircle2, RotateCcw, Download, Upload, Edit2, Save, X, Wand2, Sparkles } from 'lucide-react';
import { getWeekDates } from '../utils';
import { api, getToken } from '../api';

export default function WeeklyPlan() {
  const [planData, setPlanData] = useState(defaultPlan);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates();
  const isAuthenticated = !!getToken();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        const [planRes, checklistRes] = await Promise.all([
          api.getWeeklyPlan(),
          api.getChecklist()
        ]);

        if (planRes.planData) {
          try {
            setPlanData(JSON.parse(planRes.planData));
          } catch (e) {
            console.error("Error parsing plan data", e);
          }
        }

        if (checklistRes.checkedItems) {
          try {
            setCheckedItems(JSON.parse(checklistRes.checkedItems));
          } catch (e) {
            console.error("Error parsing checklist data", e);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      loadAiPlanSuggestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated]);

  const savePlanToFirebase = async (newPlanData: any) => {
    if (!isAuthenticated) return;
    try {
      await api.saveWeeklyPlan(JSON.stringify(newPlanData));
    } catch (error) {
      console.error("Error saving plan data:", error);
    }
  };

  const saveChecklistToFirebase = async (newChecklist: any) => {
    if (!isAuthenticated) return;
    try {
      await api.saveChecklist(JSON.stringify(newChecklist));
    } catch (error) {
      console.error("Error saving checklist data:", error);
    }
  };

  const [aiPlanSuggestion, setAiPlanSuggestion] = useState<any | null>(null);
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiPlanError, setAiPlanError] = useState('');
  const [planApplyLoading, setPlanApplyLoading] = useState(false);

  const loadAiPlanSuggestion = async () => {
    if (!isAuthenticated) return;
    setAiPlanLoading(true);
    setAiPlanError('');
    try {
      const resp = await api.generateAiPlan();
      setAiPlanSuggestion(resp || null);
    } catch (error: any) {
      console.error('Failed to generate AI plan suggestion', error);
      setAiPlanError(error?.message || '生成失败');
      setAiPlanSuggestion(null);
    } finally {
      setAiPlanLoading(false);
    }
  };

  const toggleCheck = (date: string, task: string) => {
    const key = `${date}-${task}`;
    const newItems = {
      ...checkedItems,
      [key]: !checkedItems[key]
    };
    setCheckedItems(newItems);
    saveChecklistToFirebase(newItems);
  };

  const confirmReset = () => {
    const newItems = { ...checkedItems };
    weekDates.forEach(date => {
      tasks.forEach(task => {
        delete newItems[`${date}-${task.id}`];
      });
    });
    setCheckedItems(newItems);
    saveChecklistToFirebase(newItems);
    setShowResetConfirm(false);
  };

  const tasks = [
    { id: 'breakfast', label: '早餐' },
    { id: 'exercise', label: '运动' },
    { id: 'snack', label: '加餐' },
    { id: 'dinner', label: '晚饭' },
    { id: 'sleep', label: '早睡' }
  ];

  type TemplateType = 'standard' | 'light' | 'outdoor';

  const buildTemplate = (templateType: TemplateType) => {
    const base = JSON.parse(JSON.stringify(defaultPlan));

    if (templateType === 'light') {
      return base.map((day: any) => ({
        ...day,
        exercise: [
          '轻量快走 30分钟',
          '舒展拉伸 10分钟'
        ],
        suggestion: `${day.suggestion}（本周采用轻量执行版，重在持续）`
      }));
    }

    if (templateType === 'outdoor') {
      return base.map((day: any) => {
        if (day.id === 'sat' || day.id === 'sun') {
          return {
            ...day,
            exercise: ['户外活动 90–120分钟（步行/骑行/球类）'],
            suggestion: '优先户外活动，保持补水，不带高糖零食。'
          };
        }

        return {
          ...day,
          exercise: [
            '日常步行 40分钟',
            '轻体能训练 15分钟',
            '拉伸 10分钟'
          ]
        };
      });
    }

    return base;
  };

  const applyTemplate = async (templateType: TemplateType) => {
    const nextPlan = buildTemplate(templateType);
    setPlanData(nextPlan);
    await savePlanToFirebase(nextPlan);
  };

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
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json) && json.length > 0) {
          setPlanData(json);
          await savePlanToFirebase(json);
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

  const startEditing = (day: any) => {
    setEditingDay(day.id);
    setEditForm(JSON.parse(JSON.stringify(day))); // Deep copy
  };

  const saveEdit = async () => {
    if (!editForm) return;
    const newPlanData = planData.map((d: any) => d.id === editForm.id ? editForm : d);
    setPlanData(newPlanData);
    await savePlanToFirebase(newPlanData);
    setEditingDay(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    setEditingDay(null);
    setEditForm(null);
  };

  const applyNextWeekSuggestion = async () => {
    if (planApplyLoading || !aiPlanSuggestion?.planData) return;
    const ok = window.confirm('确认将“下周计划建议”一键应用到当前计划？');
    if (!ok) return;

    setPlanApplyLoading(true);
    try {
      setPlanData(aiPlanSuggestion.planData as any);
      await savePlanToFirebase(aiPlanSuggestion.planData);
      alert('已应用下周计划建议。');
      await loadAiPlanSuggestion();
    } catch (error) {
      console.error('Failed to apply suggested weekly plan', error);
      alert('应用失败，请稍后重试。');
    } finally {
      setPlanApplyLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse text-center py-10 text-stone-400">加载计划中...</div>;
  }

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
          <button
            onClick={() => applyTemplate('standard')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-bold text-stone-500 bg-white hover:bg-stone-50 hover:text-pink-500 border border-stone-200 hover:border-pink-200 rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            <Wand2 size={16} /> 套用标准版
          </button>
          <button
            onClick={() => applyTemplate('light')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-bold text-stone-500 bg-white hover:bg-stone-50 hover:text-pink-500 border border-stone-200 hover:border-pink-200 rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            <Wand2 size={16} /> 套用轻量版
          </button>
          <button
            onClick={() => applyTemplate('outdoor')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-sm font-bold text-stone-500 bg-white hover:bg-stone-50 hover:text-pink-500 border border-stone-200 hover:border-pink-200 rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            <Wand2 size={16} /> 套用户外版
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

      <div className="bg-white rounded-3xl border border-violet-100 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-base font-extrabold text-violet-700 inline-flex items-center gap-2">
              <Sparkles size={16} />
              {aiPlanSuggestion?.summary || '下周计划建议卡'}
            </h3>
            {aiPlanSuggestion?.rationale && (
              <p className="text-xs text-stone-500 mt-1">
                依据：近7日打卡 {aiPlanSuggestion.rationale.totalCheckins7d ?? '-'} 次；医疗风险 {aiPlanSuggestion.rationale.latestDiagnosisRisk || 'normal'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAiPlanSuggestion}
              disabled={aiPlanLoading}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${aiPlanLoading ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
            >
              {aiPlanLoading ? '生成中...' : '重新生成'}
            </button>
            <button
              onClick={applyNextWeekSuggestion}
              disabled={planApplyLoading || !aiPlanSuggestion?.planData}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${(planApplyLoading || !aiPlanSuggestion?.planData) ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'}`}
            >
              {planApplyLoading ? '应用中...' : '一键应用'}
            </button>
          </div>
        </div>

        {aiPlanError ? (
          <p className="text-sm text-rose-600">建议生成失败：{aiPlanError}</p>
        ) : aiPlanLoading && !aiPlanSuggestion ? (
          <p className="text-sm text-stone-500">正在生成建议...</p>
        ) : (
          <ul className="space-y-1.5">
            {(Array.isArray(aiPlanSuggestion?.tips) ? aiPlanSuggestion.tips : []).map((tip: string, idx: number) => (
              <li key={idx} className="text-sm text-violet-700 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0"></span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {planData.map((day: any, index: number) => {
          const theme = dayColors[day.id as keyof typeof dayColors] || dayColors['monday'];
          const currentDate = weekDates[index];
          const displayDate = currentDate.substring(5).replace('-', '/');
          
          return (
            <div key={day.id} className={`bg-white rounded-3xl shadow-sm border ${theme.border} overflow-hidden flex flex-col transition-transform hover:-translate-y-1 duration-300`}>
              <div className={`${theme.headerBg} px-5 py-4 border-b ${theme.border} flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                  <h2 className={`text-xl font-extrabold ${theme.text}`}>{day.day}</h2>
                  <span className={`text-sm font-bold opacity-70 ${theme.text}`}>{displayDate}</span>
                </div>
                {editingDay === day.id ? (
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                      <Save size={16} />
                    </button>
                    <button onClick={cancelEdit} className="p-1.5 bg-stone-200 text-stone-600 rounded-lg hover:bg-stone-300 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEditing(day)} className={`p-1.5 ${theme.bg} ${theme.text} rounded-lg opacity-60 hover:opacity-100 transition-opacity`}>
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
              
              <div className="p-5 flex-1 space-y-6">
                {/* Food Section */}
                <div className="space-y-3">
                  <h3 className={`text-sm font-bold ${theme.text} uppercase tracking-wider flex items-center gap-2`}>
                    <Utensils size={16} className={theme.icon} /> 饮食安排
                  </h3>
                  <ul className="space-y-3 text-sm">
                    {['breakfast', 'lunch', 'snack', 'dinner', 'fruit'].map((meal) => (
                      <li key={meal} className="flex gap-3 items-center">
                        <span className="font-bold text-stone-700 shrink-0 w-10">
                          {meal === 'breakfast' ? '早餐' : meal === 'lunch' ? '午餐' : meal === 'snack' ? '加餐' : meal === 'dinner' ? '晚餐' : '水果'}
                        </span>
                        {editingDay === day.id ? (
                          <input
                            type="text"
                            value={editForm.food[meal]}
                            onChange={(e) => setEditForm({...editForm, food: {...editForm.food, [meal]: e.target.value}})}
                            className="flex-1 px-2 py-1 border border-stone-200 rounded focus:outline-none focus:border-pink-400"
                          />
                        ) : (
                          <span className="text-stone-600">{day.food[meal as keyof typeof day.food]}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exercise Section */}
                <div className="space-y-3">
                  <h3 className={`text-sm font-bold ${theme.text} uppercase tracking-wider flex items-center gap-2`}>
                    <Activity size={16} className={theme.icon} /> 运动计划
                  </h3>
                  <ul className="space-y-2 text-sm text-stone-600">
                    {editingDay === day.id ? (
                      <textarea
                        value={editForm.exercise.join('\n')}
                        onChange={(e) => setEditForm({...editForm, exercise: e.target.value.split('\n')})}
                        rows={3}
                        className="w-full px-2 py-1 border border-stone-200 rounded focus:outline-none focus:border-pink-400 resize-none"
                        placeholder="每行输入一项运动"
                      />
                    ) : (
                      day.exercise.map((ex: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className={`${theme.text} mt-0.5 font-bold`}>•</span>
                          <span>{ex}</span>
                        </li>
                      ))
                    )}
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
                  {editingDay === day.id ? (
                    <input 
                      type="text" 
                      value={editForm.suggestion}
                      onChange={(e) => setEditForm({...editForm, suggestion: e.target.value})}
                      className="flex-1 px-2 py-1 border border-stone-200 rounded focus:outline-none focus:border-pink-400 bg-white/50"
                    />
                  ) : (
                    <p className="font-medium">{day.suggestion}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
