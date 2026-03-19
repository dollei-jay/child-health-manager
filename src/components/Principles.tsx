import React from 'react';
import { snackOptions } from '../data';
import { AlertCircle, Clock, UtensilsCrossed, Target, CheckCircle2 } from 'lucide-react';

export default function Principles() {
  return (
    <div className="space-y-8">
      
      {/* Top 4 Principles */}
      <section>
        <h2 className="text-xl font-extrabold text-stone-900 mb-4 flex items-center gap-2">
          <Target className="text-pink-500" /> 4条总原则
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-pink-600 mb-2">饮料</h3>
            <p className="text-stone-600 text-sm">只喝白水、纯牛奶、无糖酸奶</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-pink-600 mb-2">水果</h3>
            <p className="text-stone-600 text-sm">每天 1份，不要果汁</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-pink-600 mb-2">零食</h3>
            <p className="text-stone-600 text-sm">不吃薯片、饼干、蛋糕、奶茶、炸鸡</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-pink-600 mb-2">晚间</h3>
            <p className="text-stone-600 text-sm">20:30后不进食，最多少量温牛奶</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schedule & Lunch Rules */}
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
            <h2 className="text-lg font-extrabold text-stone-900 mb-4 flex items-center gap-2">
              <Clock className="text-purple-500" /> 每天固定时间表
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="w-16 text-sm font-bold text-purple-400 shrink-0">早餐</div>
                <div className="text-stone-700 font-medium">上学前</div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-16 text-sm font-bold text-purple-400 shrink-0">午餐</div>
                <div className="text-stone-700 font-medium">午托/学校吃，尽量遵循规则</div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-16 text-sm font-bold text-purple-400 shrink-0">17:30</div>
                <div className="text-stone-700 font-medium">加餐：只吃1种，控量</div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-16 text-sm font-bold text-purple-400 shrink-0">18:30</div>
                <div className="text-stone-700 font-medium">晚饭</div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-16 text-sm font-bold text-purple-400 shrink-0">晚饭后</div>
                <div className="text-stone-700 font-medium">轻活动或散步</div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-16 text-sm font-bold text-purple-400 shrink-0">21:30</div>
                <div className="text-stone-700 font-medium">睡觉</div>
              </li>
            </ul>
          </section>

          <section className="bg-orange-50 p-6 rounded-3xl border border-orange-100 shadow-sm">
            <h2 className="text-lg font-extrabold text-orange-900 mb-4 flex items-center gap-2">
              <UtensilsCrossed className="text-orange-500" /> 午托吃饭规则
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-orange-800 font-medium">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-orange-500" />
                <span>主食 半碗到一小碗</span>
              </li>
              <li className="flex items-start gap-2 text-orange-800 font-medium">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-orange-500" />
                <span>先吃菜和肉，再吃主食</span>
              </li>
              <li className="flex items-start gap-2 text-orange-800 font-medium">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-orange-500" />
                <span>不喝甜饮料，不加炸物甜点</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Snack Rules & Execution Suggestions */}
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
            <h2 className="text-lg font-extrabold text-stone-900 mb-2">17:30 固定加餐清单</h2>
            <p className="text-sm text-stone-500 mb-6 font-medium">每次只能选1种</p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-3">第一优先</h3>
                <div className="flex flex-wrap gap-2">
                  {snackOptions.priority1.map((item, i) => (
                    <span key={i} className="bg-teal-50 text-teal-700 px-4 py-1.5 rounded-xl text-sm font-medium border border-teal-100">{item}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-sky-600 uppercase tracking-wider mb-3">第二优先</h3>
                <div className="flex flex-wrap gap-2">
                  {snackOptions.priority2.map((item, i) => (
                    <span key={i} className="bg-sky-50 text-sky-700 px-4 py-1.5 rounded-xl text-sm font-medium border border-sky-100">{item}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">第三优先</h3>
                <div className="flex flex-wrap gap-2">
                  {snackOptions.priority3.map((item, i) => (
                    <span key={i} className="bg-stone-100 text-stone-700 px-4 py-1.5 rounded-xl text-sm font-medium border border-stone-200">{item}</span>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 p-5 bg-rose-50/50 rounded-2xl border border-rose-100">
                <h4 className="font-bold text-rose-900 mb-2 text-sm">如果特别饿，顺序是：</h4>
                <ol className="list-decimal list-inside text-sm font-medium text-rose-700 space-y-1">
                  <li>喝水</li>
                  <li>吃奶/酸奶/蛋</li>
                  <li>还饿再加黄瓜或小番茄</li>
                </ol>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Execution Suggestions & Final Judgment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-3xl border border-pink-100 shadow-sm">
          <h2 className="text-lg font-extrabold text-stone-900 mb-6">最重要的执行建议</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-pink-600 mb-2">1）先盯住3件事，不要贪多</h3>
              <ul className="list-disc list-inside text-sm font-medium text-stone-600 space-y-1 ml-2">
                <li>不喝甜饮</li>
                <li>17:30固定健康加餐</li>
                <li>20:30后不进食</li>
              </ul>
              <p className="text-sm font-bold text-teal-600 mt-2">只要这3条做到，体重增长速度通常就会下来。</p>
            </div>
            
            <div>
              <h3 className="font-bold text-pink-600 mb-2">2）不要让孩子觉得是在“被减肥”</h3>
              <p className="text-sm font-medium text-stone-600 mb-2">说法建议改成：</p>
              <ul className="list-disc list-inside text-sm font-medium text-stone-600 space-y-1 ml-2">
                <li>“为了长高得更好”</li>
                <li>“为了身体发育更稳”</li>
                <li>“为了跑得更快、更有力气”</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-pink-600 mb-2">3）家里大人要配合</h3>
              <p className="text-sm font-medium text-stone-600">如果家里人晚上吃零食、喝奶茶，孩子很难执行。最好全家一起做两周，效果最明显。</p>
            </div>

            <div>
              <h3 className="font-bold text-pink-600 mb-2">4）先执行2周，再复盘</h3>
              <p className="text-sm font-medium text-stone-600 mb-2">重点看：</p>
              <ul className="list-disc list-inside text-sm font-medium text-stone-600 space-y-1 ml-2">
                <li>晚上还馋不馋零食</li>
                <li>体重有没有继续快涨</li>
                <li>运动能不能形成习惯</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-pink-100 to-rose-100 p-6 rounded-3xl border border-pink-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="text-pink-600" size={28} />
            <h2 className="text-2xl font-extrabold text-pink-900">最终判断</h2>
          </div>
          
          <p className="text-pink-800 font-medium mb-6">目前最值得做的，不是先纠结某一种药，而是先把：</p>
          
          <div className="space-y-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-pink-200/50 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-lg">1</div>
              <span className="font-bold text-pink-900">体重增长速度压下来</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-pink-200/50 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-lg">2</div>
              <span className="font-bold text-pink-900">睡眠固定住</span>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-pink-200/50 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-lg">3</div>
              <span className="font-bold text-pink-900">运动稳定住</span>
            </div>
          </div>
          
          <p className="text-pink-900 font-bold text-center bg-white/60 p-5 rounded-2xl border border-pink-200/50">
            这三件事做好，对她现在这种“偏早发育 + BMI偏高”的情况，非常关键。
          </p>
        </section>
      </div>
    </div>
  );
}
