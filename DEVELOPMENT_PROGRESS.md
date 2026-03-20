# DEVELOPMENT_PROGRESS

## 2026-03-20

### 阶段推进记录
- 当前阶段：基础可用性推进中（同时预研并落地了阶段4“报告输出”的首版能力）
- 分支：`feat/report-center`

### 今日完成
1. 新增「成长报告」页面（`src/components/ReportCenter.tsx`）
   - 支持 7/14/30 天报告周期
   - 支持报告生成与 Markdown 导出
2. 新增报告后端接口（`GET /api/reports/weekly`）
   - 聚合待办、打卡、周计划、采购、生长记录
   - 输出执行建议与趋势摘要
3. 前端导航接入（`src/App.tsx`）
   - 新增「成长报告」Tab
4. API 客户端扩展（`src/api.ts`）
   - 新增 `getWeeklyReport(days)`
5. 文档更新（`README.md`）
   - 增加“成长报告中心”说明

### 本地验证
- `npm run lint`：通过
- `npm run build`：通过（有 chunk 体积告警，不影响可用性）

### 下一步
- 推送该分支到 GitHub
- 发起 PR 合并到 main
- 按路线继续阶段2（生长/BMI趋势增强）与阶段3（计划闭环）

6. 新增 CI/CD 自动发版（Docker）
   - 新增 `.github/workflows/docker-publish.yml`
   - push 到 `main` 自动构建并发布到 GHCR

7. 阶段3（计划闭环）首版已落地
   - 新增周复盘页面（summary/blockers/nextFocus/score）
   - 新增 weekly_reviews 数据表与读写 API
