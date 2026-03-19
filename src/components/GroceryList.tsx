import React, { useState, useEffect } from 'react';
import { groceryList as defaultList } from '../data';
import { Leaf, Egg, Wheat, Cherry, Edit2, Save, X } from 'lucide-react';
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

  const saveListToFirebase = async (newListData: any) => {
    if (!isAuthenticated) return;
    try {
      await api.saveGroceryList(JSON.stringify(newListData));
    } catch (error) {
      console.error("Error saving grocery list data:", error);
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
