#!/usr/bin/env bash
# Wrapper to run next task using limps CLI
# Replaces the complex run-agent.sh script

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

plan_name="$1"
create_issues="${2:-true}"

# Get next task from limps
output=$(npx limps next-task "$plan_name" 2>&1)
echo "$output"

# Extract task ID from output
task_id=$(echo "$output" | grep -oE "Task ID: ([^[:space:]]+)" | cut -d" " -f3 || echo "")

if [ -z "$task_id" ]; then
    echo "⚠️  No task ID found in limps output" >&2
    exit 1
fi

# Open agent file using task ID
bash "$SCRIPT_DIR/open-agent-file.sh" "$task_id" "$create_issues"
