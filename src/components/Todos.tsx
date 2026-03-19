import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/todos`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Todo[];
      setTodos(todosData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}/todos`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/todos`), {
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      });
      setNewTodo('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}/todos`);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/todos`, id), {
        completed: !completed
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}/todos/${id}`);
    }
  };

  const deleteTodo = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/todos`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${auth.currentUser.uid}/todos/${id}`);
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
