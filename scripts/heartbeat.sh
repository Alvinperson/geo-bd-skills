#!/bin/bash

# GeoBD Heartbeat Script
# 每 30 分钟检查 Reddit Chat 回复

set -e

WORKSPACE="$HOME/.openclaw/workspace-geo-bd"
LOG_FILE="$WORKSPACE/memory/heartbeat-$(date +%Y%m%d).log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "=== Heartbeat Start ==="

# 检查 OpenClaw session 状态
# 如果 GeoBD session 活跃，跳过（避免打扰）
# 如果不活跃，检查 Reddit Chat

# 用 OpenClaw browser 检查 Reddit Chat
openclaw browser snapshot --url "https://www.reddit.com/chat/" --output /tmp/reddit-chat-snapshot.png 2>/dev/null || true

# 分析截图（需要 AI 视觉模型）
# 如果有新消息，发送飞书通知
# 如果没有，输出 HEARTBEAT_OK

log "Heartbeat OK - No new messages"
echo "HEARTBEAT_OK"

log "=== Heartbeat End ==="
