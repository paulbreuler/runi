#!/usr/bin/env bash
# Detect active agent from branch name, commits, or modified files

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PLANS_DIR="../runi-planning-docs/plans"

# Function to extract agent pattern from text
extract_agent_pattern() {
    local text="$1"
    # Match patterns like: agent_0, agent_2, Agent 0, Agent 2, agent-0, etc.
    echo "$text" | grep -oE "(agent[_\s-]?[0-9]+|Agent\s+[0-9]+)" | head -1 | sed 's/[^0-9]//g' || true
}

# Function to find agent file by number
find_agent_by_number() {
    local agent_num="$1"
    local plan_dir="$2"
    
    if [ -z "$plan_dir" ] || [ ! -d "$plan_dir" ]; then
        return 1
    fi
    
    local agents_dir="$plan_dir/agents"
    if [ ! -d "$agents_dir" ]; then
        return 1
    fi
    
    # Try exact match first: agent_0_*.agent.md
    local agent_file=$(find "$agents_dir" -name "agent_${agent_num}_*.agent.md" ! -name "*.completed.md" 2>/dev/null | head -1)
    if [ -n "$agent_file" ] && [ -f "$agent_file" ]; then
        echo "$agent_file"
        return 0
    fi
    
    # Try pattern match: agent_0*.agent.md
    agent_file=$(find "$agents_dir" -name "agent_${agent_num}*.agent.md" ! -name "*.completed.md" 2>/dev/null | head -1)
    if [ -n "$agent_file" ] && [ -f "$agent_file" ]; then
        echo "$agent_file"
        return 0
    fi
    
    return 1
}

# Function to extract agent info from agent file
extract_agent_info() {
    local agent_file="$1"
    
    if [ ! -f "$agent_file" ]; then
        return 1
    fi
    
    # Extract agent name from first line (e.g., "# Agent 0: Accessibility Foundation (Early)")
    local agent_name=$(head -1 "$agent_file" | sed 's/^# Agent [0-9]*: //' | sed 's/\*\*Plan Location\*\*.*//' | xargs)
    
    # Extract feature numbers and TL;DRs
    local features=""
    local feature_numbers=""
    local current_feature=""
    
    while IFS= read -r line; do
        if [[ "$line" =~ ^###\ Feature\ #([0-9]+): ]]; then
            if [ -n "$current_feature" ]; then
                features="${features}${features:+, }${current_feature}"
            fi
            current_feature="${BASH_REMATCH[1]}"
            feature_numbers="${feature_numbers}${feature_numbers:+, }#${current_feature}"
        elif echo "$line" | grep -qE '\*\*TL;DR\*\*:' && [ -n "$current_feature" ]; then
            local tldr=$(echo "$line" | sed -E 's/.*\*\*TL;DR\*\*:[[:space:]]+(.*)/\1/')
            # Only set if we haven't set a description yet for this feature
            if [[ "$current_feature" =~ ^[0-9]+$ ]]; then
                current_feature="Feature #${current_feature}: ${tldr}"
            fi
        fi
    done < "$agent_file"
    
    # Add last feature
    if [ -n "$current_feature" ]; then
        # If current_feature is just a number, use it as-is
        if [[ "$current_feature" =~ ^[0-9]+$ ]]; then
            features="${features}${features:+, }Feature #${current_feature}"
        else
            features="${features}${features:+, }${current_feature}"
        fi
    fi
    
    # Extract plan name from agent file path
    local plan_name=$(echo "$agent_file" | sed -E 's|.*/plans/([^/]+)/.*|\1|')
    
    echo "{\"agent_file\": \"$agent_file\", \"agent_name\": \"$agent_name\", \"features\": \"$features\", \"feature_numbers\": \"$feature_numbers\", \"plan_name\": \"$plan_name\"}"
}

# Function to detect agent from branch name
detect_from_branch() {
    local branch_name="$1"
    
    # Extract agent number from branch patterns
    local agent_num=$(extract_agent_pattern "$branch_name")
    if [ -z "$agent_num" ]; then
        return 1
    fi
    
    # Try to detect plan from branch name
    local plan_info=$(bash "$SCRIPT_DIR/detect-active-plan.sh" --json 2>/dev/null || echo "{}")
    local plan_dir=""
    
    if command -v jq >/dev/null 2>&1; then
        plan_dir=$(echo "$plan_info" | jq -r '.plan_dir // empty' 2>/dev/null || echo "")
    else
        # Fallback: try to extract from branch name
        local branch_plan=$(echo "$branch_name" | grep -oE "(datagrid|console|history|request)" || echo "")
        if [ -n "$branch_plan" ]; then
            plan_dir=$(find "$PLANS_DIR" -maxdepth 1 -type d -name "*${branch_plan}*" ! -name "plans" ! -name "templates" | head -1)
        fi
    fi
    
    # If no plan detected, try to find any plan with this agent
    if [ -z "$plan_dir" ]; then
        for plan in "$PLANS_DIR"/*; do
            if [ ! -d "$plan" ]; then
                continue
            fi
            local agent_file=$(find_agent_by_number "$agent_num" "$plan")
            if [ -n "$agent_file" ]; then
                plan_dir="$plan"
                break
            fi
        done
    fi
    
    if [ -z "$plan_dir" ]; then
        return 1
    fi
    
    local agent_file=$(find_agent_by_number "$agent_num" "$plan_dir")
    if [ -z "$agent_file" ]; then
        return 1
    fi
    
    extract_agent_info "$agent_file"
    return 0
}

# Function to detect agent from commit messages
detect_from_commits() {
    local commit_range="${1:-HEAD}"
    
    # Get commit messages
    local commits=$(git log "$commit_range" --format="%s %b" 2>/dev/null || echo "")
    if [ -z "$commits" ]; then
        return 1
    fi
    
    # Extract agent number from commits
    local agent_num=$(extract_agent_pattern "$commits")
    if [ -z "$agent_num" ]; then
        return 1
    fi
    
    # Try to detect plan
    local plan_info=$(bash "$SCRIPT_DIR/detect-active-plan.sh" --json 2>/dev/null || echo "{}")
    local plan_dir=""
    
    if command -v jq >/dev/null 2>&1; then
        plan_dir=$(echo "$plan_info" | jq -r '.plan_dir // empty' 2>/dev/null || echo "")
    fi
    
    # If no plan detected, search all plans
    if [ -z "$plan_dir" ]; then
        for plan in "$PLANS_DIR"/*; do
            if [ ! -d "$plan" ]; then
                continue
            fi
            local agent_file=$(find_agent_by_number "$agent_num" "$plan")
            if [ -n "$agent_file" ]; then
                plan_dir="$plan"
                break
            fi
        done
    fi
    
    if [ -z "$plan_dir" ]; then
        return 1
    fi
    
    local agent_file=$(find_agent_by_number "$agent_num" "$plan_dir")
    if [ -z "$agent_file" ]; then
        return 1
    fi
    
    extract_agent_info "$agent_file"
    return 0
}

# Function to detect agent from modified files
detect_from_files() {
    local file_list="$1"
    
    # Check if any files are agent files
    local agent_file=$(echo "$file_list" | grep -E "runi-planning-docs/plans/[^/]+/agents/agent_[0-9]+.*\.agent\.md" | head -1)
    
    if [ -z "$agent_file" ]; then
        # Try relative path
        agent_file=$(echo "$file_list" | grep -E "\.\./runi-planning-docs/plans/[^/]+/agents/agent_[0-9]+.*\.agent\.md" | head -1)
    fi
    
    if [ -z "$agent_file" ]; then
        return 1
    fi
    
    # Resolve to absolute path
    if [[ "$agent_file" != /* ]]; then
        agent_file="$PROJECT_ROOT/$agent_file"
    fi
    
    if [ ! -f "$agent_file" ]; then
        return 1
    fi
    
    extract_agent_info "$agent_file"
    return 0
}

# Function to detect from recently modified agent files
detect_from_recent_files() {
    # Get recently modified agent files (last 7 days)
    local recent_agent=$(find "$PLANS_DIR" -name "*.agent.md" -type f ! -name "*.completed.md" -mtime -7 2>/dev/null | head -1)
    
    if [ -z "$recent_agent" ] || [ ! -f "$recent_agent" ]; then
        return 1
    fi
    
    extract_agent_info "$recent_agent"
    return 0
}

# Main execution
main() {
    local output_json=true
    local branch_name=""
    local commit_range=""
    local file_list=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --branch)
                branch_name="$2"
                shift 2
                ;;
            --commits)
                commit_range="$2"
                shift 2
                ;;
            --files)
                file_list="$2"
                shift 2
                ;;
            --json)
                output_json=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    cd "$PROJECT_ROOT"
    
    local result=""
    local source=""
    
    # Method 1: Branch name
    if [ -z "$result" ] && [ -n "$branch_name" ]; then
        result=$(detect_from_branch "$branch_name" 2>/dev/null || echo "")
        if [ -n "$result" ]; then
            source="branch"
        fi
    fi
    
    # Method 2: Current branch (if not specified)
    if [ -z "$result" ] && [ -z "$branch_name" ]; then
        branch_name=$(git branch --show-current 2>/dev/null || echo "")
        if [ -n "$branch_name" ]; then
            result=$(detect_from_branch "$branch_name" 2>/dev/null || echo "")
            if [ -n "$result" ]; then
                source="branch"
            fi
        fi
    fi
    
    # Method 3: Commit messages
    if [ -z "$result" ]; then
        if [ -n "$commit_range" ]; then
            result=$(detect_from_commits "$commit_range" 2>/dev/null || echo "")
        else
            result=$(detect_from_commits "HEAD~10..HEAD" 2>/dev/null || echo "")
        fi
        if [ -n "$result" ]; then
            source="commits"
        fi
    fi
    
    # Method 4: Modified files
    if [ -z "$result" ] && [ -n "$file_list" ]; then
        result=$(detect_from_files "$file_list" 2>/dev/null || echo "")
        if [ -n "$result" ]; then
            source="files"
        fi
    fi
    
    # Method 5: Git diff (staged or unstaged)
    if [ -z "$result" ]; then
        local changed_files=$(git diff --name-only HEAD 2>/dev/null | tr '\n' ' ' || echo "")
        if [ -n "$changed_files" ]; then
            result=$(detect_from_files "$changed_files" 2>/dev/null || echo "")
            if [ -n "$result" ]; then
                source="git_diff"
            fi
        fi
    fi
    
    # Method 6: Recently modified agent files
    if [ -z "$result" ]; then
        result=$(detect_from_recent_files 2>/dev/null || echo "")
        if [ -n "$result" ]; then
            source="recent_files"
        fi
    fi
    
    if [ -z "$result" ]; then
        if [ "$output_json" = true ]; then
            echo '{"error": "No agent detected", "agent_file": "", "agent_name": "", "features": "", "feature_numbers": "", "plan_name": "", "source": "none"}'
        else
            echo "❌ No agent detected" >&2
        fi
        return 1
    fi
    
    # Add source to result
    if [ "$output_json" = true ]; then
        if command -v jq >/dev/null 2>&1; then
            echo "$result" | jq ". + {\"source\": \"$source\"}"
        else
            # Fallback: append source manually
            echo "$result" | sed "s/}$/, \"source\": \"$source\"}/"
        fi
    else
        echo "$result"
    fi
}

main "$@"
