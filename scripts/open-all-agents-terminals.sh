#!/usr/bin/env bash
#
# Run all agent files in Cursor Agent in new terminal windows that stay open
# Usage: ./scripts/open-all-agents-terminals.sh [plan-name]
#

set -euo pipefail

PLAN_NAME="${1:-0018-component-design-principles-audit}"
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

COUNT=$(echo "$AGENT_FILES" | wc -l | xargs)
echo "Running ${COUNT} agent(s) from ${PLAN_NAME} in new terminal windows..."
echo ""

# Open each agent file in a new terminal window that stays open
for agent_file in ${AGENT_FILES}; do
  agent_name=$(basename "${agent_file}")
  agent_path=$(realpath "${agent_file}")
  
  echo "Running: ${agent_name}"
  
  # Open in new terminal window (macOS) - window stays open
  if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript <<EOF
tell application "Terminal"
  activate
  do script "cd $(pwd) && echo '📋 Agent: ${agent_name}' && echo 'Running agent in Cursor...' && cat '${agent_path}' | cursor agent --print --output-format stream-json --stream-partial-output - && echo '' && echo '✅ Agent execution completed' && echo 'Terminal will stay open. Close this window when done.' && exec zsh"
end tell
EOF
  # Open in new terminal (Linux)
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    gnome-terminal --title "${agent_name}" -- bash -c "cd $(pwd) && cat '${agent_path}' | cursor agent --print --output-format stream-json --stream-partial-output - && echo '✅ Agent execution completed' && exec zsh" 2>/dev/null || \
    xterm -T "${agent_name}" -e "cd $(pwd) && cat '${agent_path}' | cursor agent --print --output-format stream-json --stream-partial-output - && echo '✅ Agent execution completed' && exec zsh" 2>/dev/null || \
    echo "Warning: Could not open new terminal. Run manually: cat '${agent_path}' | cursor agent --print --output-format stream-json --stream-partial-output -"
  else
    echo "Warning: Unsupported OS. Run manually: cursor '${agent_path}'"
  fi
  
  # Small delay to avoid overwhelming the system
  sleep 0.3
done

echo ""
echo "✅ All agents running in new terminal windows"
echo "Each terminal window will stay open so you can watch the output"
