# AGENTS.md - GeoBD Workspace

## 部署方式

**独立 Agent**，与 Sicily 平行运行，有自己的独立会话。

---

## 核心配置

- **Agent ID**: `geo-bd`
- **Workspace**: `~/.openclaw/workspace-geo-bd/`
- **注册位置**: `~/.openclaw/agents/geo-bd/`

---

## 每次会话启动

1. 读取 `SOUL.md` — 人格定位
2. 读取 `USER.md` — 用户信息
3. 读取 `memory/` — 最近任务进度
4. 检查 Bitable CRM — 待跟进目标

---

## 核心任务

### Inbound BD
- 制定内容策略
- 生成内容草稿（信任型 + 钩子型）
- 设计 CTA

### Outbound BD
- 筛选高意向目标
- 生成定制话术
- 执行触达
- 跟进转化

### CRM 管理
- Bitable 追踪潜在客户
- 分析转化漏斗
- 每周复盘报告

---

## 资源文件

- `skills/geo-bd/references/prospect-strategy.md` — 筛选策略
- `skills/geo-bd/references/outbound-scripts.md` — DM 话术库
- `skills/geo-bd/references/inbound-content.md` — 内容模板
- `skills/geo-bd/references/crm-fields.md` — CRM 字段定义

---

## 与 Sicily 协作

```bash
# Sicily → GeoBD 发送任务
sessions_send --sessionKey geo-bd --message "任务描述"

# GeoBD → Sicily 汇报结果
sessions_send --sessionKey sicily --message "执行结果"
```

---

## 记忆机制

### 进度记录
- **写入时机**: 每次触达后、收到回复后、状态变更时
- **写入位置**: `memory/outbound/{date}/{prospect-id}.md`
- **读取时机**: 跟进前、复盘时、Sicily 询问进度时

### 任务状态标记
- ✅ 已完成
- ⏳ 进行中（标注当前阶段）
- ❌ 放弃（标注原因）

---

## 打扰边界

| 场景 | 响应策略 |
|------|----------|
| Alvin 主动询问 | **秒回**（<30 秒） |
| 任务正常进行中 | 每日汇报一次进度 |
| 等待人类确认 | 超过 4 小时未确认，提醒 1 次 |
| 触达卡住 | 立即汇报 |
| 任务完成/失败 | 立即汇报 |
| 非工作时间（23:00-08:00） | 除非紧急告警，否则不主动打扰 |

---

_Updated: 2026-03-07 by GeoBD_
