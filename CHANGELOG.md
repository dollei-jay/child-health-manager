# Changelog

## [Unreleased]

### Added
- 新增「周复盘」模块（计划闭环）
- 新增周复盘接口：`GET /api/weekly-review`、`POST /api/weekly-review`
- 新增 GitHub Actions：push 到 main 自动发布 Docker 镜像到 GHCR
- 新增「成长报告中心」页面（ReportCenter）
- 新增周报接口：`GET /api/reports/weekly?days=7|14|30`
- 新增报告导出功能（Markdown）
- 顶部导航新增「成长报告」入口

### Changed
- API 客户端新增 `getWeeklyReport(days)`
- README 增补“成长报告中心”功能说明

### Notes
- 前端 UI 风格与配色保持原有体系（粉/紫渐变主题未改）
