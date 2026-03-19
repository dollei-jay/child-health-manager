import React, { useState } from 'react';
import { CalendarDays, ShoppingCart, BookOpen, Sparkles, BarChart2, TrendingUp } from 'lucide-react';
import WeeklyPlan from './components/WeeklyPlan';
import GroceryList from './components/GroceryList';
import Principles from './components/Principles';
import Stats from './components/Stats';
import GrowthTracker from './components/GrowthTracker';

function App() {
  const [activeTab, setActiveTab] = useState('principles');

  const renderContent = () => {
    switch (activeTab) {
      case 'principles': return <Principles />;
      case 'plan': return <WeeklyPlan />;
      case 'stats': return <Stats />;
      case 'growth': return <GrowthTracker />;
      case 'grocery': return <GroceryList />;
      default: return <Principles />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 text-stone-800 font-sans selection:bg-pink-200 pb-12">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-xl border-b border-pink-100 sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 md:py-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-200">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 leading-tight">
                  张安栎健康成长执行清单
                </h1>
                <p className="mt-0.5 text-[11px] md:text-xs font-medium text-stone-500 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0"></span>
                  8岁7个月女孩 ｜ 控体重增速、稳发育节奏
                </p>
              </div>
            </div>
            
            <div className="w-full md:w-auto -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
              <nav className="flex p-1.5 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-pink-100 w-max mx-auto md:mx-0">
                <TabButton 
                  active={activeTab === 'principles'} 
                  onClick={() => setActiveTab('principles')} 
                  icon={<BookOpen size={16} className="md:w-[18px] md:h-[18px]" />} 
                  label="核心原则" 
                />
                <TabButton 
                  active={activeTab === 'plan'} 
                  onClick={() => setActiveTab('plan')} 
                  icon={<CalendarDays size={16} className="md:w-[18px] md:h-[18px]" />} 
                  label="一周计划" 
                />
                <TabButton 
                  active={activeTab === 'stats'} 
                  onClick={() => setActiveTab('stats')} 
                  icon={<BarChart2 size={16} className="md:w-[18px] md:h-[18px]" />} 
                  label="数据统计" 
                />
                <TabButton 
                  active={activeTab === 'growth'} 
                  onClick={() => setActiveTab('growth')} 
                  icon={<TrendingUp size={16} className="md:w-[18px] md:h-[18px]" />} 
                  label="生长记录" 
                />
                <TabButton 
                  active={activeTab === 'grocery'} 
                  onClick={() => setActiveTab('grocery')} 
                  icon={<ShoppingCart size={16} className="md:w-[18px] md:h-[18px]" />} 
                  label="采购清单" 
                />
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 md:gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
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
