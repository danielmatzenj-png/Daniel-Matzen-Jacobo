#!/usr/bin/env bash
# Instala dos tareas de launchd en tu Mac:
#   com.mail2excel.run      -> clasifica correos varias veces al día (9,11,13,15,17 h)
#   com.mail2excel.summary  -> envía el resumen diario a las 18:05 h
#
# Uso:  ./scripts/install-launchd.sh
# Desinstalar:  ./scripts/uninstall-launchd.sh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AGENTS="$HOME/Library/LaunchAgents"
LOG_DIR="$PROJECT_DIR/logs"
RUN="$PROJECT_DIR/scripts/run.sh"

mkdir -p "$AGENTS" "$LOG_DIR"
chmod +x "$RUN"

run_plist="$AGENTS/com.mail2excel.run.plist"
sum_plist="$AGENTS/com.mail2excel.summary.plist"

cat > "$run_plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>com.mail2excel.run</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${RUN}</string>
        <string>run</string>
    </array>
    <key>StartCalendarInterval</key>
    <array>
        <dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>
        <dict><key>Hour</key><integer>11</integer><key>Minute</key><integer>0</integer></dict>
        <dict><key>Hour</key><integer>13</integer><key>Minute</key><integer>0</integer></dict>
        <dict><key>Hour</key><integer>15</integer><key>Minute</key><integer>0</integer></dict>
        <dict><key>Hour</key><integer>17</integer><key>Minute</key><integer>0</integer></dict>
    </array>
    <key>StandardOutPath</key><string>${LOG_DIR}/run.log</string>
    <key>StandardErrorPath</key><string>${LOG_DIR}/run.err.log</string>
    <key>WorkingDirectory</key><string>${PROJECT_DIR}</string>
</dict>
</plist>
PLIST

cat > "$sum_plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>com.mail2excel.summary</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${RUN}</string>
        <string>summary</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict><key>Hour</key><integer>18</integer><key>Minute</key><integer>5</integer></dict>
    <key>StandardOutPath</key><string>${LOG_DIR}/summary.log</string>
    <key>StandardErrorPath</key><string>${LOG_DIR}/summary.err.log</string>
    <key>WorkingDirectory</key><string>${PROJECT_DIR}</string>
</dict>
</plist>
PLIST

# Recarga las tareas.
for label in com.mail2excel.run com.mail2excel.summary; do
    launchctl unload "$AGENTS/$label.plist" 2>/dev/null || true
    launchctl load "$AGENTS/$label.plist"
done

echo "✓ Tareas instaladas:"
echo "  - com.mail2excel.run      (9,11,13,15,17 h)"
echo "  - com.mail2excel.summary  (18:05 h)"
echo "Logs en: $LOG_DIR"
echo
echo "Para probar una ejecución ahora mismo:"
echo "  launchctl start com.mail2excel.run"
