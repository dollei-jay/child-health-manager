# child-health-manager

儿童健康成长管理系统（家庭版）

> 用一个系统把「计划 → 执行 → 复盘 → 报告」做成可持续闭环，降低家长记录成本，提升成长管理连续性。

- GitHub: https://github.com/dollei-jay/child-health-manager
- Docker Hub: `dollei/child-health-manager:latest`
- GHCR: `ghcr.io/dollei-jay/child-health-manager:latest`

---

## 1. 项目定位

`child-health-manager` 面向家庭儿童健康管理场景，核心解决三类问题：

1. **数据分散**：身高体重、待办、采购、计划分散在多个工具，难持续。
2. **执行断档**：计划有了但落地困难，缺少日常打卡和追踪。
3. **复盘薄弱**：缺少阶段性汇总与趋势判断，家长难以决策。

项目目标不是“记账本”，而是让家庭形成可执行、可追踪、可复盘的成长管理闭环。

---

## 2. 功能总览

### 2.1 当前可用（main 分支）

#### 账号与档案
- 注册 / 登录（JWT 鉴权）
- 儿童档案（姓名、生日、性别、目标）
- 多孩子管理与切换（含头像）

#### 日常执行
- 备忘待办（新增 / 编辑 / 完成 / 删除）
- 一周计划（编辑 / 模板套用 / 导入导出）
- 每日打卡（早餐/运动/加餐/晚饭/早睡）
- 采购清单（分组编辑）

#### 生长数据
- 身高体重记录（含 BMI）
- 生长趋势可视化
- 历史记录管理

#### 提醒与复盘
- 站内提醒（含已读/静默）
- 周复盘（总结 / 阻塞 / 下周焦点 / 评分）
- 总览卡片与打卡日历

#### 数据与导出
- 成长报告（7/14/30 天）
- CSV 导出（growth/todos）
- 打印版 PDF 导出

#### AI 能力（已接入）
- 小人单入口聊天（固定右下角）
- 结构化回执与撤销入口
- 医疗写入确认门禁（高风险动作需确认）

---

### 2.2 开发中（本地迭代，不等于 main 已发布）

> 以下能力属于本地开发迭代项，是否进入 main 以实际提交为准。

- AI 计划/采购建议的多轮迭代确认写入流程（建议→调整→确认→落库→回执）
- AI 生成质量评分与兜底策略细化
- 观测面板与错误分类策略增强
- 移动端交互细节与异常兜底进一步打磨

---

## 3. 产品亮点

1. **闭环导向**：从“记录”升级到“计划-执行-复盘-报告”完整链路。
2. **单入口 AI**：坚持仅用一个“小人”入口，不破坏主信息架构。
3. **家庭可执行**：内容偏实践，不走空泛建议。
4. **证据化输出**：报告、导出、审计与回执支持复盘留痕。
5. **多孩子上下文**：切换后跨模块数据上下文一致。

---

## 4. 技术栈

- 前端：React + Vite + TypeScript + Tailwind
- 后端：Express + TypeScript
- 数据库：SQLite（本地文件持久化）
- 鉴权：JWT + bcryptjs
- 图表：Recharts
- 部署：Docker / docker-compose
- CI：GitHub Actions

---

## 5. 部署与安装

### 5.1 本地开发

#### 环境要求
- Node.js 20+
- npm 10+

#### 启动
```bash
npm install
npm run dev
```
默认地址：`http://localhost:3000`

#### 常用命令
```bash
npm run dev        # 开发运行
npm run lint       # TypeScript 检查
npm run build      # 构建
npm run start      # 生产启动
npm run test:smoke # API 冒烟测试
```

---

### 5.2 Docker 部署（推荐）

目录示例：
```text
/volume1/docker/child-health-manager/
├─ docker-compose.yml
├─ .env
└─ data/
```

`.env` 示例：
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=请替换为至少32位高强度随机字符串
```

`docker-compose.yml` 示例：
```yaml
services:
  app:
    image: dollei/child-health-manager:latest
    container_name: child-health-manager
    restart: unless-stopped
    ports:
      - "13000:3000"
    env_file:
      - .env
    volumes:
      - ./data:/app/data
```

启动：
```bash
docker compose pull
docker compose up -d
```

访问：
`http://<NAS-IP>:13000`

---

### 5.3 备份与恢复

- `scripts/backup.sh`
- `scripts/verify-backup.sh`
- `scripts/restore.sh`

示例：
```bash
./scripts/backup.sh /path/to/backups
./scripts/verify-backup.sh /path/to/backups/child-health-manager-backup-YYYYmmdd-HHMMSS.tar.gz
./scripts/restore.sh /path/to/backups/child-health-manager-backup-YYYYmmdd-HHMMSS.tar.gz /path/to/app
```

【风险提示】恢复会覆盖目标 `data/` 目录，请先保留快照。

---

## 6. 镜像发布说明（重要）

当前仓库 `docker-publish` 工作流已调整为：

- ✅ **仅支持手动触发**（`workflow_dispatch`）
- ❌ 不再因 push main 自动发布镜像

即：需要在 GitHub Actions 页面手动点 **Run workflow** 才会构建并发布镜像。

---

## 7. 更新日志

- 详细日志：[`CHANGELOG.md`](./CHANGELOG.md)
- 开发过程：[`DEVELOPMENT_PROGRESS.md`](./DEVELOPMENT_PROGRESS.md)
- AI 专项计划与进度：[`AI_AGENT_DEVELOPMENT_TODO.md`](./AI_AGENT_DEVELOPMENT_TODO.md)

---

## 8. 开发计划（滚动）

当前主线：

1. AI 建议到页面写入的闭环体验（确认门禁与回执一致性）
2. 移动端可用性与交互细节提升
3. 观测能力完善（耗时/错误分类/可追溯性）
4. 发布前回归与运维清单标准化

> 以 `AI_AGENT_DEVELOPMENT_TODO.md` 为项目执行事实基线。

---

## 9. 运维与风险提示

1. 必须挂载 `./data:/app/data`，否则容器重建会丢数据。
2. 修改 `JWT_SECRET` 会使旧 token 失效，用户需重新登录。
3. 建议通过反向代理 + HTTPS 暴露，不建议公网裸露端口。
4. AI 相关改动建议先本地回归（含写库/撤销链路）再进入发布窗口。

---

## 10. 许可证

暂未指定（后续可补充 `LICENSE`）。

---

## 11. 贡献与协作约定（简版）

- 先本地验证（lint/build/smoke）再提交。
- 高风险改动需附回滚方案。
- 文档变更与代码变更保持同步（README / TODO / CHANGELOG）。
