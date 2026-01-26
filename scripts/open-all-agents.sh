#!/usr/bin/env bash
#
# Open all agent files in Cursor
# Usage: ./scripts/open-all-agents.sh [plan-name] [--new-window|--reuse-window]
#
# Options:
#   --new-window    Open each file in a new Cursor window (default)
#   --reuse-window Open all files in the same Cursor window

set -euo pipefail

PLAN_NAME="${1:-0018-component-design-principles-audit}"
WINDOW_MODE="${2:---new-window}"

# Shift to handle optional window mode argument
if [[ "$1" == "--new-window" ]] || [[ "$1" == "--reuse-window" ]]; then
  PLAN_NAME="0018-component-design-principles-audit"
  WINDOW_MODE="$1"
elif [[ "$2" == "--new-window" ]] || [[ "$2" == "--reuse-window" ]]; then
  WINDOW_MODE="$2"
fi

PLAN_DIR="../runi-planning-docs/plans/${PLAN_NAME}"
AGENTS_DIR="${PLAN_DIR}/agents"

if [ ! -d "${AGENTS_DIR}" ]; then
  echo "Error: Agents directory not found: ${AGENTS_DIR}" >&2
  exit 1
fi

# Get all agent files sorted by number
AGENT_FILES=$(find "${AGENTS_DIR}" -name "*.agent.md" | sort)

if [ -z "${AGENT_FILES}" ]; then
  echo "No agent files found in ${AGENTS_DIR}" >&2
  exit 1
fi

# Check if cursor command is available
if ! command -v cursor >/dev/null 2>&1; then
  echo "Error: Cursor CLI not found. Install it from Cursor: Cmd+Shift+P → 'Shell Command: Install cursor command'" >&2
  exit 1
fi

echo "Opening ${PLAN_NAME} agents in Cursor..."
echo ""

# Build cursor command with appropriate window mode
CURSOR_CMD="cursor"
if [[ "$WINDOW_MODE" == "--new-window" ]]; then
  CURSOR_CMD="cursor -n"
elif [[ "$WINDOW_MODE" == "--reuse-window" ]]; then
  CURSOR_CMD="cursor -r"
fi

# Open each agent file in Cursor
OPENED_COUNT=0
for agent_file in ${AGENT_FILES}; do
  agent_name=$(basename "${agent_file}")
  agent_path=$(realpath "${agent_file}" 2>/dev/null || echo "${agent_file}")
  
  echo "Opening: ${agent_name}"
  
  # Open file in Cursor
  if $CURSOR_CMD "${agent_path}" 2>/dev/null; then
    ((OPENED_COUNT++))
  else
    echo "  ⚠️  Failed to open: ${agent_name}" >&2
  fi
  
  # Small delay to avoid overwhelming Cursor
  sleep 0.2
done

echo ""
echo "✅ Opened ${OPENED_COUNT} agent file(s) in Cursor"
echo ""
echo "To open a specific agent file:"
echo "  cursor '${AGENTS_DIR}/000_agent_infrastructure.agent.md'"
