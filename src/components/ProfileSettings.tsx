import React, { useState, useEffect } from 'react';
import { X, Save, User, Calendar, Activity } from 'lucide-react';
import { api } from '../api';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onProfileUpdate: (profile: any) => void;
}

export default function ProfileSettings({ isOpen, onClose, userProfile, onProfileUpdate }: ProfileSettingsProps) {
  const [childName, setChildName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [childGender, setChildGender] = useState('girl');
  const [childGoal, setChildGoal] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setChildName(userProfile.childName || '');
      setChildBirthDate(userProfile.childBirthDate || '');
      setChildGender(userProfile.childGender || 'girl');
      setChildGoal(userProfile.childGoal || '');
    }
  }, [userProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedProfile = {
        childName,
        childBirthDate,
        childGender,
        childGoal
      };
      await api.updateProfile(updatedProfile);
      onProfileUpdate({ ...userProfile, ...updatedProfile });
      onClose();
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <h2 className="text-xl font-bold text-stone-800">修改宝贝信息</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
          </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? '保存中...' : <><Save size={18} /> 保存修改</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
