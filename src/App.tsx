import React, { useState, useEffect, lazy, Suspense } from 'react';
import { CalendarDays, ShoppingCart, BookOpen, Sparkles, BarChart2, TrendingUp, LogOut, ListTodo, Settings, Home, FileText, RefreshCcw } from 'lucide-react';
import Auth from './components/Auth';
import ProfileSettings from './components/ProfileSettings';

const WeeklyPlan = lazy(() => import('./components/WeeklyPlan'));
const GroceryList = lazy(() => import('./components/GroceryList'));
const Principles = lazy(() => import('./components/Principles'));
const Stats = lazy(() => import('./components/Stats'));
const GrowthTracker = lazy(() => import('./components/GrowthTracker'));
const Todos = lazy(() => import('./components/Todos'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const ReportCenter = lazy(() => import('./components/ReportCenter'));
const WeeklyReview = lazy(() => import('./components/WeeklyReview'));
import { api, getToken, removeToken } from './api';

interface UserProfile {
  childName?: string;
  childBirthDate?: string;
  childGender?: string;
  childGoal?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const profile = await api.getProfile();
          setUserProfile(profile);
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
      case 'dashboard': return <Dashboard childName={userProfile?.childName} />;
      case 'principles': return <Principles />;
      case 'plan': return <WeeklyPlan />;
      case 'stats': return <Stats />;
      case 'growth': return <GrowthTracker />;
      case 'grocery': return <GroceryList />;
      case 'todos': return <Todos />;
      case 'reports': return <ReportCenter />;
      case 'review': return <WeeklyReview />;
      default: return <Principles />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 text-stone-800 font-sans selection:bg-pink-200 pb-12">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-xl border-b border-pink-100 sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3 gap-3 lg:gap-4">
            {/* Top row on mobile: Title + Actions */}
            <div className="flex items-center justify-between gap-4 min-w-0">
              <div className="flex items-center gap-3 shrink-0 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-200">
                  <Sparkles size={20} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 leading-tight truncate">
                    {userProfile?.childName ? `${userProfile.childName}的健康成长执行清单` : '宝贝健康成长执行清单'}
                  </h1>
                  <p className="mt-0.5 text-xs font-medium text-stone-500 flex items-center gap-1.5 truncate">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0"></span>
                    <span className="truncate">{getSubtitle()}</span>
                  </p>
                </div>
              </div>
              
              {/* Mobile Actions */}
              <div className="flex items-center gap-1 shrink-0 lg:hidden">
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
              <div className="w-full overflow-x-auto hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:w-auto">
                <nav className="flex p-1.5 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-pink-100 w-max lg:w-auto mx-auto lg:mx-0">
                  <TabButton 
                    active={activeTab === 'dashboard'} 
                    onClick={() => setActiveTab('dashboard')} 
                    icon={<Home size={16} />} 
                    label="总览" 
                  />
                  <TabButton 
                    active={activeTab === 'principles'} 
                    onClick={() => setActiveTab('principles')} 
                    icon={<BookOpen size={16} />} 
                    label="核心原则" 
                  />
                  <TabButton 
                    active={activeTab === 'plan'} 
                    onClick={() => setActiveTab('plan')} 
                    icon={<CalendarDays size={16} />} 
                    label="一周计划" 
                  />
                  <TabButton 
                    active={activeTab === 'stats'} 
                    onClick={() => setActiveTab('stats')} 
                    icon={<BarChart2 size={16} />} 
                    label="数据统计" 
                  />
                  <TabButton 
                    active={activeTab === 'growth'} 
                    onClick={() => setActiveTab('growth')} 
                    icon={<TrendingUp size={16} />} 
                    label="生长记录" 
                  />
                  <TabButton 
                    active={activeTab === 'grocery'} 
                    onClick={() => setActiveTab('grocery')} 
                    icon={<ShoppingCart size={16} />} 
                    label="采购清单" 
                  />
                  <TabButton 
                    active={activeTab === 'todos'} 
                    onClick={() => setActiveTab('todos')} 
                    icon={<ListTodo size={16} />} 
                    label="备忘待办" 
                  />
                  <TabButton 
                    active={activeTab === 'reports'} 
                    onClick={() => setActiveTab('reports')} 
                    icon={<FileText size={16} />} 
                    label="成长报告" 
                  />
                  <TabButton 
                    active={activeTab === 'review'} 
                    onClick={() => setActiveTab('review')} 
                    icon={<RefreshCcw size={16} />} 
                    label="周复盘" 
                  />
                </nav>
              </div>
              
              {/* Desktop Actions */}
              <div className="hidden lg:flex items-center gap-2 shrink-0 ml-2 pl-4 border-l border-pink-100">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="animate-pulse text-center py-10 text-stone-400">模块加载中...</div>}>
          {renderContent()}
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
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
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
