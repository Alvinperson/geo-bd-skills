---
name: reddit-geo-prospect
description: Find GEO (Generative Engine Optimization) prospects on Reddit. Executes 4-step workflow: search subreddits → find relevant posts → extract comments → identify high-intent users. Output: structured prospect list with permalinks.
metadata: {"clawdbot":{"emoji":"🔎","requires":{"bins":["node"]}}}
---

# Reddit GEO Prospecting

**使命**：在 Reddit 上找到有 GEO 需求的精准用户，输出可跟进的意向列表。

**北极星**：每条结果都必须有明确的意向信号 + permalink，方便后续 BD 触达。

---

## 🎯 标准工作流（4 步闭环）

### Step 1: 搜索目标 Subreddit

**默认 Subreddit 列表**（按优先级排序）：

| 优先级 | Subreddit | 说明 |
|--------|-----------|------|
| P0 | `r/SEO` | SEO 从业者，GEO 直接受众 |
| P0 | `r/SaaS` | SaaS 创始人，需要 AI 可见性 |
| P1 | `r/entrepreneur` | 创业者，寻找获客方法 |
| P1 | `r/ArtificialIntelligence` | AI 爱好者 |
| P1 | `r/marketing` | 营销人员，关注新渠道 |
| P2 | `r/Startup_Ideas` | 早期创业者 |
| P2 | `r/TheFounders` | 创始人社区 |
| P2 | `r/digital_marketing` | 数字营销从业者 |

**搜索关键词**（按优先级）：
1. `GEO` / `generative engine optimization`
2. `AI search optimization` / `ChatGPT optimization`
3. `LLM visibility` / `AI visibility`
4. `SEO AI` / `AI SEO`
5. `generative search` / `answer engine`

---

### Step 2: 筛选相关帖子

**筛选标准**（满足任一即可）：

✅ **高意向信号**：
- 标题/正文包含 "GEO" / "generative engine optimization"
- 问 "怎么做 AI 优化" / "如何在 ChatGPT 中被推荐"
- 说 "在找 GEO 工具/方案"
- 抱怨 "SEO 没用了，AI 时代怎么办"

⚠️ **中意向信号**：
- 讨论 "AI 对 SEO 的影响"
- 问 "AI search 怎么优化"
- 分享 AI 获客经验

❌ **排除**：
- 纯新闻/公告（无讨论价值）
- 招聘/广告（非真实需求）
- 太泛的讨论（如 "AI 好不好"）

---

### Step 3: 提取评论里的意向用户

**目标评论**（满足任一即可）：

✅ **高意向**：
- 问具体问题（"怎么做？" / "有工具推荐吗？"）
- 表达需求（"我也在找这个" / "求分享"）
- 确认痛点（"对，我也遇到这个问题"）

⚠️ **中意向**：
- 表示兴趣（"这个有意思" / "mark 一下"）
- 追问细节（"能多说点吗？"）

❌ **排除**：
- 纯灌水（"up" / "+1" 无实质内容）
- 反对/质疑（"这是智商税"）
- 发广告/引流

---

### Step 4: 输出结构化列表

**输出格式**（Markdown 表格）：

| Reddit 用户 | 意向信号 | 甲方背景 | 来源帖子 | Permalink | 优先级 |
|-------------|----------|----------|----------|-----------|--------|
| u/xxx | 问"怎么做 GEO" | SaaS 创始人，B2B 工具 | [帖子标题](链接) | [评论链接](链接) | P0 |
| u/yyy | 说"在找 AI 获客方法" | 电商，独立站 | [帖子标题](链接) | [评论链接](链接) | P1 |

**字段说明**：
- **原话**：用户的发帖/评论内容（原文复制）→ 写入 CRM「原话」
- **意向信号**：用户原话或行为摘要（50 字内）→ 写入 CRM「意向需求」
- **甲方背景**：从发帖历史/个人简介提取的行业/阶段/规模 → 写入 CRM「甲方背景」
- **来源帖子**：帖子标题 + 链接
- **Permalink**：具体评论的 permalink → 写入 CRM「来源链接」
- **优先级**：P0（高意向）/ P1（中意向）/ P2（观察）→ 写入 CRM「优先级」

---

## 🛠️ 执行命令

### 快速执行（默认参数）

```bash
# 用默认参数执行完整 4 步流程
node {baseDir}/scripts/reddit-geo-prospect.mjs run
```

### 自定义参数

```bash
# 指定 Subreddit 列表
node {baseDir}/scripts/reddit-geo-prospect.mjs run --subs SEO,SaaS,entrepreneur

# 指定搜索关键词
node {baseDir}/scripts/reddit-geo-prospect.mjs run --keywords "GEO,generative engine optimization,AI search"

# 限制结果数量
node {baseDir}/scripts/reddit-geo-prospect.mjs run --limit 20

# 只看最近 N 天的帖子
node {baseDir}/scripts/reddit-geo-prospect.mjs run --timeRange 7

# 只看特定优先级的结果
node {baseDir}/scripts/reddit-geo-prospect.mjs run --minPriority P1
```

### 单步执行（调试用）

```bash
# 只执行 Step 1：搜索帖子
node {baseDir}/scripts/reddit-geo-prospect.mjs search --sub SEO --keyword "GEO" --limit 10

# 只执行 Step 2：筛选帖子
node {baseDir}/scripts/reddit-geo-prospect.mjs filter --posts <post_ids_json>

# 只执行 Step 3：提取评论
node {baseDir}/scripts/reddit-geo-prospect.mjs comments --post <post_id> --limit 50

# 只执行 Step 4：输出列表
node {baseDir}/scripts/reddit-geo-prospect.mjs output --data <comments_json> --format markdown|json|csv
```

---

## 📋 输出示例

```markdown
# Reddit GEO Prospects - 2026-03-07

**搜索范围**: r/SEO, r/SaaS, r/entrepreneur  
**时间范围**: 最近 30 天  
**关键词**: GEO, generative engine optimization, AI search  
**找到意向用户**: 12 人

---

## P0 - 高意向（立即跟进）

| 用户 | 意向信号 | 甲方背景 | 来源 | Permalink |
|------|----------|----------|------|-----------|
| u/TechFounder123 | 问"GEO 具体怎么做？有成功案例吗？" | SEO agency 创始人，服务电商客户 | [GEO 讨论帖](https://reddit.com/r/SEO/comments/xxx) | [评论](https://reddit.com/r/SEO/comments/xxx/yyy) |
| u/SaaSBuilder | 说"SEO 流量跌了 50%，AI 时代怎么办" | SaaS 创始人，B2B 获客工具，种子轮 | [SEO 已死？](https://reddit.com/r/SaaS/comments/xxx) | [评论](https://reddit.com/r/SaaS/comments/xxx/yyy) |

## P1 - 中意向（培育）

| 用户 | 意向信号 | 甲方背景 | 来源 | Permalink |
|------|----------|----------|------|-----------|
| u/MarketerPro | 说"这个有意思，mark 一下" | 数字营销从业者 | [GEO 入门指南](https://reddit.com/r/marketing/comments/xxx) | [评论](https://reddit.com/r/marketing/comments/xxx/yyy) |

---

## 下一步建议

1. **立即跟进 P0 用户**（2 人）- 用 outbound-scripts.md 模板 A
2. **培育 P1 用户**（10 人）- 关注 + 互动，等待更强信号
3. **记录到 CRM** - 写入 Bitable，标记来源 "Reddit"
```

---

## 🔄 与 GeoBD 协作

### GeoBD 调用此技能

```bash
# GeoBD 执行 Reddit prospecting
reddit-geo-prospect run --subs SEO,SaaS --limit 30

# 将结果写入 CRM
# （自动调用 feishu-bitable_create_record）
```

### 输出同步给 Sicily

```bash
# 发送结果给 Sicily
sessions_send --sessionKey sicily --message "Reddit 找到 12 个 GEO 意向用户，详情见 Bitable"
```

---

## ⚠️ 避坑清单

- ❌ 不要一次搜太多 Subreddit（≤5 个/次，避免信息过载）
- ❌ 不要抓取太多帖子（≤20 个/次，先小批量测试）
- ❌ 不要忽略时间范围（优先最近 30 天，太旧的需求可能已解决）
- ❌ 不要只看标题（评论里才有真实意向）
- ❌ 不要忘记 permalink（没有链接就无法定位跟进）

---

## 📊 效果追踪

**核心指标**（每次执行后记录）：

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 搜索帖子数 | 50-100 | 覆盖范围 |
| 相关帖子数 | 10-20 | 筛选效率 |
| 意向用户数 | 5-15 | 有效线索 |
| P0 用户数 | 2-5 | 高价值线索 |
| 执行时长 | <10 分钟 | 效率指标 |

---

_Updated: 2026-03-07 by Sicily_
