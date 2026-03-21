# AI 驱动健康管理智能体开发计划（本地执行版）

> 项目：`child-health-manager`
> 
> 执行模式：**仅本地开发**（未获董事长明确“推送”指令前，禁止 push / 发布）
> 
> 创建时间：2026-03-21

---

## 使用规则（必须遵守）

1. 每完成一个 Todo，立即将 `- [ ]` 改为 `- [x]`。
2. 每完成一个关键项，必须补充：
   - **证据**（命令输出/截图/测试结果）
   - **成果路径**（代码文件路径）
3. 每次开始新一轮开发，先看本文件这三块：
   - `当前状态（Doing）`
   - `下一步（Next）`
   - `成果索引（Artifacts）`
4. 不允许只改状态不留证据。

---

## 当前状态（Doing）

- 当前阶段：**Phase 1 - 蓝图与边界固化**
- 当前任务：`P1-T4`（医疗边界与风险策略）
- 阻塞项：无
- 风险项：无

---

## 下一步（Next）

1. 完成 `P1-T4` 风险边界与医疗免责声明策略
2. 补齐 `01-boundary-rules-v1.md`
3. 汇总 Phase 1 文档并打包推送
4. 进入 `Phase 2` 最小闭环开发（ai/chat + tool 调用）

---

## Phase 0｜立项与主线确认（已完成）

- [x] P0-T1 确认主线：从功能型网站升级为“AI 驱动健康管理智能体系统”
- [x] P0-T2 确认前端策略：单入口“小人”智能体，不增加多处 AI 按钮
- [x] P0-T3 确认开发策略：先本地开发，未明确允许前不推送

**成果路径**
- `/home/dollei/.openclaw/workspace-itops/child-health-manager/AI_AGENT_DEVELOPMENT_TODO.md`

---

## Phase 1｜蓝图与边界（规则先行）

### P1-T1 规则蓝图 v1（边界与执行规则）
- [x] 输出智能体边界与执行规则 v1 草案
- [x] 明确三层能力：认知层 / 决策层 / 执行层
- [x] 明确“自动写库 + 回执 + 可撤销”原则

### P1-T2 数据模型与 API 清单（进行中）
- [x] 盘点现有表结构与可复用字段
- [x] 明确新增表（如 ai_ops_log / ai_sessions / diagnosis_records 扩展）
- [x] 设计 AI 专用 API：`/api/ai/chat`、`/api/ai/plan/generate`、`/api/ai/purchase/generate`
- [x] 设计写库回执结构与撤销 token 机制

### P1-T3 写库权限矩阵
- [x] 列出“自动写入”动作白名单
- [x] 列出“必须确认”动作清单
- [x] 定义高风险动作判定条件
- [x] 定义确认弹窗标准文案

### P1-T4 医疗边界与风险策略
- [ ] 定义医疗建议边界（仅限生活干预：饮食/运动/作息；不输出诊断结论）
- [ ] 定义高风险触发规则（异常波动/持续症状等）
- [ ] 增加“阻断并建议就医”硬规则（如骨龄严重偏离、体重骤降等触发后禁止继续给出日常建议）
- [ ] 定义统一免责声明模板

**Phase 1 验收标准**
- [ ] 有完整文档可直接指导开发（规则、数据、接口、风险）
- [ ] 董事长可一眼看出：可自动执行什么、何时必须确认

**预计成果路径**
- `/home/dollei/.openclaw/workspace-itops/child-health-manager/docs/ai-agent/01-boundary-rules-v1.md`
- `/home/dollei/.openclaw/workspace-itops/child-health-manager/docs/ai-agent/02-data-api-spec-v1.md`
- `/home/dollei/.openclaw/workspace-itops/child-health-manager/docs/ai-agent/03-write-policy-matrix-v1.md`

---

## Phase 2｜后端最小闭环（会读、会写、会回执）

### P2-T1 AI Orchestrator 基座
- [ ] 新增 AI 服务目录（`server/ai/*` 或等效结构）
- [ ] 抽象 tool 接口（read/write/plan/purchase）
- [ ] 接入模型调用（可配置 provider）

### P2-T2 `/api/ai/chat` 主入口
- [ ] 支持多轮上下文（当前孩子 + 时间范围）
- [ ] 支持 tool calling（只允许白名单工具）
- [ ] 引入 Function Calling 标准动作指令（如 `update_weight` / `add_todo`）并做参数校验
- [ ] 返回结构化回执（做了什么、写了什么、建议什么）

### P2-T3 写库执行器
- [ ] 实现身高体重自动录入工具
- [ ] 实现诊断记录录入工具（高风险默认确认）
- [ ] 实现待办/计划/采购写入工具
- [ ] 统一操作日志与审计记录

### P2-T4 撤销机制
- [ ] 设计撤销 token（一次写入对应一次可撤销句柄）
- [ ] 新增撤销 API
- [ ] 撤销后回执与审计补记

### P2-T5 测试与冒烟
- [ ] 覆盖主要意图解析测试
- [ ] 覆盖关键写库链路测试
- [ ] 覆盖撤销链路测试

**Phase 2 验收标准**
- [ ] 一句话能触发“解析 → 写库 → 回执”完整闭环
- [ ] 写库动作可追踪、可撤销、可审计

**预计成果路径**
- `/home/dollei/.openclaw/workspace-itops/child-health-manager/server/ai/`
- `/home/dollei/.openclaw/workspace-itops/child-health-manager/server.ts`（API 路由接入）
- `/home/dollei/.openclaw/workspace-itops/child-health-manager/scripts/ai-smoke-test.mjs`

---

## Phase 3｜前端单入口“小人”接入

### P3-T1 小人入口与聊天抽屉
- [ ] 新增固定入口（右下角）
- [ ] 新增聊天抽屉 UI（消息流 + 输入 + 状态）
- [ ] 支持孩子上下文显示与切换感知

### P3-T2 回执卡片与确认弹窗
- [ ] 展示结构化回执卡片（写入项/建议项）
- [ ] 高风险动作弹确认框
- [ ] 支持“撤销上一步”快捷入口

### P3-T3 动态结果卡片（无新增导航按钮）
- [ ] 总览注入今日/本周建议卡
- [ ] 计划页注入“下周计划卡”（含“一键应用”按钮，确认后落库）
- [ ] 采购页注入“采购建议卡”（含“一键应用”按钮，确认后落库）

**Phase 3 验收标准**
- [ ] 仅靠“小人入口”即可完成主流程，不依赖新增 AI 菜单
- [ ] 前端主信息架构保持简洁

**预计成果路径**
- `/home/dollei/.openclaw/workspace-itops/child-health-manager/src/components/ai/`
- `/home/dollei/.openclaw/workspace-itops/child-health-manager/src/App.tsx`

---

## Phase 4｜计划与采购智能引擎（质量提升）

### P4-T1 下周计划生成器
- [ ] 输入融合：历史数据 + 本周执行率 + 最近诊断
- [ ] 输出结构：作息/饮食/运动/观察/复查
- [ ] 输出可落库与二次编辑

### P4-T2 采购清单生成器
- [ ] 按计划映射采购项
- [ ] 分级：必买/建议/可选
- [ ] 每项附理由与关联计划条目（示例：因本周运动打卡频次较高，建议补充高蛋白物资）

### P4-T3 建议层次化
- [ ] 当日建议
- [ ] 本周建议
- [ ] 下周建议
- [ ] 明确依据数据引用

### P4-T4 质量评估与调优
- [ ] 生成质量打分规则
- [ ] 低质量输出回退策略（模板兜底）
- [ ] 连续 3 轮真实场景演练

**Phase 4 验收标准**
- [ ] 计划、采购、建议三套输出稳定可执行
- [ ] 输出具备“依据可解释性”

---

## Phase 5｜部署前回归与运营化

### P5-T1 全链路回归
- [ ] 核心路径回归（聊天录入/计划生成/采购生成/撤销）
- [ ] 移动端交互回归
- [ ] 性能与异常兜底回归

### P5-T2 运维与观测
- [ ] AI 请求日志看板（耗时/失败率）
- [ ] 错误分类与告警策略
- [ ] 用户操作审计可检索

### P5-T3 发布准备（仅准备，不推送）
- [ ] 发版清单补全
- [ ] 回滚方案验证
- [ ] 发布说明草案

**Phase 5 验收标准**
- [ ] 可进入可控上线窗口
- [ ] 回滚与审计完备

---

## 成果索引（Artifacts）

> 规则：每新增一个成果文件，必须追加到此索引

- `AI_AGENT_DEVELOPMENT_TODO.md`（本文件）
- `docs/ai-agent/02-data-api-spec-v1.md`
- `docs/ai-agent/03-write-policy-matrix-v1.md`
- 待新增：
  - `docs/ai-agent/01-boundary-rules-v1.md`
  - `docs/ai-agent/04-risk-guardrails-v1.md`

---

## 开发日志（按天简记）

### 2026-03-21
- [x] 确认 AI 主线方向（智能体化）
- [x] 确认前端策略（单入口小人）
- [x] 建立本地落盘 Todo 体系
- [x] 完成数据模型/API清单 v1
- [x] 完成写库权限矩阵 v1

