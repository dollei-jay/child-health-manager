import React, { useState, useEffect, useRef } from 'react';
import { weeklyPlan as defaultPlan, dayColors } from '../data';
import { Activity, Lightbulb, Utensils, CheckCircle2, RotateCcw, Download, Upload, Edit2, Save, X } from 'lucide-react';
import { getWeekDates } from '../utils';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export default function WeeklyPlan() {
  const [planData, setPlanData] = useState(defaultPlan);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    const planRef = doc(db, `users/${userId}/weeklyPlan/current`);
    const checklistRef = doc(db, `users/${userId}/checklist/current`);

    const unsubPlan = onSnapshot(planRef, (docSnap) => {
      if (docSnap.exists()) {
        try {
          setPlanData(JSON.parse(docSnap.data().planData));
        } catch (e) {
          console.error("Error parsing plan data", e);
        }
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}/weeklyPlan/current`));

    const unsubChecklist = onSnapshot(checklistRef, (docSnap) => {
      if (docSnap.exists()) {
        try {
          setCheckedItems(JSON.parse(docSnap.data().checkedItems));
        } catch (e) {
          console.error("Error parsing checklist data", e);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}/checklist/current`));

    return () => {
      unsubPlan();
      unsubChecklist();
    };
  }, [userId]);

  const savePlanToFirebase = async (newPlanData: any) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, `users/${userId}/weeklyPlan/current`), {
        planData: JSON.stringify(newPlanData),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/weeklyPlan/current`);
    }
  };

  const saveChecklistToFirebase = async (newChecklist: any) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, `users/${userId}/checklist/current`), {
        checkedItems: JSON.stringify(newChecklist),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/checklist/current`);
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
