import React, { useState, useEffect } from 'react';
import { groceryList as defaultList } from '../data';
import { Leaf, Egg, Wheat, Cherry, Edit2, Save, X, Sparkles } from 'lucide-react';
import { api, getToken } from '../api';

export default function GroceryList() {
  const [listData, setListData] = useState(defaultList);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!getToken();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchList = async () => {
      try {
        const res = await api.getGroceryList();
        if (res.listData) {
          try {
            setListData(JSON.parse(res.listData));
          } catch (e) {
            console.error("Error parsing grocery list data", e);
          }
        }
      } catch (error) {
        console.error("Error fetching grocery list:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      loadAiPurchaseSuggestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated]);

  const saveListToFirebase = async (newListData: any) => {
    if (!isAuthenticated) return;
    try {
      await api.saveGroceryList(JSON.stringify(newListData));
    } catch (error) {
      console.error("Error saving grocery list data:", error);
    }
  };

  const [aiPurchaseSuggestion, setAiPurchaseSuggestion] = useState<any | null>(null);
  const [aiPurchaseLoading, setAiPurchaseLoading] = useState(false);
  const [aiPurchaseError, setAiPurchaseError] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  const loadAiPurchaseSuggestion = async () => {
    if (!isAuthenticated) return;
    setAiPurchaseLoading(true);
    setAiPurchaseError('');
    try {
      const resp = await api.generateAiPurchase();
      setAiPurchaseSuggestion(resp || null);
    } catch (error: any) {
      console.error('Failed to generate AI purchase suggestion', error);
      setAiPurchaseError(error?.message || '生成失败');
      setAiPurchaseSuggestion(null);
    } finally {
      setAiPurchaseLoading(false);
    }
  };

  const startEditing = (category: string, items: string[]) => {
    setEditingCategory(category);
    setEditForm([...items]);
  };

  const saveEdit = async () => {
    if (!editingCategory) return;
    const newListData = { ...listData, [editingCategory]: editForm.filter(item => item.trim() !== '') };
    setListData(newListData);
    await saveListToFirebase(newListData);
    setEditingCategory(null);
    setEditForm([]);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditForm([]);
  };

  const applyPurchaseSuggestion = async () => {
    if (applyLoading || !aiPurchaseSuggestion?.mergedListData) return;
    const ok = window.confirm('确认将“采购建议卡”一键应用到当前清单？');
    if (!ok) return;

    setApplyLoading(true);
    try {
      setListData(aiPurchaseSuggestion.mergedListData as any);
      await saveListToFirebase(aiPurchaseSuggestion.mergedListData);
      alert('已应用采购建议。');
      await loadAiPurchaseSuggestion();
    } catch (error) {
      console.error('Failed to apply purchase suggestion', error);
      alert('应用失败，请稍后重试。');
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse text-center py-10 text-stone-400">加载清单中...</div>;
  }

  const categories = [
    { id: 'vegetables', title: '蔬菜', icon: Leaf, color: 'teal' },
    { id: 'protein', title: '优质蛋白', icon: Egg, color: 'rose' },
    { id: 'carbs', title: '主食', icon: Wheat, color: 'amber' },
    { id: 'fruits', title: '水果', icon: Cherry, color: 'orange' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-extrabold text-stone-900">一周采购清单</h2>

      <div className="bg-white rounded-3xl border border-amber-100 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-base font-extrabold text-amber-700 inline-flex items-center gap-2"><Sparkles size={16} /> {aiPurchaseSuggestion?.summary || '采购建议卡'}</h3>
            {aiPurchaseSuggestion?.rationale && (
              <p className="text-xs text-stone-500 mt-1">
                依据：计划运动关键词 {aiPurchaseSuggestion.rationale.highExerciseMentions ?? '-'} 次；当前覆盖 蔬菜{aiPurchaseSuggestion.rationale.currentCoverage?.vegetables ?? 0}/蛋白{aiPurchaseSuggestion.rationale.currentCoverage?.protein ?? 0}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAiPurchaseSuggestion}
              disabled={aiPurchaseLoading}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${aiPurchaseLoading ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
            >
              {aiPurchaseLoading ? '生成中...' : '重新生成'}
            </button>
            <button
              onClick={applyPurchaseSuggestion}
              disabled={applyLoading || !aiPurchaseSuggestion?.mergedListData}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors whitespace-nowrap ${(applyLoading || !aiPurchaseSuggestion?.mergedListData) ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}
            >
              {applyLoading ? '应用中...' : '一键应用'}
            </button>
          </div>
        </div>

        {aiPurchaseError ? (
          <p className="text-sm text-rose-600">建议生成失败：{aiPurchaseError}</p>
        ) : aiPurchaseLoading && !aiPurchaseSuggestion ? (
          <p className="text-sm text-stone-500">正在生成建议...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
              <div className="text-xs font-extrabold text-rose-700 mb-2">必买</div>
              <ul className="space-y-1.5">
                {(Array.isArray(aiPurchaseSuggestion?.tiers?.mustBuy) ? aiPurchaseSuggestion.tiers.mustBuy : []).length === 0 ? (
                  <li className="text-xs text-rose-600">当前覆盖充足，无新增必买项。</li>
                ) : (
                  (aiPurchaseSuggestion.tiers.mustBuy || []).map((row: any, idx: number) => (
                    <li key={idx} className="text-xs text-rose-700">• {row.item}（{row.reason}）</li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs font-extrabold text-amber-700 mb-2">建议</div>
              <ul className="space-y-1.5">
                {(aiPurchaseSuggestion?.tiers?.recommended || []).map((row: any, idx: number) => (
                  <li key={idx} className="text-xs text-amber-700">• {row.item}（{row.reason}）</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
              <div className="text-xs font-extrabold text-stone-700 mb-2">可选</div>
              <ul className="space-y-1.5">
                {(aiPurchaseSuggestion?.tiers?.optional || []).map((row: any, idx: number) => (
                  <li key={idx} className="text-xs text-stone-700">• {row.item}（{row.reason}）</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map(({ id, title, icon: Icon, color }) => {
          const isEditing = editingCategory === id;
          const items = listData[id as keyof typeof listData] || [];
          
          const colorClasses = {
            teal: { border: 'border-teal-100', bg: 'bg-teal-50', text: 'text-teal-500', title: 'text-teal-900', dot: 'bg-teal-300' },
            rose: { border: 'border-rose-100', bg: 'bg-rose-50', text: 'text-rose-500', title: 'text-rose-900', dot: 'bg-rose-300' },
            amber: { border: 'border-amber-100', bg: 'bg-amber-50', text: 'text-amber-500', title: 'text-amber-900', dot: 'bg-amber-300' },
            orange: { border: 'border-orange-100', bg: 'bg-orange-50', text: 'text-orange-500', title: 'text-orange-900', dot: 'bg-orange-300' }
          }[color as 'teal' | 'rose' | 'amber' | 'orange'];

          return (
            <div key={id} className={`bg-white rounded-3xl shadow-sm border ${colorClasses.border} p-6 hover:-translate-y-1 transition-transform duration-300 flex flex-col`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${colorClasses.bg} ${colorClasses.text} flex items-center justify-center`}>
                    <Icon size={24} />
                  </div>
                  <h3 className={`text-lg font-bold ${colorClasses.title}`}>{title}</h3>
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                      <Save size={16} />
                    </button>
                    <button onClick={cancelEdit} className="p-1.5 bg-stone-200 text-stone-600 rounded-lg hover:bg-stone-300 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEditing(id, items)} className={`p-1.5 ${colorClasses.bg} ${colorClasses.text} rounded-lg opacity-60 hover:opacity-100 transition-opacity`}>
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
              
              <div className="flex-1">
                {isEditing ? (
                  <textarea
                    value={editForm.join('\n')}
                    onChange={(e) => setEditForm(e.target.value.split('\n'))}
                    rows={8}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-pink-400 resize-none text-sm text-stone-600"
                    placeholder="每行输入一项物品"
                  />
                ) : (
                  <ul className="space-y-3">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-stone-600 font-medium">
                        <span className={`w-2 h-2 rounded-full ${colorClasses.dot} mt-2 shrink-0`}></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
