# DEVELOPMENT_PROGRESS（Beta）

> 分支基线：`beta`
> 
> 说明：本文件记录“真实已执行动作”，用于下一轮开发前快速恢复上下文。

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
