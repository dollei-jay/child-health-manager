import React, { useMemo, useState } from 'react';
import { FileText, Download, CalendarRange, Sparkles, Table, Printer } from 'lucide-react';
import { api } from '../api';

interface WeeklyReport {
  period: { start: string; end: string; days: number };
  overview: {
    activeTodos: number;
    completedTodos: number;
    overdueTodos: number;
    weeklyPlanTasks: number;
    groceryItems: number;
    checkins: number;
    perfectDays: number;
  };
  growth: {
    latest: null | {
      date: string;
      height: number;
      weight: number;
      bmi: number;
    };
    trend7d: {
      weightDeltaKg: number | null;
      heightDeltaCm: number | null;
      bmiDelta: number | null;
    };
  };
  recommendations: string[];
  generatedAt: string;
}

function toMarkdown(report: WeeklyReport) {
  const lines = [
    `# 儿童健康成长周报`,
    '',
    `- 报告区间：${report.period.start} ~ ${report.period.end}（${report.period.days}天）`,
    `- 生成时间：${new Date(report.generatedAt).toLocaleString('zh-CN')}`,
    '',
    '## 一、执行概览',
    `- 待办进行中：${report.overview.activeTodos} 项`,
    `- 待办已完成：${report.overview.completedTodos} 项`,
    `- 待办已逾期：${report.overview.overdueTodos} 项`,
    `- 周计划任务量：${report.overview.weeklyPlanTasks} 项`,
    `- 采购物资数：${report.overview.groceryItems} 项`,
    `- 本周打卡数：${report.overview.checkins} 次`,
    `- 完美达成天数：${report.overview.perfectDays} 天`,
    '',
    '## 二、生长数据',
    report.growth.latest
      ? `- 最新记录：${report.growth.latest.date}｜身高 ${report.growth.latest.height} cm｜体重 ${report.growth.latest.weight} kg｜BMI ${report.growth.latest.bmi}`
      : '- 最新记录：暂无',
    report.growth.trend7d.weightDeltaKg === null
      ? '- 7日趋势：样本不足（至少需2条记录）'
      : `- 7日趋势：体重 ${report.growth.trend7d.weightDeltaKg > 0 ? '+' : ''}${report.growth.trend7d.weightDeltaKg} kg，身高 ${report.growth.trend7d.heightDeltaCm && report.growth.trend7d.heightDeltaCm > 0 ? '+' : ''}${report.growth.trend7d.heightDeltaCm ?? 0} cm，BMI ${report.growth.trend7d.bmiDelta && report.growth.trend7d.bmiDelta > 0 ? '+' : ''}${report.growth.trend7d.bmiDelta ?? 0}`,
    '',
    '## 三、执行建议',
    ...report.recommendations.map((r, idx) => `${idx + 1}. ${r}`)
  ];

  return lines.join('\n');
}

export default function ReportCenter() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);
  const [error, setError] = useState('');

  const reportMarkdown = useMemo(() => (report ? toMarkdown(report) : ''), [report]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getWeeklyReport(days);
      setReport(data);
    } catch (err: any) {
      setError(err?.message || '获取报告失败');
    } finally {
      setLoading(false);
    }
  };

  const exportMarkdown = () => {
    if (!report) return;
    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `child-health-report-${report.period.start}-to-${report.period.end}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = async (type: 'growth' | 'todos') => {
    try {
      const blob = await api.exportCsv(type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'CSV 导出失败');
    }
  };

  const exportPdf = () => {
    if (!report) return;

    const title = `儿童健康成长报告（${report.period.start} ~ ${report.period.end}）`;
    const html = `
      <!doctype html>
      <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; padding: 24px; color: #1f2937; }
          h1 { font-size: 20px; margin: 0 0 8px; }
          h2 { font-size: 16px; margin: 18px 0 8px; }
          p, li { font-size: 12px; line-height: 1.7; margin: 0; }
          ul { margin: 0; padding-left: 18px; }
          .meta { color: #6b7280; margin-bottom: 12px; font-size: 12px; }
          .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p class="meta">生成时间：${new Date(report.generatedAt).toLocaleString('zh-CN')}</p>

        <h2>一、执行概览</h2>
        <div class="grid">
          <div class="card"><p>待办进行中：${report.overview.activeTodos} 项</p></div>
          <div class="card"><p>待办已完成：${report.overview.completedTodos} 项</p></div>
          <div class="card"><p>待办逾期：${report.overview.overdueTodos} 项</p></div>
          <div class="card"><p>周计划任务量：${report.overview.weeklyPlanTasks} 项</p></div>
          <div class="card"><p>采购物资：${report.overview.groceryItems} 项</p></div>
          <div class="card"><p>打卡次数：${report.overview.checkins} 次（完美日 ${report.overview.perfectDays} 天）</p></div>
        </div>

        <h2>二、生长数据</h2>
        <div class="card">
          <p>${report.growth.latest ? `最新记录：${report.growth.latest.date}，身高 ${report.growth.latest.height} cm，体重 ${report.growth.latest.weight} kg，BMI ${report.growth.latest.bmi}` : '暂无生长记录'}</p>
          <p style="margin-top:6px;">${report.growth.trend7d.weightDeltaKg !== null ? `周期趋势：体重 ${report.growth.trend7d.weightDeltaKg > 0 ? '+' : ''}${report.growth.trend7d.weightDeltaKg} kg，身高 ${report.growth.trend7d.heightDeltaCm && report.growth.trend7d.heightDeltaCm > 0 ? '+' : ''}${report.growth.trend7d.heightDeltaCm ?? 0} cm，BMI ${report.growth.trend7d.bmiDelta && report.growth.trend7d.bmiDelta > 0 ? '+' : ''}${report.growth.trend7d.bmiDelta ?? 0}` : '周期趋势：样本不足（至少2条记录）'}</p>
        </div>

        <h2>三、执行建议</h2>
        <ul>
          ${report.recommendations.map((r) => `<li>${r}</li>`).join('')}
        </ul>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) {
      setError('无法打开打印窗口，请检查浏览器弹窗设置');
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 flex items-center gap-2">
              <FileText className="text-pink-500" /> 成长报告中心
            </h2>
            <p className="mt-2 text-sm font-medium text-stone-500">自动聚合待办、打卡与生长数据，生成可导出的阶段报告。</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-200 shrink-0">
            <Sparkles size={18} />
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="inline-flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-600">
            <CalendarRange size={16} className="text-pink-500" />
            报告周期
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value={7}>最近7天</option>
              <option value={14}>最近14天</option>
              <option value={30}>最近30天</option>
            </select>
          </label>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="h-[42px] px-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold text-sm shadow-md shadow-pink-200 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? '生成中...' : '生成报告'}
          </button>

          <button
            onClick={exportMarkdown}
            disabled={!report}
            className="h-[42px] px-4 bg-white border border-pink-200 text-pink-600 rounded-xl font-bold text-sm hover:bg-pink-50 transition-colors disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-1.5"><Download size={16} /> 导出 Markdown</span>
          </button>

          <button
            onClick={() => exportCsv('growth')}
            className="h-[42px] px-4 bg-white border border-stone-200 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-50 transition-colors"
          >
            <span className="inline-flex items-center gap-1.5"><Table size={16} /> 导出生长CSV</span>
          </button>

          <button
            onClick={() => exportCsv('todos')}
            className="h-[42px] px-4 bg-white border border-stone-200 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-50 transition-colors"
          >
            <span className="inline-flex items-center gap-1.5"><Table size={16} /> 导出待办CSV</span>
          </button>

          <button
            onClick={exportPdf}
            disabled={!report}
            className="h-[42px] px-4 bg-white border border-purple-200 text-purple-600 rounded-xl font-bold text-sm hover:bg-purple-50 transition-colors disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-1.5"><Printer size={16} /> 导出PDF（打印）</span>
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-rose-500 font-medium">{error}</p>}
      </div>

      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card title="待办进行中" value={`${report.overview.activeTodos} 项`} sub={`逾期 ${report.overview.overdueTodos} 项`} />
            <Card title="待办已完成" value={`${report.overview.completedTodos} 项`} sub={`打卡 ${report.overview.checkins} 次`} />
            <Card title="周计划任务量" value={`${report.overview.weeklyPlanTasks} 项`} sub={`采购 ${report.overview.groceryItems} 项`} />
            <Card title="完美达成天数" value={`${report.overview.perfectDays} 天`} sub={`${report.period.days} 天周期`} />
          </div>

          <section className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
            <h3 className="text-lg font-extrabold text-stone-800 mb-3">生长趋势摘要</h3>
            <div className="text-sm text-stone-600 font-medium leading-7">
              {report.growth.latest ? (
                <p>
                  最新记录：<span className="font-bold text-stone-700">{report.growth.latest.date}</span>，
                  身高 <span className="font-bold text-rose-500">{report.growth.latest.height} cm</span>，
                  体重 <span className="font-bold text-purple-500">{report.growth.latest.weight} kg</span>，
                  BMI <span className="font-bold text-sky-500">{report.growth.latest.bmi}</span>。
                </p>
              ) : (
                <p>当前无生长记录，建议先补录至少 2 条数据再看趋势。</p>
              )}
              {report.growth.trend7d.weightDeltaKg !== null && (
                <p className="mt-2">
                  近 {report.period.days} 天趋势：
                  体重 {report.growth.trend7d.weightDeltaKg > 0 ? '+' : ''}{report.growth.trend7d.weightDeltaKg} kg，
                  身高 {report.growth.trend7d.heightDeltaCm && report.growth.trend7d.heightDeltaCm > 0 ? '+' : ''}{report.growth.trend7d.heightDeltaCm ?? 0} cm，
                  BMI {report.growth.trend7d.bmiDelta && report.growth.trend7d.bmiDelta > 0 ? '+' : ''}{report.growth.trend7d.bmiDelta ?? 0}。
                </p>
              )}
            </div>
          </section>

          <section className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
            <h3 className="text-lg font-extrabold text-stone-800 mb-3">执行建议</h3>
            <ul className="space-y-2 text-sm text-stone-600 font-medium">
              {report.recommendations.map((item, idx) => (
                <li key={idx} className="rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5">{idx + 1}) {item}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm">
      <p className="text-sm font-bold text-stone-500">{title}</p>
      <p className="text-xl font-extrabold text-stone-800 mt-1">{value}</p>
      <p className="text-xs text-stone-400 mt-1">{sub}</p>
    </div>
  );
}
