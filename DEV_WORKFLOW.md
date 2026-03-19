# DEV_WORKFLOW.md

本项目标准开发流程（SOP）：**本地先测试，测试成功再推 GitHub**。

---

## 1. 分支策略

- `main`：稳定主分支，仅接收通过验证的变更。
- 功能开发：`feat/<feature-name>`
- 缺陷修复：`fix/<bug-name>`
- 文档维护：`docs/<topic>`

> 禁止直接在 `main` 上做日常开发提交。

---

## 2. 开发前检查

每次开发前先执行：

```bash
git checkout main
git pull
npm install
```

创建新分支：

```bash
git checkout -b feat/your-feature-name
```

---

## 3. 本地开发与测试流程（强制）

### 3.1 开发运行

```bash
npm run dev
```

访问 `http://localhost:3000` 进行功能验证。

### 3.2 质量门禁（必须通过）

```bash
npm run lint
npm run build
```

- `lint` 失败：禁止提交
- `build` 失败：禁止提交

### 3.3 手工验收清单（最小回归）

每次合并前至少验证以下路径：

1. 注册 / 登录
2. 宝贝档案读取与修改
3. 待办新增/完成/删除
4. 一周计划保存与重开读取
5. 采购清单保存与重开读取
6. 生长记录新增/删除
7. 刷新页面后数据仍存在（验证 SQLite 持久化）

---

## 4. 提交规范

### 4.1 Commit Message 建议

- `feat: ...` 新功能
- `fix: ...` 修复
- `docs: ...` 文档
- `refactor: ...` 重构
- `chore: ...` 杂项维护

示例：

```text
feat: add growth record validation
fix: handle empty child profile fields
docs: update synology deployment notes
```

### 4.2 提交流程

```bash
git add .
git commit -m "feat: your message"
git push -u origin feat/your-feature-name
```

---

## 5. 合并策略

建议使用 PR 合并到 `main`：

- 标题清晰说明目的
- 描述中包含：改了什么、如何验证、是否影响数据
- 至少附上本地验证结果（`lint/build` 结果 + 手工验收点）

若紧急直推（临时）：也必须先完成第 3 节的本地验证。

---

## 6. 失败处理与回滚

### 6.1 本地测试失败

- 不推送
- 修复后重新执行 `lint + build + 手工验收`

### 6.2 线上问题回滚

- 立即回退到上一个稳定 commit/tag
- 保留 `data/`（SQLite 数据目录）
- 回滚后执行最小回归测试

---

## 7. Docker/群晖相关补充

涉及容器变更（镜像、compose、环境变量）时，必须额外验证：

1. 容器可正常启动
2. `JWT_SECRET` 已配置且非默认值
3. `./data -> /app/data` 挂载生效
4. 容器重启后数据不丢失

---

## 8. 持续迭代原则

- 小步提交、频繁验证
- 每次只解决一类问题，避免超大提交
- 先可用，再优化
- 所有“完成”必须可复测、可复现

