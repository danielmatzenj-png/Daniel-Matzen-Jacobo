#!/usr/bin/env bash
# Desinstala las tareas de launchd de mail2excel.
set -euo pipefail

AGENTS="$HOME/Library/LaunchAgents"
for label in com.mail2excel.run com.mail2excel.summary; do
    launchctl unload "$AGENTS/$label.plist" 2>/dev/null || true
    rm -f "$AGENTS/$label.plist"
    echo "✓ Eliminada: $label"
done
