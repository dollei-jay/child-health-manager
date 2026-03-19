import React, { useMemo, useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Filter, CalendarClock, Flag, Pencil, Save, X } from 'lucide-react';
import { api } from '../api';

type Priority = 'low' | 'medium' | 'high';
type FilterMode = 'all' | 'active' | 'completed' | 'overdue' | 'today' | 'week';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority?: Priority;
  dueDate?: string | null;
  createdAt: string;
}

const priorityMeta: Record<Priority, { label: string; chip: string }> = {
  high: { label: '高优先', chip: 'bg-rose-100 text-rose-600 border-rose-200' },
  medium: { label: '中优先', chip: 'bg-amber-100 text-amber-600 border-amber-200' },
  low: { label: '低优先', chip: 'bg-teal-100 text-teal-600 border-teal-200' }
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateSafe(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const data = await api.getTodos();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const addedTodo = await api.createTodo({
        text: newTodo.trim(),
        priority: newPriority,
        dueDate: newDueDate || null
      });
      setTodos([addedTodo, ...todos]);
      setNewTodo('');
      setNewPriority('medium');
      setNewDueDate('');
    } catch (error) {
      console.error('Failed to add todo', error);
    }
  };

  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      await api.updateTodo(id, { completed: !completed });
      setTodos(todos.map(t => (t.id === id ? { ...t, completed: !completed } : t)));
    } catch (error) {
      console.error('Failed to update todo', error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await api.deleteTodo(id);
      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo', error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditPriority(todo.priority || 'medium');
    setEditDueDate(todo.dueDate || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditPriority('medium');
    setEditDueDate('');
  };

  const saveEdit = async (id: number) => {
    const trimmed = editText.trim();
    if (!trimmed) return;

    try {
      await api.updateTodo(id, {
        text: trimmed,
        priority: editPriority,
        dueDate: editDueDate || null
      });
      setTodos(todos.map(t => (
        t.id === id
          ? { ...t, text: trimmed, priority: editPriority, dueDate: editDueDate || null }
          : t
      )));
      cancelEdit();
    } catch (error) {
      console.error('Failed to save todo edit', error);
    }
  };

  const sortedTodos = useMemo(() => {
    const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

    return [...todos].sort((a, b) => {
      const ap = priorityRank[(a.priority || 'medium') as Priority];
      const bp = priorityRank[(b.priority || 'medium') as Priority];
      if (ap !== bp) return ap - bp;

      const ad = parseDateSafe(a.dueDate);
      const bd = parseDateSafe(b.dueDate);

      if (ad && bd) return ad.getTime() - bd.getTime();
      if (ad && !bd) return -1;
      if (!ad && bd) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [todos]);

  const filteredTodos = useMemo(() => {
    const today = startOfDay(new Date());
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    return sortedTodos.filter(todo => {
      const due = parseDateSafe(todo.dueDate);
      const dueStart = due ? startOfDay(due) : null;

      switch (filterMode) {
        case 'active':
          return !todo.completed;
        case 'completed':
          return todo.completed;
        case 'overdue':
          return !todo.completed && !!dueStart && dueStart < today;
        case 'today':
          return !!dueStart && dueStart.getTime() === today.getTime();
        case 'week':
          return !!dueStart && dueStart >= today && dueStart <= weekEnd;
        case 'all':
        default:
          return true;
      }
    });
  }, [sortedTodos, filterMode]);

  const summary = useMemo(() => {
    const today = startOfDay(new Date());
    const active = todos.filter(t => !t.completed).length;
    const completed = todos.filter(t => t.completed).length;
    const overdue = todos.filter(t => {
      const due = parseDateSafe(t.dueDate);
      return !t.completed && !!due && startOfDay(due) < today;
    }).length;
    return { active, completed, overdue };
  }, [todos]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
        <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
          <CheckCircle2 className="text-pink-500" />
          备忘与待办
        </h2>

        <form onSubmit={handleAddTodo} className="space-y-3 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="添加新的待办事项..."
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!newTodo.trim()}
              className="bg-pink-500 hover:bg-pink-600 disabled:bg-stone-300 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
            >
              <Plus size={20} />
              添加
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-600">
              <Flag size={16} className="text-rose-400" />
              <span className="font-medium">优先级</span>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="ml-auto bg-white border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                <option value="high">高优先</option>
                <option value="medium">中优先</option>
                <option value="low">低优先</option>
              </select>
            </label>

            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-600">
              <CalendarClock size={16} className="text-purple-400" />
              <span className="font-medium">截止日期</span>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="ml-auto bg-white border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </label>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <SummaryCard title="待完成" value={summary.active} tone="rose" />
          <SummaryCard title="已完成" value={summary.completed} tone="teal" />
          <SummaryCard title="已逾期" value={summary.overdue} tone="amber" />
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-5">
          <Filter size={15} className="text-stone-400" />
          {[
            { key: 'all', label: '全部' },
            { key: 'active', label: '进行中' },
            { key: 'completed', label: '已完成' },
            { key: 'overdue', label: '已逾期' },
            { key: 'today', label: '今天到期' },
            { key: 'week', label: '7天内到期' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setFilterMode(item.key as FilterMode)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                filterMode === item.key
                  ? 'bg-pink-50 text-pink-600 border-pink-200'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-pink-200 hover:text-pink-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <p className="text-center text-stone-400 py-8">当前筛选下暂无待办事项</p>
          ) : (
            filteredTodos.map(todo => {
              const prio = (todo.priority || 'medium') as Priority;
              const due = parseDateSafe(todo.dueDate);
              const isOverdue = !todo.completed && !!due && startOfDay(due) < startOfDay(new Date());
              const isEditing = editingId === todo.id;

              return (
                <div
                  key={todo.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    todo.completed
                      ? 'bg-stone-50 border-stone-100'
                      : 'bg-white border-stone-200 hover:border-pink-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTodo(todo.id, todo.completed)}
                      className={`flex-shrink-0 mt-0.5 transition-colors ${
                        todo.completed ? 'text-pink-500' : 'text-stone-300 hover:text-pink-400'
                      }`}
                    >
                      {todo.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <select
                              value={editPriority}
                              onChange={(e) => setEditPriority(e.target.value as Priority)}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            >
                              <option value="high">高优先</option>
                              <option value="medium">中优先</option>
                              <option value="low">低优先</option>
                            </select>
                            <input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveEdit(todo.id)}
                              className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 flex items-center gap-1"
                            >
                              <Save size={14} /> 保存
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 text-sm font-medium hover:bg-stone-200 flex items-center gap-1"
                            >
                              <X size={14} /> 取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <span
                              className={`text-lg break-words ${
                                todo.completed ? 'text-stone-400 line-through' : 'text-stone-700'
                              }`}
                            >
                              {todo.text}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => startEdit(todo)}
                                className="text-stone-300 hover:text-purple-500 transition-colors p-1.5"
                                title="编辑"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => deleteTodo(todo.id)}
                                className="text-stone-300 hover:text-red-500 transition-colors p-1.5"
                                title="删除"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${priorityMeta[prio].chip}`}>
                              {priorityMeta[prio].label}
                            </span>
                            {todo.dueDate ? (
                              <span
                                className={`text-xs px-2 py-1 rounded-lg border font-medium ${
                                  isOverdue
                                    ? 'bg-rose-100 text-rose-600 border-rose-200'
                                    : 'bg-purple-100 text-purple-600 border-purple-200'
                                }`}
                              >
                                截止：{todo.dueDate}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-lg border font-medium bg-stone-100 text-stone-500 border-stone-200">
                                无截止日期
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, tone }: { title: string; value: number; tone: 'rose' | 'teal' | 'amber' }) {
  const styleMap = {
    rose: 'border-rose-100 bg-rose-50/50 text-rose-600',
    teal: 'border-teal-100 bg-teal-50/50 text-teal-600',
    amber: 'border-amber-100 bg-amber-50/50 text-amber-600'
  } as const;

  return (
    <div className={`rounded-2xl border px-4 py-3 ${styleMap[tone]}`}>
      <p className="text-xs font-medium opacity-80">{title}</p>
      <p className="text-2xl font-extrabold leading-tight mt-1">{value}</p>
    </div>
  );
}
