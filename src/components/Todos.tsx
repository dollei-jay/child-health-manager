import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { api } from '../api';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
}

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

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
      const addedTodo = await api.createTodo(newTodo.trim());
      setTodos([addedTodo, ...todos]);
      setNewTodo('');
    } catch (error) {
      console.error('Failed to add todo', error);
    }
  };

  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      await api.updateTodo(id, !completed);
      setTodos(todos.map(t => t.id === id ? { ...t, completed: !completed } : t));
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
        <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
          <CheckCircle2 className="text-pink-500" />
          备忘与待办
        </h2>

        <form onSubmit={handleAddTodo} className="flex gap-3 mb-8">
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
        </form>

        <div className="space-y-3">
          {todos.length === 0 ? (
            <p className="text-center text-stone-400 py-8">暂无待办事项，快来添加一个吧！</p>
          ) : (
            todos.map(todo => (
              <div
                key={todo.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  todo.completed 
                    ? 'bg-stone-50 border-stone-100' 
                    : 'bg-white border-stone-200 hover:border-pink-200 shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  className={`flex-shrink-0 transition-colors ${
                    todo.completed ? 'text-pink-500' : 'text-stone-300 hover:text-pink-400'
                  }`}
                >
                  {todo.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                
                <span className={`flex-1 text-lg ${
                  todo.completed ? 'text-stone-400 line-through' : 'text-stone-700'
                }`}>
                  {todo.text}
                </span>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-stone-300 hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
