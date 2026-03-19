import React, { useState } from 'react';
import { Sparkles, LogIn, UserPlus, Mail, Lock, User, Calendar, Activity } from 'lucide-react';
import { api, setToken } from '../api';

interface AuthProps {
  onLogin: () => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [childGender, setChildGender] = useState('girl');
  const [childGoal, setChildGoal] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login({ email, password });
        setToken(res.token);
        onLogin();
      } else {
        const res = await api.register({
          email,
          password,
          childName,
          childBirthDate,
          childGender,
          childGoal
        });
        setToken(res.token);
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-xl border border-pink-100 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-pink-400 to-rose-400 text-white flex items-center justify-center shadow-lg shadow-pink-200">
          <Sparkles size={32} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
            宝贝健康成长执行清单
          </h1>
          <p className="text-stone-500 font-medium text-sm">
            记录成长点滴，定制专属健康计划
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="邮箱地址"
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码 (至少6位)"
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>

            {!isLogin && (
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <p className="text-sm font-medium text-stone-600 px-1">宝贝基本信息</p>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="text"
                    required={!isLogin}
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
                      required={!isLogin}
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
                    placeholder="成长小目标 (例如: 控体重增速、稳发育节奏)"
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? '处理中...' : isLogin ? (
              <><LogIn size={18} /> 登录</>
            ) : (
              <><UserPlus size={18} /> 注册</>
            )}
          </button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-stone-200"></div>
        </div>
        
        <p className="text-sm text-stone-500 mt-4">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-pink-600 font-bold ml-1 hover:underline"
          >
            {isLogin ? '立即注册' : '直接登录'}
          </button>
        </p>
      </div>
    </div>
  );
}
