# child-health-manager

儿童健康成长管理系统（家庭版）

> 目标：把「计划 - 执行 - 复盘 - 报告」做成可持续闭环，降低家长记录成本，提升孩子健康管理的连续性。

- GitHub: https://github.com/dollei-jay/child-health-manager
- Docker Hub: `dollei/child-health-manager:latest`
- GHCR: `ghcr.io/dollei-jay/child-health-manager:latest`

---

## 1. 项目定位

本项目服务家庭场景下的儿童健康成长管理，围绕三个核心问题：

1. **数据分散**：身高/体重、待办、采购、计划常分散在多个地方。
2. **执行断档**：有计划但缺少日常打卡与复盘，难以长期坚持。
3. **复盘困难**：缺少阶段报告，无法快速判断本周执行质量与趋势。

系统通过统一入口把数据、计划和执行结果连接起来。

---

## 2. 功能总览（当前可用）

### 2.1 账号与档案
- 用户注册 / 登录（JWT 鉴权）
- 宝贝档案管理（姓名、生日、性别、目标）

### 2.2 日常执行
- 备忘待办（新增 / 完成 / 删除 / 编辑）
- 优先级与截止日期管理
- 一周计划（可编辑、导入、导出、模板套用）
- 每日打卡（早餐/运动/加餐/晚饭/早睡）
- 采购清单（分类编辑）

### 2.3 生长数据
- 生长记录（日期、身高、体重、BMI）
- 生长曲线图（趋势可视化）
- 历史记录管理（含删除）

### 2.4 统计与报告
- 打卡日历统计（累计完成、完美达成天数、本月完成）
- 成长报告中心（7/14/30天）
  - 自动聚合：待办、打卡、周计划、采购、生长数据
  - 生成执行建议
  - Markdown 导出

### 2.5 计划闭环（周复盘）
- 周复盘模块（按周一为起点）
- 记录：本周总结 / 阻塞问题 / 下周焦点 / 执行评分
- 同一周支持反复更新（幂等保存）

---

## 3. 产品亮点

1. **闭环思维落地**：不是单纯记数据，而是“计划-执行-复盘-报告”闭环。
2. **家庭实操导向**：周计划、采购清单、打卡与待办联动，减少执行摩擦。
3. **证据化输出**：周报可导出（Markdown），便于归档和对比。
4. **UI 风格统一**：保持稳定、温和、易读的粉紫主题，不做风格漂移。
5. **自动化发布**：推送 `main` 后自动构建并发布 Docker 镜像（双仓库）。

---

## 4. 技术栈

- 前端：React + Vite + TypeScript + Tailwind
- 后端：Express + TypeScript
- 数据库：SQLite（文件持久化）
- 鉴权：JWT + bcryptjs
- 部署：Docker / docker-compose
- CI/CD：GitHub Actions（推送 main 自动发布镜像）

---

## 5. 本地开发

### 5.1 环境要求
- Node.js 20+
- npm 10+

### 5.2 启动
```bash
npm install
npm run dev
```
默认地址：`http://localhost:3000`

### 5.3 常用命令
```bash
npm run dev      # 开发运行
npm run lint     # TypeScript 检查
npm run build    # 前端构建
npm run start    # 生产启动
```

---

## 6. 生产部署（Docker）

### 6.5 备份与恢复（SOP）

已提供脚本：

- `scripts/backup.sh`：创建备份包（`data/` 或 `database.sqlite` + `.env` + `docker-compose.yml`）
- `scripts/verify-backup.sh`：校验备份包完整性（sha256）
- `scripts/restore.sh`：恢复备份到目标目录

示例：

```bash
# 1) 执行备份
./scripts/backup.sh /path/to/backups

# 2) 校验备份
./scripts/verify-backup.sh /path/to/backups/child-health-manager-backup-YYYYmmdd-HHMMSS.tar.gz

# 3) 恢复（会提示风险确认）
./scripts/restore.sh /path/to/backups/child-health-manager-backup-YYYYmmdd-HHMMSS.tar.gz /path/to/app

# 4) 恢复后启动
cd /path/to/app && docker compose up -d
```

【风险提示】恢复会覆盖目标 `data/` 目录，请先确认或保留快照。


### 6.1 推荐目录结构（群晖/Linux 通用）
```text
/volume1/docker/child-health-manager/
├─ docker-compose.yml
├─ .env
└─ data/
```

### 6.2 `.env` 示例
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=请替换为至少32位高强度随机字符串
```

### 6.3 compose 示例（Docker Hub）
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

### 6.4 自动发布镜像（已启用）
- 触发条件：push 到 `main`
- 发布目标：
  - `ghcr.io/dollei-jay/child-health-manager:latest`
  - `dollei/child-health-manager:latest`
- 工作流文件：`.github/workflows/docker-publish.yml`

---

## 7. 更新日志

- 详细日志：[`CHANGELOG.md`](./CHANGELOG.md)
- 开发过程记录：[`DEVELOPMENT_PROGRESS.md`](./DEVELOPMENT_PROGRESS.md)

近期重点更新：
1. 成长报告中心（自动聚合 + Markdown 导出）
2. 周复盘模块（计划闭环）
3. main 推送自动双仓库镜像发布（GHCR + Docker Hub）
4. 顶部导航与总览重构（减少拥挤、统一信息层级）
5. 打卡日历优化（移除重复大日历，保留增强版总览日历）
6. 孩子头像能力（注册时/注册后上传，顶部与总览联动展示）

---

## 8. 已完成内容（里程碑）

### 已完成
- 基础可用性主链路（登录、档案、计划、待办、清单、记录）
- 生长记录与趋势图
- 打卡统计与总览
- 成长报告输出
- 周复盘闭环模块
- 自动 Docker 发布流水线

### 验证方式
每次发版遵循：
1. 本地 `npm run lint` 通过
2. 本地 `npm run build` 通过
3. 推送 `main`
4. GitHub Actions 自动发布镜像

---

## 9. 开发计划（滚动）

### P0（稳定与安全）
- 强制校验 `JWT_SECRET`（生产环境无值禁止启动）
- 登录限流与基础防暴力破解
- 接口输入校验统一化

### P1（体验与工程化）
- 生长/BMI 趋势判读增强（阈值提示、更清晰趋势文案）
- 前端包体优化（按模块拆包）
- 基础自动化测试补齐（关键 API 与回归路径）

### P2（能力增强）
- 多孩子档案支持
- 提醒机制（计划/记录提醒）
- 数据导出扩展（CSV/PDF）

---

## 10. 风险与运维提示

1. **必须挂载 `./data:/app/data`**，否则容器重建会丢失 SQLite 数据。
2. 修改 `JWT_SECRET` 会导致旧 token 失效，用户需重新登录。
3. 建议通过反向代理 + HTTPS 暴露服务，不建议直接公网裸露端口。

---

## 11. 许可证

暂未指定（后续可补充 `LICENSE`）。
