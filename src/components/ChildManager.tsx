import React, { useEffect, useState } from 'react';
import { Plus, Users, Save, X, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../api';

interface ChildProfile {
  id: number;
  childName: string;
  childBirthDate?: string | null;
  childGender?: 'boy' | 'girl';
  childGoal?: string;
  childAvatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ChildManagerProps {
  selectedChildId?: number | null;
  onSelectedChange?: (childId: number) => Promise<void> | void;
}

export default function ChildManager({ selectedChildId, onSelectedChange }: ChildManagerProps) {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingChildId, setDeletingChildId] = useState<number | null>(null);
  const [migrationTargetId, setMigrationTargetId] = useState<number | null>(null);

  const [formName, setFormName] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formGender, setFormGender] = useState<'boy' | 'girl'>('girl');
  const [formGoal, setFormGoal] = useState('');
  const [formAvatar, setFormAvatar] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormBirthDate('');
    setFormGender('girl');
    setFormGoal('');
    setFormAvatar('');
  };

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const res = await api.getChildren();
      setChildren(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      console.error('failed to fetch children', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormAvatar(String(reader.result || '').slice(0, 250000));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const submitCreate = async () => {
    if (!formName.trim()) return;
    try {
      const created = await api.createChild({
        childName: formName.trim(),
        childBirthDate: formBirthDate || null,
        childGender: formGender,
        childGoal: formGoal,
        childAvatar: formAvatar
      });
      setShowCreate(false);
      resetForm();
      await fetchChildren();

      if (created?.id && onSelectedChange) {
        await onSelectedChange(Number(created.id));
      }
    } catch (err) {
      console.error('failed to create child', err);
    }
  };

  const startEdit = (child: ChildProfile) => {
    setEditingId(child.id);
    setFormName(child.childName || '');
    setFormBirthDate(child.childBirthDate || '');
    setFormGender((child.childGender as 'boy' | 'girl') || 'girl');
    setFormGoal(child.childGoal || '');
    setFormAvatar(child.childAvatar || '');
  };

  const submitEdit = async () => {
    if (!editingId || !formName.trim()) return;
    try {
      await api.updateChild(editingId, {
        childName: formName.trim(),
        childBirthDate: formBirthDate || null,
        childGender: formGender,
        childGoal: formGoal,
        childAvatar: formAvatar
      });
      setEditingId(null);
      resetForm();
      await fetchChildren();
    } catch (err) {
      console.error('failed to update child', err);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const startDelete = (childId: number) => {
    const candidates = children.filter((c) => c.id !== childId);
    setDeletingChildId(childId);
    setMigrationTargetId(candidates.length ? candidates[0].id : null);
  };

  const cancelDelete = () => {
    setDeletingChildId(null);
    setMigrationTargetId(null);
  };

  const submitDelete = async () => {
    if (!deletingChildId) return;
    try {
      await api.deleteChild(deletingChildId, migrationTargetId || undefined);
      cancelDelete();
      await fetchChildren();
      if (onSelectedChange) await onSelectedChange(migrationTargetId || deletingChildId);
    } catch (err) {
      console.error('failed to delete child', err);
    }
  };

  if (loading) {
    return <div className="animate-pulse text-center py-8 text-stone-400">加载孩子档案中...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-stone-800 inline-flex items-center gap-2">
          <Users size={18} className="text-pink-500" /> 多孩子档案
        </h3>
        <button
          onClick={() => {
            setShowCreate((v) => !v);
            setEditingId(null);
            resetForm();
          }}
          className="px-3 py-2 text-xs font-bold rounded-xl bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100 transition-colors inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> 新增孩子
        </button>
      </div>

      {showCreate && (
        <EditorCard
          title="新增孩子"
          formName={formName}
          setFormName={setFormName}
          formBirthDate={formBirthDate}
          setFormBirthDate={setFormBirthDate}
          formGender={formGender}
          setFormGender={setFormGender}
          formGoal={formGoal}
          setFormGoal={setFormGoal}
          formAvatar={formAvatar}
          onAvatarSelect={handleAvatarSelect}
          onSave={submitCreate}
          onCancel={() => {
            setShowCreate(false);
            resetForm();
          }}
        />
      )}

      <div className="space-y-3">
        {children.map((child) => {
          const selected = Number(selectedChildId) === Number(child.id);
          const editing = editingId === child.id;

          if (editing) {
            return (
              <div key={child.id}>
                <EditorCard
                  title={`编辑：${child.childName}`}
                  formName={formName}
                  setFormName={setFormName}
                  formBirthDate={formBirthDate}
                  setFormBirthDate={setFormBirthDate}
                  formGender={formGender}
                  setFormGender={setFormGender}
                  formGoal={formGoal}
                  setFormGoal={setFormGoal}
                  formAvatar={formAvatar}
                  onAvatarSelect={handleAvatarSelect}
                  onSave={submitEdit}
                  onCancel={cancelEdit}
                />
              </div>
            );
          }

          return (
            <div key={child.id} className={`p-4 rounded-2xl border ${selected ? 'border-pink-200 bg-pink-50/50' : 'border-stone-200 bg-white'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 font-bold flex items-center justify-center overflow-hidden shrink-0">
                    {child.childAvatar ? (
                      <img src={child.childAvatar} alt="孩子头像" className="w-full h-full object-cover" />
                    ) : (
                      (child.childName || '宝').charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-stone-700 truncate">{child.childName}</p>
                    <p className="text-xs text-stone-500 mt-1">
                      {child.childBirthDate ? `生日 ${child.childBirthDate}` : '未设置生日'} · {child.childGender === 'boy' ? '男孩' : '女孩'}
                    </p>
                    <p className="text-xs text-stone-400 mt-1 truncate">{child.childGoal || '未设置成长目标'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!selected && (
                    <button
                      onClick={async () => {
                        await api.selectChild(child.id);
                        if (onSelectedChange) await onSelectedChange(child.id);
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-pink-200 text-pink-600 bg-white hover:bg-pink-50"
                    >
                      切换
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(child)}
                    className="p-2 text-stone-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg"
                    title="编辑"
                  >
                    <Pencil size={15} />
                  </button>
                  {children.length > 1 && (
                    <button
                      onClick={() => startDelete(child.id)}
                      className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                      title="删除"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {deletingChildId && (
          <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-3">
            <p className="text-sm font-bold text-rose-700 inline-flex items-center gap-2">
              <AlertTriangle size={16} /> 删除孩子档案（数据迁移）
            </p>
            <p className="text-xs text-rose-600">将把该孩子关联的待办/计划/清单/生长记录迁移到目标孩子，然后删除该档案。</p>

            <label className="text-xs font-medium text-stone-600 block">
              迁移目标
              <select
                value={migrationTargetId || ''}
                onChange={(e) => setMigrationTargetId(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
              >
                {children
                  .filter((c) => c.id !== deletingChildId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.childName}
                    </option>
                  ))}
              </select>
            </label>

            <div className="flex items-center gap-2">
              <button onClick={submitDelete} className="px-3 py-2 text-xs font-bold rounded-lg bg-rose-500 text-white hover:bg-rose-600">确认删除并迁移</button>
              <button onClick={cancelDelete} className="px-3 py-2 text-xs font-bold rounded-lg bg-white border border-stone-200 text-stone-600 hover:bg-stone-50">取消</button>
            </div>
          </div>
        )}

        {children.length === 0 && (
          <div className="text-sm text-stone-500 py-5 text-center border border-dashed border-stone-200 rounded-2xl bg-stone-50">
            还没有孩子档案，请先新增。
          </div>
        )}
      </div>
    </div>
  );
}

function EditorCard({
  title,
  formName,
  setFormName,
  formBirthDate,
  setFormBirthDate,
  formGender,
  setFormGender,
  formGoal,
  setFormGoal,
  formAvatar,
  onAvatarSelect,
  onSave,
  onCancel
}: {
  title: string;
  formName: string;
  setFormName: (v: string) => void;
  formBirthDate: string;
  setFormBirthDate: (v: string) => void;
  formGender: 'boy' | 'girl';
  setFormGender: (v: 'boy' | 'girl') => void;
  formGoal: string;
  setFormGoal: (v: string) => void;
  formAvatar: string;
  onAvatarSelect: (file?: File) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="p-4 rounded-2xl border border-pink-200 bg-white space-y-3">
      <p className="text-sm font-bold text-stone-700">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="孩子昵称"
          className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <input
          type="date"
          value={formBirthDate}
          onChange={(e) => setFormBirthDate(e.target.value)}
          className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <select
          value={formGender}
          onChange={(e) => setFormGender((e.target.value as 'boy' | 'girl') || 'girl')}
          className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
        >
          <option value="girl">女孩</option>
          <option value="boy">男孩</option>
        </select>
        <input
          value={formGoal}
          onChange={(e) => setFormGoal(e.target.value)}
          placeholder="成长目标"
          className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
      </div>

      <label className="flex items-center gap-3 px-3 py-2 border border-stone-200 rounded-xl bg-stone-50 cursor-pointer hover:bg-pink-50 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 font-bold flex items-center justify-center overflow-hidden">
          {formAvatar ? <img src={formAvatar} alt="头像预览" className="w-full h-full object-cover" /> : '头像'}
        </div>
        <div className="text-xs text-stone-600 font-medium">上传孩子头像（可选）</div>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onAvatarSelect(e.target.files?.[0])} />
      </label>

      <div className="flex items-center gap-2">
        <button onClick={onSave} className="px-3 py-2 text-xs font-bold rounded-lg bg-pink-500 text-white hover:bg-pink-600 inline-flex items-center gap-1.5"><Save size={14} /> 保存</button>
        <button onClick={onCancel} className="px-3 py-2 text-xs font-bold rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 inline-flex items-center gap-1.5"><X size={14} /> 取消</button>
      </div>
    </div>
  );
}
