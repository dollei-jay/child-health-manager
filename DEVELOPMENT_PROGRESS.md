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

8. 阶段2（生长/BMI趋势增强）首版已落地
   - 生长页面新增趋势洞察卡（最新记录、较上次变化、近30天频次、数据完整性）
   - 曲线图与文案增强，提升家长对阶段变化的可读性

9. 阶段P1（包体优化）首版已落地
   - App 页面级模块改为 lazy + Suspense 按需加载
   - Vite manualChunks 拆分图表库与图标库，主入口包体明显下降

10. 阶段P0（安全稳定）首版已落地
   - 生产环境 JWT_SECRET 强校验（弱密钥拦截）
   - JWT 增加过期时间（7d）
   - 多个核心接口增加参数校验与范围限制

11. 阶段P0.5（登录限流）首版已落地
   - 登录接口增加 IP+邮箱维度限流（默认 15 分钟 10 次）
   - 超限返回 429 与 Retry-After，成功登录自动清理失败计数

12. 阶段P0.6（审计日志）首版已落地
   - 新增 audit_logs 表与查询接口（最近 N 条）
   - 登录与关键写操作落审计，便于排障和安全追踪

13. 阶段P1.5（备份恢复SOP）首版已落地
   - 新增 backup/verify/restore 三个脚本
   - README 补齐可执行的备份恢复操作流程

14. 阶段P2（多孩子档案）后端首版已落地
   - 新增 child_profiles 与 selectedChildId，完成旧数据兼容迁移
   - 待办/计划/清单/生长记录按选中孩子隔离存取
   - 新增 children 管理与选择接口，保留 profile 兼容行为

15. 阶段P2（多孩子档案）前端首版已落地
   - 设置面板新增 ChildManager：新增/编辑/切换孩子
   - 与后端 children 接口打通，切换后自动刷新当前档案

16. 阶段P2.2（孩子删除与迁移保护）已落地
   - 新增 DELETE /api/children/:id（事务迁移后删除）
   - 前端新增删除确认与迁移目标选择，防止误删导致数据丢失
