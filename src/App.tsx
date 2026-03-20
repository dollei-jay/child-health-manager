import React, { useState, useEffect, lazy, Suspense } from 'react';
import { CalendarDays, ShoppingCart, TrendingUp, LogOut, ListTodo, Settings, Home, Bell, Repeat } from 'lucide-react';
import Auth from './components/Auth';
import ProfileSettings from './components/ProfileSettings';

const WeeklyPlan = lazy(() => import('./components/WeeklyPlan'));
const GroceryList = lazy(() => import('./components/GroceryList'));
const Principles = lazy(() => import('./components/Principles'));
const Stats = lazy(() => import('./components/Stats'));
const GrowthTracker = lazy(() => import('./components/GrowthTracker'));
const Todos = lazy(() => import('./components/Todos'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const WeeklyReview = lazy(() => import('./components/WeeklyReview'));
const ReminderCenter = lazy(() => import('./components/ReminderCenter'));
import { api, getToken, removeToken } from './api';

interface UserProfile {
  childName?: string;
  childBirthDate?: string;
  childGender?: string;
  childGoal?: string;
  childAvatar?: string;
  selectedChildId?: number | null;
}

interface ChildMeta {
  total: number;
  selectedName: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [childMeta, setChildMeta] = useState<ChildMeta>({ total: 0, selectedName: '' });
  const [children, setChildren] = useState<Array<{ id: number; childName: string; childAvatar?: string }>>([]);
  const [reminderCount, setReminderCount] = useState(0);
  const [contextVersion, setContextVersion] = useState(0);
  const [isSwitchingChild, setIsSwitchingChild] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          await fetchAndSetProfile();
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Failed to fetch profile', err);
          removeToken();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const fetchAndSetProfile = async () => {
    const profile = await api.getProfile();
    setUserProfile(profile);

    try {
      const childrenRes = await api.getChildren();
      const items = Array.isArray(childrenRes?.items) ? childrenRes.items : [];
      setChildren(items.map((c: any) => ({ id: Number(c.id), childName: String(c.childName || ''), childAvatar: c.childAvatar || '' })));
      const selectedId = Number(profile?.selectedChildId);
      const selected = items.find((c: any) => Number(c.id) === selectedId);
      setChildMeta({ total: items.length, selectedName: selected?.childName || profile?.childName || '' });
    } catch {
      setChildren([]);
      setChildMeta({ total: profile?.childName ? 1 : 0, selectedName: profile?.childName || '' });
    }

    try {
      const reminders = await api.getReminders();
      setReminderCount(Array.isArray(reminders?.items) ? reminders.items.length : 0);
    } catch {
      setReminderCount(0);
    }
  };

  const handleLogin = async () => {
    try {
      await fetchAndSetProfile();
      setIsAuthenticated(true);
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    removeToken();
    setIsAuthenticated(false);
    setUserProfile(null);
  };

  const handleQuickSwitchChild = async () => {
    if (children.length <= 1 || isSwitchingChild) return;
    const selectedId = Number(userProfile?.selectedChildId);
    const currentIndex = children.findIndex((c) => c.id === selectedId);
    const next = children[(currentIndex + 1 + children.length) % children.length];
    if (!next) return;

    setIsSwitchingChild(true);
    try {
      setUserProfile((prev) => prev ? {
        ...prev,
        selectedChildId: next.id,
        childName: next.childName || prev.childName,
        childAvatar: next.childAvatar || prev.childAvatar
      } : prev);
      setChildMeta((prev) => ({ ...prev, selectedName: next.childName || prev.selectedName }));

      await api.selectChild(next.id);
      await fetchAndSetProfile();
      setActiveTab('dashboard');
      setContextVersion((v) => v + 1);
    } catch (err) {
      console.error('Failed to quick switch child', err);
      await fetchAndSetProfile();
    } finally {
      setIsSwitchingChild(false);
    }
  };

  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return '';
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    
    if (today.getDate() < birthDate.getDate()) {
      months--;
    }
    
    if (months < 0) {
      months += 12;
    }

    return `${years}岁${months}个月`;
  };

  const getSubtitle = () => {
    if (!userProfile) return '8岁7个月女孩 ｜ 控体重增速、稳发育节奏';

    const age = calculateAge(userProfile.childBirthDate);
    const gender = userProfile.childGender === 'boy' ? '男孩' : '女孩';
    const goal = userProfile.childGoal || '健康成长';

    if (age) {
      return `${age}${gender} ｜ ${goal}`;
    }
    return `宝贝健康成长 ｜ ${goal}`;
  };

  const selectedChild = children.find((c) => Number(c.id) === Number(userProfile?.selectedChildId));
  const childAvatar = selectedChild?.childAvatar || userProfile?.childAvatar || '';
  const childInitial = (userProfile?.childName || childMeta.selectedName || '宝').trim().charAt(0) || '宝';
  const isBoyTheme = false;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-pulse text-pink-400 font-bold text-xl">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="max-w-5xl mx-auto space-y-8">
            <Dashboard childName={userProfile?.childName} childAvatar={childAvatar} isBoyTheme={isBoyTheme} />
            <Principles />
            <Stats showCalendar={false} />
            <WeeklyReview />
          </div>
        );
      case 'growth': return <GrowthTracker />;
      case 'plan': return <WeeklyPlan />;
      case 'grocery': return <GroceryList />;
      case 'todos': return <Todos />;
      case 'reminders': return <ReminderCenter onGotoTab={setActiveTab} />;
      default: return <Dashboard childName={userProfile?.childName} childAvatar={childAvatar} isBoyTheme={isBoyTheme} />;
    }
  };

  return (
    <div className={`min-h-screen text-stone-800 font-sans pb-12 ${isBoyTheme ? 'theme-boy bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 selection:bg-blue-100' : 'theme-girl bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 selection:bg-pink-200'}`}>
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-xl border-b border-pink-100 sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3 gap-3 lg:gap-4">
            {/* Top row on mobile: Title + Actions */}
            <div className="flex items-center justify-between gap-4 min-w-0">
              <div className="flex items-center gap-3 shrink-0 min-w-0">
                <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-200 font-extrabold text-lg overflow-hidden">
                  {childAvatar ? (
                    <img src={childAvatar} alt="孩子头像" className="w-full h-full object-cover" />
                  ) : (
                    childInitial
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className={`text-lg sm:text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r leading-tight truncate ${isBoyTheme ? 'from-sky-500 to-cyan-500' : 'from-pink-600 to-purple-600'}`}>
                    {userProfile?.childName ? `${userProfile.childName}的成长管理` : '宝贝成长管理'}
                  </h1>
                  <p className="mt-0.5 text-xs font-medium text-stone-500 flex items-center gap-1.5 truncate">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${isBoyTheme ? 'bg-sky-400' : 'bg-pink-400'}`}></span>
                    <span className="truncate">{getSubtitle()}</span>
                  </p>

                </div>
              </div>
              
              {/* Mobile Actions */}
              <div className="flex items-center gap-1 shrink-0 lg:hidden">
                <button
                  onClick={() => setActiveTab('reminders')}
                  className={`p-2 rounded-xl transition-colors ${reminderCount > 0 ? 'text-amber-600 hover:bg-amber-50' : 'text-stone-500 hover:bg-stone-50'}`}
                  title="提醒中心"
                >
                  <Bell size={20} />
                </button>
                {children.length > 1 && (
                  <button
                    onClick={handleQuickSwitchChild}
                    disabled={isSwitchingChild}
                    className={`p-2 rounded-xl transition-colors ${isSwitchingChild ? 'text-stone-300 cursor-not-allowed' : 'text-stone-500 hover:text-pink-500 hover:bg-pink-50'}`}
                    title={`快速切换孩子（当前：${childMeta.selectedName || userProfile?.childName || '未选择'}）`}
                  >
                    <Repeat size={20} className={isSwitchingChild ? 'animate-spin' : ''} />
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-stone-500 hover:text-pink-500 hover:bg-pink-50 rounded-xl transition-colors"
                  title="设置"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-stone-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                  title="退出登录"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
            
            {/* Bottom row on mobile: Navigation */}
            <div className="flex items-center gap-3 min-w-0 lg:flex-1 lg:justify-end">
              <button
                onClick={handleQuickSwitchChild}
                disabled={children.length <= 1 || isSwitchingChild}
                className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-xl transition-colors whitespace-nowrap ${children.length > 1 && !isSwitchingChild ? 'text-pink-600 bg-pink-50 border border-pink-200 hover:bg-pink-100' : 'text-stone-400 bg-stone-50 border border-stone-200 cursor-not-allowed'}`}
                title={children.length > 1 ? `快速切换孩子（当前：${childMeta.selectedName || userProfile?.childName || '未选择'}）` : '暂无可切换孩子'}
              >
                <Repeat size={16} className={isSwitchingChild ? 'animate-spin' : ''} />
                <span>{isSwitchingChild ? '切换中...' : '切换孩子'}</span>
              </button>
              <div className="w-full overflow-x-auto hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:w-auto">
                <nav className="flex p-1.5 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-pink-100 w-max lg:w-full lg:flex-wrap lg:justify-end mx-auto lg:mx-0">
                  <TabButton 
                    active={activeTab === 'dashboard'} 
                    onClick={() => setActiveTab('dashboard')} 
                    icon={<Home size={16} />} 
                    label="总览" 
                  />
                  <TabButton 
                    active={activeTab === 'growth'} 
                    onClick={() => setActiveTab('growth')} 
                    icon={<TrendingUp size={16} />} 
                    label="生长记录" 
                  />
                  <TabButton 
                    active={activeTab === 'plan'} 
                    onClick={() => setActiveTab('plan')} 
                    icon={<CalendarDays size={16} />} 
                    label="一周计划" 
                  />
                  <TabButton 
                    active={activeTab === 'todos'} 
                    onClick={() => setActiveTab('todos')} 
                    icon={<ListTodo size={16} />} 
                    label="备忘待办" 
                  />
                  <TabButton 
                    active={activeTab === 'grocery'} 
                    onClick={() => setActiveTab('grocery')} 
                    icon={<ShoppingCart size={16} />} 
                    label="采购清单" 
                  />
                </nav>
              </div>
              
              {/* Desktop Actions */}
              <div className="hidden lg:flex items-center gap-2 shrink-0 ml-2 pl-4 border-l border-pink-100">
                <button
                  onClick={() => setActiveTab('reminders')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition-colors ${reminderCount > 0 ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'}`}
                  title="提醒中心"
                >
                  <Bell size={14} />
                  <span>{reminderCount > 0 ? `提醒 ${reminderCount}` : '无提醒'}</span>
                </button>

                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-stone-500 hover:text-pink-500 hover:bg-pink-50 rounded-xl transition-colors whitespace-nowrap"
                  title="设置"
                >
                  <Settings size={18} />
                  <span>设置</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-stone-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap"
                  title="退出登录"
                >
                  <LogOut size={18} />
                  <span>退出</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Suspense fallback={<div className="animate-pulse text-center py-10 text-stone-400">模块加载中...</div>}>
          <div key={contextVersion}>{renderContent()}</div>
        </Suspense>
      </main>

      <ProfileSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        userProfile={userProfile} 
        onProfileUpdate={setUserProfile}
        onRefreshProfile={fetchAndSetProfile}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 shrink-0 ${
        active
          ? 'bg-white text-pink-600 shadow-sm border border-pink-100 scale-100'
          : 'text-stone-500 hover:bg-pink-50/50 hover:text-pink-500 scale-95 hover:scale-100 border border-transparent'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default App;
