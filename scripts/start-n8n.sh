#!/bin/sh
set -eu
TASK_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
export N8N_USER_FOLDER="$TASK_ROOT/.private/n8n-data"
export N8N_LISTEN_ADDRESS=127.0.0.1
export N8N_HOST=localhost
export N8N_PORT=5678
export N8N_PROTOCOL=http
export N8N_DIAGNOSTICS_ENABLED=false
export N8N_VERSION_NOTIFICATIONS_ENABLED=false
export N8N_PERSONALIZATION_ENABLED=false
export N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
exec "$TASK_ROOT/.runtime/n8n/node_modules/.bin/n8n" "$@"
