# Changelog

## [Unreleased]

### Added
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
- 登录限流首版：按 IP+邮箱维度限制登录尝试（默认15分钟最多10次）
- 超限返回 429 并附带 Retry-After 头
- 后端安全加固：生产环境强制 JWT_SECRET（长度与弱口令校验）
- 鉴权 token 增加 7 天过期策略
- 关键接口新增参数校验与范围约束（注册/登录/待办/计划/清单/生长记录）
- 前端构建优化：启用路由/模块懒加载（lazy + Suspense）
- 构建拆包优化：recharts 与图标库独立 chunk，降低主包体积
- API 客户端新增 `getWeeklyReport(days)`
- README 增补“成长报告中心”功能说明

### Notes
- 前端 UI 风格与配色保持原有体系（粉/紫渐变主题未改）
