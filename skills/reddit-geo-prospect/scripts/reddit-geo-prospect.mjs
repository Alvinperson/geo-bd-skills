#!/usr/bin/env node

/**
 * Reddit GEO Prospecting Script
 * 
 * Executes 4-step workflow using reddit-readonly:
 * 1. Search target subreddits via reddit-readonly
 * 2. Extract comments from relevant posts
 * 3. Detect intent signals
 * 4. Output structured prospect list
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync } from 'fs';

const execAsync = promisify(exec);

// LLM config - use qwen3.5-plus (current model) or claude-opus-4-6
const LLM_MODEL = process.env.GEO_PROSPECT_MODEL || 'qwen3.5-plus';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseDir = join(__dirname, '..');

// Default configuration
const DEFAULT_SUBS = ['SEO', 'SaaS', 'entrepreneur', 'marketing'];
const DEFAULT_KEYWORDS = ['GEO', 'generative engine optimization', 'AI search optimization', 'LLM visibility', 'SEO AI'];
const DEFAULT_LIMIT = 20;
const DEFAULT_TIME_RANGE = 30;

// Intent signal patterns
const HIGH_INTENT_PATTERNS = [
  // Chinese patterns
  /怎么做 (GEO|AI 优化)/i,
  /GEO 具体/i,
  /有 (案例 | 工具 | 方案) 推荐/i,
  /在找 (GEO|AI 获客)/i,
  /SEO 没用了/i,
  /AI 时代 (怎么办 | 怎么搞)/i,
  /ChatGPT (推荐 | 可见性)/i,
  /perplexity (优化 | 排名)/i,
  // English patterns - high intent
  /manually track/i,
  /spreadsheet.*pain/i,
  /pain.*spreadsheet/i,
  /tedious.*unreliable/i,
  /tracking.*AI visibility/i,
  /how to (optimize|improve).*AI/i,
  /how to.*ChatGPT/i,
  /tool.*recommend/i,
  /looking for.*GEO/i,
  /need.*GEO/i,
  /struggling with.*AI/i,
  /clients ask.*AI/i,
  /AI visibility.*problem/i,
  /GEO.*strategy/i,
  /show up.*AI/i,
  /cite.*brand/i,
  /LLM.*visibility/i,
  /invisible.*AI/i,
  /SEO.*invisible/i,
  /not showing up.*AI/i,
  /never get.*cited/i,
  /competitors.*recommended/i,
  /hardest.*close/i,
  /what shifted/i,
  /entity.*across platforms/i,
];

const MEDIUM_INTENT_PATTERNS = [
  // Chinese patterns
  /AI 对 SEO 的影响/i,
  /AI search (怎么 | 如何)/i,
  /有意思/i,
  /mark/i,
  /能多说/i,
  // English patterns - medium intent
  /curious how/i,
  /what tools/i,
  /interesting/i,
  /how do you/i,
  /anyone else/i,
  /has anyone/i,
  /what's your/i,
  /AI.*SEO/i,
  /GEO.*approach/i,
];

const EXCLUDE_PATTERNS = [
  /招聘/i,
  /广告/i,
  /引流/i,
  /\+1$/,
  /^up$/i,
  /智商税/i,
  /scam/i,
];

function parseArgs(args) {
  const parsed = {
    subs: DEFAULT_SUBS,
    keywords: DEFAULT_KEYWORDS,
    limit: DEFAULT_LIMIT,
    timeRange: DEFAULT_TIME_RANGE,
    minPriority: 'P2',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--subs':
        parsed.subs = next.split(',').map(s => s.trim());
        i++;
        break;
      case '--keywords':
        parsed.keywords = next.split(',').map(k => k.trim());
        i++;
        break;
      case '--limit':
        parsed.limit = parseInt(next, 10);
        i++;
        break;
      case '--timeRange':
        parsed.timeRange = parseInt(next, 10);
        i++;
        break;
      case '--minPriority':
        parsed.minPriority = next;
        i++;
        break;
    }
  }

  return parsed;
}

// Use LLM to analyze intent for multiple comments at once
async function analyzeIntentWithLLM(comments, postContext) {
  const prompt = `你是一名 GEO（Generative Engine Optimization）领域的 BD 专家。你的任务是分析 Reddit 评论，识别有 GEO 需求的潜在客户。

【帖子背景】
标题：${postContext.title}
正文摘要：${postContext.selftext_snippet?.substring(0, 300) || '无'}

【待分析的评论列表】
${comments.map((c, i) => `---
评论 ${i + 1}:
作者：u/${c.author}
内容：${c.body_snippet}
`).join('\n')}

【判断标准】

**P0 - 高意向（立即跟进）**：
- 明确表达 GEO/AI 可见性需求或痛点
- 有预算/付费意愿信号（如 "happy to pay", "would buy", "currently paying for"）
- 是决策者（创始人/agency owner/in-house 负责人）
- 有时间紧迫性（如 "need this now", "deadline"）
- 正在手动做某事且很痛苦（如 "manually track", "spreadsheet", "tedious"）

**P1 - 中意向（培育）**：
- 对 GEO 表示兴趣或好奇
- 问问题但不是急需解决
- 分享经验但没有明确需求
- 可能是决策者但需求不明确

**P2 - 低意向（观察）**：
- 泛泛而谈，没有具体行动意向
- 只是参与讨论但没有个人需求

**排除**：
- 反对/质疑 GEO（如 "scam", "snake oil", "doesn't work"）
- 纯广告/引流（推销自己的工具）
- 灌水（"up", "+1", "thanks"）
- 与 GEO 完全无关

【输出格式】
必须输出严格的 JSON 数组，每个元素对应一条评论：
[
  {
    "index": 1,
    "priority": "P0" | "P1" | "P2" | "排除",
    "reason": "50 字内说明判断依据",
    "signal": "提取原话中最能体现意向的 1 句（≤80 字）",
    "background": "从评论推断的行业/身份（如 'SEO agency', 'SaaS founder', 'In-house SEO'）"
  }
]

【注意】
- 必须输出 JSON，不要有其他文字
- index 对应评论在列表中的序号（从 1 开始）
- 如果评论太短或无法判断，标记为 "P2"
- 广告/引流直接标记为 "排除"
`;

  // Call LLM via OpenClaw's model
  // Since we're in a Node.js script, we'll use a simple HTTP call to the model
  // For now, use a placeholder - in real deployment this would call the LLM API
  // Actually, let's use a simpler approach: write comments to temp file and call OpenClaw
  
  // For this implementation, we'll use the sessions_spawn to call LLM
  // But that's complex. Let's use a simpler approach: call via exec to openclaw cli
  
  // Actually, the simplest is to use the model directly via API
  // But we don't have direct API access in this script.
  
  // Let me use a pragmatic approach: for now, keep regex as fallback but add LLM as primary
  // In production, this would be replaced with actual LLM API call
  
  // For now, return null to indicate LLM should be used but isn't available in this context
  // The actual implementation would require API key or OpenClaw integration
  
  return null; // Placeholder - indicates LLM not available in script context
}

// Fallback to regex-based detection (used when LLM is not available)
function detectIntent(text) {
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(text)) {
      return { priority: null, signal: '排除' };
    }
  }

  for (const pattern of HIGH_INTENT_PATTERNS) {
    if (pattern.test(text)) {
      return { priority: 'P0', signal: text.substring(0, 80) };
    }
  }

  for (const pattern of MEDIUM_INTENT_PATTERNS) {
    if (pattern.test(text)) {
      return { priority: 'P1', signal: text.substring(0, 80) };
    }
  }

  return { priority: null, signal: null };
}

// LLM-based intent analysis via OpenClaw session spawn
async function analyzeCommentsWithLLLM(comments, postContext) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  // Prepare data for LLM analysis
  const analysisData = {
    postTitle: postContext.title,
    postSnippet: postContext.selftext_snippet,
    comments: comments.map(c => ({
      author: c.author,
      text: c.body_snippet
    }))
  };
  
  // Write to temp file
  const tmpFile = `/tmp/geo_prospect_analysis_${Date.now()}.json`;
  writeFileSync(tmpFile, JSON.stringify(analysisData, null, 2));
  
  // Use OpenClaw to analyze via LLM
  // This is a simplified approach - in production would use proper API
  const llmPrompt = `分析这些 Reddit 评论的 GEO 意向：

帖子：${postContext.title}
评论数：${comments.length}

逐条判断：P0（高意向）/ P1（中意向）/ P2（低）/ 排除

输出 JSON 数组：[{index, priority, reason, signal, background}]`;

  try {
    // For now, use a simple approach: call openclaw sessions_spawn
    // This requires OpenClaw CLI access
    const cmd = `openclaw sessions_spawn --runtime=subagent --mode=run --task "分析 GEO 意向" --timeout 60`;
    
    // This is getting complex. Let me use a simpler approach:
    // Just call an external LLM API directly (like DashScope for qwen)
    
    // For this implementation, I'll use DashScope API (Alibaba Cloud)
    const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
    
    if (!DASHSCOPE_API_KEY) {
      console.log('   ⚠️ 无 DASHSCOPE_API_KEY，降级使用正则匹配');
      return null;
    }
    
    // Build prompt
    const prompt = `你是一名 GEO 领域 BD 专家。分析以下 Reddit 评论的意向强度。

帖子标题：${postContext.title}

评论列表（JSON 格式）：
${JSON.stringify(comments.map(c => ({ author: c.author, text: c.body_snippet })), null, 2)}

判断标准：
- P0：明确 GEO 需求/痛点，有预算信号，决策者，时间紧迫，手动做且痛苦
- P1：有兴趣/好奇，问问题，分享经验但需求不明确
- P2：泛泛而谈，无具体意向
- 排除：反对 GEO，广告/引流，灌水，无关

输出严格 JSON 数组：
[{
  "index": 1,
  "priority": "P0"|"P1"|"P2"|"排除",
  "reason": "50 字内",
  "signal": "原话≤80 字",
  "background": "行业/身份"
}]

只输出 JSON，不要其他文字。`;

    const { stdout } = await execAsync(
      `curl -s -X POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \\
        -H "Authorization: Bearer ${DASHSCOPE_API_KEY}" \\
        -H "Content-Type: application/json" \\
        -d '{
          "model": "qwen-plus",
          "messages": [{"role": "user", "content": ${JSON.stringify(prompt)}],
          "temperature": 0.1,
          "max_tokens": 2000
        }'`,
      { timeout: 30000 }
    );
    
    const result = JSON.parse(stdout);
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      console.log('   ⚠️ LLM 返回空，降级使用正则');
      return null;
    }
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('   ⚠️ LLM 返回非 JSON，降级使用正则');
      return null;
    }
    
    return JSON.parse(jsonMatch[0]);
    
  } catch (err) {
    console.log(`   ⚠️ LLM 调用失败：${err.message}，降级使用正则`);
    return null;
  }
}

function generateSuggestion(signal) {
  if (signal.includes('怎么做') || signal.includes('具体') || signal.includes('how to')) {
    return '发案例 + CTA（DM 我拿完整清单）';
  } else if (signal.includes('SEO 没用了') || signal.includes('怎么办')) {
    return '共情 + GEO 价值说明 + 邀请 demo';
  } else if (signal.includes('工具') || signal.includes('方案') || signal.includes('track')) {
    return '发工具对比 + 预约咨询';
  } else if (signal.includes('有意思') || signal.includes('mark')) {
    return '发入门资料 + 邀请社群';
  } else {
    return '关注 + 互动，等待更强信号';
  }
}

function extractBackground(text) {
  const lower = text.toLowerCase();
  let bg = [];
  if (lower.includes('agency') || lower.includes('client')) bg.push('SEO agency');
  if (lower.includes('saas') || lower.includes('founder')) bg.push('SaaS founder');
  if (lower.includes('in-house') || lower.includes('team')) bg.push('In-house SEO');
  if (lower.includes('building') || lower.includes('tool')) bg.push('Building tools');
  return bg.length > 0 ? bg.join(', ') : '未明确';
}

async function execReadonly(subs, query, limit) {
  const scriptPath = join(__dirname, '../../reddit-readonly/scripts/reddit-readonly.mjs');
  const cmd = `node "${scriptPath}" find --subreddits "${subs.join(',')}" --query "${query}" --maxAgeHours 720 --perSubredditLimit ${limit} --maxResults ${limit}`;
  
  try {
    const { stdout } = await execAsync(cmd, { timeout: 30000 });
    return JSON.parse(stdout);
  } catch (e) {
    throw new Error(`reddit-readonly search failed: ${e.message}`);
  }
}

async function extractComments(postId, limit = 30) {
  const scriptPath = join(__dirname, '../../reddit-readonly/scripts/reddit-readonly.mjs');
  const cmd = `node "${scriptPath}" comments "${postId}" --limit ${limit}`;
  
  try {
    const { stdout } = await execAsync(cmd, { timeout: 20000 });
    return JSON.parse(stdout);
  } catch (e) {
    throw new Error(`Failed to extract comments: ${e.message}`);
  }
}

async function runProspecting(config) {
  console.log(`🔎 开始 Reddit GEO Prospecting\n`);
  console.log(`搜索范围：r/${config.subs.join(', r/')}`);
  console.log(`关键词：${config.keywords.join(', ')}`);
  console.log(`限制：${config.limit} 条结果`);
  console.log(`时间范围：最近 ${config.timeRange} 天\n`);
  console.log('─'.repeat(60) + '\n');

  const prospects = [];
  const query = config.keywords.join(' OR ');
  
  // Step 1: Search posts
  console.log('📌 Step 1: 搜索帖子...');
  let searchResult;
  try {
    searchResult = await execReadonly(config.subs, query, config.limit);
    if (!searchResult.ok) {
      throw new Error(searchResult.error?.message || 'Search failed');
    }
    console.log(`   ✅ 找到 ${searchResult.data?.results?.length || 0} 个相关帖子\n`);
  } catch (err) {
    console.error(`   ❌ 搜索失败：${err.message}`);
    return { ok: false, error: err.message };
  }

  const posts = searchResult.data?.results || [];
  
  // Step 2 & 3: Extract comments and detect intent with LLM
  console.log('📌 Step 2-3: 提取评论 + LLM 识别意向...\n');
  
  for (const post of posts.slice(0, 10)) {
    console.log(`   处理：${post.title.substring(0, 50)}...`);
    
    try {
      const commentResult = await extractComments(post.id, 30);
      if (!commentResult.ok || !commentResult.data?.comments) continue;
      
      const comments = commentResult.data.comments
        .filter(c => c.body_snippet && c.body_snippet.length >= 20)
        .filter(c => c.author !== post.author); // Skip OP
      
      if (comments.length === 0) continue;
      
      // Try LLM analysis first
      let llmResults = null;
      if (process.env.DASHSCOPE_API_KEY) {
        llmResults = await analyzeCommentsWithLLLM(comments, post);
      }
      
      // Process each comment
      for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];
        let analysis;
        
        if (llmResults && llmResults[i]) {
          // Use LLM result
          const llm = llmResults[i];
          if (llm.priority === '排除' || llm.priority === 'P2') continue;
          
          analysis = {
            priority: llm.priority,
            signal: llm.signal,
            reason: llm.reason,
            background: llm.background,
          };
          console.log(`      ✅ ${llm.priority}: u/${comment.author} (${llm.reason})`);
        } else {
          // Fallback to regex
          const intent = detectIntent(comment.body_snippet);
          if (!intent.priority) continue;
          
          analysis = {
            priority: intent.priority,
            signal: intent.signal,
            reason: '正则匹配',
            background: extractBackground(comment.body_snippet + ' ' + (post.selftext_snippet || '')),
          };
          console.log(`      ⚡ ${intent.priority}: u/${comment.author} (正则)`);
        }
        
        prospects.push({
          user: `u/${comment.author}`,
          signal: analysis.signal,
          post: post.title,
          postUrl: post.permalink,
          permalink: comment.permalink,
          priority: analysis.priority,
          suggestion: generateSuggestion(analysis.signal),
          background: analysis.background,
          llmReason: analysis.reason,
        });
      }
    } catch (err) {
      console.log(`      ⚠️ 跳过：${err.message}`);
    }
  }

  // Deduplicate
  const seen = new Set();
  const uniqueProspects = prospects.filter(p => {
    if (seen.has(p.user)) return false;
    seen.add(p.user);
    return true;
  });

  // Output
  console.log('\n' + '═'.repeat(60));
  console.log('📊 结果汇总\n');

  const p0Count = uniqueProspects.filter(p => p.priority === 'P0').length;
  const p1Count = uniqueProspects.filter(p => p.priority === 'P1').length;

  console.log(`找到意向用户：${uniqueProspects.length} 人`);
  console.log(`  P0（高意向）: ${p0Count} 人`);
  console.log(`  P1（中意向）: ${p1Count} 人`);
  console.log('\n');

  console.log('## P0 - 高意向（立即跟进）\n');
  console.log('| 用户 | 意向信号 | 来源 | Permalink | 建议话术 |');
  console.log('|------|----------|------|-----------|----------|');

  for (const p of uniqueProspects.filter(p => p.priority === 'P0')) {
    console.log(`| ${p.user} | ${p.signal}... | [${p.post.substring(0, 25)}](${p.postUrl}) | [评论](${p.permalink}) | ${p.suggestion} |`);
  }

  console.log('\n\n## P1 - 中意向（培育）\n');
  console.log('| 用户 | 意向信号 | 来源 | Permalink | 建议话术 |');
  console.log('|------|----------|------|-----------|----------|');

  for (const p of uniqueProspects.filter(p => p.priority === 'P1')) {
    console.log(`| ${p.user} | ${p.signal}... | [${p.post.substring(0, 25)}](${p.postUrl}) | [评论](${p.permalink}) | ${p.suggestion} |`);
  }

  console.log('\n\n## 下一步建议\n');
  console.log('1. **立即跟进 P0 用户** - 用 outbound-scripts.md 模板 A');
  console.log('2. **培育 P1 用户** - 关注 + 互动，等待更强信号');
  console.log('3. **记录到 CRM** - 写入 Bitable，标记来源 "Reddit"');

  return { ok: true, data: { prospects: uniqueProspects, summary: { total: uniqueProspects.length, p0: p0Count, p1: p1Count } } };
}

// CLI entry
const args = process.argv.slice(2);
const command = args[0];
const config = parseArgs(args.slice(1));

if (command === 'run' || !command) {
  runProspecting(config)
    .then(result => process.exit(result.ok ? 0 : 1))
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
} else {
  console.log(`Unknown command: ${command}`);
  console.log('Usage: node reddit-geo-prospect.mjs run [--subs X,Y,Z] [--limit N]');
  process.exit(1);
}
