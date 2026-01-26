#!/usr/bin/env bash
#
# Check status of running Cursor agents
# Usage: ./scripts/check-agents-status.sh [plan-name] [--watch]
#

set -euo pipefail

PLAN_NAME="${1:-0018-component-design-principles-audit}"
WATCH_MODE=false

# Parse arguments
if [[ "${1:-}" == "--watch" ]]; then
  WATCH_MODE=true
  PLAN_NAME="${2:-0018-component-design-principles-audit}"
elif [[ "${2:-}" == "--watch" ]]; then
  WATCH_MODE=true
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

check_status() {
  # Clear screen if watching
  if [ "$WATCH_MODE" = true ]; then
    clear
  fi
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Agent Status Check - ${PLAN_NAME}"
  echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Check for running cursor agent processes
  RUNNING_AGENTS=0
  COMPLETED_AGENTS=0
  UNKNOWN_AGENTS=0
  TOTAL_AGENTS=0

  # Get all cursor agent processes
  ALL_CURSOR_AGENT_PROCS=$(pgrep -fl "cursor.*agent" 2>/dev/null || true)

  for agent_file in ${AGENT_FILES}; do
    agent_name=$(basename "${agent_file}")
    agent_path=$(realpath "${agent_file}")
    
    TOTAL_AGENTS=$((TOTAL_AGENTS + 1))
    
    # Check if cursor agent process is running with this specific agent file
    # Look for the agent file path or name in the process command
    if echo "$ALL_CURSOR_AGENT_PROCS" | grep -q "${agent_name}" 2>/dev/null; then
      echo "🟢 ${agent_name} - RUNNING"
      RUNNING_AGENTS=$((RUNNING_AGENTS + 1))
    elif echo "$ALL_CURSOR_AGENT_PROCS" | grep -q "cursor.*agent" 2>/dev/null; then
      # There are cursor agent processes, but this specific one might have completed
      # or the process name doesn't match exactly
      echo "🟡 ${agent_name} - UNKNOWN (check terminal window)"
      UNKNOWN_AGENTS=$((UNKNOWN_AGENTS + 1))
    else
      echo "✅ ${agent_name} - COMPLETED (no process found)"
      COMPLETED_AGENTS=$((COMPLETED_AGENTS + 1))
    fi
  done

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Summary:"
  echo "  Total agents: ${TOTAL_AGENTS}"
  echo "  🟢 Running: ${RUNNING_AGENTS}"
  echo "  🟡 Unknown: ${UNKNOWN_AGENTS}"
  echo "  ✅ Completed: ${COMPLETED_AGENTS}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Show all cursor agent processes if any
  if [ -n "$ALL_CURSOR_AGENT_PROCS" ]; then
    echo "Active cursor agent processes:"
    echo "$ALL_CURSOR_AGENT_PROCS" | while read -r line; do
      echo "  ${line}"
    done
    echo ""
  fi

  if [ "$WATCH_MODE" = false ]; then
    echo "💡 Tip: Check terminal windows for '✅ Agent execution completed' message"
    echo "💡 Tip: Use --watch flag for continuous monitoring: ./scripts/check-agents-status.sh ${PLAN_NAME} --watch"
  fi
}

# Run check
if [ "$WATCH_MODE" = true ]; then
  # Watch mode: refresh every 5 seconds
  while true; do
    check_status
    echo ""
    echo "Press Ctrl+C to stop watching..."
    sleep 5
  done
else
  # Single check
  check_status
fi
