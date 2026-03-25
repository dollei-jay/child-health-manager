# DEVELOPMENT_PROGRESS（Beta）

> 分支基线：`beta`
> 
> 说明：本文件记录“真实已执行动作”，用于下一轮开发前快速恢复上下文。

---

## 2026-03-26

### 6) AI 交互重构与事务化执行（进行中，核心链路已可用）

#### 6.1 已完成：大模型长期配置 + 启动稳定化
- 服务启动时自动加载 `.env.local`（优先）+ `.env`（回退）。
- `AI_PROVIDER / AI_BASE_URL / AI_MODEL / AI_API_KEY` 本地长期生效。

**证据**
- 启动日志可见 dotenv 注入环境变量。
- `GET /api/ai/status` 返回 `configured: true`（在配置正确时）。

#### 6.2 已完成：计划/采购草案预览 + 确认写入门禁
- 计划、采购草案生成后均展示预览文本。
- 维持 pending_confirm -> 确认后写库闭环。

**证据**
- `/api/ai/chat` 返回 `apply_weekly_plan/apply_grocery_list` 的 `pending_confirm`。
- 确认后返回 `done`，对应表可读到更新数据。

#### 6.3 已完成：高风险“清空数据”事务
- 新增 `clear_data` 确认链路：
  - 触发：清空计划/清空采购/同时清空
  - 二次确认：`确认清空`
  - 执行：删除 `weekly_plan` / `grocery_list`
  - 回执：结构化写入回执（删除条数）

**证据（E2E）**
- step1: `pending_confirm`
- step2: `done`
- 清空后：`/api/weekly-plan` 与 `/api/grocery-list` 返回 null

#### 6.4 已完成：生长记录自然语言新增/修改/删除
- 新增：`今天身高130.5 体重28.3`
- 修改：`修改生长记录：YYYY-MM-DD 身高X 体重Y`
- 删除：`删除生长记录：YYYY-MM-DD`

**证据（E2E）**
- `growth_add / growth_update / growth_delete` 均返回 `done`。

#### 6.5 已完成：待办自然语言 CRUD（最终分流修复）
- 新增：`新增待办：...`
- 完成：`完成待办：...`
- 修改：`修改待办：A 改为 B`
- 删除：`删除待办：...`

**证据（E2E）**
- `todo_add / todo_complete / todo_update / todo_delete` 均返回 `done`。
- 最终 `todos_after` 与预期一致（可为空）。

#### 6.6 当前待收口
- 前端页面一致性需董事长实测确认（总览/详情页同步观察）。
- 对“复杂自然语言全局改计划”仍可继续增强（已可用但需持续优化鲁棒性）。

---

## 2026-03-23

### 1) 分支治理调整（已完成）
- 删除本地与远端 `feat/report-center`。
- 建立新策略：
  - `origin/main` 作为稳定正式版。
  - `beta` 作为本地持续开发版。
- 将未发布开发代码封存在 `beta`（WIP 提交）。

**证据**
- 本地分支：`main`, `beta`
- `beta` 提交：`b91e21c`

---

### 2) CI 发布策略调整（已完成并已推 main）
- 将 `docker-publish.yml` 从 push 触发改为手动触发 `workflow_dispatch`。
- 目的：避免 main 每次更新自动发布镜像。

**证据**
- main 提交：`4e8fa5a`
- workflow 仅保留 manual dispatch。

---

### 3) README 重写（已完成并已推 main）
- 结构化重写 README：定位、功能总览（当前可用+开发中）、亮点、技术栈、部署、更新日志、开发计划、许可证、风险提示。

**证据**
- main 提交：`1a61218`

---

### 4) AI 大模型接入切换（本地运行态）
- 按董事长提供配置启动：
  - `AI_BASE_URL=http://127.0.0.1:8317/v1`
  - `AI_API_KEY=已注入`
  - `AI_MODEL=gpt-5.4`
  - `AI_PROVIDER=openai-compatible`
- 验证聊天返回为真实模型文本，不再仅“已收到”。

**证据**
- `/api/ai/chat` 返回完整建议文本。

---

### 5) AI 上下文问题修复（进行中并已部分完成）

#### 5.1 已完成
- 修复“已注册孩子档案未被利用”问题：在 chat 请求前注入 child profile hint。
- 修复 mock 模型仅回显问题（用于本地 fallback）。

#### 5.2 已完成（关键）
- 打通“计划/采购建议先待确认，再写库”的核心后端流程：
  - `帮我生成一周计划` -> 返回 pending_confirm 草案
  - 确认写入后 -> 更新 `weekly_plan` 并返回写入回执
  - `帮我生成采购清单` -> 返回 pending_confirm 草案
  - 确认写入后 -> 更新 `grocery_list` 并返回写入回执

**证据（端到端脚本）**
- draft pending = true
- confirm assistant = “已按确认写入…”
- `/api/weekly-plan` 与 `/api/grocery-list` 可读到新数据

#### 5.3 仍待收口
- 多轮“修改草案”对话能力（不落库）
- 确认后页面自动刷新一致性
- 异常与重复确认边界用例

---

## 当前风险提示

1. 开发代码在 `beta`，请勿误推 main。
2. 本地端口 3400 可能被旧进程占用，需先清理后重启。
3. AI 写库链路变更需优先做端到端回归，避免“聊天有回复但页面无落库”。

---

## 下一轮开发建议（启动即做）

1. 先读 `AI_AGENT_DEVELOPMENT_TODO.md` 的 Doing/Next。
2. 启动 `beta` 分支服务并验证：
   - `npm run lint`
   - `npm run build`
   - 端到端确认写入用例
3. 开发 P6-T2/T3/T4（调整草案、多轮确认、回归报告）。
