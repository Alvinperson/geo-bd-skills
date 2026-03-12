# Reddit GEO Prospecting - 使用指南

## 🚀 一句话调用

```
用 reddit-geo-prospect 搜 GEO 相关帖子，找意向用户
```

或

```
执行 reddit-geo-prospect，搜 r/SEO 和 r/SaaS，找 20 个意向用户
```

---

## 📋 标准执行流程

每次执行自动完成以下 4 步：

### Step 1: 搜索目标 Subreddit
- 默认：`r/SEO`, `r/SaaS`, `r/entrepreneur`, `r/ArtificialIntelligence`, `r/marketing`
- 可自定义：`--subs SEO,SaaS,founders`

### Step 2: 筛选相关帖子
- 关键词：`GEO`, `generative engine optimization`, `AI search optimization`, `LLM visibility`, `SEO AI`
- 时间范围：最近 30 天（可自定义）

### Step 3: 提取评论里的意向用户
- 高意向信号：问具体问题、表达需求、确认痛点
- 中意向信号：表示兴趣、追问细节

### Step 4: 输出结构化列表
- Markdown 表格格式
- 包含：用户、意向信号、来源帖子、Permalink、优先级、建议话术

---

## 🎯 常用命令

### 默认执行（推荐）
```
用 reddit-geo-prospect 找 GEO 意向用户
```

### 指定 Subreddit
```
用 reddit-geo-prospect 搜 r/SEO 和 r/SaaS，找意向用户
```

### 限制结果数量
```
用 reddit-geo-prospect 找 30 个 GEO 意向用户
```

### 只看最近 N 天
```
用 reddit-geo-prospect 搜最近 7 天的 GEO 帖子
```

---

## 📊 输出格式

```markdown
# Reddit GEO Prospects - 2026-03-07

**搜索范围**: r/SEO, r/SaaS, r/entrepreneur  
**时间范围**: 最近 30 天  
**关键词**: GEO, generative engine optimization, AI search  
**找到意向用户**: 12 人

---

## P0 - 高意向（立即跟进）

| 用户 | 意向信号 | 来源 | Permalink | 建议话术 |
|------|----------|------|-----------|----------|
| u/TechFounder123 | 问"GEO 具体怎么做？" | [GEO 讨论帖](链接) | [评论](链接) | 发电商案例 + CTA |

## P1 - 中意向（培育）

| 用户 | 意向信号 | 来源 | Permalink | 建议话术 |
|------|----------|------|-----------|----------|
| u/MarketerPro | 说"这个有意思" | [GEO 入门](链接) | [评论](链接) | 发入门资料 + 邀请社群 |

---

## 下一步建议

1. **立即跟进 P0 用户** - 用 outbound-scripts.md 模板 A
2. **培育 P1 用户** - 关注 + 互动，等待更强信号
3. **记录到 CRM** - 写入 Bitable，标记来源 "Reddit"
```

---

## 🔄 与 GeoBD 协作

### GeoBD 自动调用

GeoBD 执行 BD 任务时，会自动调用此技能：

```
GeoBD: 执行 Reddit prospecting，找 30 个意向用户
→ reddit-geo-prospect 执行
→ 结果写入 Bitable CRM
→ 汇报给 Alvin
```

### 手动调用后转交 GeoBD

```
你：用 reddit-geo-prospect 找 GEO 意向用户
→ Sicily 执行，输出列表
→ 你：@GeoBD 跟进这些 P0 用户
→ GeoBD 用 outbound-scripts 触达
```

---

## ⚠️ 注意事项

1. **不要一次搜太多** - ≤5 个 Subreddit/次，避免信息过载
2. **优先最近 30 天** - 太旧的需求可能已解决
3. **必须包含 permalink** - 没有链接就无法定位跟进
4. **执行后记录 CRM** - 避免重复触达同一用户

---

## 📈 效果追踪

每次执行后记录以下指标：

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 搜索帖子数 | 50-100 | 覆盖范围 |
| 相关帖子数 | 10-20 | 筛选效率 |
| 意向用户数 | 5-15 | 有效线索 |
| P0 用户数 | 2-5 | 高价值线索 |
| 执行时长 | <10 分钟 | 效率指标 |

---

_Updated: 2026-03-07 by Sicily_
