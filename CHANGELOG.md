# Changelog

## [Unreleased]

### Added
- 新增基础 API 冒烟测试脚本：`scripts/api-smoke-test.mjs`
- 新增 npm 脚本：`npm run test:smoke`（需服务运行）
- 实测覆盖链路：注册/登录/档案/待办/生长/提醒/周报
- 报告中心新增 PDF 导出（浏览器打印版）
- 支持将报告内容排版后直接打印/另存为 PDF
- 新增 CSV 导出接口：`GET /api/export/csv?type=growth|todos`
- 报告中心新增一键导出：生长记录 CSV / 待办 CSV
- 新增 cron 主动提醒：每日 09:00（早间提醒）与 21:00（晚间复盘提醒），时区 `Asia/Shanghai`
- 提醒将自动发送至董事长会话（boss）
- 新增提醒摘要接口：`GET /api/reminders/digest`（用于计划推送）
- 重构提醒聚合逻辑为可复用函数，支持站内与推送复用同一规则
- 新增提醒状态管理：已读 / 静默（snooze）
- 新增提醒状态接口：
  - `POST /api/reminders/:type/:hash/read`
  - `POST /api/reminders/:type/:hash/snooze`
- 提醒中心支持“静默2小时 / 已读”操作并即时刷新
- 新增“提醒中心”页面，支持按风险级别分组展示提醒项
- 每条提醒支持一键跳转到对应模块处理（待办/生长/周复盘）
- 新增站内提醒接口：`GET /api/reminders`
- 提醒规则首版：今日到期/逾期待办、生长记录缺失或过久未更新、周末复盘缺失
- 顶部状态区新增提醒计数徽标（无提醒/提醒N条）
- 新增孩子删除能力（带迁移目标），防止孤儿数据与误删丢失
- 删除时自动迁移：待办/周计划/打卡清单/采购清单/生长记录
- ChildManager 增加删除确认与迁移目标选择 UI
- 新增多孩子前端管理组件（新增/编辑/切换孩子）
- 设置面板升级为“当前孩子 + 多孩子档案管理”
- API 客户端增加 children 管理调用（get/create/update/select）
- 新增多孩子数据模型基础：`child_profiles` 表与 `users.selectedChildId`
- 新增多孩子接口：`GET/POST/PUT /api/children`、`POST /api/children/:id/select`
- 现有模块数据按“当前选中孩子”隔离（待办/计划/清单/生长记录）
- 兼容旧接口：`/api/profile` 仍可读写当前选中孩子
- 新增备份/校验/恢复脚本：`scripts/backup.sh`、`scripts/verify-backup.sh`、`scripts/restore.sh`
- README 补充备份恢复 SOP 与风险提示
- 新增审计日志基础能力（audit_logs 表）
- 记录登录成功/失败/限流与关键写操作（档案更新、待办增删、生长记录增删）
- 新增审计查询接口：`GET /api/audit-logs?limit=50`
- 生长记录模块增强：新增“较上次变化/近30天频次/数据完整性”洞察卡
- 生长曲线模块补充趋势提示文案（家庭趋势观察提示）
- 新增「周复盘」模块（计划闭环）
- 新增周复盘接口：`GET /api/weekly-review`、`POST /api/weekly-review`
- 新增 GitHub Actions：push 到 main 自动发布 Docker 镜像到 GHCR
- 新增「成长报告中心」页面（ReportCenter）
- 新增周报接口：`GET /api/reports/weekly?days=7|14|30`
- 新增报告导出功能（Markdown）
- 顶部导航新增「成长报告」入口

### Changed
- CI 流水线升级：镜像发布前新增 smoke 门禁（lint/build/dev + api smoke test）
- smoke 失败将阻断 Docker 镜像发布
- 多孩子视图增强：主界面增加“当前孩子”数据视图标识
- 切换孩子后自动刷新全局 profile 与统计上下文
- 登录限流首版：按 IP+邮箱维度限制登录尝试（默认15分钟最多10次）
- 超限返回 429 并附带 Retry-After 头
- 后端安全加固：生产环境强制 JWT_SECRET（长度与弱口令校验）
- 鉴权 token 增加 7 天过期策略
- 关键接口新增参数校验与范围约束（注册/登录/待办/计划/清单/生长记录）
- 前端构建优化：启用路由/模块懒加载（lazy + Suspense）
- 构建拆包优化：recharts 与图标库独立 chunk，降低主包体积
- API 客户端新增 `getWeeklyReport(days)`
- README 增补“成长报告中心”功能说明

### Added
- 注册页支持上传孩子头像（可选）
- 设置页与多孩子管理支持上传/修改孩子头像
- 总览标题卡右侧改为孩子头像展示（无头像使用首字占位）
- 顶部快速“切换孩子”按钮前置到主导航前

### Changed
- 顶部主导航收敛为 5 项：总览 / 生长记录 / 一周计划 / 采购清单 / 备忘待办
- 提醒中心改为铃铛入口，去除冗余文案与重复导航项
- 总览日历升级为紧凑增强版，移除重复大日历
- 孩子切换后通过上下文重挂载刷新主内容模块
- 登录态初始化改为同步拉取 children/profile/reminders，避免首屏切换按钮失效
- 性别自动换色方案回退，统一保持原粉紫主题
- 顶部导航顺序调整：备忘待办前置到采购清单之前
- 多处头像尺寸放大（顶部、总览、设置、注册、多孩子列表）
- 新增发布前回归清单：scripts/release-checklist.md（含移动端适配检查）
- 切换孩子新增切换中态与防重复触发，提升流畅性
- 移动端导航与主内容密度优化（小屏可读性提升）
- 新增通用页面区块组件 PageSection，用于后续页面扩展

### Notes
- 前端 UI 风格与配色保持原有体系（粉/紫渐变主题未改）
