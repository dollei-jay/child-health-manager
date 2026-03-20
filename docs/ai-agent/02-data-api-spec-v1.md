# 02-data-api-spec-v1

> 项目：child-health-manager
> 阶段：Phase 1 / P1-T2
> 版本：v1
> 日期：2026-03-21

## 1. 目标
为“AI 驱动健康管理智能体”定义可直接落地的数据模型与 API 契约，支持：
- 读历史数据（多孩子上下文）
- 生成建议/下周计划/采购清单
- 对话触发结构化写库
- 写库回执与撤销

---

## 2. 现有可复用表（基于 server.ts 盘点）

### 2.1 用户与孩子
- `users`（含 `selectedChildId`, `childAvatar`）
- `child_profiles`（多孩子档案）

### 2.2 执行与记录
- `todos`（priority / dueDate / childProfileId）
- `weekly_plan`（childProfileId）
- `checklist`（childProfileId）
- `grocery_list`（childProfileId）
- `growth_records`（height, weight, childProfileId）
- `weekly_reviews`
- `reminder_states`
- `audit_logs`

### 2.3 现有可复用 API
- profile/children: `/api/profile`, `/api/children`
- 任务与计划: `/api/todos`, `/api/weekly-plan`, `/api/checklist`
- 采购: `/api/grocery-list`
- 生长: `/api/growth-records`
- 复盘与提醒: `/api/weekly-review`, `/api/reminders*`
- 报告导出: `/api/reports/weekly`, `/api/export/csv`

---

## 3. 新增数据模型（v1）

## 3.1 `ai_sessions`
用于保存会话级上下文（便于连续对话与回放）。

```sql
CREATE TABLE IF NOT EXISTS ai_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  childProfileId INTEGER,
  title TEXT,
  status TEXT DEFAULT 'active',
  lastMessageAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## 3.2 `ai_messages`
保存智能体交互消息（用户/助手/tool）。

```sql
CREATE TABLE IF NOT EXISTS ai_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sessionId INTEGER NOT NULL,
  role TEXT NOT NULL,                -- user|assistant|tool
  content TEXT NOT NULL,
  toolName TEXT,
  toolPayload TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## 3.3 `ai_ops_log`
核心操作日志（用于回执、审计、撤销）。

```sql
CREATE TABLE IF NOT EXISTS ai_ops_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  childProfileId INTEGER,
  sessionId INTEGER,
  opType TEXT NOT NULL,              -- write_growth|write_diagnosis|write_todo|apply_plan|apply_grocery
  targetTable TEXT,
  targetId INTEGER,
  actionPayload TEXT NOT NULL,       -- 原始动作参数
  beforeSnapshot TEXT,               -- 撤销前快照
  afterSnapshot TEXT,                -- 写入后快照
  undoToken TEXT UNIQUE,
  undoable INTEGER DEFAULT 1,
  riskLevel TEXT DEFAULT 'low',      -- low|medium|high
  confirmedByUser INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  undoneAt TEXT
);
```

## 3.4 `diagnosis_records`（新增）
诊断/医嘱记录（严格区分于 AI 建议）。

```sql
CREATE TABLE IF NOT EXISTS diagnosis_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  childProfileId INTEGER NOT NULL,
  visitDate TEXT,
  hospital TEXT,
  doctorName TEXT,
  diagnosisText TEXT NOT NULL,
  adviceText TEXT,
  riskFlag TEXT DEFAULT 'normal',    -- normal|warning|critical
  source TEXT DEFAULT 'manual',      -- manual|ai
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. AI 专用 API（v1）

## 4.1 `POST /api/ai/chat`
单入口对话接口（支持 function calling）。

### Request
```json
{
  "sessionId": 12,
  "message": "今天安栎118cm，22.4kg，医生建议继续补充维D4周",
  "childProfileId": 3,
  "timeRange": "30d"
}
```

### Response
```json
{
  "sessionId": 12,
  "assistant": "已记录本次身高体重与诊断，给你本周建议如下...",
  "actions": [
    {
      "type": "write_growth",
      "status": "done",
      "target": "growth_records",
      "targetId": 88,
      "undoToken": "undo_xxx"
    },
    {
      "type": "write_diagnosis",
      "status": "pending_confirm",
      "reason": "医疗相关需确认"
    }
  ],
  "cards": [
    { "type": "weekly_advice", "title": "本周建议", "data": {} }
  ]
}
```

## 4.2 `POST /api/ai/plan/generate`
基于历史数据生成下周计划（不自动落库）。

### Request
```json
{
  "childProfileId": 3,
  "horizon": "next_week",
  "strategy": "balanced"
}
```

### Response
```json
{
  "plan": {
    "sleep": [],
    "diet": [],
    "exercise": [],
    "studyHabit": [],
    "observation": []
  },
  "reasoning": ["依据最近30天生长速度与执行率"],
  "applyToken": "apply_plan_xxx"
}
```

## 4.3 `POST /api/ai/purchase/generate`
根据计划生成采购清单（不自动落库）。

### Response 要点
- 分级：`must_buy` / `recommended` / `optional`
- 每项含 `reason` 与 `linkedPlanItem`
- 返回 `applyToken` 供一键应用

## 4.4 `POST /api/ai/apply`
应用 AI 生成结果（计划/采购），落库并产生日志。

## 4.5 `POST /api/ai/undo`
按 `undoToken` 回滚上一步写入。

---

## 5. Function Calling 规范（后端白名单）

允许动作（v1）：
- `update_growth(heightCm, weightKg, measuredAt)`
- `add_diagnosis(visitDate, diagnosisText, adviceText, riskFlag)`
- `add_todo(text, priority, dueDate)`
- `generate_week_plan(strategy)`
- `generate_purchase_list(strategy)`
- `apply_generated_plan(applyToken)`
- `apply_generated_purchase(applyToken)`

### 规则
1. 所有函数参数先过 schema 校验。
2. 医疗/高风险动作默认 `pending_confirm`。
3. 所有写入必须落 `ai_ops_log`。
4. 可撤销写入必须返回 `undoToken`。

---

## 6. 写库回执结构（统一）

```json
{
  "opId": 1001,
  "status": "done",
  "opType": "write_growth",
  "target": { "table": "growth_records", "id": 88 },
  "summary": "已记录：身高118cm，体重22.4kg",
  "undoToken": "undo_xxx",
  "riskLevel": "low",
  "confirmed": true,
  "timestamp": "2026-03-21T05:00:00+08:00"
}
```

---

## 7. 安全与边界

1. AI 仅做生活干预建议（饮食/运动/作息），不输出诊断结论。
2. 触发高风险（如体重骤降、骨龄严重偏离）时，阻断普通建议并提示就医。
3. 医疗相关写入默认需人工确认。
4. 关键写入必须可审计、可撤销。

---

## 8. 实施顺序建议（与开发计划对齐）

1. 先建表：`ai_sessions`、`ai_messages`、`ai_ops_log`、`diagnosis_records`
2. 再做 API：`/api/ai/chat` + `/api/ai/undo`
3. 再做生成器：`/api/ai/plan/generate` + `/api/ai/purchase/generate`
4. 最后做应用器：`/api/ai/apply`
