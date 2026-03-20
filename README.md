# child-health-manager

儿童健康成长管理系统（家庭版）  
用于记录孩子基础信息、成长数据、周计划、采购清单与待办事项，支持账号登录和本地数据持久化。

- GitHub: https://github.com/dollei-jay/child-health-manager

---

## 1. 项目定位

本项目用于家庭场景下的儿童健康管理，目标是：

- 把“成长数据 + 日常计划 + 执行清单”集中管理
- 降低记录成本，提升长期执行连续性
- 为后续 AI 辅助分析打基础（持续开发中）

---

## 2. 当前功能（已实现）

- 用户注册 / 登录（JWT 鉴权）
- 宝贝档案管理（姓名、生日、性别、目标）
- 一周计划（可保存）
- 备忘待办（新增/完成/删除）
- 采购清单（可保存）
- 生长记录（身高、体重、BMI，支持删除）
- 统计展示页面

---


## 2.5 成长报告中心（新）

新增「成长报告」模块（保持原有 UI 配色风格不变），支持：

- 报告周期选择：最近 7 / 14 / 30 天
- 一键生成周报：聚合待办、打卡、周计划、采购、生长记录
- 趋势摘要：体重/身高/BMI 区间变化（样本不足时给出提示）
- 执行建议：基于逾期待办、打卡频次、生长变化自动生成
- 报告导出：Markdown 文件（便于归档与二次编辑）

前端入口：顶部导航「成长报告」
后端接口：`GET /api/reports/weekly?days=7|14|30`

## 3. 技术栈

- 前端：React + Vite + TypeScript + Tailwind
- 后端：Express + TypeScript
- 数据库：SQLite（文件持久化）
- 鉴权：JWT + bcryptjs
- 部署：Docker / docker-compose（支持群晖 Container Manager）

---

## 4. 本地开发

### 4.1 环境要求

- Node.js 20+
- npm 10+

### 4.2 启动步骤

```bash
npm install
npm run dev
```

默认监听：`http://localhost:3000`

### 4.3 常用命令

```bash
npm run dev      # 开发启动（前后端同进程）
npm run build    # 构建前端
npm run start    # 启动服务
npm run lint     # TypeScript 类型检查
```

---

## 5. 环境变量

> 生产环境至少配置以下变量：

| 变量名 | 必填 | 说明 |
|---|---|---|
| `NODE_ENV` | 是 | `production` |
| `JWT_SECRET` | 是 | JWT 密钥，必须为高强度随机字符串 |
| `PORT` | 否 | 默认 `3000` |

示例：

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=请替换为至少32位随机复杂字符串
```

---

## 6. Docker 部署

### 6.1 直接 compose 启动（通用 Linux）

```bash
docker compose up -d --build
```

当前 `docker-compose.yml` 已包含：

- 端口映射：`3000:3000`
- 数据卷：`./data:/app/data`
- 自动重启：`unless-stopped`

---

## 7. 群晖 Docker 部署规则（强制执行）

> 适用于 DSM 7.x + Container Manager。  
> 后续上线、迁移、重装请按本节执行，避免数据丢失和安全问题。

### 7.1 目录规范（必须）

在群晖创建固定目录（示例）：

```text
/volume1/docker/child-health-manager/
├─ docker-compose.yml
├─ .env
└─ data/                  # SQLite 持久化目录（核心数据）
```

**规则：**
1. 必须持久化 `data/`，否则容器重建会丢失数据库。
2. 禁止把数据库放在容器临时层。
3. 备份时必须包含 `data/ + .env + compose 文件`。

### 7.2 镜像与服务规范（必须）

1. 重启策略：`unless-stopped`
2. 容器端口：`3000`
3. 宿主机端口：建议使用非冲突端口（如 `13000:3000`）
4. 环境变量必须通过 `.env` 注入，不要硬编码到镜像
5. `JWT_SECRET` 必须替换为高强度随机值（至少 32 位）

示例 `.env`：

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=替换成高强度随机字符串
```

### 7.3 网络与访问控制（必须）

1. 默认仅内网开放端口（NAS 防火墙白名单）。
2. 对外访问必须走 DSM 反向代理 + HTTPS（证书）。
3. 不建议直接公网暴露 `3000`。
4. 建议为域名配置访问日志，便于审计与故障追踪。

### 7.4 反向代理建议（推荐）

- 外部：`https://child.xxx.com`
- 内部转发：`http://127.0.0.1:13000`
- 开启 HSTS（按实际情况）
- 配置证书自动续签（Let's Encrypt 或企业证书）

### 7.5 升级与回滚规范（必须）

**升级流程：**
1. 备份 `data/`（快照或压缩备份）
2. 拉取最新代码
3. `docker compose up -d --build`
4. 验证登录、档案、记录读写

**回滚流程：**
1. 停止当前容器
2. 切回上一个稳定版本（镜像/代码）
3. 保留并复用原 `data/`
4. 重启并验证核心功能

### 7.6 日志与巡检（推荐）

- 查看日志：`docker logs -f qinqin_baby_app`
- 每周检查：
  - 容器状态（是否反复重启）
  - 磁盘占用（`data/` 增长情况）
  - 最近备份是否可恢复

---

## 8. 数据与备份

- SQLite 文件路径（容器内）：`/app/data/database.sqlite`
- 建议备份频率：每天增量 + 每周全量
- 备份校验：至少每月做一次恢复演练

---

## 9. 当前已知限制（现状说明）

1. JWT 目前无过期策略（后续版本将加入）
2. 接口输入校验仍需加强（后续加 schema 校验）
3. 登录接口限流尚未启用（后续补齐）
4. 前端构建包体偏大（后续做代码分割）

---

## 10. 后续持续开发计划（建议优先级）

### P0（安全与稳定）
- 强制 `JWT_SECRET` 校验（无值禁止启动）
- JWT 过期与续签机制
- 登录限流与防暴力破解
- 统一请求参数校验和错误处理

### P1（工程化）
- 完善 README / 运维手册 / 备份恢复 SOP
- 增加基础 API 自动化测试
- 优化前端打包体积

### P2（功能增强）
- 多孩子档案支持
- 生长曲线对标分析
- 计划模板与提醒机制
- 数据导出（CSV/PDF）

---

## 11. 许可证

暂未指定（可后续补充 `LICENSE` 文件）。

## 开发流程

- 参见 [DEV_WORKFLOW.md](./DEV_WORKFLOW.md)（本地先测试，再推 GitHub 的标准流程）
