# HEARTBEAT-SETUP.md

## 配置自动心跳（每 30 分钟）

### macOS (launchd)

```bash
# 1. 创建 launchd plist
cat > ~/Library/LaunchAgents/com.geo-bd.heartbeat.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.geo-bd.heartbeat</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/alvin/.openclaw/workspace-geo-bd/scripts/heartbeat.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>1800</integer>
    <key>StandardOutPath</key>
    <string>/tmp/geo-bd-heartbeat.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/geo-bd-heartbeat.err</string>
</dict>
</plist>
EOF

# 2. 加载
launchctl load ~/Library/LaunchAgents/com.geo-bd.heartbeat.plist

# 3. 验证
launchctl list | grep geo-bd
```

### Linux (cron)

```bash
# 编辑 crontab
crontab -e

# 添加（每 30 分钟）
*/30 * * * * /bin/bash /home/alvin/.openclaw/workspace-geo-bd/scripts/heartbeat.sh
```

---

_Updated: 2026-03-07 by GeoBD_
