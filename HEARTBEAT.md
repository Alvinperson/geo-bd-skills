# HEARTBEAT.md

# GeoBD 心跳检查清单

## 每次心跳（高频，每 30 分钟）

### Reddit Chat 回复监控（方案 I：不依赖 CRM）

**核心逻辑**：只检查 Reddit Chat 有没有新消息，不依赖飞书 CRM 授权

- [ ] 打开 Reddit Chat 页面（https://www.reddit.com/chat/）
- [ ] 截图分析有没有新消息通知
- [ ] 有新消息 → 飞书通知木木（附带截图/用户名）
- [ ] 无新消息 → `HEARTBEAT_OK`（不回复，静默）

**执行逻辑**：
```
1. browser navigate https://www.reddit.com/chat/
2. browser snapshot 截图
3. 分析 snapshot，判断有没有新 Chat 消息
4. 有新消息 → message send 飞书通知木木
5. 无新消息 → 输出 HEARTBEAT_OK（系统自动丢弃，不打扰）
```

**注意**：
- 不查询 CRM（独立 session 无飞书授权）
- 不自动更新 CRM 状态（需要木木手动告知）
- 只负责发现回复并通知

---

## 每日检查（23:00 前）

- [ ] 检查 Bitable CRM，筛选超过 3 天未回复的目标（需要跟进或放弃）
- [ ] 检查今日 Outbound 触达目标（不超过 50 人）
- [ ] 检查 Inbound 内容发布计划（每周 2-3 篇）

## 每周检查（周日）

- [ ] 输出本周 BD 数据报告（触达数/回复数/对接数/转化率）
- [ ] 分析哪个环节转化率最低
- [ ] 调整下周策略

---

_Updated: 2026-03-11 by GeoBD_
