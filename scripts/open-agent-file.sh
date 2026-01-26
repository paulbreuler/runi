#!/usr/bin/env bash
# Minimal helper to open agent file in Cursor and optionally create GitHub issues
# This replaces the complex run-agent.sh script - most logic is now in limps CLI

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Function to get absolute path
get_absolute_path() {
    local path="$1"
    if [[ "$path" == /* ]]; then
        echo "$path"
    elif command -v realpath >/dev/null 2>&1; then
        realpath "$path" 2>/dev/null || echo "$path"
    else
        local dir
        dir=$(cd "$(dirname "$path")" 2>/dev/null && pwd)
        if [ -n "$dir" ]; then
            echo "$dir/$(basename "$path")"
        else
            echo "$path"
        fi
    fi
}

# Function to resolve plan number to directory name
resolve_plan_number() {
    local plan_input="$1"
    local PLANS_DIR="../runi-planning-docs/plans"
    
    if [[ "$plan_input" =~ ^[0-9]+- ]]; then
        echo "$plan_input"
        return 0
    fi
    
    if [[ "$plan_input" =~ ^[0-9]+$ ]]; then
        local found=$(find "$PLANS_DIR" -maxdepth 1 -type d -name "${plan_input}-*" ! -name "plans" ! -name "templates" 2>/dev/null | head -1)
        if [ -n "$found" ]; then
            echo "$(basename "$found")"
            return 0
        fi
        if [ -d "$PLANS_DIR/${plan_input}-plan" ]; then
            echo "${plan_input}-plan"
            return 0
        fi
    fi
    
    echo "$plan_input"
    return 0
}

# Function to construct agent file path from task ID
# Task ID format: <plan-name>#<agent-number>
# Agent file format: plans/<plan-name>/agents/<agent-number>_agent_<name>.agent.md
construct_agent_path_from_task_id() {
    local task_id="$1"
    
    if [[ ! "$task_id" =~ ^([^#]+)#([0-9]+)$ ]]; then
        return 1
    fi
    
    local plan_name="${BASH_REMATCH[1]}"
    local agent_num="${BASH_REMATCH[2]}"
    local agents_dir="../runi-planning-docs/plans/${plan_name}/agents"
    
    # Find agent file matching the number (format: 000_agent_*.agent.md)
    local agent_file=$(find "$agents_dir" -maxdepth 1 -name "${agent_num}_agent_*.agent.md" 2>/dev/null | head -1)
    
    if [ -n "$agent_file" ]; then
        echo "$agent_file"
        return 0
    fi
    
    return 1
}

main() {
    local input="$1"
    local create_issues="${2:-false}"
    
    cd "$PROJECT_ROOT"
    
    local agent_file=""
    
    # Check if input is a task ID (format: plan-name#number)
    if [[ "$input" =~ ^[^#]+#[0-9]+$ ]]; then
        agent_file=$(construct_agent_path_from_task_id "$input")
        if [ -z "$agent_file" ] || [ ! -f "$agent_file" ]; then
            echo "❌ Could not find agent file for task ID: $input" >&2
            exit 1
        fi
    else
        # Assume it's a file path
        agent_file=$(get_absolute_path "$input")
        if [ ! -f "$agent_file" ]; then
            echo "❌ Agent file not found: $agent_file" >&2
            exit 1
        fi
    fi
    
    # Open file in Cursor
    if command -v cursor >/dev/null 2>&1; then
        if ! cursor -r "$agent_file" 2>/dev/null && ! cursor "$agent_file" 2>/dev/null; then
            echo "⚠️  Failed to open agent file in Cursor. You can open it manually at: ${agent_file}" >&2
        fi
    else
        echo "⚠️  Cursor CLI not found. Install it from Cursor: Cmd+Shift+P → 'Shell Command: Install cursor command'" >&2
    fi
    
    # Optionally create GitHub issues
    if [ "$create_issues" = "true" ]; then
        if [ -f "$SCRIPT_DIR/create-agent-issues.sh" ]; then
            local log_file
            log_file=$(mktemp /tmp/agent-issues-XXXXXX.log 2>/dev/null || echo "/tmp/agent-issues-$$.log")
            (
                bash "$SCRIPT_DIR/create-agent-issues.sh" "$agent_file" "$log_file" >> "$log_file" 2>&1
            ) &
            disown $! 2>/dev/null || true
            echo "🔄 Creating GitHub issues in background (log: ${log_file})"
        fi
    fi
    
    echo "✅ Agent file opened: $(basename "$agent_file")"
}

if [ $# -lt 1 ]; then
    echo "Usage: $0 <agent-file-path-or-task-id> [create-issues]" >&2
    echo "  agent-file-path-or-task-id: Path to agent file or task ID (e.g., plan-name#000)" >&2
    echo "  create-issues: 'true' to create GitHub issues (optional, default: false)" >&2
    exit 1
fi

main "$@"
