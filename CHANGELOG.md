# Changelog

## [Unreleased]

### Added
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
- 后端安全加固：生产环境强制 JWT_SECRET（长度与弱口令校验）
- 鉴权 token 增加 7 天过期策略
- 关键接口新增参数校验与范围约束（注册/登录/待办/计划/清单/生长记录）
- 前端构建优化：启用路由/模块懒加载（lazy + Suspense）
- 构建拆包优化：recharts 与图标库独立 chunk，降低主包体积
- API 客户端新增 `getWeeklyReport(days)`
- README 增补“成长报告中心”功能说明

### Notes
- 前端 UI 风格与配色保持原有体系（粉/紫渐变主题未改）
