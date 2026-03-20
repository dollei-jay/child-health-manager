import React, { useState, useEffect } from 'react';
import { X, Save, User, Calendar, Activity, ImagePlus } from 'lucide-react';
import { api } from '../api';
import ChildManager from './ChildManager';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onProfileUpdate: (profile: any) => void;
  onRefreshProfile?: () => Promise<void> | void;
}

export default function ProfileSettings({ isOpen, onClose, userProfile, onProfileUpdate, onRefreshProfile }: ProfileSettingsProps) {
  const [childName, setChildName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [childGender, setChildGender] = useState('girl');
  const [childGoal, setChildGoal] = useState('');
  const [childAvatar, setChildAvatar] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setChildName(userProfile.childName || '');
      setChildBirthDate(userProfile.childBirthDate || '');
      setChildGender(userProfile.childGender || 'girl');
      setChildGoal(userProfile.childGoal || '');
      setChildAvatar(userProfile.childAvatar || '');
    }
  }, [userProfile]);

  const handleAvatarSelect = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        const maxSize = 256;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        setChildAvatar(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const refreshProfile = async () => {
    if (onRefreshProfile) {
      await onRefreshProfile();
      return;
    }

    const profile = await api.getProfile();
    onProfileUpdate(profile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedProfile = {
        childName,
        childBirthDate,
        childGender,
        childGoal,
        childAvatar
      };
      await api.updateProfile(updatedProfile);
      await refreshProfile();
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-800">孩子信息与多档案管理</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 bg-white">
            <h3 className="text-sm font-bold text-stone-600">当前选中孩子（兼容旧入口）</h3>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="text"
                  required
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="宝贝昵称"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="date"
                    required
                    value={childBirthDate}
                    onChange={(e) => setChildBirthDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-stone-600"
                  />
                </div>
                <select
                  value={childGender}
                  onChange={(e) => setChildGender(e.target.value)}
                  className="w-32 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-stone-600"
                >
                  <option value="girl">女孩</option>
                  <option value="boy">男孩</option>
                </select>
              </div>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="text"
                  value={childGoal}
                  onChange={(e) => setChildGoal(e.target.value)}
                  placeholder="成长小目标"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
              </div>
              <label className="flex items-center gap-3 px-3 py-2.5 border border-stone-200 rounded-xl bg-stone-50 cursor-pointer hover:bg-pink-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center overflow-hidden font-bold text-sm">
                  {childAvatar ? <img src={childAvatar} alt="头像预览" className="w-full h-full object-cover" /> : <ImagePlus size={16} />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-stone-700">上传孩子头像（可选）</p>
                  <p className="text-xs text-stone-500">支持注册后自定义修改</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarSelect(e.target.files?.[0])}
                />
              </label>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? '保存中...' : <><Save size={16} /> 保存当前孩子</>}
              </button>
            </div>
          </form>

          <div className="border-t border-stone-100 pt-6">
            <ChildManager
              selectedChildId={userProfile?.selectedChildId}
              onSelectedChange={async () => {
                await refreshProfile();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
